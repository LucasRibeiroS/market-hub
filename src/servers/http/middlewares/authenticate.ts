import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

import { GenericMiddleware, GenericRequest } from '@utils/fastify/types'
import { Permissions } from '@utils/permissions'
import { isHttpException, UnauthorizedException } from '@utils/exception'
import { verifyAccessToken } from '@utils/jwt'

import { DrizzleApiKeysRepository, DrizzleUsersRepository } from '@repositories/implementations'

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

const usersRepository = new DrizzleUsersRepository()
const apiKeysRepository = new DrizzleApiKeysRepository()

// User standard authentication, with jwt
const authenticateJwt = async(req: FastifyRequest<GenericRequest>): Promise<void> => {
	const authorization = req.headers.authorization || ''
	const [prefix, token] = authorization.split(' ')

	// Check if the token is a Bearer token
	if (prefix !== 'Bearer' || !token) {
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
	} catch (e) {
		if (isHttpException(e)) {
			throw e
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

	const apiKey = await apiKeysRepository.findFirst({ public_key: authorization })
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
				]).catch((e) => {
					console.log(e)

					throw new UnauthorizedException()
				})
			},
			...originalMiddlewares
		]
	})
})