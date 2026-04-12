import { and, eq, inArray, SQL, sql } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { marketplaceListings } from '@integrator-packages/database/drizzle/tables'
import { IMarketplaceListing } from '@integrator-packages/database/entities'

import {
	ICreateManyParams,
	IFindByIdResponse,
	IFindManyParams,
	IFindManyResponse,
	IMarketplaceListingsRepository,
	IUpdateParams
} from '@repositories/IMarketplaceListingsRepository'

export class DrizzleMarketplaceListingsRepository
	extends DrizzleBaseRepository
	implements IMarketplaceListingsRepository {

	private findByIdQuery = this.drizzleClient.query.marketplaceListings.findFirst({
		where: eq(marketplaceListings.id, sql.placeholder('id')),
		with: {
			account: {
				columns: {
					status: true
				},
				with: { provider: true }
			}
		}
	}).prepare('findMarketplaceCredentialById')

	async findMany({ id, account_id, variant_id }: IFindManyParams): Promise<IFindManyResponse> {
		const where: SQL[] = []
		if (id !== undefined) {
			where.push(inArray(marketplaceListings.id, id))
		}
		if (account_id !== undefined) {
			where.push(eq(marketplaceListings.account_id, account_id))
		}
		if (variant_id !== undefined) {
			where.push(inArray(marketplaceListings.variant_id, variant_id))
		}

		return await this.drizzleClient.query.marketplaceListings.findMany({
			where: and(...where),
			with: {
				variant: {
					with: { product: true }
				}
			}
		})
	}

	async findById(id: string): Promise<IFindByIdResponse | null> {
		return await this.findByIdQuery.execute({ id }) || null
	}

	async createMany(data: ICreateManyParams): Promise<IMarketplaceListing[]> {
		return await this.drizzleClient
			.insert(marketplaceListings)
			.values(data)
			.returning()
	}

	async update(id: string, data: IUpdateParams): Promise<void> {
		await this.drizzleClient
			.update(marketplaceListings)
			.set(data)
			.where(eq(marketplaceListings.id, id))
	}

	async updateMany(ids: string[], data: IUpdateParams): Promise<void> {
		await this.drizzleClient
			.update(marketplaceListings)
			.set(data)
			.where(inArray(marketplaceListings.id, ids))
	}
}