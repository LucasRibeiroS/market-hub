import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { generateId } from '@utils/helpers'

const timestampConfig = { precision: 3, mode: 'date' } as const

const timestamps = {
	created_at: timestamp(timestampConfig).defaultNow().notNull(),
	updated_at: timestamp(timestampConfig).defaultNow().notNull().$onUpdateFn(() => new Date())
}

// Tables
export const apiKeys = pgTable('api_keys', {
	id: text().primaryKey().notNull().$defaultFn(() => generateId()),
	user_id: text().notNull(),
	public_key: text().notNull().unique(),
	name: text().notNull(),
	permissions: text().array().notNull(),
	...timestamps
}, (table) => [
	uniqueIndex().using('btree', table.public_key),
	index().using('btree', table.user_id)
])

export const users = pgTable('users', {
	id: text().primaryKey().notNull().$defaultFn(() => generateId()),
	email: text().notNull().unique(),
	password: text().notNull(),
	...timestamps
}, (table) => [uniqueIndex().using('btree', table.email)])