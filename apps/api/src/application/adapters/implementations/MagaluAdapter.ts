import { injectable } from 'tsyringe'

import { Provider } from '@integrator-packages/database/entities'

import {
	IExchangeCodeParams,
	IExchangeCodeResponse,
	IGetAttributesParams,
	IGetAttributesResponse,
	IGetUserInfoParams,
	IGetUserInfoResponse,
	IMarketplaceAdapter,
	IPublishProductParams,
	IPublishProductResponse,
	IRefreshTokenParams,
	IRefreshTokenResponse,
	IRevokeAuthorizationParams,
	IRevokeAuthorizationResponse
} from '@adapters/IMarketplaceAdapter'

@injectable()
export class MagaluAdapter implements IMarketplaceAdapter {
	readonly provider: Provider = 'magalu'

	async exchangeCode(_params: IExchangeCodeParams): Promise<IExchangeCodeResponse> {
		throw new Error('Not implemented')
	}

	async getUserInfo(_params: IGetUserInfoParams): Promise<IGetUserInfoResponse> {
		throw new Error('Not implemented')
	}

	async refreshToken(_params: IRefreshTokenParams): Promise<IRefreshTokenResponse> {
		throw new Error('Not implemented')
	}

	async revokeAuthorization(_params: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse> {
		throw new Error('Not implemented')
	}

	async getAttributes(_params: IGetAttributesParams): Promise<IGetAttributesResponse> {
		throw new Error('Not implemented')
	}

	async publishProduct(_params: IPublishProductParams): Promise<IPublishProductResponse> {
		throw new Error('Not implemented')
	}
}