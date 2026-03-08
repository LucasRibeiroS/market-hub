import { FastifyReply, FastifyRequest } from 'fastify'
import { CookieSerializeOptions } from '@fastify/cookie'

import { IWrappedUseCase } from '@integrator-packages/use-case'
import { ServerErrorException } from '@integrator-packages/use-case/exceptions'

import { env } from '@config/env'

import { determineTokenExpiration, getTokens } from '@utils/jwt'
import { ACCESS_TOKEN_COOKIE_NAME, IS_AUTHENTICATED_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@http/utils/cookies'
import { GenericRequest } from '@http/utils/types'

declare module 'fastify' {
	export interface FastifyReply {
		error?: {
			message: string
		}
	}
}

export type IApplyAuthUseCaseOptions = Partial<{
	separate_request_data: boolean
	manage_auth_cookies: 'set' | 'unset'
	map_params: (params: Record<string, unknown>) => Record<string, unknown>
}>

export const applyAuthUseCase = (
	useCase: IWrappedUseCase<unknown, unknown>,
	{ separate_request_data, manage_auth_cookies, map_params }: IApplyAuthUseCaseOptions = {}
) => async(req: FastifyRequest<GenericRequest>, res: FastifyReply) => {
	let data: { [x: string]: unknown } = {
		...req.query,
		...req.body,
		...{ 'refresh_token': req.cookies[REFRESH_TOKEN_COOKIE_NAME] }
	}

	if (req.user?.id !== undefined) {
		data.user_id = req.user.id
	}

	if (separate_request_data) {
		const { user_id, ...body } = data
		data = {
			user_id,
			data: body
		}
	}

	if (map_params !== undefined) {
		data = { ...data, ...map_params(req.params) }
	} else {
		data = { ...data, ...req.params }
	}

	const { status_code, process, body } = await useCase.handle(data)

	if (status_code >= 400 && typeof body === 'string') {
		// Set explicity error message to use in the logger
		res.error = { message: body }
	}

	if (process === 'success') {
		if (manage_auth_cookies === 'set') {
			setAuthCookies(res, body)
		}
		if (manage_auth_cookies === 'unset') {
			unsetAuthCookies(res)
		}
	}

	return res.status(status_code).send({ process, body })
}

const setAuthCookies = (res: FastifyReply, body: unknown) => {
	const tokens = getTokens(body)
	if (tokens === null) {
		console.warn('[setAuthCookies] Expected tokens in response but got invalid format', { body })
		throw new ServerErrorException('Failed to set auth cookies due to invalid token format')
	}

	const cookieConfig: CookieSerializeOptions = {

		secure: env.NODE_ENV === 'production', // send cookie over HTTPS only
		httpOnly: true,
		sameSite: 'strict', // alternative CSRF protection
		domain: new URL(env.APP_URL).hostname
	}

	const accessExpiration = determineTokenExpiration(env.ACCESS_TOKEN_EXPIRES)
	const refreshExpiration = determineTokenExpiration(env.REFRESH_TOKEN_EXPIRES)

	if (tokens.refresh_token !== undefined) {
		res.setCookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
			...cookieConfig,
			path: '/auth',
			expires: refreshExpiration
		})
	}

	res.setCookie(ACCESS_TOKEN_COOKIE_NAME, tokens.access_token, {
		...cookieConfig,
		path: '/',
		expires: accessExpiration
	})
	res.setCookie(IS_AUTHENTICATED_COOKIE_NAME, 'true', {
		...cookieConfig,
		path: '/',
		httpOnly: false,
		expires: refreshExpiration
	})
}

const unsetAuthCookies = (res: FastifyReply) => {
	const cookieConfig: CookieSerializeOptions = {
		domain: new URL(env.APP_URL).hostname
	}

	res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieConfig, path: '/auth' })
		.clearCookie(ACCESS_TOKEN_COOKIE_NAME, cookieConfig)
		.clearCookie(IS_AUTHENTICATED_COOKIE_NAME, cookieConfig)
}