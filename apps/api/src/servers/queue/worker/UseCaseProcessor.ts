import { container } from 'tsyringe'
import { Job, Processor, Queue } from 'bullmq'

import { IUseCase, UseCaseFactory } from '@integrator-packages/use-case'

export type UseCaseProcessorParams<T = unknown, K = unknown> = {
	// eslint-disable-next-line typescript/no-explicit-any
	use_case_class: new (...args: any[]) => IUseCase<T, K>
	queue: Queue
}

export class UseCaseProcessor {
	apply<T, K>({ use_case_class, queue }: UseCaseProcessorParams<T, K>): Processor<unknown, unknown, string> {
		return async(job) => {
			const { process, body } = await this.handle(use_case_class, job.data)

			if (process === 'failed') {
				await this.maybeRemoveJobScheduler(queue, job)

				throw new Error(body)
			}

			return body
		}
	}

	private async handle<T, K>(useCaseClass: UseCaseProcessorParams<T, K>['use_case_class'], data: T) {
		const useCase = UseCaseFactory.create(container.resolve(useCaseClass))

		return await useCase.handle(data)
	}

	private async maybeRemoveJobScheduler(queue: Queue, job: Job) {
		// Removal of the job scheduler is made to avoid the creation of new jobs that will fail
		const currentAttempt = job.attemptsMade + 1
		const maxAttempts = job.opts.attempts || 1
		if (job.repeatJobKey !== undefined && currentAttempt >= maxAttempts) {
			await queue.removeJobScheduler(job.repeatJobKey)
		}
	}
}
