import { TSchema } from '@sinclair/typebox'

export type IDocumentation = {
	request?: TSchema
	response?: TSchema
	is_public?: boolean
	summary: string
	description?: string
	tags?: string[]
}