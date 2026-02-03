import { container } from 'tsyringe'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { IUseCase, UseCaseFactory } from '@integrator-packages/use-case'

import { AuthenticationMethods } from '@http/middlewares/authenticate'
import { applyUseCase, IApplyUseCaseOptions } from '@http/middlewares/apply_use_case'

import { getFullSchema } from '@utils/fastify/schema'

type IRoute = {
	method: 'post' | 'get' | 'put' | 'delete' | 'patch'
	path: string
	auth_method?: AuthenticationMethods
	// eslint-disable-next-line typescript/no-explicit-any
	use_case_class: new (...args: any[]) => IUseCase<unknown, unknown>
	handler_options?: IApplyUseCaseOptions
	swagger_options?: Partial<{ hide: true }>
}

type IRouteOptions = {
	group?: string
}

export const registerRoutes = (routes: IRoute[], options: IRouteOptions = {}) => fp((fastify: FastifyInstance) => {
	const { group } = options

	for (const route of routes) {
		const { method, path, use_case_class, handler_options, swagger_options } = route

		const use_case = UseCaseFactory.create(container.resolve(use_case_class))

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

		let url = (group || '') + path
		if (url.endsWith('/')) {
			url = url.slice(0, -1)
		}
		// Register the route
		fastify.route({
			method,
			url,
			config: { authMethod: route.auth_method },
			schema: use_case.documentation
				? getFullSchema({
					...swagger_options,
					...use_case.documentation,
					schemas
				}).schema
				: undefined,
			handler: applyUseCase(use_case, handler_options)
		})
	}
})