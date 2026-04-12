import { Static, TSchema, Type } from '@sinclair/typebox'

import { AccountStatusEnum, IApiKey, IMarketplaceAccount, IMarketplaceListing, IProduct, IUser, IVariant, ListingStatusEnum, ProviderEnum } from '@integrator-packages/database/entities'

import { Permissions } from '@utils/permissions'
import { defaultPageSize, IPagination, IPaginator } from '@utils/pagination'
import { DateType, TEnumObject, TNullable, TNumeric } from '@utils/typebox/types'
import { assertTypes, CustomOmit, SetDateAsString } from '@utils/types'

/**
 * Creates a schema with a guaranteed $id property
 * @param schema The schema to set the $id on
 * @param id The schema $id
 * @returns Schema with guaranteed $id type
 */
const createSchema = <T extends TSchema>(
	schema: T,
	id: string
): { $id: string } & T => {
	// Create a new object with the schema and id
	schema.$id = id
	return schema as { $id: string } & T
}

/**
 * This file defines TypeBox schemas for various entities and objects used in the application.
 * The real entities are defined in the database module, and these schemas are used for validation and documentation in the API layer.
 */

// Enums
export const accountStatusEnumSchema = createSchema(TEnumObject(AccountStatusEnum, {
	active: 'The account is active and connected',
	disconnected: 'The account has been disconnected by the user',
	expired: 'The account connection has expired and needs re-authorization',
	revoked: 'The account access has been revoked by the marketplace',
	error: 'There was an error with the account connection'
}), '/enums/AccountStatusEnum')
export const listingStatusEnumSchema = createSchema(TEnumObject(ListingStatusEnum, {
	pending: 'The listing is pending synchronization',
	active: 'The listing is active on the marketplace',
	paused: 'The listing is paused on the marketplace',
	error: 'There was an error with the listing synchronization'
}), '/enums/ListingStatusEnum')
export const providerEnumSchema = createSchema(TEnumObject(ProviderEnum, {
	mercado_livre: 'Mercado Livre - Marketplace de vendas online',
	magalu: 'Magazine Luiza - Marketplace de vendas online'
}), '/enums/ProviderEnum')
export const permissionsEnumSchema = createSchema(TEnumObject(Permissions.user, {
	products: 'Manage products and variants',
	webhooks: 'Manage webhooks'
}), '/enums/PermissionsEnum')

// Models
// User management
export const apiKeyJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	user_id: Type.String({ readOnly: true }),
	name: Type.String(),
	key_preview: Type.String({ readOnly: true }),
	permissions: Type.Array(Type.Ref(permissionsEnumSchema.$id), { readOnly: true }),
	is_active: Type.Boolean({ default: true }),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IApiKey')
type ApplicationApiKey = CustomOmit<IApiKey, 'encrypted_key' | 'key_lookup'>
assertTypes<Static<typeof apiKeyJsonSchema>, SetDateAsString<ApplicationApiKey, 'created_at' | 'updated_at'>>()

export const marketplaceAccountJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	user_id: Type.String({ readOnly: true }),
	provider_id: Type.String({ readOnly: true }),
	external_id: Type.String({ readOnly: true }),
	external_email: TNullable(Type.String({ readOnly: true })),
	status: Type.Ref(accountStatusEnumSchema.$id),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IMarketplaceAccount')
assertTypes<Static<typeof marketplaceAccountJsonSchema>, SetDateAsString<IMarketplaceAccount, 'created_at' | 'updated_at'>>()

export const userJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	name: Type.String(),
	email: Type.String({ format: 'email' }),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IUser')
assertTypes<Static<typeof userJsonSchema>, SetDateAsString<IUser, 'created_at' | 'updated_at'>>()

// Product management
export const productJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	user_id: Type.String({ readOnly: true }),
	name: Type.String(),
	description: Type.String(),
	attributes: Type.Record(Type.String(), Type.Any(), { description: 'Product scoped attributes, like brand, manufacturer, etc.' }),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IProduct')
assertTypes<Static<typeof productJsonSchema>, SetDateAsString<IProduct, 'created_at' | 'updated_at'>>()

export const variantJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	user_id: Type.String({ readOnly: true }),
	product_id: Type.String({ readOnly: true }),
	sku: Type.String(),
	ean: TNullable(Type.String()),
	price: Type.Integer(),
	weight_kg: TNumeric({ precision: 10, scale: 3, minimum: 0.001 }),
	height_cm: TNumeric({ precision: 10, scale: 2, minimum: 0.1 }),
	width_cm: TNumeric({ precision: 10, scale: 2, minimum: 0.1 }),
	depth_cm: TNumeric({ precision: 10, scale: 2, minimum: 0.1 }),
	images: Type.Array(Type.String(), { minItems: 1, maxItems: 20 }),
	attributes: Type.Record(Type.String(), Type.Any(), { description: 'Variant scoped attributes, like color, size, etc.' }),
	is_primary: Type.Boolean(),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IVariant')
assertTypes<Static<typeof variantJsonSchema>, SetDateAsString<IVariant, 'created_at' | 'updated_at'>>()

// Marketplace management
export const marketplaceListingJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	account_id: Type.String({ readOnly: true }),
	variant_id: Type.String({ readOnly: true }),
	external_product_id: TNullable(Type.String({ readOnly: true })),
	external_variant_id: TNullable(Type.String({ readOnly: true })),
	status: Type.Ref(listingStatusEnumSchema.$id),
	last_sync_at: TNullable(DateType({ readOnly: true })),
	sync_message: TNullable(Type.String({ readOnly: true })),
	metadata: Type.Record(Type.String(), Type.Any())
}), 'entities/IMarketplaceListing')
assertTypes<Static<typeof marketplaceListingJsonSchema>, SetDateAsString<IMarketplaceListing, 'last_sync_at'>>()

// Objects
export const paginatorJsonSchema = createSchema(Type.Object({
	page: Type.Integer({ minimum: 1, default: 1 }),
	page_size: Type.Integer({ minimum: 5, default: defaultPageSize, maximum: 100 }),
	order_by: Type.Optional(Type.String({ description: 'Field to sort by' })),
	order_direction: Type.Optional(Type.Union([
		Type.Literal('asc', { title: 'asc' }),
		Type.Literal('desc', { title: 'desc' })
	]))
}), 'objects/IPaginator')
assertTypes<Static<typeof paginatorJsonSchema>, IPaginator>()

export const paginationJsonSchema = createSchema(Type.Object({
	page_size: Type.Integer({ minimum: 1 }),
	total_pages: Type.Integer({ minimum: 1 }),
	total_count: Type.Integer({ minimum: 0 })
}), 'objects/IPagination')
assertTypes<Static<typeof paginationJsonSchema>, IPagination>()

export const appTokensJsonSchema = createSchema(Type.Object({
	access_token: Type.String({ readOnly: true }),
	refresh_token: Type.String({ readOnly: true })
}), 'objects/IAppTokens')

// Simple function to export all schemas as an array for easy registration
export const getAllSchemas = () => [
	accountStatusEnumSchema,
	listingStatusEnumSchema,
	providerEnumSchema,
	permissionsEnumSchema,
	userJsonSchema,
	apiKeyJsonSchema,
	marketplaceAccountJsonSchema,
	productJsonSchema,
	variantJsonSchema,
	marketplaceListingJsonSchema,
	paginatorJsonSchema,
	paginationJsonSchema,
	appTokensJsonSchema
]