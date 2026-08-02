export type IOrderItem = {
	id: string
	order_id: string
	variant_id: string | null
	listing_id: string | null
	external_item_id: string
	external_variant_id: string | null
	title: string
	quantity: number
	unit_amount: number // in cents
	total_amount: number // in cents (may differ from unit_amount * quantity due to per-item discounts)
	metadata: Record<string, unknown>
	created_at: Date
	updated_at: Date
}