import { Queue, QueueOptions, Worker, WorkerOptions } from 'bullmq'

import { env } from '@config/env'
import { ONE_HOUR_IN_MS } from '@constants/units'

import { applyUseCase } from '@queue/utils/apply_use_case'

import { RefreshMarketplaceCredential } from '@use-cases/marketplace-credentials'

export enum QueueName {
	refresh_marketplace_credentials = 'refresh-marketplace-credentials'
}

class QueueServer {
	private readonly config: QueueOptions & WorkerOptions = {
		connection: {
			host: env.REDIS_HOST,
			port: env.REDIS_PORT
		},
		defaultJobOptions: {
			removeOnComplete: true,
			removeOnFail: env.NODE_ENV === 'production'
		}
	}

	readonly queues: { [key in QueueName]: Queue } = {
		[QueueName.refresh_marketplace_credentials]: new Queue(QueueName.refresh_marketplace_credentials, {
			connection: this.config.connection,
			defaultJobOptions: {
				...this.config.defaultJobOptions,
				attempts: 3,
				backoff: {
					type: 'fixed',
					delay: ONE_HOUR_IN_MS
				}
			}
		})
	}

	async start() {
		new Worker(
			QueueName.refresh_marketplace_credentials,
			async({ data }) => applyUseCase(RefreshMarketplaceCredential, data),
			this.config
		)
	}
}

export default new QueueServer()