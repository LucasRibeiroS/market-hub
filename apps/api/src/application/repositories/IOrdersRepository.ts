import { IMarketplaceAccount, IMarketplaceProvider, IOrder, IOrderItem } from '@integrator-packages/database/entities'

import { IPagination, IPaginator } from '@utils/pagination'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
	account_id?: string
	product_id?: string
} & IPaginator

export type IFindManyResponse = {
	data: Array<{
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

export type IFindFirstParams = {
	account_id: string
	external_order_id: string
}

export type ICountParams = {
	user_id: string
	account_id?: string
	product_id?: string
}

export type IUpsertParams = CustomOmit<IOrder, 'id' | 'created_at' | 'updated_at'>

export interface IOrdersRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findById(id: string): Promise<IOrder | null>
	findFirst(params: IFindFirstParams): Promise<IOrder | null>
	count(params: ICountParams): Promise<number>
	upsert(params: IUpsertParams): Promise<IOrder>
	deleteById(id: string): Promise<void>
}

export const OrdersRepositorySymbol = Symbol('IOrdersRepository')