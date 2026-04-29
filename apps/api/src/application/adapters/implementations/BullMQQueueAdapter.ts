import { Queue } from 'bullmq'

import { QueueServer } from '@queue/app'

import { IAddJobParams, IQueueAdapter, IRemoveJobParams, QueueName } from '@adapters/IQueueAadpter'
import { IOrchestratorDispatcher, OrchestratorDispatchParams } from '@integrator-packages/use-case/orchestrator'

export class BullMQQueueAdapter implements IQueueAdapter, IOrchestratorDispatcher {
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

	async dispatch<TInput = unknown, TState extends Record<string, unknown> = Record<string, unknown>>({
		queue_name,
		job_data
	}: OrchestratorDispatchParams<TInput, TState>): Promise<void> {
		const queue = this.getQueue(queue_name as QueueName)
		await queue.add(queue_name, job_data, {
			jobId: `${job_data.orchestration_id}:${job_data.phase}:${job_data.step_index}`
		})
	}

	private getQueue(name: QueueName): Queue {
		const queue = QueueServer.queues[name]
		if (!queue) {
			throw new Error(`Queue ${name} not found`)
		}
		return queue
	}
}