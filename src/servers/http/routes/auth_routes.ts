import { FastifyInstance } from 'fastify'

import { getFullSchema } from '@utils/fastify/schema'

import { applyUseCase } from '@http/middlewares/apply_use_case'

import { generateAccessToken, login, register } from '@use-cases/auth'

export const authRoutes = async(fastify: FastifyInstance) => {
	fastify.addSchema(register.documentation.request)
	fastify.addSchema(register.documentation.response)
	fastify.post(
		'/auth/register',
		getFullSchema({
			...register.documentation,
			schemas: {
				body: register.documentation.request?.$id,
				response: register.documentation.response?.$id
			}
		}),
		applyUseCase(register)
	)

	fastify.addSchema(login.documentation.request)
	fastify.addSchema(login.documentation.response)
	fastify.post(
		'/auth/login',
		getFullSchema({
			...login.documentation,
			schemas: {
				body: login.documentation.request?.$id,
				response: login.documentation.response?.$id
			}
		}),
		applyUseCase(login)
	)

	fastify.addSchema(generateAccessToken.documentation.request)
	fastify.addSchema(generateAccessToken.documentation.response)
	fastify.post(
		'/auth/generate-access-token',
		getFullSchema({
			...generateAccessToken.documentation,
			schemas: {
				body: generateAccessToken.documentation.request?.$id,
				response: generateAccessToken.documentation.response?.$id
			}
		}),
		applyUseCase(generateAccessToken)
	)
}