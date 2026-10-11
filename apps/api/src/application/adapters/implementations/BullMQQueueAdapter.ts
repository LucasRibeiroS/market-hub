import { Queue } from 'bullmq'

import { QueueServer } from '@queue/app'

import { IAddJobParams, IHasScheduledJobParams, IQueueAdapter, IRemoveJobParams, QueueName } from '@adapters/IQueueAadpter'

export class BullMQQueueAdapter implements IQueueAdapter {
	async addJob({ id, name, data, scheduler }: IAddJobParams): Promise<void> {
		const queue = this.getQueue(name)

		if (scheduler !== undefined) {
			await queue.upsertJobScheduler(id, { pattern: scheduler.cron }, { data })
			return
		}

		await queue.add(name, data, { jobId: id })
	}

	async removeJob({ id, name }: IRemoveJobParams): Promise<void> {
		const queue = this.getQueue(name)
		await queue.remove(id)
	}

	async hasScheduledJob({ id, name }: IHasScheduledJobParams): Promise<boolean> {
		const queue = this.getQueue(name)
		const scheduler = await queue.getJobScheduler(id)

		return scheduler !== undefined && scheduler !== null
	}

	private getQueue(name: QueueName): Queue {
		const queue = QueueServer.queues[name]
		if (!queue) {
			throw new Error(`Queue ${name} not found`)
		}
		return queue
	}
}