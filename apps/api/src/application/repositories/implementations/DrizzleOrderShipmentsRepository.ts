import { eq } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { orderShipments } from '@integrator-packages/database/drizzle/tables'
import { IOrderShipment } from '@integrator-packages/database/entities'

import {
	ICreateParams,
	IOrderShipmentsRepository,
	IUpdateParams,
	IUpsertParams
} from '@repositories/IOrderShipmentsRepository'

export class DrizzleOrderShipmentsRepository
	extends DrizzleBaseRepository
	implements IOrderShipmentsRepository {

	async create(params: ICreateParams): Promise<IOrderShipment> {
		const result = await this.drizzleClient
			.insert(orderShipments)
			.values(params)
			.returning()

		return result[0]
	}

	async upsert({ order_id, external_shipment_id, data }: IUpsertParams): Promise<IOrderShipment> {

		const result = await this.drizzleClient
			.insert(orderShipments)
			.values({
				order_id,
				external_shipment_id,
				...data
			})
			.onConflictDoUpdate({
				target: [orderShipments.order_id, orderShipments.external_shipment_id],
				set: {
					order_id,
					external_shipment_id,
					...data
				}
			})
			.returning()

		return result[0]
	}

	async findManyByOrderId(order_id: string): Promise<IOrderShipment[]> {
		return await this.drizzleClient
			.select()
			.from(orderShipments)
			.where(eq(orderShipments.order_id, order_id))
	}

	async update(params: IUpdateParams): Promise<IOrderShipment> {
		const { id, ...data } = params

		const result = await this.drizzleClient
			.update(orderShipments)
			.set(data)
			.where(eq(orderShipments.id, id))
			.returning()

		return result[0]
	}

	async deleteByOrderId(order_id: string): Promise<void> {
		await this.drizzleClient
			.delete(orderShipments)
			.where(eq(orderShipments.order_id, order_id))
	}
}
