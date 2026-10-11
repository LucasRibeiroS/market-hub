import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { DeleteMarketplaceWebhook, DeleteMarketplaceWebhookSymbol } from '@use-cases/marketplace-webhooks/DeleteMarketplaceWebhook'

import { EmptyObject } from '@utils/types'

type DeleteMarketplaceAccountRequest = {
	id: string
	user_id: string
}
type T = DeleteMarketplaceAccountRequest
type DeleteMarketplaceAccountResponse = EmptyObject
type K = DeleteMarketplaceAccountResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Delete Marketplace Account',
	description: 'Delete an existing Marketplace Account for a user'
})
export class DeleteMarketplaceAccount implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(QueueAdapterSymbol)
		private queueAdapter: IQueueAdapter,
		@inject(DeleteMarketplaceWebhookSymbol)
		private deleteMarketplaceWebhook: DeleteMarketplaceWebhook
	) {}

	@Transactional()
	async execute({ id, user_id }: T): Promise<K> {
		const account = await this.marketplaceAccountsRepository.findByIdSimplified(id)
		if (account === null || account.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}

		await Promise.all([
			this.deleteMarketplaceWebhook.execute({ account_id: account.id }),
			this.removeRefreshCredentialsJob({ account_id: account.id })
		])

		await this.marketplaceAccountsRepository.delete(account.id)

		return {}
	}

	private async removeRefreshCredentialsJob({ account_id }: IRemoveRefreshCredentialsJobParams): Promise<void> {
		await this.queueAdapter.removeJob({
			id: account_id,
			name: 'refresh-marketplace-credentials'
		})
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String()
	})

	protected schema = Validator.schema
}

type IRemoveRefreshCredentialsJobParams = {
	account_id: string
}