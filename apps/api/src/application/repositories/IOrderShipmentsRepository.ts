import { IOrderShipment } from '@integrator-packages/database/entities'
import { CustomOmit } from '@utils/types'

export type ICreateParams = CustomOmit<IOrderShipment, 'id' | 'created_at' | 'updated_at'>

export type IUpdateParams = { id: string } & Partial<CustomOmit<IOrderShipment, 'id' | 'created_at' | 'updated_at'>>

export type IUpsertParams = {
	order_id: string
	external_shipment_id: string
	data: Omit<ICreateParams, 'order_id' | 'external_shipment_id'>
}

export interface IOrderShipmentsRepository {
	create(params: ICreateParams): Promise<IOrderShipment>
	upsert(params: IUpsertParams): Promise<IOrderShipment>
	findManyByOrderId(order_id: string): Promise<IOrderShipment[]>
	update(params: IUpdateParams): Promise<IOrderShipment>
	deleteByOrderId(order_id: string): Promise<void>
}

export const OrderShipmentsRepositorySymbol = Symbol('IOrderShipmentsRepository')
