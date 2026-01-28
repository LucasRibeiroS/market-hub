export type IProduct = {
	id: string
	user_id: string
	name: string
	description: string
	attributes: Record<string, unknown>
	created_at: Date
	updated_at: Date
}