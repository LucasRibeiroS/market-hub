import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatusEnum, IMarketplaceAccount, Provider } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { IMarketplaceProvidersRepository, MarketplaceProvidersRepositorySymbol } from '@repositories/IMarketplaceProvidersRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { marketplaceAccountJsonSchema, providerEnumSchema } from '@utils/typebox'

type CreateMarketplaceAccountRequest = {
	user_id: string
	provider: Provider
	code: string // The code received from the marketplace after the user authorizes our app.
}
type T = CreateMarketplaceAccountRequest
type CreateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}
type K = CreateMarketplaceAccountResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Create Marketplace Account',
	description: 'Creates a new marketplace account for the specified provider.',
	response: Type.Object({
		account: Type.Ref(marketplaceAccountJsonSchema.$id)
	}, { $id: 'marketplace-accounts/CreateMarketplaceAccountResponse' })
})
export class CreateMarketplaceAccount implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(MarketplaceCredentialsRepositorySymbol)
		private marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceProvidersRepositorySymbol)
		private marketplaceProvidersRepository: IMarketplaceProvidersRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	@Transactional()
	async execute({ user_id, provider, code }: T): Promise<K> {
		const mktProvider = await this.marketplaceProvidersRepository.findFirst({
			provider: provider,
			is_active: true
		})
		if (mktProvider === null) {
			throw new Error('Marketplace provider not found or inactive')
		}

		const adapter = this.marketplaceAdapterFactory.get(provider)

		const { credentials } = await adapter.exchangeCode({ code, provider: mktProvider })
		const { account } = await adapter.getUserInfo({ credentials, provider: mktProvider })

		const mktAccount = await this.marketplaceAccountsRepository.create({
			user_id: user_id,
			provider_id: mktProvider.id,
			external_id: account.external_id,
			external_email: account.external_email,
			status: AccountStatusEnum.active
		})

		await this.marketplaceCredentialsRepository.create({
			account_id: mktAccount.id,
			access_token: credentials.access_token,
			access_token_expires_at: credentials.access_token_expires_at,
			refresh_token: credentials.refresh_token,
			refresh_token_expires_at: credentials.refresh_token_expires_at,
			scopes: credentials.scopes,
			token_type: credentials.token_type
		})

		return { account: mktAccount }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-accounts/CreateMarketplaceAccountRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		provider: Type.Ref(providerEnumSchema.$id),
		code: Type.String()
	})

	protected schema = Validator.schema
}