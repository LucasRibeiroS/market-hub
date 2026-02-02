export type IMarketplaceCredential = {
	id: string
	account_id: string
	access_token: string
	refresh_token: string
	access_token_expires_at: Date
	refresh_token_expires_at: Date
	scopes: Record<string, unknown> | null
	token_type: string | null
}