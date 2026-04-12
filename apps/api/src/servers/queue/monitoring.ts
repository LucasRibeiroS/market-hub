import type { Queue } from 'bullmq'
import { fastify, type FastifyInstance } from 'fastify'

import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

import { env } from '@config/env'

export class QueueMonitoring {
	private readonly server: FastifyInstance
	private readonly serverAdapter: FastifyAdapter
	private readonly board: ReturnType<typeof createBullBoard>

	private readonly BASE_PATH = '/queues'
	private readonly port = env.QUEUE_MONITORING_PORT

	constructor() {
		this.server = fastify()
		this.serverAdapter = new FastifyAdapter()

		this.configureServer()

		this.board = createBullBoard({
			queues: [],
			serverAdapter: this.serverAdapter
		})
	}

	private configureServer() {
		this.serverAdapter.setBasePath(this.BASE_PATH)

		this.server.register(this.serverAdapter.registerPlugin(), {
			prefix: this.BASE_PATH
		})

		this.server.setNotFoundHandler((_, reply) => {
			reply.redirect(this.BASE_PATH)
		})
	}

	start() {
		this.server.listen({ port: this.port, host: '::' }, (err) => {
			if (err) {
				console.error({ err })
			} else {
				console.log(`[${env.APPLICATION_NAME}] Queue monitoring server running on ${this.port}`)
			}
		})
	}

	stop() {
		this.server.close()
		console.log(`[${env.APPLICATION_NAME}] Queue monitoring server stopped`)
	}

	setQueues(queues: Queue[]) {
		this.board.setQueues(queues.map((queue) => new BullMQAdapter(queue)))
	}
}