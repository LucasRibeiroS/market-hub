import { IOrderInvoice } from '@integrator-packages/database/entities'
import { CustomOmit } from '@utils/types'

export type ICreateParams = CustomOmit<IOrderInvoice, 'id' | 'created_at' | 'updated_at'>

export type IUpdateParams = Partial<CustomOmit<IOrderInvoice, 'id' | 'created_at' | 'updated_at'>> & { id: string }

export interface IOrderInvoicesRepository {
	create(params: ICreateParams): Promise<IOrderInvoice>
	findManyByOrderId(order_id: string): Promise<IOrderInvoice[]>
	findByInvoiceNumber(order_id: string, invoice_number: string): Promise<IOrderInvoice | null>
	update(params: IUpdateParams): Promise<IOrderInvoice>
	deleteByOrderId(order_id: string): Promise<void>
}

export const OrderInvoicesRepositorySymbol = Symbol('IOrderInvoicesRepository')
