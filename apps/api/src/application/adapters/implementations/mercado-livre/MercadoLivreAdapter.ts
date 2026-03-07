import { addDays, addSeconds } from 'date-fns'
import { injectable } from 'tsyringe'

import { IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'
import { FailedDependencyException } from '@integrator-packages/use-case/exceptions'

import { MercadoLivreClient } from '@adapters/implementations/mercado-livre/MercadoLivreClient'

import {
	IExchangeCodeParams,
	IExchangeCodeResponse,
	IGetUserInfoParams,
	IGetUserInfoResponse,
	IMarketplaceAdapter,
	IRefreshTokenParams,
	IRefreshTokenResponse,
	IRevokeAuthorizationParams,
	IRevokeAuthorizationResponse
} from '@adapters/IMarketplaceAdapter'

@injectable()
export class MercadoLivreAdapter implements IMarketplaceAdapter {
	readonly provider: Provider = 'mercado_livre'
	private client: MercadoLivreClient

	async exchangeCode({ code, provider }: IExchangeCodeParams): Promise<IExchangeCodeResponse> {
		const client = this.getClient({
			base_url: provider.base_url,
			// credentials are only necessary for authenticated requests
			credentials: { access_token: '', token_type: 'Bearer' }
		})

		const payload: IOAuthTokenPayload = {
			client_id: provider.client_id,
			client_secret: provider.client_secret,
			grant_type: 'authorization_code',
			redirect_uri: provider.redirect_uri,
			code
		}

		const [response, err] = await client.post<IOAuthTokenResponse>('/oauth/token', payload)
		if (err) {
			throw new FailedDependencyException(`Mercado Livre exchange code error: ${err.message}`)
		}

		return {
			credentials: {
				access_token: response.access_token,
				access_token_expires_at: addSeconds(new Date(), response.expires_in),
				refresh_token: response.refresh_token,
				// Mercado livre refresh tokens may have a longer expiration, but if it statys invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: response.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: response.token_type
			}
		}
	}

	async getUserInfo({ credentials, provider }: IGetUserInfoParams): Promise<IGetUserInfoResponse> {
		const client = this.getClient({ base_url: provider.base_url, credentials })

		const [response, err] = await client.get<IUserResponse>('/users/me')
		if (err) {
			throw new FailedDependencyException(`Mercado Livre get user info error: ${err.message}`)
		}

		return {
			account: {
				external_id: response.id.toString(),
				external_email: response.email
			}
		}
	}

	async refreshToken(_params: IRefreshTokenParams): Promise<IRefreshTokenResponse> {
		throw new Error('Not implemented')
	}

	async revokeAuthorization(_params: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse> {
		throw new Error('Not implemented')
	}

	private getClient({ base_url, credentials }: IGetClientParams): MercadoLivreClient {
		if (!this.client) {
			this.client = new MercadoLivreClient(base_url, credentials)
		} else {
			this.client.updateCredentials(credentials)
		}

		return this.client
	}
}

type IOAuthTokenPayload = {
	client_id: string
	client_secret: string
	grant_type: 'authorization_code'
	redirect_uri: string
	code: string
}

type IOAuthTokenResponse = {
	access_token: string
	token_type: string
	expires_in: number
	scope: string
	user_id: number
	refresh_token: string
}

type IUserResponse = {
	id: number
	email: string
}

type IGetClientParams = {
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
} & Pick <IMarketplaceProvider, 'base_url'>