import { IMarketplaceAccount, IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

type ProviderClientConfig = Pick<IMarketplaceProvider, 'client_id' | 'client_secret' | 'redirect_url'>

export type OAuthCredentials = Pick<
	IMarketplaceCredential,
    | 'access_token'
    | 'access_token_expires_at'
    | 'refresh_token'
    | 'refresh_token_expires_at'
    | 'scopes'
    | 'token_type'
>

export type IExchangeCodeParams = {
	code: string
	provider: ProviderClientConfig
}
export type IExchangeCodeResponse = {
	account: Pick<IMarketplaceAccount, 'external_id' | 'external_email'>
	credentials: OAuthCredentials
}

export type IRefreshTokenParams = {
	credentials: OAuthCredentials
	provider: ProviderClientConfig
}
export type IRefreshTokenResponse = {
	credentials: OAuthCredentials
}

export type IRevokeAuthorizationParams = {
	account: Pick<IMarketplaceAccount, 'external_id'>
	credentials: OAuthCredentials
	config: ProviderClientConfig
}
export type IRevokeAuthorizationResponse = {
	external_id: string
}

export interface IMarketplaceAdapter {
	readonly provider: Provider

	exchangeCode(params: IExchangeCodeParams): Promise<IExchangeCodeResponse>
	refreshToken(params: IRefreshTokenParams): Promise<IRefreshTokenResponse>
	revokeAuthorization(params: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse>
}

export const MarketplaceAdapterSymbol = Symbol('IMarketplaceAdapter')