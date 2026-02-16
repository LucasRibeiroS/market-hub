// This file contains the JWT signing and verification logic.
import { createSigner, createVerifier } from 'fast-jwt'
import { addDays, addMinutes, addYears } from 'date-fns'
import { DateArg } from 'date-fns/types'

import { env } from '@config/env'

// Default signers for generating access and refresh tokens
const algorithm = 'HS256'
const signAccessToken = createSigner({
	key: env.ACCESS_TOKEN_SECRET,
	expiresIn: env.ACCESS_TOKEN_EXPIRES,
	algorithm
})
const signRefreshToken = createSigner({
	key: env.REFRESH_TOKEN_SECRET,
	expiresIn: env.REFRESH_TOKEN_EXPIRES,
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
		? createSigner({ key: env.ACCESS_TOKEN_EXPIRES, expiresIn, algorithm })(data)
		: signAccessToken(data)
	const refreshToken = signRefreshToken({ id })

	return { accessToken, refreshToken }
}

// Default verifier for decoding access tokens
export const verifyAccessToken = createVerifier({
	key: env.ACCESS_TOKEN_SECRET,
	algorithms: [algorithm]
})
export const verifyRefreshToken = createVerifier<string>({
	key: env.REFRESH_TOKEN_SECRET,
	algorithms: [algorithm]
}) as (token: string) => { id: string }

// Utility function to determine token expiration date based on a string like "15m", "7d", etc.
const expiration: Record<'m' | 'd' | 'y', (date: DateArg<Date>, amount: number) => Date> = {
	m: addMinutes,
	d: addDays,
	y: addYears
}

export const determineTokenExpiration = (token: string): Date => {
	const accessExpires = token.slice(0, -1)
	const suffixExpires = token.slice(-1) as 'd' | 'm' | 'y'

	return expiration[suffixExpires](new Date(), parseInt(accessExpires))
}