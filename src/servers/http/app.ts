import 'dotenv/config'

import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import rateLimit from '@specter-labs/fastify-rate-limit'
import caching from '@specter-labs/fastify-cache'
import logger from '@specter-labs/fastify-logger'

import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'

import { authenticate } from '@http/middlewares/authenticate'

import { authRoutes } from '@http/routes/auth_routes'
import { apiKeysRoutes } from '@http/routes/api_keys_routes'
import { usersRoutes } from '@http/routes/users_routes'

import { env } from '@utils/env'
import { isHttpException, RateLimitException } from '@utils/exception'
import { defaultSchemas } from '@utils/fastify/schema'

import { RedisCacheAdapter } from '@adapters/implementations'

class HttpServer {
	private app: FastifyInstance
	private port = env.PORT

	constructor() {
		this.app = fastify({ ignoreTrailingSlash: true }).withTypeProvider<TypeBoxTypeProvider>()
		this.addPlugins()
		this.addMiddlewares()
		this.addRoutes()
	}

	private addPlugins() {
		this.app.register(cors, { origin: '*' })
		this.app.register(compress)

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
						bearerAuth: {
							type: 'http',
							scheme: 'bearer'
						},
						apiKey: {
							type: 'apiKey',
							in: 'header',
							name: 'x-api-key'
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