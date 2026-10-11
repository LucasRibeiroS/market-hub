import { inject, injectable } from 'tsyringe'

import { Transactional } from '@integrator-packages/database/transaction'

import { Documentation } from '@integrator-packages/use-case/documentation'
import { IUseCase } from '@integrator-packages/use-case'

import { IOrdersRepository, OrdersRepositorySymbol } from '@repositories/IOrdersRepository'
import { ICreateParams as ICreateOrderItemParams, IOrderItemsRepository, OrderItemsRepositorySymbol } from '@repositories/IOrderItemsRepository'
import { IMarketplaceListingsRepository, MarketplaceListingsRepositorySymbol } from '@repositories/IMarketplaceListingsRepository'
import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'

import { IGetOrderDetailsResponse } from '@adapters/IMarketplaceAdapter'

type UpsertOrderRequest = {
	user_id: string
	account_id: string
	order_details: IGetOrderDetailsResponse
}
type T = UpsertOrderRequest

type UpsertOrderResponse = {
	order_id: string
}
type K = UpsertOrderResponse

export const UpsertOrderSymbol = Symbol('UpsertOrder')

@injectable()
@Documentation({
	tags: ['Orders'],
	summary: 'Upsert order',
	description: 'Create or update an internal order with items, shipments, and invoices from normalized adapter response',
	is_public: false
})
export class UpsertOrder implements IUseCase<T, K> {
	constructor(
		@inject(OrdersRepositorySymbol)
		private ordersRepository: IOrdersRepository,
		@inject(OrderItemsRepositorySymbol)
		private orderItemsRepository: IOrderItemsRepository,
		@inject(MarketplaceListingsRepositorySymbol)
		private marketplaceListingsRepository: IMarketplaceListingsRepository,
		@inject(VariantsRepositorySymbol)
		private variantsRepository: IVariantsRepository
	) {}

	@Transactional()
	async execute({ user_id, account_id, order_details }: T): Promise<K> {
		// Upsert the main order
		const order = await this.ordersRepository.upsert({
			user_id,
			account_id,
			external_order_id: order_details.external_order_id,
			status: order_details.status,
			external_status: order_details.external_status,
			total_amount: order_details.total_amount,
			shipping_amount: order_details.shipping_amount,
			discount_amount: order_details.discount_amount,
			buyer_name: order_details.buyer.name || null,
			buyer_document: order_details.buyer.document || null,
			buyer_email: order_details.buyer.email || null,
			buyer_phone: order_details.buyer.phone || null,
			ordered_at: order_details.ordered_at,
			approved_at: order_details.approved_at || null,
			metadata: {}
		})

		// Delete and recreate order items
		await this.orderItemsRepository.deleteByOrderId(order.id)

		if (order_details.items.length > 0) {
			const orderItems = await Promise.all(
				order_details.items.map(item => this.buildOrderItem({
					item,
					order_id: order.id,
					account_id,
					user_id
				}))
			)

			await this.orderItemsRepository.createMany(orderItems)
		}

		return { order_id: order.id }
	}

	/**
	 * Resolves the internal variant/listing an order item maps to (by external references,
	 * falling back to SKU) and builds the snapshot payload persisted for the item.
	 */
	private async buildOrderItem({
		item, order_id, account_id, user_id
	}: IBuildOrderItemParams): Promise<ICreateOrderItemParams> {
		const listing = item.external_variant_id === null
			? null
			: await this.marketplaceListingsRepository.findFirstByExternalReferences({
				account_id,
				external_variant_id: item.external_variant_id
			})

		const variant = listing === null && item.sku !== null
			? await this.variantsRepository.findFirst({ user_id, sku: item.sku })
			: null

		return {
			order_id,
			external_item_id: item.external_item_id,
			external_variant_id: item.external_variant_id,
			variant_id: listing?.variant_id ?? variant?.id ?? null,
			listing_id: listing?.id ?? null,
			title: item.title,
			quantity: item.quantity,
			unit_amount: item.unit_amount,
			total_amount: item.total_amount,
			metadata: {}
		}
	}
}

type IBuildOrderItemParams = {
	item: IGetOrderDetailsResponse['items'][number]
	order_id: string
	account_id: string
	user_id: string
}