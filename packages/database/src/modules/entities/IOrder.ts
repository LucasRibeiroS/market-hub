import { OrderStatus } from '@entities/enums'

export type IOrder = {
	id: string
	user_id: string
	account_id: string
	external_order_id: string
	status: OrderStatus
	external_status: string
	total_amount: number // in cents
	shipping_amount: number // in cents
	discount_amount: number // in cents
	buyer_name: string | null
	buyer_document: string | null // CPF/CNPJ
	buyer_email: string | null
	buyer_phone: string | null
	ordered_at: Date
	approved_at: Date | null
	metadata: Record<string, unknown>
	created_at: Date
	updated_at: Date
}