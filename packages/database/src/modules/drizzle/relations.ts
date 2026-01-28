import { relations } from 'drizzle-orm'
import { apiKeys, products, users, variants } from '@drizzle/tables'

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

export const variantsRelations = relations(variants, ({ one }) => ({
	product: one(products, {
		fields: [variants.product_id],
		references: [products.id]
	})
}))