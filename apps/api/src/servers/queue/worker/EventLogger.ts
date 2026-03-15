import { Worker } from 'bullmq'
import { container } from 'tsyringe'

import { ILoggerAdapter, LoggerAdapterSymbol } from '@integrator-packages/adapters'

import { env } from '@config/env'

import { formatTime } from '@utils/date'

export class EventLogger {
	private readonly loggerAdapter = container.resolve<ILoggerAdapter>(LoggerAdapterSymbol)

	// track job start times for duration calculation
	private jobStartTimes = new Map<string, number>()

	/**
	 * Registers listeners on the given worker to log job execution details, including start time, completion status, duration, and errors.
	 * @param worker The BullMQ Worker instance to attach logging to.
	 * @param queueName The name of the queue for log context.
	 */
	registerWorker(worker: Worker, queueName: string) {
		worker.on('active', (job) => {
			if (job.id === undefined) {
				return
			}

			this.jobStartTimes.set(String(job.id), Date.now())
		})

		worker.on('completed', (job) => {
			let duration: number | undefined
			const key = String(job.id)
			const startTime = this.jobStartTimes.get(key)

			if (startTime !== undefined) {
				duration = startTime ? Date.now() - startTime : undefined
				this.jobStartTimes.delete(key)
			}

			this.loggerAdapter.log(
				this.formatLog({
					result: 'OK',
					queue_name: queueName,
					job_name: job.name,
					duration
				})
			)
		})

		worker.on('failed', (job, err) => {
			let duration: number | undefined
			const key = String(job?.id || '')
			const startTime = this.jobStartTimes.get(key)

			if (startTime !== undefined) {
				duration = startTime ? Date.now() - startTime : undefined
				this.jobStartTimes.delete(key)
			}

			this.loggerAdapter.error(
				this.formatLog({
					result: 'FAIL',
					queue_name: queueName,
					job_name: job?.name,
					duration,
					message: err.message
				})
			)
		})

		worker.on('error', (err) => {
			this.loggerAdapter.error(
				this.formatLog({
					result: 'ERR',
					queue_name: queueName,
					message: err.message
				})
			)
		})
	}

	private formatLog(data: IFormatLogParams): string {
		const duration = this.formatDuration(data.duration)
		const jobName = this.formatJobName(data.job_name)
		const message = this.formatMessage(data)

		const base = `[${env.APPLICATION_NAME}] ${formatTime(new Date())} | ${data.result} | ${duration} | queue:${data.queue_name} | job:${jobName}`

		if (message !== undefined) {
			return `${base} | ${message}`
		}

		return base
	}

	private formatDuration(duration?: number): string {
		if (typeof duration !== 'number') {
			return '-'
		}
		return `${duration.toFixed(5)}ms`
	}

	private formatJobName(jobName?: string): string {
		if (typeof jobName !== 'string' || jobName.length === 0) {
			return '-'
		}
		return jobName
	}

	private formatMessage(data: Pick<IFormatLogParams, 'message' | 'result'>): string | undefined {
		if (typeof data.message === 'string' && data.message.length > 0) {
			return data.message
		}

		if (data.result === 'OK') return undefined
		if (data.result === 'FAIL') return 'Job failed'
		if (data.result === 'ERR') return 'Worker error'
		return 'Unknown result'
	}
}

type IFormatLogParams = {
	result: 'OK' | 'FAIL' | 'ERR'
	queue_name: string
	job_name?: string
	duration?: number
	message?: string
}