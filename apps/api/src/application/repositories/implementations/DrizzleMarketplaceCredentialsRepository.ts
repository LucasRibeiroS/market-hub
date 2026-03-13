import { eq, sql } from 'drizzle-orm'

import { marketplaceCredentials } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IMarketplaceCredential } from '@integrator-packages/database/entities'

import {
	ICreateParams,
	IFindFirstParams,
	IFindFirstResponse,
	IMarketplaceCredentialsRepository,
	IUpdateParams,
	IUpsertParams
} from '@repositories/IMarketplaceCredentialsRepository'

export class DrizzleMarketplaceCredentialsRepository
	extends DrizzleBaseRepository
	implements IMarketplaceCredentialsRepository {

	private findFirstQuery = this.drizzleClient.query.marketplaceCredentials.findFirst({
		where: eq(marketplaceCredentials.account_id, sql.placeholder('account_id')),
		with: {
			account: {
				columns: {},
				with: { provider: true }
			}
		}
	}).prepare('findFirstMarketplaceCredential')

	async findFirst({ account_id }: IFindFirstParams): Promise<IFindFirstResponse | null> {
		return await this.findFirstQuery.execute({ account_id }) || null
	}

	async create(data: ICreateParams): Promise<IMarketplaceCredential> {
		return await this.drizzleClient
			.insert(marketplaceCredentials)
			.values(data)
			.returning()
			.then(([result]) => result)
	}

	async update(id: string, data: IUpdateParams): Promise<void> {
		await this.drizzleClient
			.update(marketplaceCredentials)
			.set(data)
			.where(eq(marketplaceCredentials.id, id))
			.returning()
	}

	async upsert(data: IUpsertParams): Promise<IMarketplaceCredential> {
		return await this.drizzleClient
			.insert(marketplaceCredentials)
			.values(data)
			.onConflictDoUpdate({
				target: marketplaceCredentials.account_id,
				set: data
			})
			.returning()
			.then(([result]) => result)
	}
}