import { RefreshMarketplaceCredentialRequest } from '@use-cases/marketplace-credentials'

type JobDataMap = {
	'refresh-marketplace-credentials': RefreshMarketplaceCredentialRequest
}

export type QueueName = keyof JobDataMap

export type IAddJobParams = {
	[K in keyof JobDataMap]: {
		id: string
		name: K
		data: JobDataMap[K]
		scheduler?: {
			cron: string
		}
	}
}[keyof JobDataMap]

export type IRemoveJobParams = {
	id: string
	name: QueueName
}

export interface IQueueAdapter {
	addJob(params: IAddJobParams): Promise<void>
	removeJob(params: IRemoveJobParams): Promise<void>
}

export const QueueAdapterSymbol = Symbol('IQueueAdapter')