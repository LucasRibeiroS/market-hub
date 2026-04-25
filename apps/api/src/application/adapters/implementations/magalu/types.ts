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
 * Product listing types
 * ========================================
 */

export type ICategoryResponse = {
	id: string
	name: string
	path: string
	parent_id: string | null
	created_at: string
	updated_at: string | null
	created_by: string
	updated_by: string | null
}

export type IAttributeResponse = {
	id: string
	name: string
	display_name: string
	type: 'text' | 'choice' | 'number'
	required: 'required' | 'recommended' | 'optional'
	variation: boolean
	choices: string[] | null
	example: string | null
	position: number
	required_is_default: boolean
	required_matching: boolean
	is_inherited: boolean
}

export type IPaginatedResponse<T> = {
	meta: {
		page: {
			offset: number
			limit: number
			count: number
			max_limit?: number
		}
		links: {
			self: string
			next: string | null
			previous: string | null
		}
	}
	results: T[]
}

/**
 * ========================================
 * Error response types
 * ========================================
 */

export type IMagaluErrorResponse = {
	slug: string
	message: string
	details?: IMagaluErrorDetail[]
}

export type IMagaluErrorDetail = {
	field: string
	location: string
	slug: string
	message: string
}

export type IMagaluValidationErrorResponse = {
	detail: IMagaluValidationErrorDetail[]
}

export type IMagaluValidationErrorDetail = {
	type: string
	loc: Array<string | number>
	msg: string
}
