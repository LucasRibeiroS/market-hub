import { and, eq } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { orderInvoices } from '@integrator-packages/database/drizzle/tables'
import { IOrderInvoice } from '@integrator-packages/database/entities'

import {
	ICreateParams,
	IOrderInvoicesRepository,
	IUpdateParams
} from '@repositories/IOrderInvoicesRepository'

export class DrizzleOrderInvoicesRepository
	extends DrizzleBaseRepository
	implements IOrderInvoicesRepository {

	async create(params: ICreateParams): Promise<IOrderInvoice> {
		const result = await this.drizzleClient
			.insert(orderInvoices)
			.values(params)
			.returning()

		return result[0]
	}

	async findManyByOrderId(order_id: string): Promise<IOrderInvoice[]> {
		return await this.drizzleClient
			.select()
			.from(orderInvoices)
			.where(eq(orderInvoices.order_id, order_id))
	}

	async findByInvoiceNumber(order_id: string, invoice_number: string): Promise<IOrderInvoice | null> {
		return await this.drizzleClient
			.select()
			.from(orderInvoices)
			.where(and(
				eq(orderInvoices.order_id, order_id),
				eq(orderInvoices.invoice_number, invoice_number)
			))
			.then(rows => rows[0] || null)
	}

	async update(params: IUpdateParams): Promise<IOrderInvoice> {
		const { id, ...data } = params

		const result = await this.drizzleClient
			.update(orderInvoices)
			.set(data)
			.where(eq(orderInvoices.id, id))
			.returning()

		return result[0]
	}

	async deleteByOrderId(order_id: string): Promise<void> {
		await this.drizzleClient
			.delete(orderInvoices)
			.where(eq(orderInvoices.order_id, order_id))
	}
}
