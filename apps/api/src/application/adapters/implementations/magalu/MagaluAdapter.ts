import { inject, injectable } from 'tsyringe'
import { addDays, addSeconds } from 'date-fns'

import { IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

import { ILoggerAdapter, LoggerAdapterSymbol } from '@integrator-packages/adapters'

import { FailedDependencyException } from '@integrator-packages/use-case/exceptions'

import { MagaluClient } from '@adapters/implementations/magalu/MagaluClient'
import { IJwtPayload, IOAuthTokenPayload, IOAuthTokenResponse } from '@adapters/implementations/magalu/types'

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
	private client?: MagaluClient

	constructor(
		@inject(LoggerAdapterSymbol)
		private readonly loggerAdapter: ILoggerAdapter
	) {}

	async exchangeCode({ code, provider }: IExchangeCodeParams): Promise<IExchangeCodeResponse> {
		const client = this.getUnauthenticatedClient({ base_url: 'https://id.magalu.com' })

		const payload: IOAuthTokenPayload = {
			client_id: provider.client_id,
			client_secret: provider.client_secret,
			grant_type: 'authorization_code',
			redirect_uri: provider.redirect_uri,
			code
		}

		const [res, err] = await client.post<IOAuthTokenResponse>('/oauth/token', payload)
		if (err) {
			this.loggerAdapter.error(`Magalu exchange code error: ${err}`)
			throw new FailedDependencyException('Failed to exchange code for Magalu')
		}

		this.ensureRequiredScopes(res.scope)

		return {
			credentials: {
				access_token: res.access_token,
				access_token_expires_at: addSeconds(new Date(), res.expires_in),
				refresh_token: res.refresh_token,
				// Magalu refresh tokens may have a longer expiration, but if it stays invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: res.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: res.token_type
			}
		}

	}

	async getUserInfo({ credentials }: IGetUserInfoParams): Promise<IGetUserInfoResponse> {
		const jwtPayload = this.decodeJwtPayload(credentials.access_token)

		if (jwtPayload === null) {
			this.loggerAdapter.error('Magalu get user info error: could not decode sub from JWT')
			throw new FailedDependencyException('Failed to get user info from Magalu token')
		}

		return {
			account: {
				external_id: jwtPayload.sub,
				external_email: jwtPayload.email || null
			}
		}
	}

	async refreshToken({ provider, refresh_token }: IRefreshTokenParams): Promise<IRefreshTokenResponse> {
		const client = this.getUnauthenticatedClient({ base_url: provider.base_url })

		const payload: IOAuthTokenPayload = {
			client_id: provider.client_id,
			client_secret: provider.client_secret,
			grant_type: 'refresh_token',
			refresh_token
		}

		const [res, err] = await client.post<IOAuthTokenResponse>(
			'/oauth/token',
			new URLSearchParams(payload).toString(),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		)

		if (err) {
			this.loggerAdapter.error(`Magalu refresh token error: ${err.message}`)
			throw new FailedDependencyException('Failed to refresh token for Magalu')
		}

		return {
			credentials: {
				access_token: res.access_token,
				access_token_expires_at: addSeconds(new Date(), res.expires_in),
				refresh_token: res.refresh_token,
				// Magalu refresh tokens may have a longer expiration, but if it stays invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: res.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: res.token_type
			}
		}
	}

	async revokeAuthorization({ account }: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse> {
		this.loggerAdapter.warn(`Magalu does not expose a revoke endpoint. Marking account ${account.external_id} as revoked locally only.`)

		return { external_id: account.external_id }
	}

	async getAttributes(_params: IGetAttributesParams): Promise<IGetAttributesResponse> {
		throw new Error('Not implemented')
	}

	async publishProduct(_params: IPublishProductParams): Promise<IPublishProductResponse> {
		throw new Error('Not implemented')
	}

	/** @throws FailedDependencyException if any of the required scopes are missing from the granted scopes */
	private ensureRequiredScopes(scopes: string): void {
		const required = [
			'open:portfolio-skus-seller:read',
			'open:portfolio-skus-seller:write',
			'open:portfolio-prices-seller:read',
			'open:portfolio-prices-seller:write',
			'open:portfolio-stocks-seller:read',
			'open:portfolio-stocks-seller:write',
			'open:portfolio-categories-seller:read',
			'open:order-order-seller:read'
		]

		const granted = new Set(scopes.split(' '))
		const missing = required.filter(s => !granted.has(s))
		if (missing.length > 0) {
			throw new FailedDependencyException(`Authorization incomplete — the following permissions were not granted: ${missing.join(', ')}`)
		}
	}

	/** Decode the payload segment of a JWT without verifying the signature. */
	private decodeJwtPayload(token: string): IJwtPayload | null {
		try {
			const [, payloadB64] = token.split('.')
			const json = Buffer.from(payloadB64, 'base64url').toString('utf-8')
			return JSON.parse(json) as IJwtPayload
		} catch {
			return null
		}
	}

	protected getUnauthenticatedClient({ base_url }: IGetUnauthenticatedClientParams): MagaluClient {
		return new MagaluClient(base_url, { access_token: '', token_type: 'Bearer' })
	}

	protected getClient({ base_url, credentials }: IGetClientParams): MagaluClient {
		if (!this.client) {
			this.client = new MagaluClient(base_url, credentials)
		} else {
			this.client.updateCredentials(credentials)
		}

		return this.client
	}
}

type IGetUnauthenticatedClientParams = Pick<IMarketplaceProvider, 'base_url'>

type IGetClientParams = {
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
} & Pick <IMarketplaceProvider, 'base_url'>