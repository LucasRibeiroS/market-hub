export type IVariant = {
	id: string
	user_id: string
	product_id: string
	sku: string // Stock Keeping Unit
	ean: string | null // GTIN/Código de Barras
	price: number // in cents
	weight_kg: string
	height_cm: string
	width_cm: string
	depth_cm: string
	images: string[]
	attributes: Record<string, string>
	is_primary: boolean
	created_at: Date
	updated_at: Date
}