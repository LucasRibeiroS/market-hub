export type AccountStatus = 'active' | 'disconnected' | 'expired' | 'revoked' | 'error'

export const AccountStatusEnum: { [key in AccountStatus]: key } = {
	active: 'active',
	disconnected: 'disconnected',
	expired: 'expired',
	revoked: 'revoked',
	error: 'error'
}