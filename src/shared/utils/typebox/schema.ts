import { Static, TSchema, Type } from '@sinclair/typebox'

import { IApiKey, IUser } from '@entities'
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

export const TEnumObject = <T extends Record<string, string>>(enumObj: T) => {
	const values = Object.values(enumObj) as [T[keyof T], ...T[keyof T][]]
	return Type.Union(
		values.map(value => Type.Literal(value))
	)
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