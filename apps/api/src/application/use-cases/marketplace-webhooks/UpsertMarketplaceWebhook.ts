import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceCredential, IMarketplaceProvider } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { IMarketplaceWebhooksRepository, MarketplaceWebhooksRepositorySymbol } from '@repositories/IMarketplaceWebhooksRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { resolveOrderWebhookUrl } from '@utils/webhook'
import { EmptyObject } from '@utils/types'
import { providerEnumSchema, TNullable } from '@utils/typebox'

type UpsertMarketplaceWebhookRequest = {
	account_id: string
	provider: IMarketplaceProvider
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
}
type UpsertMarketplaceWebhookResponse = EmptyObject
type T = UpsertMarketplaceWebhookRequest
type K = UpsertMarketplaceWebhookResponse

export const UpsertMarketplaceWebhookSymbol = Symbol('UpsertMarketplaceWebhook')

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Webhooks'],
	summary: 'Upsert Marketplace Webhook',
	description: 'Creates or updates a marketplace webhook for the specified account.'
})
export class UpsertMarketplaceWebhook implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceWebhooksRepositorySymbol)
		private marketplaceWebhooksRepository: IMarketplaceWebhooksRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	@Transactional()
	async execute({ account_id, provider, credentials }: T): Promise<K> {
		const adapter = this.marketplaceAdapterFactory.get(provider.provider)

		const webhookUrl = resolveOrderWebhookUrl({ account_id, provider: provider.provider })

		const { subscription } = await adapter.subscribeOrderWebhooks({
			credentials,
			provider,
			webhook_url: webhookUrl
		})

		if (subscription !== undefined) {
			await this.marketplaceWebhooksRepository.upsert({
				account_id,
				external_webhook_id: subscription.external_webhook_id,
				topic: subscription.topic,
				is_active: true
			})
		}

		return {}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-webhooks/UpsertMarketplaceWebhookRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.String(),
		provider: Type.Ref(providerEnumSchema.$id),
		credentials: Type.Object({
			access_token: Type.String(),
			token_type: TNullable(Type.String())
		})
	})

	protected schema = Validator.schema
}
