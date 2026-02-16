export type IApiKey = {
	id: string
	user_id: string
	encrypted_key: string
	key_lookup: string
	key_preview: string
	name: string
	permissions: string[]
	created_at: Date
	updated_at: Date
}