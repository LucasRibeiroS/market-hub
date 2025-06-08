export type IApiKey = {
	id: string
	user_id: string
	public_key: string
	name: string
	permissions: string[]
	created_at: Date
	updated_at: Date
}