import {
	IMarketplaceAccount,
	IMarketplaceCredential,
	IMarketplaceListing,
	IMarketplaceProvider,
	IProduct,
	IVariant,
	Provider
} from '@integrator-packages/database/entities'

type ProviderClientConfig = Pick<IMarketplaceProvider, 'client_id' | 'client_secret' | 'redirect_uri' | 'base_url'>

export type OAuthCredentials = Pick<
	IMarketplaceCredential,
    | 'access_token'
    | 'access_token_expires_at'
    | 'refresh_token'
    | 'refresh_token_expires_at'
    | 'scopes'
    | 'token_type'
>

// the necessary credentials for calling the marketplace API after authorization
export type IMarketplaceCredentials = Pick<OAuthCredentials, 'access_token' | 'token_type'>

export type IExchangeCodeParams = {
	code: string
	provider: Pick<IMarketplaceProvider, 'token_url'> & ProviderClientConfig
}
export type IExchangeCodeResponse = {
	credentials: OAuthCredentials
}

export type IGetUserInfoParams = {
	credentials: IMarketplaceCredentials
	provider: ProviderClientConfig
}
export type IGetUserInfoResponse = {
	account: Pick<IMarketplaceAccount, 'external_id' | 'external_email'>
}

export type IRefreshTokenParams = {
	refresh_token: string
	provider: Pick<IMarketplaceProvider, 'token_url'> & ProviderClientConfig
}
export type IRefreshTokenResponse = {
	credentials: OAuthCredentials
}

export type IRevokeAuthorizationParams = {
	account: Pick<IMarketplaceAccount, 'external_id'>
	credentials: IMarketplaceCredentials
	provider: ProviderClientConfig
}
export type IRevokeAuthorizationResponse = {
	external_id: string
}

export type IGetAttributesParams = {
	credentials: IMarketplaceCredentials
	provider: Pick<IMarketplaceProvider, 'base_url'>
	product: {
		name: string
	}
}
export type IGetAttributesResponse = {
	category_id: string // marketplace-specific, stored in listing metadata
	category_name: string
	attributes: Array<{
		id: string
		name: string
		description?: string
		required: boolean
		allowed_in_variants?: boolean // indicates if the attribute is required for variants or just for the main product
		allowed_values?: string[] // if the marketplace restricts to an enum
	}>
}

export type IPublishProductParams = {
	credentials: IMarketplaceCredentials
	provider: Pick<ProviderClientConfig, 'base_url'>
	product: {
		variants: IVariant[]
	} & IProduct
}
export type IPublishProductResponse = {
	listings: Array<
		Pick<IMarketplaceListing, 'variant_id' | 'external_product_id' | 'external_variant_id' | 'status' | 'sync_message'>
	>
}

export type ISubscribeOrderWebhooksParams = {
	credentials: IMarketplaceCredentials
	provider: ProviderClientConfig
	webhook_url: string
}
export type ISubscribeOrderWebhooksResponse = {
	subscription?: {
		topic: string
		external_webhook_id: string
	}
}

export type IUnsubscribeOrderWebhooksParams = {
	credentials: IMarketplaceCredentials
	provider: ProviderClientConfig
	subscription: {
		external_webhook_id: string
	}
}
export type IUnsubscribeOrderWebhooksResponse = void

export type IGetOrderDetailsParams = {
	credentials: IMarketplaceCredentials
	provider: Pick<IMarketplaceProvider, 'base_url'>
	external_order_id: string
	resource?: string
}
export type IGetOrderDetailsResponse = {
	external_status: string
	status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
	ordered_at: Date
	approved_at: Date | null

	// Financials — in cents
	total_amount: number
	shipping_amount: number
	discount_amount: number

	// Buyer
	external_order_id: string
	buyer: {
		name: string | null
		document: string | null
		email: string | null
		phone: string | null
	}

	// Items with snapshot data
	items: Array<{
		external_item_id: string
		external_variant_id: string | null
		title: string
		sku: string | null
		quantity: number
		unit_amount: number // in cents
		total_amount: number // in cents
	}>
}

export interface IMarketplaceAdapter {
	readonly provider: Provider

	// Auth methods
	exchangeCode(params: IExchangeCodeParams): Promise<IExchangeCodeResponse>
	getUserInfo(params: IGetUserInfoParams): Promise<IGetUserInfoResponse>
	refreshToken(params: IRefreshTokenParams): Promise<IRefreshTokenResponse>
	revokeAuthorization(params: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse>

	// Orders methods
	subscribeOrderWebhooks(params: ISubscribeOrderWebhooksParams): Promise<ISubscribeOrderWebhooksResponse>
	unsubscribeOrderWebhooks(params: IUnsubscribeOrderWebhooksParams): Promise<IUnsubscribeOrderWebhooksResponse>
	getOrderDetails(params: IGetOrderDetailsParams): Promise<IGetOrderDetailsResponse>

	// Products methods
	getAttributes(params: IGetAttributesParams): Promise<IGetAttributesResponse>
	publishProduct(params: IPublishProductParams): Promise<IPublishProductResponse>
}

export const MarketplaceAdapterSymbol = Symbol('IMarketplaceAdapter')