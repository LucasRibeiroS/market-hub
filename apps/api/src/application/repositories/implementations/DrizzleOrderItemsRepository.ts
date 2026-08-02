import { eq } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { orderItems } from '@integrator-packages/database/drizzle/tables'
import { IOrderItem } from '@integrator-packages/database/entities'

import {
	ICreateParams,
	IOrderItemsRepository,
	IUpdateParams
} from '@repositories/IOrderItemsRepository'

export class DrizzleOrderItemsRepository
	extends DrizzleBaseRepository
	implements IOrderItemsRepository {

	async create(params: ICreateParams): Promise<IOrderItem> {
		const result = await this.drizzleClient
			.insert(orderItems)
			.values(params)
			.returning()

		return result[0]
	}

	async createMany(params: ICreateParams[]): Promise<IOrderItem[]> {
		if (params.length === 0) {
			return []
		}

		return await this.drizzleClient
			.insert(orderItems)
			.values(params)
			.returning()
	}

	async findManyByOrderId(order_id: string): Promise<IOrderItem[]> {
		return await this.drizzleClient
			.select()
			.from(orderItems)
			.where(eq(orderItems.order_id, order_id))
	}

	async update(params: IUpdateParams): Promise<IOrderItem> {
		const { id, ...data } = params

		const result = await this.drizzleClient
			.update(orderItems)
			.set(data)
			.where(eq(orderItems.id, id))
			.returning()

		return result[0]
	}

	async deleteByOrderId(order_id: string): Promise<void> {
		await this.drizzleClient
			.delete(orderItems)
			.where(eq(orderItems.order_id, order_id))
	}
}
