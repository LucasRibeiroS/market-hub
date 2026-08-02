import { relations } from 'drizzle-orm'
import { apiKeys, marketplaceAccounts, marketplaceCredentials, marketplaceListings, marketplaceProviders, marketplaceWebhooks, orders, orderItems, orderShipments, orderInvoices, products, users, variants } from '@drizzle/tables'

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
	listings: many(marketplaceListings),
	orderItems: many(orderItems)
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
	listings: many(marketplaceListings),
	orders: many(orders)
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

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
	account: one(marketplaceAccounts, {
		fields: [marketplaceListings.account_id],
		references: [marketplaceAccounts.id]
	}),
	variant: one(variants, {
		fields: [marketplaceListings.variant_id],
		references: [variants.id]
	}),
	orderItems: many(orderItems)
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(users, {
		fields: [orders.user_id],
		references: [users.id]
	}),
	account: one(marketplaceAccounts, {
		fields: [orders.account_id],
		references: [marketplaceAccounts.id]
	}),
	items: many(orderItems),
	shipments: many(orderShipments),
	invoices: many(orderInvoices)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.order_id],
		references: [orders.id]
	}),
	variant: one(variants, {
		fields: [orderItems.variant_id],
		references: [variants.id]
	}),
	listing: one(marketplaceListings, {
		fields: [orderItems.listing_id],
		references: [marketplaceListings.id]
	})
}))

export const orderShipmentsRelations = relations(orderShipments, ({ one }) => ({
	order: one(orders, {
		fields: [orderShipments.order_id],
		references: [orders.id]
	}),
	invoices: one(orderInvoices, {
		fields: [orderShipments.id],
		references: [orderInvoices.shipment_id]
	})
}))

export const orderInvoicesRelations = relations(orderInvoices, ({ one }) => ({
	order: one(orders, {
		fields: [orderInvoices.order_id],
		references: [orders.id]
	}),
	shipment: one(orderShipments, {
		fields: [orderInvoices.shipment_id],
		references: [orderShipments.id]
	})
}))