import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceWebhooksRepository, MarketplaceWebhooksRepositorySymbol } from '@repositories/IMarketplaceWebhooksRepository'
import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { EmptyObject } from '@utils/types'

type DeleteMarketplaceWebhookRequest = {
	account_id: string
}
type DeleteMarketplaceWebhookResponse = EmptyObject
type T = DeleteMarketplaceWebhookRequest
type K = DeleteMarketplaceWebhookResponse

export const DeleteMarketplaceWebhookSymbol = Symbol('DeleteMarketplaceWebhook')

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Webhooks'],
	summary: 'Delete Marketplace Webhook',
	description: 'Deletes a marketplace webhook for the specified account.'
})
export class DeleteMarketplaceWebhook implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceWebhooksRepositorySymbol)
		private marketplaceWebhooksRepository: IMarketplaceWebhooksRepository,
		@inject(MarketplaceCredentialsRepositorySymbol)
		private marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	@Transactional()
	async execute({ account_id }: T): Promise<K> {
		const [webhook, credentials] = await Promise.all([
			this.marketplaceWebhooksRepository.findFirst({ account_id }),
			this.marketplaceCredentialsRepository.findFirst({ account_id })
		])
		if (webhook === null) {
			// Some providers don't have the webhook at the user level
			return {}
		}
		if (credentials === null) {
			throw new NotFoundException('Marketplace credentials not found for the given account')
		}

		const adapter = this.marketplaceAdapterFactory.get(credentials.account.provider.provider)

		await Promise.all([
			adapter.unsubscribeOrderWebhooks({
				credentials,
				provider: credentials.account.provider,
				subscription: {
					external_webhook_id: webhook.external_webhook_id
				}
			}),
			this.marketplaceWebhooksRepository.delete({
				account_id,
				topic: webhook.topic
			})
		])

		return {}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-webhooks/DeleteMarketplaceWebhookRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.String()
	})

	protected schema = Validator.schema
}