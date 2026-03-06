import { AccountStatus } from '@entities/enums'

export type IMarketplaceAccount = {
	id: string
	user_id: string
	provider_id: string
	external_id: string
	external_email: string | null
	status: AccountStatus
	created_at: Date
	updated_at: Date
}