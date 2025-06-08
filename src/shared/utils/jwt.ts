// This file contains the JWT signing and verification logic.
import { createSigner, createVerifier } from 'fast-jwt'

import { env } from '@utils/env'

// Default signers for generating access and refresh tokens
const algorithm = 'HS256'
const signAccessToken = createSigner({
	key: env.AUTH_ACCESS_SECRET,
	expiresIn: env.AUTH_ACCESS_EXPIRES,
	algorithm
})
const signRefreshToken = createSigner({
	key: env.AUTH_REFRESH_SECRET,
	expiresIn: env.AUTH_REFRESH_EXPIRES,
	algorithm
})

type IGenerateAppTokens = {
	id: string
	expiresIn?: string
}
export type IAppTokens = {
	accessToken: string
	refreshToken: string
}

export const generateAppTokens = ({
	id, expiresIn
}: IGenerateAppTokens): IAppTokens => {
	const data = { id }

	const accessToken = expiresIn !== undefined
		? createSigner({ key: env.AUTH_ACCESS_SECRET, expiresIn, algorithm })(data)
		: signAccessToken(data)
	const refreshToken = signRefreshToken({ id })

	return { accessToken, refreshToken }
}

// Default verifier for decoding access tokens
export const verifyAccessToken = createVerifier({
	key: env.AUTH_ACCESS_SECRET,
	algorithms: [algorithm]
})
export const verifyRefreshToken = createVerifier<string>({
	key: env.AUTH_REFRESH_SECRET,
	algorithms: [algorithm]
}) as (token: string) => { id: string }
