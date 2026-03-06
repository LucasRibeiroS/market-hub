import { and, eq, sql } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { marketplaceProviders } from '@integrator-packages/database/drizzle/tables'
import { IMarketplaceProvider } from '@integrator-packages/database/entities'

import { IFindFirstParams, IMarketplaceProvidersRepository } from '@repositories/IMarketplaceProvidersRepository'

export class DrizzleMarketplaceProvidersRepository
	extends DrizzleBaseRepository
	implements IMarketplaceProvidersRepository {

	private findFirstQuery = this.drizzleClient.query.marketplaceProviders
		.findFirst({
			where: and(
				eq(marketplaceProviders.provider, sql.placeholder('provider')),
				eq(marketplaceProviders.is_active, sql.placeholder('is_active'))
			)
		})
		.prepare('findFirstMarketplaceProvider')

	async findFirst({ provider, is_active }: IFindFirstParams): Promise<IMarketplaceProvider | null> {
		return await this.findFirstQuery.execute({ provider, is_active }) || null
	}
}