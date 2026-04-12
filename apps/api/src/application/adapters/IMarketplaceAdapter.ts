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
	provider: ProviderClientConfig
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
	provider: ProviderClientConfig
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

export interface IMarketplaceAdapter {
	readonly provider: Provider

	// Auth methods
	exchangeCode(params: IExchangeCodeParams): Promise<IExchangeCodeResponse>
	getUserInfo(params: IGetUserInfoParams): Promise<IGetUserInfoResponse>
	refreshToken(params: IRefreshTokenParams): Promise<IRefreshTokenResponse>
	revokeAuthorization(params: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse>

	// Products methods
	getAttributes(params: IGetAttributesParams): Promise<IGetAttributesResponse>
	publishProduct(params: IPublishProductParams): Promise<IPublishProductResponse>
}

export const MarketplaceAdapterSymbol = Symbol('IMarketplaceAdapter')