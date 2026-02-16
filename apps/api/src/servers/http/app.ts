import 'dotenv/config'

import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import cookie from '@fastify/cookie'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import rateLimit from '@specter-labs/fastify-rate-limit'
import caching from '@specter-labs/fastify-cache'
import logger from '@specter-labs/fastify-logger'

import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'

import { RedisCacheAdapter } from '@integrator-packages/adapters/cache'

import { isHttpException, RateLimitException } from '@integrator-packages/use-case/exceptions'

import '@config/bootstrap'
import { env } from '@config/env'

import { authenticate } from '@http/middlewares/authenticate'

import { authRoutes } from '@http/routes/auth_routes'
import { apiKeysRoutes } from '@http/routes/api_keys_routes'
import { usersRoutes } from '@http/routes/users_routes'
import { productsRoutes } from '@http/routes/products_routes'
import { variantsRoutes } from '@http/routes/variants_routes'
import { marketplaceAccountRoutes } from '@http/routes/marketplace_account_routes'

import { ACCESS_TOKEN_COOKIE_NAME } from '@utils/cookies'
import { defaultSchemas } from '@utils/fastify/schema'

class HttpServer {
	private app: FastifyInstance
	private port = env.PORT

	constructor() {
		this.app = fastify().withTypeProvider<TypeBoxTypeProvider>()
		this.addPlugins()
		this.addMiddlewares()
		this.addRoutes()
	}

	private addPlugins() {
		this.app.register(cors, {
			origin: (origin, cb) => {
				cb(null, origin || true)
			},
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
		})
		this.app.register(compress)
		this.app.register(cookie)

		// Custom plugins
		this.app.register(rateLimit, {
			storageAdapter: new RedisCacheAdapter(),
			exception: RateLimitException,
			prefix: `${env.APPLICATION_NAME}:http:rate-limit`
		})
		this.app.register(caching, {
			storageAdapter: new RedisCacheAdapter(),
			prefix: `${env.APPLICATION_NAME}:http:cache`
		})
		this.app.register(logger, {
			level: env.NODE_ENV === 'production' ? 'error' : 'info',
			prefix: env.APPLICATION_NAME,
			ignoreStatusCodes: [401, 403]
		})

		// Disable validatorCompiler, since all validation in done inside use cases
		this.app.addHook('onRoute', (routeOptions) => {
			routeOptions.validatorCompiler = () => () => true
		})
		// To make sure every response is returned in the format { process, body }
		this.app.setErrorHandler((error, _, reply) => {
			if (isHttpException(error)) {
				return reply
					.status(error.status_code)
					.send({ process: error.process, body: error.body })
			}

			console.error('Unexpected error:', error)

			return reply.status(500).send({
				process: 'failed',
				body: 'Internal server error'
			})
		})

		// Documentation
		this.app.register(defaultSchemas)
		this.app.register(swagger, {
			openapi: {
				info: {
					title: 'Intergalactic API',
					description: 'API documentation for the Intergalactic application',
					version: '0.1'
				},
				components: {
					securitySchemes: {
						apiKey: {
							type: 'apiKey',
							in: 'header',
							name: 'x-api-key'
						},
						cookieAuth: {
							type: 'apiKey',
							in: 'cookie',
							name: ACCESS_TOKEN_COOKIE_NAME
						}
					}
				}
			}
		})
		this.app.register(scalar, {
			routePrefix: '/reference',
			configuration: {
				defaultHttpClient: {
					targetKey: 'node',
					clientKey: 'fetch'
				},
				theme: 'purple'
			}
		})
	}

	private addMiddlewares() {
		this.app.register(authenticate)
	}

	private addRoutes() {
		this.app.register(authRoutes)
		this.app.register(apiKeysRoutes)
		this.app.register(usersRoutes)
		this.app.register(productsRoutes)
		this.app.register(variantsRoutes)
		this.app.register(marketplaceAccountRoutes)
	}

	start() {
		this.app.listen({ port: this.port, host: '::' }, (err) => {
			if (err) {
				console.error({ err })
			} else {
				console.log(`[${env.APPLICATION_NAME}] Server running on ${this.port}`)
			}
		})
	}
}

export default new HttpServer()