export type Provider = 'mercado_livre' | 'magalu'

export const ProviderEnum: { [key in Provider]: key } = {
	mercado_livre: 'mercado_livre',
	magalu: 'magalu'
}

export type AccountStatus = 'active' | 'disconnected' | 'expired' | 'revoked' | 'error'

export const AccountStatusEnum: { [key in AccountStatus]: key } = {
	active: 'active',
	disconnected: 'disconnected',
	expired: 'expired',
	revoked: 'revoked',
	error: 'error'
}

export type IMarketplaceProvider = {
	id: string
	provider: Provider
	display_name: string
	auth_url: string
	token_url: string
	client_id: string
	client_secret: string
	redirect_url: string
	is_active: boolean
}

export type IMarketplaceAccount = {
	id: string
	user_id: string
	provider: Provider
	external_id: string
	external_email: string | null
	status: AccountStatus
	created_at: Date
	updated_at: Date
}