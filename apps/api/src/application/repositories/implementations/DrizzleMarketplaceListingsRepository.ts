import { and, eq, exists, inArray, SQL, sql } from 'drizzle-orm'

import { DrizzleBaseRepository, jsonBuildObject } from '@integrator-packages/database/drizzle/client'
import { marketplaceAccounts, marketplaceListings, marketplaceProviders, variants } from '@integrator-packages/database/drizzle/tables'
import { IMarketplaceListing } from '@integrator-packages/database/entities'

import {
	ICountParams,
	ICreateManyParams,
	IFindByIdResponse,
	IFindManyForPublishParams,
	IFindManyForPublishResponse,
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
					user_id: true,
					external_email: true,
					status: true
				},
				with: {
					provider: {
						columns: {
							provider: true,
							display_name: true
						}
					}
				}
			},
			variant: {
				columns: {
					id: true,
					product_id: true,
					sku: true
				}
			}
		}
	}).prepare('findMarketplaceCredentialById')

	async findMany({
		user_id, account_id, product_id, status, provider, ...paginator
	}: IFindManyParams): Promise<IFindManyResponse> {
		const where: SQL[] = [eq(marketplaceAccounts.user_id, user_id)]
		if (account_id !== undefined) {
			where.push(eq(marketplaceListings.account_id, account_id))
		}
		if (product_id !== undefined) {
			where.push(eq(variants.product_id, product_id))
		}
		if (status !== undefined) {
			where.push(eq(marketplaceListings.status, status))
		}
		if (provider !== undefined) {
			where.push(eq(marketplaceProviders.provider, provider))
		}

		const query = this.drizzleClient
			.select({
				id: marketplaceListings.id,
				account_id: marketplaceListings.account_id,
				variant_id: marketplaceListings.variant_id,
				status: marketplaceListings.status,
				last_sync_at: marketplaceListings.last_sync_at,
				sync_message: marketplaceListings.sync_message,
				account: jsonBuildObject({
					external_email: marketplaceAccounts.external_email,
					status: marketplaceAccounts.status,
					provider: jsonBuildObject({
						provider: marketplaceProviders.provider,
						display_name: marketplaceProviders.display_name
					})
				}),
				variant: jsonBuildObject({
					id: variants.id,
					product_id: variants.product_id,
					sku: variants.sku
				})
			})
			.from(marketplaceListings)
			.innerJoin(marketplaceAccounts, eq(marketplaceListings.account_id, marketplaceAccounts.id))
			.innerJoin(marketplaceProviders, eq(marketplaceAccounts.provider_id, marketplaceProviders.id))
			.innerJoin(variants, eq(marketplaceListings.variant_id, variants.id))
			.where(and(...where))
			.$dynamic()

		return await this.paginatedQuery({
			query,
			counter: this.count({ user_id, account_id, product_id, status, provider }),
			paginator
		})
	}

	async findManyForPublish({
		id, account_id, variant_id
	}: IFindManyForPublishParams): Promise<IFindManyForPublishResponse> {
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

	async count({ user_id, account_id, product_id, status, provider }: ICountParams): Promise<number> {
		const where: SQL[] = [
			exists(
				this.drizzleClient
					.select({ id: sql`1` })
					.from(marketplaceAccounts)
					.innerJoin(marketplaceProviders, eq(marketplaceAccounts.provider_id, marketplaceProviders.id))
					.where(and(
						eq(marketplaceAccounts.id, marketplaceListings.account_id),
						eq(marketplaceAccounts.user_id, user_id),
						account_id !== undefined ? eq(marketplaceAccounts.id, account_id) : undefined,
						provider !== undefined ? eq(marketplaceProviders.provider, provider) : undefined
					))
			)
		]
		if (product_id !== undefined) {
			where.push(
				exists(
					this.drizzleClient
						.select({ id: sql`1` })
						.from(variants)
						.where(and(
							eq(variants.id, marketplaceListings.variant_id),
							eq(variants.product_id, product_id)
						))
				)
			)
		}
		if (status !== undefined) {
			where.push(eq(marketplaceListings.status, status))
		}

		return await this.drizzleClient.$count(marketplaceListings, and(...where))
	}
}