import { pgEnum } from 'drizzle-orm/pg-core'

export const provider = pgEnum('provider', ['mercado_livre', 'magalu'])

export const listingStatus = pgEnum('listing_status', ['pending', 'active', 'paused', 'error'])

export const accountStatus = pgEnum('account_status', ['active', 'disconnected', 'expired', 'revoked', 'error'])

export const orderStatus = pgEnum('order_status', [
	'pending', // payment not yet confirmed
	'paid', // payment confirmed, awaiting fulfillment
	'shipped', // dispatched
	'delivered', // confirmed receipt
	'cancelled',
	'refunded' // payment reversed
])

export const shipmentStatus = pgEnum('shipment_status', [
	'pending',
	'invoiced', // NF-e issued — required intermediate state in BR marketplaces (Magalu, Shopee BR)
	'shipped',
	'delivered',
	'returned',
	'cancelled'
])