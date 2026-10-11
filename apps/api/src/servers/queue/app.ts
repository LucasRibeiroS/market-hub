import { container } from 'tsyringe'
import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq'

import { env } from '@config/env'
import { ONE_HOUR_IN_MS, ONE_MINUTE_IN_MS } from '@constants/units'

import { UseCaseProcessor, UseCaseProcessorParams } from '@queue/worker/UseCaseProcessor'
import { EventLogger } from '@queue/worker/EventLogger'
import { QueueMonitoring } from '@queue/monitoring'

import { RefreshMarketplaceCredential, RescheduleMarketplaceCredentialRefreshes } from '@use-cases/marketplace-credentials'
import { PublishMarketplaceListings } from '@use-cases/marketplace-listings'
import { SyncMercadoLivreOrder } from '@use-cases/orders'

export enum QueueName {
	refresh_marketplace_credentials = 'refresh-marketplace-credentials',
	publish_marketplace_listings = 'publish-marketplace-listings',
	sync_mercado_livre_order = 'sync-mercado-livre-order'
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
		[QueueName.publish_marketplace_listings]: new Queue(QueueName.publish_marketplace_listings, QueueServer.config),
		[QueueName.sync_mercado_livre_order]: new Queue(QueueName.sync_mercado_livre_order, {
			connection: QueueServer.config.connection,
			defaultJobOptions: {
				...QueueServer.config.defaultJobOptions,
				attempts: 5,
				backoff: {
					type: 'exponential',
					delay: ONE_MINUTE_IN_MS
				}
			}
		})
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

		this.createWorker(QueueName.sync_mercado_livre_order, {
			use_case_class: SyncMercadoLivreOrder,
			queue: QueueServer.queues[QueueName.sync_mercado_livre_order]
		})

		if (env.NODE_ENV === 'local') {
			this.monitoring.setQueues(Object.values(QueueServer.queues))
			this.monitoring.start()
		}

		await this.rescheduleCredentialRefreshes()
	}

	/**
	 * The refresh schedules live only in Redis, so they are lost if it restarts without persistence.
	 * Restores them for the active accounts, so the server can start even if it fails.
	 */
	private async rescheduleCredentialRefreshes() {
		try {
			const { rescheduled } = await container.resolve(RescheduleMarketplaceCredentialRefreshes).execute()

			if (rescheduled.length > 0) {
				console.log(`[${env.APPLICATION_NAME}] Rescheduled credentials refresh for ${rescheduled.length} account(s)`)
			}
		} catch(error) {
			console.error(`[${env.APPLICATION_NAME}] Failed to reschedule credentials refresh`, error)
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