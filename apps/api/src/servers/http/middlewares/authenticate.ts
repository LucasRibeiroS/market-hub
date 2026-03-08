import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { container } from 'tsyringe'

import { isHttpException, UnauthorizedException } from '@integrator-packages/use-case/exceptions'

import { Permissions } from '@utils/permissions'
import { hash } from '@utils/cryptography'
import { verifyAccessToken } from '@utils/jwt'
import { ACCESS_TOKEN_COOKIE_NAME } from '@http/utils/cookies'
import { GenericMiddleware, GenericRequest } from '@http/utils/types'

import { IUsersRepository, UsersRepositorySymbol } from '@repositories/IUsersRepository'
import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

export type AuthenticationMethods = 'jwt' | 'api_key' | 'any'

declare module 'fastify' {
	interface FastifyInstance {
		authenticateJwt: GenericMiddleware
		authenticateApiKey: GenericMiddleware
	}

	interface FastifyContextConfig {
		authMethod?: AuthenticationMethods
	}

	interface FastifyRequest {
		user?: {
			id: string
			permissions: string[]
		}
	}
}

type IJwtToken = {
	id: string
}

const usersRepository: IUsersRepository = container.resolve(UsersRepositorySymbol)
const apiKeysRepository: IApiKeysRepository = container.resolve(ApiKeysRepositorySymbol)

// User standard authentication, with jwt
const authenticateJwt = async(req: FastifyRequest<GenericRequest>): Promise<void> => {
	const token = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
	if (!token) {
		throw new UnauthorizedException()
	}

	try {
		// Verify the JWT token
		const decoded = verifyAccessToken(token) as IJwtToken

		const user = await usersRepository.findById(decoded.id)
		if (user === null) {
			throw new UnauthorizedException()
		}

		const data = {
			id: user.id,
			permissions: Object.values(Permissions.user)
		}

		req.user = data

		return
	} catch(error) {
		if (isHttpException(error)) {
			throw error
		}
	}

	throw new UnauthorizedException()
}

// External available authentication, with api key
const authenticateApiKey = async(req: FastifyRequest<GenericRequest>): Promise<void> => {
	const authorization = req.headers['x-api-key']
	if (authorization === undefined || typeof authorization !== 'string') {
		throw new UnauthorizedException()
	}

	const apiKey = await apiKeysRepository.findFirst({ key_lookup: hash(authorization) })
	if (apiKey === null) {
		throw new UnauthorizedException()
	}

	req.user = {
		id: apiKey.user_id,
		permissions: apiKey.permissions
	}
}

export const authenticate = fp((fastify: FastifyInstance) => {
	fastify.decorate('authenticateJwt', authenticateJwt)
	fastify.decorate('authenticateApiKey', authenticateApiKey)

	fastify.addHook('onRoute', routeOptions => {
		const authMethod = routeOptions.config?.authMethod
		if (authMethod === undefined) {
			// No authentication required for this route
			return
		}

		const originalMiddlewares = Array.isArray(routeOptions.onRequest)
			? routeOptions.onRequest
			: routeOptions.onRequest ? [routeOptions.onRequest] : []

		routeOptions.onRequest = [
			async function(req: FastifyRequest, res: FastifyReply) {
				const typedReq = req as FastifyRequest<GenericRequest>
				if (authMethod === 'jwt') {
					return fastify.authenticateJwt(typedReq, res)
				}
				if (authMethod.includes('api_key')) {
					return fastify.authenticateApiKey(typedReq, res)
				}
				// Composed authentication middleware
				return Promise.any([
					fastify.authenticateJwt(typedReq, res),
					fastify.authenticateApiKey(typedReq, res)
				]).catch((error) => {
					console.log(error)

					throw new UnauthorizedException()
				})
			},
			...originalMiddlewares
		]
	})
})