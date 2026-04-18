import { and, eq, getTableColumns, inArray, sql } from 'drizzle-orm'

import { marketplaceAccounts, marketplaceCredentials, marketplaceProviders } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository, jsonBuildObject } from '@integrator-packages/database/drizzle/client'
import { IMarketplaceAccount } from '@integrator-packages/database/entities'

import {
	ICountParams,
	ICreateParams,
	IFindByIdResponse,
	IFindByIdSimplifiedResponse,
	IFindManyParams,
	IFindManyResponse,
	IFindManyWithDistinctProvidersParams,
	IFindManyWithDistinctProvidersResponse,
	IMarketplaceAccountsRepository,
	IUpdateParams
} from '@repositories/IMarketplaceAccountsRepository'

export class DrizzleMarketplaceAccountsRepository
	extends DrizzleBaseRepository
	implements IMarketplaceAccountsRepository {

	private findByIdQuery = this.drizzleClient.query.marketplaceAccounts
		.findFirst({
			where: eq(marketplaceAccounts.id, sql.placeholder('id')),
			with: {
				provider: {
					columns: { provider: true, display_name: true }
				}
			}
		})
		.prepare('findMarketplaceAccountById')

	private findByIdSimplifiedQuery = this.drizzleClient.query.marketplaceAccounts
		.findFirst({
			where: eq(marketplaceAccounts.id, sql.placeholder('id')),
			columns: {
				id: true,
				user_id: true,
				provider_id: true,
				status: true
			}
		})
		.prepare('findMarketplaceAccountByIdSimplified')

	async findMany({ user_id, ...paginator }: IFindManyParams): Promise<IFindManyResponse> {
		return await this.paginatedQuery({
			query: this.drizzleClient
				.select({
					...getTableColumns(marketplaceAccounts),
					provider: {
						provider: marketplaceProviders.provider,
						display_name: marketplaceProviders.display_name
					}
				})
				.from(marketplaceAccounts)
				.innerJoin(marketplaceProviders, eq(marketplaceAccounts.provider_id, marketplaceProviders.id))
				.where(eq(marketplaceAccounts.user_id, user_id))
				.$dynamic(),
			counter: this.count({ user_id }),
			paginator
		})
	}

	async findManyWithDistinctProviders({
		user_id, status, provider
	}: IFindManyWithDistinctProvidersParams): Promise<IFindManyWithDistinctProvidersResponse> {
		return await this.drizzleClient
			.selectDistinctOn([marketplaceProviders.provider], {
				...getTableColumns(marketplaceAccounts),
				credentials: jsonBuildObject({
					access_token: marketplaceCredentials.access_token,
					token_type: marketplaceCredentials.token_type
				}),
				provider: jsonBuildObject({
					provider: marketplaceProviders.provider,
					base_url: marketplaceProviders.base_url
				})
			})
			.from(marketplaceAccounts)
			.innerJoin(marketplaceProviders, eq(marketplaceProviders.id, marketplaceAccounts.provider_id))
			.innerJoin(marketplaceCredentials, eq(marketplaceCredentials.account_id, marketplaceAccounts.id))
			.where(and(
				eq(marketplaceAccounts.user_id, user_id),
				eq(marketplaceAccounts.status, status),
				provider !== undefined ? inArray(marketplaceProviders.provider, provider) : undefined
			))
	}

	async findById(id: string): Promise<IFindByIdResponse | null> {
		return await this.findByIdQuery.execute({ id }) || null
	}

	async findByIdSimplified(id: string): Promise<IFindByIdSimplifiedResponse | null> {
		return await this.findByIdSimplifiedQuery.execute({ id }) || null
	}

	async count({ user_id }: ICountParams): Promise<number> {
		return await this.drizzleClient.$count(marketplaceAccounts, eq(marketplaceAccounts.user_id, user_id))
	}

	async create(data: ICreateParams): Promise<IMarketplaceAccount> {
		return await this.drizzleClient
			.insert(marketplaceAccounts)
			.values(data)
			.returning()
			.then(([result]) => result)
	}

	async update(id: string, data: IUpdateParams): Promise<IMarketplaceAccount> {
		return await this.drizzleClient
			.update(marketplaceAccounts)
			.set(data)
			.where(eq(marketplaceAccounts.id, id))
			.returning()
			.then(([result]) => result)
	}

	async delete(id: string): Promise<void> {
		await this.drizzleClient
			.delete(marketplaceAccounts)
			.where(eq(marketplaceAccounts.id, id))
			.execute()
	}
}
