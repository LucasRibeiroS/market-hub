import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceAccount, IMarketplaceProvider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { marketplaceAccountJsonSchema } from '@utils/typebox'

type GetMarketplaceAccountRequest = {
	id: string
	user_id: string
}
type T = GetMarketplaceAccountRequest
type GetMarketplaceAccountResponse = {
	account: {
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount
}
type K = GetMarketplaceAccountResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Get Marketplace Account',
	description: 'Get an existing Marketplace Account for a user',
	response: Type.Object({
		account: Type.Ref(marketplaceAccountJsonSchema.$id)
	}, { $id: 'marketplace-accounts/GetMarketplaceAccountResponse' })
})
export class GetMarketplaceAccount implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository
	) {}

	async execute({ id, user_id }: T): Promise<K> {
		const account = await this.marketplaceAccountsRepository.findById(id)
		if (account === null || account.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}

		return { account }
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String()
	})

	protected schema = Validator.schema
}