import { Union } from '@utils/types'

/**
 * ========================================
 * Authentication and user info
 * ========================================
 */

export type IOAuthTokenPayload = {
	client_id: string
	client_secret: string
	redirect_uri?: string
} & Union<[
	{ grant_type: 'authorization_code', code: string },
	{ grant_type: 'refresh_token', refresh_token: string }
]>

export type IOAuthTokenResponse = {
	access_token: string
	refresh_token: string
	token_type: string
	expires_in: number // seconds
	scope: string
	created_at: number // Unix timestamp
}

export type IJwtPayload = {
	sub: string // seller/tenant identifier → external_id
	email?: string
	tenant_id?: string
}

/**
 * ========================================
 * Error response types
 * ========================================
 */

export type IMagaluErrorDetail = {
	field: string
	description: string
}

export type IMagaluErrorResponse = {
	title: string
	status: number
	detail: string
	errors?: IMagaluErrorDetail[]
}