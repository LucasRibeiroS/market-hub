import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'
import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { DeleteOrder, DeleteOrderSymbol } from '@use-cases/orders/DeleteOrder'
import { UpsertOrder, UpsertOrderSymbol } from '@use-cases/orders/UpsertOrder'

import { EmptyObject } from '@utils/types'
import { ProviderEnum } from '@integrator-packages/database/entities'

type ProcessMagaluOrderWebhookRequest = {
	account_id: string
	topic: string
	data: {
		status: string
		params: {
			id: string
		}
		resource?: string
	}
}
type T = ProcessMagaluOrderWebhookRequest

type ProcessMagaluOrderWebhookResponse = EmptyObject
type K = ProcessMagaluOrderWebhookResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Orders'],
	summary: 'Process Magalu order webhook',
	description: 'Receives and processes Magalu order webhooks to create or delete orders',
	is_public: true
})
export class ProcessMagaluOrderWebhook implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceCredentialsRepositorySymbol)
		private marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory,
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(UpsertOrderSymbol)
		private upsertOrder: UpsertOrder,
		@inject(DeleteOrderSymbol)
		private deleteOrder: DeleteOrder
	) {}

	private DELETE_STATUSES = ['cancelled', 'refunded']

	async execute({ account_id, topic, data }: T): Promise<K> {
		if (topic !== 'orders_order') {
			return {}
		}

		const credential = await this.marketplaceCredentialsRepository.findFirst({ account_id })
		if (credential === null || credential.account.provider.provider !== ProviderEnum.magalu) {
			throw new NotFoundException('Marketplace account not found for magalu webhook')
		}

		// Check if we should delete this order
		if (this.DELETE_STATUSES.includes(data.status.toLowerCase())) {
			await this.deleteOrder.execute({
				account_id,
				external_order_id: data.params.id
			})

			return {}
		}

		// Get order details from adapter
		const adapter = this.marketplaceAdapterFactory.get(ProviderEnum.magalu)

		const orderDetails = await adapter.getOrderDetails({
			credentials: credential,
			provider: credential.account.provider,
			external_order_id: data.params.id,
			resource: data.resource
		})

		// Check status after fetching details
		if (this.DELETE_STATUSES.includes(orderDetails.status.toLowerCase())) {
			await this.deleteOrder.execute({
				account_id,
				external_order_id: data.params.id
			})

			return {}
		}

		// Get the user for this account
		const accountInfo = await this.marketplaceAccountsRepository.findByIdSimplified(account_id)
		if (accountInfo === null) {
			throw new NotFoundException('Marketplace account not found')
		}

		// Upsert the order
		await this.upsertOrder.execute({
			user_id: accountInfo.user_id,
			account_id,
			order_details: orderDetails
		})

		return {}
	}
}

// Validator (single definition)

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.String(),
		topic: Type.String(),
		data: Type.Object({
			status: Type.String(),
			params: Type.Object({
				id: Type.String()
			}),
			resource: Type.Optional(Type.String())
		})
	})

	protected schema = Validator.schema
}