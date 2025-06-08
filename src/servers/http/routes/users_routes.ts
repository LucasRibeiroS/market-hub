import { FastifyInstance } from 'fastify'

import { getFullSchema } from '@utils/fastify/schema'

import { applyUseCase } from '@http/middlewares/apply_use_case'

import { getUser } from '@use-cases/users'

export const usersRoutes = async(fastify: FastifyInstance) => {
	fastify.addSchema(getUser.documentation.response)

	fastify.get(
		'/users/me',
		{
			config: { authMethod: 'any' },
			...getFullSchema({
				...getUser.documentation,
				schemas: {
					response: getUser.documentation.response?.$id
				}
			})
		},
		applyUseCase(getUser)
	)
}