import { Union } from '@utils/types'

/**
 * ========================================
 * Authentication and user info
 * ========================================
 */

export type IOAuthTokenPayload = {
	client_id: string
	client_secret: string
	redirect_uri: string
} & Union<[
	{ grant_type: 'authorization_code', code: string },
	{ grant_type: 'refresh_token', refresh_token: string }
]>
export type IOAuthTokenResponse = {
	access_token: string
	token_type: string
	expires_in: number
	scope: string
	user_id: number
	refresh_token: string
}

export type IUserResponse = {
	id: number
	email: string
}

/**
 * ========================================
 * Product listing types
 * ========================================
 */

export type ICategoryPredictionResponse = {
	category_id: string
	category_name: string
	domain_id: string
	domain_name: string
}

export type ICategoryAttributesResponse = {
	id: string
	name: string
	tooltip?: string
	hint?: string
	example?: string
	value_type: string
	tags?: {
		required?: boolean
		allow_variations?: boolean
		catalog_listing_required?: boolean
	}
	values?: Array<{ id: string, name: string }>
}

export enum BuyingMode {
	BUY_IT_NOW = 'buy_it_now',
	AUCTION = 'auction'
}

export enum Condition {
	NEW = 'new',
	USED = 'used',
	REFURBISHED = 'refurbished'
}

export enum ListingType {
	FREE = 'free',
	BRONZE = 'bronze',
	SILVER = 'silver',
	GOLD_PRO = 'gold_pro'
}

export type IAttribute = {
	id: string
	value_name: string
}

export type IItemPayload = {
	title: string // Máximo 60 caracteres
	category_id: string // ID da categoria (ex: MLB1055)
	price: number // Em centavos (ex: R$ 10,00 = 1000)
	currency_id: 'BRL'
	available_quantity: number // Deve ser 0 se houver variations
	buying_mode: BuyingMode
	condition: Condition
	listing_type_id: ListingType // ID do tipo de anúncio (ex: gold_pro)
	pictures: Array<{ source: string }> // URLs de imagens
	attributes: IAttribute[] // Ficha técnica e "item_condition"
	variations?: Array<{
		price: number
		available_quantity: number
		attribute_combinations: IAttribute[] // O que torna a variação única (ex: Tamanho 42)
		picture_ids?: string[] // IDs de imagens previamente enviadas ou URLs
		seller_custom_field?: string // Seu SKU interno
	}> // Opcional, apenas se o item tiver variações
}

export type IItemResponse = {
	id: string // O identificador principal gerado (Ex: MLB12345678)
	title: string
	category_id: string
	price: number
	currency_id: string
	available_quantity: number
	sold_quantity: number
	buying_mode: string
	listing_type_id: string
	condition: string // Em transição, priorizar leitura dos atributos
	permalink: string // Link público do anúncio
	pictures: Array<{
		id: string
		url: string
		secure_url: string
	}>
	attributes: Array<{
		id: string
		name: string
		value_id: string | null
		value_name: string
	}>
	variations?: Array<{
		id: number // ID numérico da variação gerado pelo ML
		price: number
		available_quantity: number
		sold_quantity: number
		seller_custom_field: string | null
		attribute_combinations: Array<{
			id: string
			name: string
			value_id: string | null
			value_name: string
		}>
	}>
	status: string // 'active', 'paused', 'closed', 'under_review'
	date_created: string
	last_updated: string
}

/**
 * ========================================
 * Error response types
 * ========================================
 */

export type IMeliErrorCause = {
	department: string
	cause_id: number
	type: 'error' | 'warning'
	code: string
	references: string[]
	message: string
}

export type IMeliErrorResponse = {
	message: string
	error: string
	status: number
	cause: IMeliErrorCause[]
}