import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { tryCatch } from '@utils/try_catch'

export type RefreshMarketplaceCredentialRequest = {
	account_id: string
}
type T = RefreshMarketplaceCredentialRequest
type RefreshMarketplaceCredentialResponse = void
type K = RefreshMarketplaceCredentialResponse

@injectable()
@ValidateWith(() => Validator)
export class RefreshMarketplaceCredential implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceCredentialsRepositorySymbol)
		private marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	async execute({ account_id }: T): Promise<K> {
		const existingCredential = await this.marketplaceCredentialsRepository.findFirst({ account_id })
		if (existingCredential === null) {
			throw new NotFoundException('Marketplace credential not found')
		}

		const mktProvider = existingCredential.account.provider

		const adapter = this.marketplaceAdapterFactory.get(mktProvider.provider)

		const [res, err] = await tryCatch(() => adapter.refreshToken({
			refresh_token: existingCredential.refresh_token,
			provider: mktProvider
		}))
		if (err) {
			await this.marketplaceAccountsRepository.update(existingCredential.account_id, { status: 'error' })
			throw err
		}

		await this.marketplaceCredentialsRepository.update(existingCredential.id, res.credentials)
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.String()
	})

	protected schema = Validator.schema
}