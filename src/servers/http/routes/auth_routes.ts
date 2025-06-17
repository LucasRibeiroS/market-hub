import { FastifyInstance } from 'fastify'

import { getFullSchema } from '@utils/fastify/schema'

import { applyUseCase } from '@http/middlewares/apply_use_case'

import { createPasswordReset, generateAccessToken, login, register, resetPassword } from '@use-cases/auth'

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

	fastify.addSchema(createPasswordReset.documentation.request)
	fastify.post(
		'/auth/password/code',
		getFullSchema({
			...createPasswordReset.documentation,
			schemas: { body: createPasswordReset.documentation.request?.$id }
		}),
		applyUseCase(createPasswordReset)
	)

	fastify.addSchema(resetPassword.documentation.request)
	fastify.post(
		'/auth/password/reset',
		getFullSchema({
			...resetPassword.documentation,
			schemas: { body: resetPassword.documentation.request?.$id }
		}),
		applyUseCase(resetPassword)
	)
}