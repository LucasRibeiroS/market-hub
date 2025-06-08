import { relations } from 'drizzle-orm'
import { apiKeys, users } from '@drizzle/schema'

export const usersRelations = relations(users, ({ many }) => ({
	apiKeys: many(apiKeys)
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users, {
		fields: [apiKeys.user_id],
		references: [users.id]
	})
}))