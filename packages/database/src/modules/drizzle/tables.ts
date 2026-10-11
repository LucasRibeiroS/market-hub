import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { accountStatus, listingStatus, orderStatus, provider, shipmentStatus } from '@drizzle/enums'

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
}, table => [index().using('btree', table.user_id)])

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
	attributes: jsonb().$type<Record<string, unknown>>().notNull().default({}), // Specific attributes. Ex: { "Color": "Red", "Size": "42", "Voltage": "220V" }
	is_primary: boolean().default(false).notNull(), // Indicates the main variant of a product. A product can have multiple variants, but only one primary variant.
	...timestamps
}, table => [uniqueIndex().on(table.user_id, table.sku), index().on(table.product_id)])

// Marketplace management
export const marketplaceProviders = pgTable('marketplace_providers', {
	id: text().primaryKey().$defaultFn(() => `mktp_${generateId()}`),
	provider: provider().notNull(),
	display_name: text().notNull(),
	is_active: boolean().notNull().default(true),
	client_id: text().notNull(),
	client_secret: text().notNull(),
	redirect_uri: text().notNull(),
	base_url: text().notNull(),
	token_url: text().notNull(), // the URL to exchange authorization code for access token
	auth_url: text().notNull()
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
	scopes: jsonb('scopes').$type<Record<string, unknown>>(), // Ex: { "read_orders": true, "write_products": true }
	token_type: text('token_type').default('Bearer')
}, table => [uniqueIndex().using('btree', table.account_id)])

export const marketplaceWebhooks = pgTable('marketplace_webhooks', {
	id: text().primaryKey().$defaultFn(() => `mktweb_${generateId()}`),
	account_id: text().references(() => marketplaceAccounts.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	external_webhook_id: text().notNull(),
	topic: text().notNull(),
	is_active: boolean().notNull().default(true),
	...timestamps
}, table => [uniqueIndex().on(table.account_id, table.topic)])

// The listings represent the variants listed on different marketplace accounts
export const marketplaceListings = pgTable('marketplace_listings', {
	id: text().primaryKey().$defaultFn(() => `lis_${generateId()}`),
	variant_id: text().references(() => variants.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	account_id: text().references(() => marketplaceAccounts.id, { onUpdate: 'cascade', onDelete: 'cascade' }).notNull(),
	external_product_id: text(),
	external_variant_id: text(),
	status: listingStatus().notNull().default('pending'),
	last_sync_at: timestamp(timestampConfig),
	sync_message: text(),
	metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}) // Provider-specific metadata. Ex: { listing_type_id: "gold_pro", category_id: "MLB123" }
}, table => [
	uniqueIndex().on(table.variant_id, table.account_id),
	index().on(table.external_product_id)
])

// Orders management
export const orders = pgTable('orders', {
	id: text().primaryKey().$defaultFn(() => `ord_${generateId()}`),
	user_id: text().notNull().references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	account_id: text().notNull().references(() => marketplaceAccounts.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	external_order_id: text().notNull(),
	status: orderStatus().notNull().default('pending'),
	external_status: text().notNull(), // raw provider status for auditability
	// Financials
	total_amount: integer().notNull(),
	shipping_amount: integer().notNull().default(0),
	discount_amount: integer().notNull().default(0),
	// Buyer
	buyer_name: text(),
	buyer_document: text(),
	buyer_email: text(),
	buyer_phone: text(),
	// Lifecycle dates
	ordered_at: timestamp(timestampConfig).notNull(),
	approved_at: timestamp(timestampConfig),
	// Provider-specific fields (e.g. Meli pack_id)
	metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
	...timestamps
}, table => [
	uniqueIndex().on(table.account_id, table.external_order_id),
	index().on(table.user_id)
])

export const orderItems = pgTable('order_items', {
	id: text().primaryKey().$defaultFn(() => `ordit_${generateId()}`),
	order_id: text().notNull().references(() => orders.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	variant_id: text().references(() => variants.id, { onUpdate: 'cascade', onDelete: 'set null' }),
	listing_id: text().references(() => marketplaceListings.id, { onUpdate: 'cascade', onDelete: 'set null' }),
	external_item_id: text().notNull(),
	external_variant_id: text(),
	// Snapshot data to avoid depending on future changes to the product/variant
	title: text().notNull(),
	quantity: integer().notNull(),
	unit_amount: integer().notNull(),
	total_amount: integer().notNull(), // May differ from unit_amount * quantity due to per-item discounts
	metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
	...timestamps
}, table => [
	index().using('btree', table.order_id),
	index().using('btree', table.variant_id)
])

export const orderShipments = pgTable('order_shipments', {
	id: text().primaryKey().$defaultFn(() => `oship_${generateId()}`),
	order_id: text().notNull().references(() => orders.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	external_shipment_id: text().notNull(),
	status: shipmentStatus().notNull().default('pending'),
	// Logistic info
	carrier: text(),
	tracking_number: text(),
	tracking_url: text(),
	// Delivery address
	shipping_street: text(),
	shipping_number: text(),
	shipping_complement: text(),
	shipping_district: text(),
	shipping_city: text(),
	shipping_state: text(),
	shipping_zip_code: text(),
	// Delivery lifecycle dates
	shipped_at: timestamp(timestampConfig),
	estimated_delivery_at: timestamp(timestampConfig),
	delivered_at: timestamp(timestampConfig),
	metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
	...timestamps
}, table => [index().on(table.order_id)])

export const orderInvoices = pgTable('order_invoices', {
	id: text().primaryKey().$defaultFn(() => `ordinv_${generateId()}`),
	order_id: text().notNull().references(() => orders.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	// In split fulfillment, each invoice is tied to its specific shipment.
	shipment_id: text().references(() => orderShipments.id, { onUpdate: 'cascade', onDelete: 'set null' }),
	// Invoice details
	invoice_number: text().notNull(),
	invoice_key: text(), // NF-e 44-digit access key
	invoice_url: text(),
	issued_at: timestamp(timestampConfig),
	metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
	...timestamps
}, table => [
	index().on(table.order_id),
	index().on(table.shipment_id),
	uniqueIndex().on(table.order_id, table.invoice_number)
])