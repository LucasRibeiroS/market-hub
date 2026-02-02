export type ListingStatus = 'pending' | 'active' | 'paused' | 'error'

export const ListingStatusEnum: { [key in ListingStatus]: key } = {
	pending: 'pending',
	active: 'active',
	paused: 'paused',
	error: 'error'
}