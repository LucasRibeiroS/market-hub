export type IMarketplaceWebhook = {
	id: string
	account_id: string
	external_webhook_id: string
	topic: string
	is_active: boolean
	created_at: Date
	updated_at: Date
}