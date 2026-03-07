import { IMarketplaceCredential } from '@integrator-packages/database/entities/IMarketplaceCredential'

import { BaseHttpClient } from '@clients/BaseHttpClient'

export class MercadoLivreClient extends BaseHttpClient {
	constructor(
		baseURL: string,
		credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	) {
		if (credentials.token_type !== 'Bearer') {
			throw new Error(`Unsupported token type: ${credentials.token_type}`)
		}

		super(
			baseURL,
			{ 'Authorization': `${credentials.token_type} ${credentials.access_token}` }
		)
	}
}