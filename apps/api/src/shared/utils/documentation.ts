import { TSchema } from '@sinclair/typebox'
import { MetadataKeys } from '@utils/decorators'

export type IDocumentation = {
	request?: TSchema
	response?: TSchema
	is_public?: boolean
	summary: string
	description?: string
	tags?: string[]
}

/**
 * Decorator for adding documentation metadata to use cases
 * @param documentation - The documentation object for the use case
 */
export const Documentation = (documentation: Partial<IDocumentation>) => (target: object) => {
	return Reflect.defineMetadata(MetadataKeys.DOCUMENTATION, documentation, target)
}