import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { AuthenticationMethods } from '@http/middlewares/authenticate'
import { applyUseCase, IApplyUseCaseOptions } from '@http/middlewares/apply_use_case'

import { getFullSchema } from '@utils/fastify/schema'
import { IWrappedUseCase } from '@utils/use_case'

type IRoute = {
	method: 'post' | 'get' | 'put' | 'delete' | 'patch'
	path: string
	auth_method?: AuthenticationMethods
	use_case: IWrappedUseCase<unknown, unknown>
	handler_options?: IApplyUseCaseOptions
}

export const registerRoutes = (routes: IRoute[]) => fp((fastify: FastifyInstance) => {
	for (const route of routes) {
		const { method, path, use_case, handler_options } = route

		// Add schemas if they exist
		if (use_case.documentation?.request) {
			fastify.addSchema(use_case.documentation.request)
		}
		if (use_case.documentation?.response) {
			fastify.addSchema(use_case.documentation.response)
		}

		// Build schema configuration based on HTTP method
		const schemas: Record<string, string | undefined> = {}

		if (use_case.documentation?.request?.$id) {
			if (['delete', 'get'].includes(method)) {
				// GET and DELETE should use query parameters
				schemas.querystring = use_case.documentation.request.$id
			} else if (['patch', 'post', 'put'].includes(method)) {
				// POST, PUT, and PATCH should use request body
				schemas.body = use_case.documentation.request.$id
			}
		}
		if (use_case.documentation?.response?.$id) {
			schemas.response = use_case.documentation.response.$id
		}

		// Register the route
		fastify.route({
			method,
			url: path,
			config: { authMethod: route.auth_method },
			schema: use_case.documentation
				? getFullSchema({ ...use_case.documentation, schemas }).schema
				: undefined,
			handler: applyUseCase(use_case, handler_options)
		})
	}
})

export const registerRoutes2 = async(fastify: FastifyInstance, routes: Array<IRoute>) => {
	for (const route of routes) {
		const { method, path, use_case, handler_options } = route

		// Add schemas if they exist
		if (use_case.documentation?.request) {
			fastify.addSchema(use_case.documentation.request)
		}
		if (use_case.documentation?.response) {
			fastify.addSchema(use_case.documentation.response)
		}

		// Build schema configuration based on HTTP method
		const schemas: Record<string, string | undefined> = {}

		if (use_case.documentation?.request?.$id) {
			if (['delete', 'get'].includes(method)) {
				// GET and DELETE should use query parameters
				schemas.querystring = use_case.documentation.request.$id
			} else if (['patch', 'post', 'put'].includes(method)) {
				// POST, PUT, and PATCH should use request body
				schemas.body = use_case.documentation.request.$id
			}
		}
		if (use_case.documentation?.response?.$id) {
			schemas.response = use_case.documentation.response.$id
		}

		// Register the route
		fastify.route({
			method,
			url: path,
			config: { authMethod: route.auth_method },
			schema: use_case.documentation
				? getFullSchema({ ...use_case.documentation, schemas }).schema
				: undefined,
			handler: applyUseCase(use_case, handler_options)
		})
	}
}