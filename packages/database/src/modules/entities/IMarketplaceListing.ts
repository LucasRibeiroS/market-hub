import { ListingStatus } from '@entities/enums'

export type IMarketplaceListing = {
	id: string
	account_id: string
	variant_id: string
	external_product_id: string | null
	external_variant_id: string | null
	status: ListingStatus
	last_sync_at: Date | null
	sync_message: string | null
	metadata: Record<string, unknown>
}