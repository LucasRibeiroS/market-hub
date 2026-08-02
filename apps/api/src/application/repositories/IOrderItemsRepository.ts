import { IOrderItem } from '@integrator-packages/database/entities'
import { CustomOmit } from '@utils/types'

export type ICreateParams = CustomOmit<IOrderItem, 'id' | 'created_at' | 'updated_at'>

export type IUpdateParams = { id: string } & Partial<CustomOmit<IOrderItem, 'id' | 'created_at' | 'updated_at'>>

export interface IOrderItemsRepository {
	create(params: ICreateParams): Promise<IOrderItem>
	createMany(params: ICreateParams[]): Promise<IOrderItem[]>
	findManyByOrderId(order_id: string): Promise<IOrderItem[]>
	update(params: IUpdateParams): Promise<IOrderItem>
	deleteByOrderId(order_id: string): Promise<void>
}

export const OrderItemsRepositorySymbol = Symbol('IOrderItemsRepository')
