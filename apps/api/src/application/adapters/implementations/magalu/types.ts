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

export type ITraceResponse = {
	trace_id: string
}

export enum Condition {
	NEW = 'NEW',
	USED = 'USED',
	REFURBISHED = 'REFURBISHED'
}

export enum DimensionType {
	PRODUCT = 'product',
	PACKAGE = 'package'
}

export enum Origin {
	NATIONAL = 'national',
	IMPORTED = 'imported'
}

export enum SkuType {
	product = 'product'
}

export type ISkuPayload = {
	active: boolean
	attributes: Array<{ name: string, value: string }>
	brand: string
	category: { id: string }
	channels: Array<{ id: string }>
	condition: Condition
	datasheet: Array<{ name: string, value: string }>
	description: string
	dimensions: Array<{
		name: DimensionType
		height: { unit: 'cm', value: number }
		width: { unit: 'cm', value: number }
		length: { unit: 'cm', value: number }
		weight: { unit: 'g', value: number }
	}>
	extra_data: Array<{ name: string, value: string }>
	fulfillment: boolean
	group: { id: string }
	has_ean: boolean
	identifiers: Array<{ type: 'ean', value: string }>
	images: Array<{ reference: string, type: string }>
	metadata: Record<string, unknown>
	origin: Origin
	perishable: boolean
	podcasts: unknown[]
	sku: string
	title: string
	type: SkuType
	videos: unknown[]
}

export type IPricePayload = {
	channel: { id: string }
	currency: 'BRL'
	list_price: number
	price: number
	normalizer?: 100
	metadata: Record<string, unknown>
}

export enum StockType {
	AVAILABLE = 'AVAILABLE'
}

export type IStockPayload = {
	channel: { id: string }
	quantity: number
	type: StockType
	metadata: Record<string, unknown>
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
