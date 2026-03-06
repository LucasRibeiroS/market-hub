import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { accountStatus, listingStatus, provider } from '@drizzle/enums'

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
	encrypted_key: text().notNull(),
	key_lookup: text().notNull(), // Blind Index (HMAC-SHA256) for searching
	key_preview: text().notNull(), // Last 4 characters of the key for display purposes
	name: text().notNull(),
	permissions: text().array().notNull(),
	is_active: boolean().default(true).notNull(),
	...timestamps
}, table => [
	index().using('btree', table.user_id),
	uniqueIndex().using('btree', table.key_lookup)
])

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

// Marketplace management
export const marketplaceProviders = pgTable('marketplace_providers', {
	id: text().primaryKey().$defaultFn(() => `mktp_${generateId()}`),
	provider: provider().notNull(),
	display_name: text().notNull(),
	auth_url: text().notNull(),
	token_url: text().notNull(),
	client_id: text().notNull(),
	client_secret: text().notNull(),
	redirect_url: text().notNull(),
	is_active: boolean().notNull().default(true)
})

export const marketplaceAccounts = pgTable('marketplace_accounts', {
	id: text().primaryKey().$defaultFn(() => `mktacc_${generateId()}`),
	user_id: text().notNull().references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	provider_id: text().notNull().references(() => marketplaceProviders.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	external_id: text().notNull(),
	external_email: text(),
	status: accountStatus().notNull().default('active'),
	...timestamps
}, table => [index().using('btree', table.user_id, table.provider_id)])

export const marketplaceCredentials = pgTable('marketplace_credentials', {
	id: text().primaryKey().$defaultFn(() => `mktcred_${generateId()}`),
	account_id: text().references(() => marketplaceAccounts.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	access_token: text().notNull(),
	refresh_token: text().notNull(),
	access_token_expires_at: timestamp(timestampConfig).notNull(),
	refresh_token_expires_at: timestamp(timestampConfig).notNull(),
	scopes: jsonb('scopes'),
	token_type: text('token_type').default('Bearer')
}, table => [uniqueIndex().using('btree', table.account_id)])

export const marketplaceWebhooks = pgTable('marketplace_webhooks', {
	id: text().primaryKey().$defaultFn(() => `mktweb_${generateId()}`),
	account_id: text().references(() => marketplaceAccounts.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	external_webhook_id: text().notNull(),
	topic: text().notNull(),
	is_active: boolean().notNull().default(true),
	...timestamps
}, (table) => [uniqueIndex().on(table.account_id, table.topic)])

// The listings represent the variants listed on different marketplace accounts
export const marketplaceListings = pgTable('marketplace_listings', {
	id: text().primaryKey().$defaultFn(() => `lis_${generateId()}`),
	variant_id: text().references(() => variants.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	account_id: text().references(() => marketplaceAccounts.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	external_id: text().notNull(),
	status: listingStatus().notNull().default('pending'),
	last_sync_at: timestamp(timestampConfig),
	sync_message: text(),
	metadata: jsonb().$type<Record<string, unknown>>().default({}) // Provider-specific metadata. Ex: { listing_type_id: "gold_pro", category_id: "MLB123" }
}, (table) => [
	uniqueIndex().on(table.variant_id, table.account_id),
	index().on(table.external_id)
])