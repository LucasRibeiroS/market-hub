import { injectable } from 'tsyringe'

import { Provider } from '@integrator-packages/database/entities'

import {
	IExchangeCodeParams,
	IExchangeCodeResponse,
	IMarketplaceAdapter,
	IRefreshTokenParams,
	IRefreshTokenResponse,
	IRevokeAuthorizationParams,
	IRevokeAuthorizationResponse
} from '@adapters/IMarketplaceAdapter'

@injectable()
export class MercadoLivreAdapter implements IMarketplaceAdapter {
	readonly provider: Provider = 'mercado_livre'

	async exchangeCode(_params: IExchangeCodeParams): Promise<IExchangeCodeResponse> {
		throw new Error('Not implemented')
	}

	async refreshToken(_params: IRefreshTokenParams): Promise<IRefreshTokenResponse> {
		throw new Error('Not implemented')
	}

	async revokeAuthorization(_params: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse> {
		throw new Error('Not implemented')
	}
}