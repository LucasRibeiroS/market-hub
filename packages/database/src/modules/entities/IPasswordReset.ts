export type IPasswordReset = {
	id: string
	user_id: string
	code: string
	expiration: Date
	is_used: boolean
	created_at: Date
	updated_at: Date
}