export interface ApiKey {
	id: string
	name: string
	prefix: string
	createdAt: Date
	expiresAt: Date | null
	lastUsedAt: Date | null
}

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