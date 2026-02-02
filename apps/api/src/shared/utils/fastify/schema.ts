import { FastifyInstance, FastifySchema } from 'fastify'
import fp from 'fastify-plugin'
import { Type } from '@sinclair/typebox'

import { IDocumentation } from '@integrator-packages/use-case/documentation/types'

import {
	accountStatusEnumSchema,
	apiKeyJsonSchema,
	appTokensJsonSchema,
	listingStatusEnumSchema,
	marketplaceListingJsonSchema,
	paginationJsonSchema,
	paginatorJsonSchema,
	productJsonSchema,
	providerEnumSchema,
	userJsonSchema,
	variantJsonSchema
} from '@utils/typebox/schemas'
import { CustomOmit } from '@utils/types'

type IAvailableSchemas = {
	querystring?: string
	params?: string
	body?: string
	response?: string
}

type GetFullSchemaOptions = {
	schemas?: IAvailableSchemas
	is_public?: boolean
	summary: string
	description?: string
	tags?: string[]
} & CustomOmit<IDocumentation, 'request' | 'response'>

export const getFullSchema = ({
	schemas,
	is_public,
	summary,
	description,
	tags
}: GetFullSchemaOptions) => {
	if (schemas === undefined) schemas = {}

	const schema: FastifySchema = {
		querystring: schemas.querystring !== undefined ? { $ref: schemas.querystring } : {},
		params: schemas.params !== undefined ? { $ref: schemas.params } : {},
		response: {
			'2xx': schemas.response === undefined
				? { $ref: 'default/success' }
				: {
					type: 'object',
					properties: {
						process: { type: 'string', enum: ['success'] },
						body: { $ref: schemas.response }
					},
					required: ['process', 'body']
				},
			'4xx': { $ref: 'default/error' },
			'5xx': { $ref: 'default/error' }
		},
		security: !is_public ? [{ apiKey: [] }] : [],
		summary,
		description,
		tags
	}
	if (schemas.body !== undefined) {
		return {
			schema: {
				...schema,
				body: { $ref: schemas.body }
			}
		}
	}
	return { schema }
}

export const defaultSchemas = fp((fastify: FastifyInstance) => {
	fastify.addSchema(Type.Object({
		process: Type.Literal('success'),
		body: Type.Object({})
	}, {
		$id: 'default/success',
		description: 'Success empty response'
	}))
	fastify.addSchema(Type.Object({
		process: Type.Literal('failed'),
		body: Type.String()
	}, {
		$id: 'default/error',
		description: 'Error response'
	}))

	// Enums
	fastify.addSchema(accountStatusEnumSchema)
	fastify.addSchema(listingStatusEnumSchema)
	fastify.addSchema(providerEnumSchema)

	// Models
	fastify.addSchema(userJsonSchema)
	fastify.addSchema(apiKeyJsonSchema)
	fastify.addSchema(productJsonSchema)
	fastify.addSchema(variantJsonSchema)
	fastify.addSchema(marketplaceListingJsonSchema)

	// Objects
	fastify.addSchema(paginatorJsonSchema)
	fastify.addSchema(paginationJsonSchema)
	fastify.addSchema(appTokensJsonSchema)
})