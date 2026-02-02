import { ListingStatus, Provider } from '@entities/enums'

export type IMarketplaceListing = {
	id: string
	variant_id: string
	provider: Provider
	external_id: string
	status: ListingStatus
	last_sync_at: Date | null
	sync_message: string | null
	metadata: Record<string, unknown>
}