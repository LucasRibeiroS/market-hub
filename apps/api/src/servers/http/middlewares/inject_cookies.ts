import { FastifyRequest } from 'fastify'

import { UnknownObject } from '@utils/types'
import { GenericRequest } from '@utils/fastify/types'

import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@utils/cookies'

export const injectCookies = async(req: FastifyRequest<GenericRequest>): Promise<void> => {
	const body = (req.body || {}) as UnknownObject

	body['access_token'] = req.cookies[ACCESS_TOKEN_COOKIE_NAME]
	body['refresh_token'] = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

	req.body = body
}