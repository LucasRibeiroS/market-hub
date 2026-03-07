export type IApiKey = {
	id: string
	user_id: string
	key_preview: string
	name: string
	permissions: string[]
	is_active: boolean
	created_at: Date
	updated_at: Date
}