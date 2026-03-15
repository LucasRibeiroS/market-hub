import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq'

import { env } from '@config/env'
import { ONE_HOUR_IN_MS } from '@constants/units'

import { UseCaseProcessor } from '@queue/worker/UseCaseProcessor'
import { EventLogger } from '@queue/worker/EventLogger'

import { RefreshMarketplaceCredential } from '@use-cases/marketplace-credentials'

export enum QueueName {
	refresh_marketplace_credentials = 'refresh-marketplace-credentials'
}

export class QueueServer {
	private static readonly config: QueueOptions & WorkerOptions = {
		connection: {
			host: env.REDIS_HOST,
			port: env.REDIS_PORT
		},
		defaultJobOptions: {
			removeOnComplete: true,
			removeOnFail: env.NODE_ENV === 'production'
		}
	}

	static readonly queues: { [key in QueueName]: Queue } = {
		[QueueName.refresh_marketplace_credentials]: new Queue(QueueName.refresh_marketplace_credentials, {
			connection: QueueServer.config.connection,
			defaultJobOptions: {
				...QueueServer.config.defaultJobOptions,
				attempts: 3,
				backoff: {
					type: 'fixed',
					delay: ONE_HOUR_IN_MS
				}
			}
		})
	}

	private readonly logger = new EventLogger()
	private readonly processor = new UseCaseProcessor()

	async start() {
		console.log(`[${env.APPLICATION_NAME}] Queue running with pid ${process.pid}`)

		const worker = new Worker(
			QueueName.refresh_marketplace_credentials,
			async({ data }) => this.processor.apply(RefreshMarketplaceCredential, data),
			QueueServer.config
		)
		this.logger.registerWorker(worker, QueueName.refresh_marketplace_credentials)
	}
}