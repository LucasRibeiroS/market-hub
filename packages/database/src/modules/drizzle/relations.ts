import { relations } from 'drizzle-orm'
import { apiKeys, marketplaceAccounts, marketplaceCredentials, marketplaceListings, marketplaceProviders, marketplaceWebhooks, products, users, variants } from '@drizzle/tables'

export const usersRelations = relations(users, ({ many }) => ({
	apiKeys: many(apiKeys)
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users, {
		fields: [apiKeys.user_id],
		references: [users.id]
	})
}))

export const productsRelations = relations(products, ({ many }) => ({
	variants: many(variants)
}))

export const variantsRelations = relations(variants, ({ one, many }) => ({
	product: one(products, {
		fields: [variants.product_id],
		references: [products.id]
	}),
	listings: many(marketplaceListings)
}))

export const marketplaceProvidersRelations = relations(marketplaceProviders, ({ many }) => ({
	accounts: many(marketplaceAccounts)
}))

export const marketplaceAccountsRelations = relations(marketplaceAccounts, ({ one, many }) => ({
	provider: one(marketplaceProviders, {
		fields: [marketplaceAccounts.provider_id],
		references: [marketplaceProviders.id]
	}),
	credentials: one(marketplaceCredentials, {
		fields: [marketplaceAccounts.id],
		references: [marketplaceCredentials.account_id]
	}),
	webhooks: many(marketplaceWebhooks),
	listings: many(marketplaceListings)
}))

export const marketplaceCredentialsRelations = relations(marketplaceCredentials, ({ one }) => ({
	account: one(marketplaceAccounts, {
		fields: [marketplaceCredentials.account_id],
		references: [marketplaceAccounts.id]
	})
}))

export const marketplaceWebhooksRelations = relations(marketplaceWebhooks, ({ one }) => ({
	account: one(marketplaceAccounts, {
		fields: [marketplaceWebhooks.account_id],
		references: [marketplaceAccounts.id]
	})
}))

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one }) => ({
	account: one(marketplaceAccounts, {
		fields: [marketplaceListings.account_id],
		references: [marketplaceAccounts.id]
	}),
	variant: one(variants, {
		fields: [marketplaceListings.variant_id],
		references: [variants.id]
	})
}))