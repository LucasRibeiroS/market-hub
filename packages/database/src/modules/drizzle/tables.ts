import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { generateId } from '@utils/helpers'

const timestampConfig = { precision: 3, mode: 'date' } as const

const timestamps = {
	created_at: timestamp(timestampConfig).defaultNow().notNull(),
	updated_at: timestamp(timestampConfig).defaultNow().notNull().$onUpdateFn(() => new Date())
}

// User management
export const apiKeys = pgTable('api_keys', {
	id: text().primaryKey().notNull().$defaultFn(() => `ak_${generateId()}`),
	user_id: text().notNull().references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	public_key: text().notNull().unique(),
	name: text().notNull(),
	permissions: text().array().notNull(),
	...timestamps
}, table => [uniqueIndex().using('btree', table.public_key), index().using('btree', table.user_id)])

export const passwordResets = pgTable('password_resets', {
	id: text().primaryKey().notNull().$defaultFn(() => `pr_${generateId()}`),
	user_id: text().references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	code: text().notNull(),
	expiration: timestamp(timestampConfig).notNull(),
	is_used: boolean().default(false).notNull(),
	...timestamps
}, table => [index().using('btree', table.user_id)])

export const users = pgTable('users', {
	id: text().primaryKey().notNull().$defaultFn(() => `usr_${generateId()}`),
	name: text().notNull(),
	email: text().notNull().unique(),
	password: text().notNull(),
	...timestamps
}, table => [uniqueIndex().using('btree', table.email)])

// Product management
export const products = pgTable('products', {
	id: text().primaryKey().$defaultFn(() => `prod_${generateId()}`),
	user_id: text().notNull().references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	name: text().notNull(),
	description: text().notNull(),
	attributes: jsonb().$type<Record<string, unknown>>().notNull().default({}), // Specific attributes. Ex: NBM, Origem de Fabricação, Gênero
	...timestamps
}, (table) => [index().using('btree', table.user_id)])

export const variants = pgTable('variants', {
	id: text().primaryKey().$defaultFn(() => `var_${generateId()}`),
	user_id: text().notNull().references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	product_id: text().references(() => products.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	sku: text().notNull(), // Stock Keeping Unit
	ean: text(), // GTIN/Código de Barras
	price: integer().notNull(),
	weight_kg: numeric({ precision: 10, scale: 3 }).notNull(),
	height_cm: numeric({ precision: 10, scale: 2 }).notNull(),
	width_cm: numeric({ precision: 10, scale: 2 }).notNull(),
	depth_cm: numeric({ precision: 10, scale: 2 }).notNull(),
	images: text().array().default([]).notNull(),
	attributes: jsonb().$type<Record<string, string>>().notNull().default({}), // Specific attributes. Ex: { "Color": "Red", "Size": "42", "Voltage": "220V" }
	...timestamps
}, (table) => [uniqueIndex().on(table.user_id, table.sku), index().on(table.product_id)])
