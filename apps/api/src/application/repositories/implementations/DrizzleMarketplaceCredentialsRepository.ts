import { marketplaceCredentials } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IMarketplaceCredential } from '@integrator-packages/database/entities'

import { ICreateParams, IMarketplaceCredentialsRepository } from '@repositories/IMarketplaceCredentialsRepository'

export class DrizzleMarketplaceCredentialsRepository
	extends DrizzleBaseRepository
	implements IMarketplaceCredentialsRepository {

	async create(data: ICreateParams): Promise<IMarketplaceCredential> {
		return await this.drizzleClient
			.insert(marketplaceCredentials)
			.values(data)
			.returning()
			.then(([result]) => result)
	}
}