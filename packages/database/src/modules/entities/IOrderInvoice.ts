export type IOrderInvoice = {
	id: string
	order_id: string
	shipment_id: string | null
	invoice_number: string
	invoice_key: string | null // NF-e 44-digit access key
	invoice_url: string | null
	issued_at: Date | null
	metadata: Record<string, unknown>
	created_at: Date
	updated_at: Date
}
