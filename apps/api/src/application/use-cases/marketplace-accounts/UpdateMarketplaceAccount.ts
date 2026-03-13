import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatus, AccountStatusEnum, IMarketplaceAccount } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { accountStatusEnumSchema, marketplaceAccountJsonSchema } from '@utils/typebox'

type UpdateMarketplaceAccountRequest = {
	id: string
	user_id: string
	data: {
		status: AccountStatus
	}
}
type T = UpdateMarketplaceAccountRequest
type UpdateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}
type K = UpdateMarketplaceAccountResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Update Marketplace Account',
	description: 'Update an existing Marketplace Account for a user',
	response: Type.Object({
		account: Type.Ref(marketplaceAccountJsonSchema.$id)
	}, { $id: 'marketplace-accounts/UpdateMarketplaceAccountResponse' })
})
export class UpdateMarketplaceAccount implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(QueueAdapterSymbol)
		private queueAdapter: IQueueAdapter
	) {}

	@Transactional()
	async execute({ id, user_id, data }: T): Promise<K> {
		const existingAccount = await this.marketplaceAccountsRepository.findById(id)
		if (existingAccount === null || existingAccount.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}

		const account = await this.marketplaceAccountsRepository.update(id, data)

		if (account.status !== AccountStatusEnum.active) {
			await this.removeRefreshCredentialsJob({ account_id: id })
		}

		return { account }
	}

	private async removeRefreshCredentialsJob({ account_id }: IRemoveRefreshCredentialsJobParams): Promise<void> {
		await this.queueAdapter.removeJob({
			id: account_id,
			name: 'refresh-marketplace-credentials'
		})
	}
}

@Documentation({
	request: Type.Index(Validator.schema, ['data'], { $id: 'marketplace-accounts/UpdateMarketplaceAccountRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String(),
		data: Type.Object({
			status: Type.Ref(accountStatusEnumSchema.$id)
		})
	})

	protected schema = Validator.schema
}

type IRemoveRefreshCredentialsJobParams = {
	account_id: string
}