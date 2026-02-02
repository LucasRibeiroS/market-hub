import { AccountStatus, Provider } from '@entities/enums'

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