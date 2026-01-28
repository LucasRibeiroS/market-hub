import { SchemaOptions, Static, TSchema, TString, Type } from '@sinclair/typebox'

import { IApiKey, IProduct, IUser, IVariant } from '@integrator-packages/database/entities'

import { assertTypes, SetDateAsString } from '@utils/types'
import { defaultPageSize, IPagination, IPaginator } from '@utils/pagination'

// Define a custom typeS
type DateTypeOptions = {
	readOnly?: boolean
}
export const DateType = (options?: DateTypeOptions) => Type.String({
	...options,
	format: 'date-time'
})

// The usage of Type.Union(T, Type.Null()) may differ from Type.Union([Type.Null(), T]).
// The former represents the desired behavior, and this utility function ensures that
export const TNullable = <T extends TSchema>(T: T) => {
	return Type.Union([Type.Null(), T])
}

export const TEnumObject = <T extends Record<string, string>>(
	enumObj: T,
	descriptions?: Partial<Record<keyof T, string>>
) => {
	const values = Object.values(enumObj) as [T[keyof T], ...T[keyof T][]]
	return Type.Union(
		values.map(value => {
			if (!descriptions) {
				return Type.Literal(value)
			}
			const key = Object.keys(enumObj).find(k => enumObj[k] === value) as keyof T
			const description = descriptions[key]
			return description ? Type.Literal(value, { description, title: key as string }) : Type.Literal(value)
		})
	)
}

type NumericOptions = {
	precision?: number
	scale?: number
	minimum?: number
	maximum?: number
} & SchemaOptions

/**
 * Creates a TypeBox schema for PostgreSQL numeric type.
 * Validates as string to preserve precision, but accepts numbers in input.
 *
 * @param options - Configuration options
 * @param options.precision - Total number of digits (default: 10)
 * @param options.scale - Number of decimal places (default: 2)
 * @param options.minimum - Minimum value (optional)
 * @param options.maximum - Maximum value (optional)
 *
 * @example
 * ```typescript
 * // For weight: numeric(10, 3)
 * TNumeric({ precision: 10, scale: 3, minimum: 0.001 })
 *
 * // For dimensions: numeric(10, 2)
 * TNumeric({ precision: 10, scale: 2, minimum: 0.1 })
 * ```
 */
export function TNumeric(options: NumericOptions = {}): TString {
	const {
		precision = 10,
		scale = 2,
		minimum,
		maximum,
		...schemaOptions
	} = options

	// Calculate max integer digits
	const integerDigits = precision - scale

	// Build regex pattern: optional sign, integer part, optional decimal part
	// Example for scale=2: ^\d{1,8}(\.\d{1,2})?$
	const pattern = scale > 0
		? `^\\d{1,${integerDigits}}(\\.\\d{1,${scale}})?$`
		: `^\\d{1,${precision}}$`

	return Type.String({
		pattern,
		...schemaOptions,
		description: `Numeric value with up to ${precision} total digits and ${scale} decimal places${minimum !== undefined ? `, minimum: ${minimum}` : ''}${maximum !== undefined ? `, maximum: ${maximum}` : ''}`
	})
}

/**
 * Creates a schema with a guaranteed $id property
 * @param schema The schema to set the $id on
 * @param id The schema $id
 * @returns Schema with guaranteed $id type
 */
export const createSchema = <T extends TSchema>(
	schema: T,
	id: string
): { $id: string } & T => {
	// Create a new object with the schema and id
	schema.$id = id
	return schema as { $id: string } & T
}

// Models
export const apiKeyJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	user_id: Type.String({ readOnly: true }),
	name: Type.String(),
	public_key: Type.String({ readOnly: true }),
	permissions: Type.Array(Type.String()),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IApiKey')
assertTypes<Static<typeof apiKeyJsonSchema>, SetDateAsString<IApiKey, 'created_at' | 'updated_at'>>()

export const userJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	name: Type.String(),
	email: Type.String({ format: 'email' }),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IUser')
assertTypes<Static<typeof userJsonSchema>, SetDateAsString<IUser, 'created_at' | 'updated_at'>>()

export const productJsonSchema = createSchema(Type.Object({
	id: Type.String({ readOnly: true }),
	user_id: Type.String({ readOnly: true }),
	name: Type.String(),
	description: Type.String(),
	attributes: Type.Record(Type.String(), Type.Any()),
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
	images: Type.Array(Type.String()),
	attributes: Type.Record(Type.String(), Type.Any()),
	created_at: DateType({ readOnly: true }),
	updated_at: DateType({ readOnly: true })
}), 'entities/IVariant')
assertTypes<Static<typeof variantJsonSchema>, SetDateAsString<IVariant, 'created_at' | 'updated_at'>>()

// Objects
export const paginatorJsonSchema = createSchema(Type.Object({
	page: Type.Integer({ minimum: 1, default: 1 }),
	page_size: Type.Integer({ minimum: 1, default: defaultPageSize, maximum: 100 }),
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