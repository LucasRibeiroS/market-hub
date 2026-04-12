import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq'

import { env } from '@config/env'
import { ONE_HOUR_IN_MS } from '@constants/units'

import { UseCaseProcessor, UseCaseProcessorParams } from '@queue/worker/UseCaseProcessor'
import { EventLogger } from '@queue/worker/EventLogger'
import { QueueMonitoring } from '@queue/monitoring'

import { RefreshMarketplaceCredential } from '@use-cases/marketplace-credentials'
import { PublishMarketplaceListings } from '@use-cases/marketplace-listings'

export enum QueueName {
	refresh_marketplace_credentials = 'refresh-marketplace-credentials',
	publish_marketplace_listings = 'publish-marketplace-listings'
}

export class QueueServer {
	private static readonly config: QueueOptions & WorkerOptions = {
		connection: {
			host: env.REDIS_HOST,
			port: env.REDIS_PORT
		},
		defaultJobOptions: {
			removeOnComplete: true,
			removeOnFail: true
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
		}),
		[QueueName.publish_marketplace_listings]: new Queue(QueueName.publish_marketplace_listings, QueueServer.config)
	}

	private workers: Worker[] = []

	private readonly logger = new EventLogger()
	private readonly processor = new UseCaseProcessor()
	private readonly monitoring = new QueueMonitoring()

	async start() {
		console.log(`[${env.APPLICATION_NAME}] Queue running with pid ${process.pid}`)

		this.createWorker(QueueName.refresh_marketplace_credentials, {
			use_case_class: RefreshMarketplaceCredential,
			queue: QueueServer.queues[QueueName.refresh_marketplace_credentials]
		})

		this.createWorker(QueueName.publish_marketplace_listings, {
			use_case_class: PublishMarketplaceListings,
			queue: QueueServer.queues[QueueName.publish_marketplace_listings]
		})

		if (env.NODE_ENV === 'local') {
			this.monitoring.setQueues(Object.values(QueueServer.queues))
			this.monitoring.start()
		}
	}

	private createWorker(queueName: QueueName, params: UseCaseProcessorParams) {
		const worker = new Worker(
			queueName,
			this.processor.apply(params),
			QueueServer.config
		)

		this.logger.registerWorker(worker, queueName)
		this.workers.push(worker)
	}

	async stop() {
		await Promise.all(
			this.workers.map(worker => worker.close())
		)
		this.monitoring.stop()

		console.log(`[${env.APPLICATION_NAME}] Queue stopped`)
	}
}