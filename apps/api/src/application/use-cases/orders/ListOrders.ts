import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceAccount, IMarketplaceProvider, IOrder, IOrderItem } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { IOrdersRepository, OrdersRepositorySymbol } from '@repositories/IOrdersRepository'

import { IPagination, IPaginator } from '@utils/pagination'
import { orderItemJsonSchema, orderJsonSchema, paginationJsonSchema, paginatorJsonSchema, providerEnumSchema } from '@utils/typebox'

type ListOrdersRequest = {
	user_id: string
	account_id?: string
	product_id?: string
} & IPaginator
type T = ListOrdersRequest

type ListOrdersResponse = {
	orders: Array<{
		account: {
			provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
		} & Pick<IMarketplaceAccount, 'external_email'>
		items: Array<Pick<IOrderItem, 'variant_id' | 'listing_id' | 'quantity' | 'unit_amount' | 'total_amount'>>
	} & Pick<
		IOrder,
		| 'id'
		| 'account_id'
		| 'status'
		| 'total_amount'
		| 'shipping_amount'
		| 'discount_amount'
		| 'buyer_name'
		| 'buyer_document'
		| 'buyer_email'
		| 'buyer_phone'
		| 'ordered_at'
		| 'approved_at'
	>>
	pagination: IPagination
}
type K = ListOrdersResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Orders'],
	summary: 'List orders',
	description: 'List orders for a user with optional filters by account, product and provider',
	response: Type.Object({
		orders: Type.Array(
			Type.Intersect([
				Type.Pick(orderJsonSchema, ['id', 'account_id', 'status', 'total_amount', 'shipping_amount', 'discount_amount', 'buyer_name', 'buyer_document', 'buyer_email', 'buyer_phone', 'ordered_at', 'approved_at']),
				Type.Object({
					account: Type.Object({
						external_email: Type.String(),
						provider: Type.Object({
							provider: Type.Ref(providerEnumSchema.$id),
							display_name: Type.String()
						})
					})
				}),
				Type.Object({
					items: Type.Array(
						Type.Pick(orderItemJsonSchema, ['variant_id', 'listing_id', 'quantity', 'unit_amount', 'total_amount'])
					)
				})
			])
		),
		pagination: Type.Ref(paginationJsonSchema.$id)
	}, { $id: 'orders/ListOrdersResponse' })
})
export class ListOrders implements IUseCase<T, K> {
	constructor(
		@inject(OrdersRepositorySymbol)
		private readonly ordersRepository: IOrdersRepository
	) {}

	async execute(params: T): Promise<K> {
		const { data: orders, pagination } = await this.ordersRepository.findMany(params)

		return { orders, pagination }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'orders/ListOrdersRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({
			user_id: Type.String(),
			account_id: Type.Optional(Type.String()),
			product_id: Type.Optional(Type.String())
		}),
		paginatorJsonSchema
	])

	protected schema = Validator.schema
}