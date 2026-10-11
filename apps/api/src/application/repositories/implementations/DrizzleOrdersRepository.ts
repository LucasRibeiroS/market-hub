import { and, eq, exists, sql } from 'drizzle-orm'

import { DrizzleBaseRepository, jsonAggBuildObject, jsonBuildObject } from '@integrator-packages/database/drizzle/client'
import { marketplaceAccounts, marketplaceProviders, orderItems, orders, variants } from '@integrator-packages/database/drizzle/tables'
import { IOrder } from '@integrator-packages/database/entities'

import {
	ICountParams,
	IFindFirstParams,
	IFindManyParams,
	IFindManyResponse,
	IOrdersRepository,
	IUpsertParams
} from '@repositories/IOrdersRepository'

export class DrizzleOrdersRepository
	extends DrizzleBaseRepository
	implements IOrdersRepository {

	async findMany({ user_id, account_id, product_id, ...paginator }: IFindManyParams): Promise<IFindManyResponse> {
		const where = [eq(orders.user_id, user_id)]
		if (account_id !== undefined) {
			where.push(eq(orders.account_id, account_id))
		}

		const itemsSq = this.drizzleClient
			.select({
				order_id: orderItems.order_id,
				data: jsonAggBuildObject({
					variant_id: orderItems.variant_id,
					listing_id: orderItems.listing_id,
					quantity: orderItems.quantity,
					unit_amount: orderItems.unit_amount,
					total_amount: orderItems.total_amount
				}).as('items_data')
			})
			.from(orderItems)
			.where(and(
				eq(orderItems.order_id, orders.id),
				product_id !== undefined
					? exists(
						this.drizzleClient
							.select({ id: sql`1` })
							.from(variants)
							.where(and(
								eq(variants.id, orderItems.variant_id),
								eq(variants.product_id, product_id)
							))
					)
					: undefined
			))
			.groupBy(orderItems.order_id)
			.as('orderItems_sq')

		const query = this.drizzleClient
			.select({
				id: orders.id,
				account_id: orders.account_id,
				status: orders.status,
				total_amount: orders.total_amount,
				shipping_amount: orders.shipping_amount,
				discount_amount: orders.discount_amount,
				buyer_name: orders.buyer_name,
				buyer_document: orders.buyer_document,
				buyer_email: orders.buyer_email,
				buyer_phone: orders.buyer_phone,
				ordered_at: orders.ordered_at,
				approved_at: orders.approved_at,
				account: jsonBuildObject({
					external_email: marketplaceAccounts.external_email,
					provider: jsonBuildObject({
						provider: marketplaceProviders.provider,
						display_name: marketplaceProviders.display_name
					})
				}),
				items: itemsSq.data
			})
			.from(orders)
			.innerJoin(marketplaceAccounts, eq(orders.account_id, marketplaceAccounts.id))
			.innerJoin(marketplaceProviders, eq(marketplaceAccounts.provider_id, marketplaceProviders.id))
			.innerJoinLateral(itemsSq, eq(itemsSq.order_id, orders.id))
			.where(and(...where))
			.$dynamic()

		return await this.paginatedQuery({
			query,
			counter: this.count({ user_id, account_id, product_id }),
			paginator
		})
	}

	async findById(id: string): Promise<IOrder | null> {
		return await this.drizzleClient
			.select()
			.from(orders)
			.where(eq(orders.id, id))
			.then(rows => rows[0] || null)
	}

	async findFirst({ account_id, external_order_id }: IFindFirstParams): Promise<IOrder | null> {
		return await this.drizzleClient
			.select()
			.from(orders)
			.where(and(
				eq(orders.account_id, account_id),
				eq(orders.external_order_id, external_order_id)
			))
			.then(rows => rows[0] || null)
	}

	async count({ user_id, account_id, product_id }: ICountParams): Promise<number> {
		const where = [eq(orders.user_id, user_id)]
		if (account_id !== undefined) {
			where.push(eq(orders.account_id, account_id))
		}
		if (product_id !== undefined) {
			where.push(
				exists(
					this.drizzleClient
						.select({ id: sql`1` })
						.from(orderItems)
						.innerJoin(variants, eq(orderItems.variant_id, variants.id))
						.where(and(
							// Correlate with the outer order, otherwise the EXISTS becomes a
							// constant predicate and count() stops matching findMany()'s result set
							eq(orderItems.order_id, orders.id),
							eq(variants.product_id, product_id)
						))
				)
			)
		}

		return await this.drizzleClient.$count(orders, and(...where))
	}

	async upsert(data: IUpsertParams): Promise<IOrder> {
		const result = await this.drizzleClient
			.insert(orders)
			.values(data)
			.onConflictDoUpdate({
				target: [orders.account_id, orders.external_order_id],
				set: {
					...data,
					// Once an order has been approved, later status updates (shipped/delivered)
					// must not wipe the original approval timestamp.
					approved_at: sql`coalesce(${orders.approved_at}, excluded.approved_at)`
				}
			})
			.returning()

		return result[0]
	}

	async deleteById(id: string): Promise<void> {
		await this.drizzleClient
			.delete(orders)
			.where(eq(orders.id, id))
	}
}