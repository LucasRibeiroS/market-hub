import { FastifyInstance } from 'fastify'

import { getFullSchema } from '@utils/fastify/schema'

import { applyUseCase } from '@http/middlewares/apply_use_case'

import { createApiKey, listApiKeys } from '@use-cases/api-keys'

export const apiKeysRoutes = async(fastify: FastifyInstance) => {
	fastify.addSchema(listApiKeys.documentation.request)
	fastify.addSchema(listApiKeys.documentation.response)
	fastify.get(
		'/api-keys',
		{
			config: { authMethod: 'jwt' },
			...getFullSchema({
				...listApiKeys.documentation,
				schemas: {
					querystring: listApiKeys.documentation.request?.$id,
					response: listApiKeys.documentation.response?.$id
				}
			})
		},
		applyUseCase(listApiKeys)
	)

	fastify.addSchema(createApiKey.documentation.request)
	fastify.addSchema(createApiKey.documentation.response)
	fastify.post(
		'/api-keys',
		{
			config: { authMethod: 'jwt' },
			...getFullSchema({
				...createApiKey.documentation,
				schemas: {
					body: createApiKey.documentation.request?.$id,
					response: createApiKey.documentation.response?.$id
				}
			})
		},
		applyUseCase(createApiKey)
	)
}