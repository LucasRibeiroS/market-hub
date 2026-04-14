import { IMarketplaceCredential } from '@integrator-packages/database/entities/IMarketplaceCredential'

import { BaseHttpClient } from '@clients/BaseHttpClient'
import { IMagaluErrorResponse } from '@adapters/implementations/magalu/types'

export class MagaluClient extends BaseHttpClient {
	constructor(
		baseURL: string,
		credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	) {
		super(baseURL)
		this.updateCredentials(credentials)
	}

	updateCredentials(credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>): void {
		if (credentials.token_type !== 'Bearer') {
			throw new Error(`Unsupported token type: ${credentials.token_type}`)
		}
		if (credentials.access_token === '') {
			return
		}

		this.defaultHeaders['Authorization'] = `${credentials.token_type} ${credentials.access_token}`
	}

	getMessageFromError(error: Error): string {
		const message = this.getRawErrorMessage(error)

		let response: IMagaluErrorResponse
		try {
			response = JSON.parse(message) as IMagaluErrorResponse
		} catch {
			return message
		}

		if (!response.errors || response.errors.length === 0) {
			return response.detail ?? response.title
		}

		return response.errors
			.map(e => `${e.field}: ${e.description}`)
			.join('. ')
	}
}
