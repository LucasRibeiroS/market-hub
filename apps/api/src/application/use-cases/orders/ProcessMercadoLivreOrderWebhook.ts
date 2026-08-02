import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { EmptyObject } from '@utils/types'

type ProcessMercadoLivreOrderWebhookRequest = {
	account_id?: string
	topic: string
	resource: string
	user_id: number
	// status comes from the test section on the web app
	status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
}
type T = ProcessMercadoLivreOrderWebhookRequest

type ProcessMercadoLivreOrderWebhookResponse = EmptyObject
type K = ProcessMercadoLivreOrderWebhookResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Orders'],
	summary: 'Receive Mercado Livre order webhook',
	description: 'Acknowledges Mercado Livre order notifications and enqueues them for asynchronous processing',
	is_public: true
})
export class ProcessMercadoLivreOrderWebhook implements IUseCase<T, K> {
	constructor(
		@inject(QueueAdapterSymbol)
		private queueAdapter: IQueueAdapter
	) {}

	private ORDER_TOPICS = ['orders', 'orders_v2']

	async execute({ topic, resource, user_id, account_id, status }: T): Promise<K> {
		if (!this.ORDER_TOPICS.includes(topic)) {
			return {}
		}

		const externalOrderId = this.getExternalOrderIdFromResource(resource)
		if (externalOrderId === null) {
			return {}
		}

		await this.queueAdapter.addJob({
			id: `sync-mercado-livre-order-${externalOrderId}`,
			name: 'sync-mercado-livre-order',
			data: { account_id, resource, user_id, status }
		})

		return {}
	}

	private getExternalOrderIdFromResource(resource: string): string | null {
		const match = resource.match(/\/orders\/(\d+)/)

		return match?.[1] || null
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.Optional(Type.String()),
		topic: Type.String(),
		resource: Type.String(),
		user_id: Type.Number(),
		status: Type.Optional(Type.Union([
			Type.Literal('pending'),
			Type.Literal('paid'),
			Type.Literal('shipped'),
			Type.Literal('delivered'),
			Type.Literal('cancelled'),
			Type.Literal('refunded')
		]))
	})

	protected schema = Validator.schema
}
