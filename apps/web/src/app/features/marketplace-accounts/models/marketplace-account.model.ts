import { Provider } from '@features/marketplace-accounts/models/marketplace-provider.model'

export type AccountStatus = 'active' | 'disconnected' | 'expired' | 'revoked' | 'error'

export const AccountStatusEnum: { [key in AccountStatus]: key } = {
	active: 'active',
	disconnected: 'disconnected',
	expired: 'expired',
	revoked: 'revoked',
	error: 'error'
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