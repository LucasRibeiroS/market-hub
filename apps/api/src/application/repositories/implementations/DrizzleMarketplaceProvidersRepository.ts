import { and, eq, sql } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { marketplaceProviders } from '@integrator-packages/database/drizzle/tables'
import { IMarketplaceProvider } from '@integrator-packages/database/entities'

import { IFindFirstParams, IFindManyParams, IMarketplaceProvidersRepository } from '@repositories/IMarketplaceProvidersRepository'

export class DrizzleMarketplaceProvidersRepository
	extends DrizzleBaseRepository
	implements IMarketplaceProvidersRepository {

	private findManyQuery = this.drizzleClient.query.marketplaceProviders
		.findMany({
			where: eq(marketplaceProviders.is_active, sql.placeholder('is_active'))
		})
		.prepare('findManyMarketplaceProviders')

	private findByIdQuery = this.drizzleClient.query.marketplaceProviders
		.findFirst({
			where: eq(marketplaceProviders.id, sql.placeholder('id'))
		})
		.prepare('findMarketplaceProviderById')

	private findFirstQuery = this.drizzleClient.query.marketplaceProviders
		.findFirst({
			where: and(
				eq(marketplaceProviders.provider, sql.placeholder('provider')),
				eq(marketplaceProviders.is_active, sql.placeholder('is_active'))
			)
		})
		.prepare('findFirstMarketplaceProvider')

	async findMany({ is_active }: IFindManyParams): Promise<IMarketplaceProvider[]> {
		return await this.findManyQuery.execute({ is_active })
	}

	async findById(id: string): Promise<IMarketplaceProvider | null> {
		return await this.findByIdQuery.execute({ id }) || null
	}

	async findFirst({ provider, is_active }: IFindFirstParams): Promise<IMarketplaceProvider | null> {
		return await this.findFirstQuery.execute({ provider, is_active }) || null
	}
}