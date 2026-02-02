import { pgEnum } from 'drizzle-orm/pg-core'

export const provider = pgEnum('provider', ['mercado_livre', 'magalu'])
export const listingStatus = pgEnum('listing_status', ['pending', 'active', 'paused', 'error'])
export const accountStatus = pgEnum('account_status', ['active', 'disconnected', 'expired', 'revoked', 'error'])