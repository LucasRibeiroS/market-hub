import { FastifyReply, FastifyRequest } from 'fastify'
import { CookieSerializeOptions } from '@fastify/cookie'

import { IWrappedUseCase } from '@integrator-packages/use-case'

import { env } from '@config/env'

import { injectCookies } from '@http/middlewares/inject_cookies'

import { ACCESS_TOKEN_COOKIE_NAME, IS_AUTHENTICATED_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@utils/cookies'
import { determineTokenExpiration } from '@utils/jwt'
import { isRecord } from '@utils/types'
import { GenericRequest } from '@utils/fastify/types'

declare module 'fastify' {
	export interface FastifyReply {
		error?: {
			message: string
		}
	}
}

export type IApplyUseCaseOptions = Partial<{
	separate_request_data: boolean
	manage_auth_cookies: Array<'set' | 'unset' | 'inject'>
	map_params: (params: Record<string, unknown>) => Record<string, unknown>
}>

export const applyUseCase = (
	useCase: IWrappedUseCase<unknown, unknown>,
	{ separate_request_data, manage_auth_cookies, map_params }: IApplyUseCaseOptions = {}
) => async(req: FastifyRequest<GenericRequest>, res: FastifyReply) => {
	if (manage_auth_cookies?.includes('inject')) {
		injectCookies(req)
	}

	let data = { ...req.query, ...req.body }

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
		if (manage_auth_cookies?.includes('set')) {
			const tokens = getTokens(body)
			if (tokens === null) {
				console.warn('[applyUseCase] Expected tokens in response but got invalid format', { body })
				return res.status(500).send({ process, body: 'Internal Server Error' })
			}

			setAuthCookies(res, tokens)
		}
		if (manage_auth_cookies?.includes('unset')) {
			unsetAuthCookies(res)
		}
	}

	return res.status(status_code).send({ process, body })
}

type Tokens = { access_token: string, refresh_token?: string }

const getTokens = (response: unknown): Tokens | null => {
	if (!isRecord(response)) return null

	const tokens = response.tokens
	if (!isRecord(tokens)) return null

	if (typeof tokens.access_token !== 'string') return null

	return {
		access_token: tokens.access_token,
		refresh_token:
			typeof tokens.refresh_token === 'string'
				? tokens.refresh_token
				: undefined
	}
}

const setAuthCookies = (res: FastifyReply, tokens: Tokens) => {
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