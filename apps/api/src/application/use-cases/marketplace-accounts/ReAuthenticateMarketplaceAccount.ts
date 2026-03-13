import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatusEnum, IMarketplaceAccount, IMarketplaceCredential } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { ConflictException, NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { IMarketplaceProvidersRepository, MarketplaceProvidersRepositorySymbol } from '@repositories/IMarketplaceProvidersRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { MARKETPLACE_REFRESH_CREDENTIALS_CRON } from '@constants/crons'
import { marketplaceAccountJsonSchema } from '@utils/typebox'

type ReAuthenticateMarketplaceAccountRequest = {
	id: string
	user_id: string
	data: {
		code: string
	}
}
type T = ReAuthenticateMarketplaceAccountRequest
type ReAuthenticateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}
type K = ReAuthenticateMarketplaceAccountResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Re-authenticate Marketplace Account',
	description: 'Re-authenticate an existing Marketplace Account for a user',
	response: Type.Object({
		account: Type.Ref(marketplaceAccountJsonSchema.$id)
	}, { $id: 'marketplace-accounts/ReAuthenticateMarketplaceAccountResponse' })
})
export class ReAuthenticateMarketplaceAccount implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(MarketplaceCredentialsRepositorySymbol)
		private marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceProvidersRepositorySymbol)
		private marketplaceProvidersRepository: IMarketplaceProvidersRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory,
		@inject(QueueAdapterSymbol)
		private queueAdapter: IQueueAdapter
	) {}

	@Transactional()
	async execute({ id, user_id, data }: T): Promise<K> {
		const existingAccount = await this.marketplaceAccountsRepository.findByIdSimplified(id)
		if (existingAccount === null || existingAccount.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}
		if (existingAccount.status === AccountStatusEnum.active) {
			throw new ConflictException('Marketplace account is already active')
		}

		const oauth = await this.processOAuthCallback({
			provider_id: existingAccount.provider_id,
			code: data.code
		})

		const account = await this.marketplaceAccountsRepository.update(id, {
			...oauth.account,
			status: AccountStatusEnum.active
		})

		await Promise.all([
			this.marketplaceCredentialsRepository.upsert({
				...oauth.credentials,
				account_id: existingAccount.id
			}),
			this.enqueueRefreshCredentialsJob({ account_id: existingAccount.id })
		])

		return { account }
	}

	/**
	 * Process the OAuth callback by exchanging the code for tokens and updating the marketplace credentials for the account.
	 */
	private async processOAuthCallback({
		provider_id, code
	}: IProcessOAuthCallbackParams): Promise<IProcessOAuthCallbackResponse> {
		const mktProvider = await this.marketplaceProvidersRepository.findById(provider_id)
		if (mktProvider === null) {
			throw new NotFoundException('Marketplace provider not found')
		}
		if (!mktProvider.is_active) {
			throw new ConflictException('Marketplace provider is inactive')
		}

		const adapter = this.marketplaceAdapterFactory.get(mktProvider.provider)

		const { credentials } = await adapter.exchangeCode({ code, provider: mktProvider })
		const { account } = await adapter.getUserInfo({ credentials, provider: mktProvider })

		return { credentials, account }
	}

	private async enqueueRefreshCredentialsJob({ account_id }: IEnqueueRefreshCredentialsJobParams): Promise<void> {
		await this.queueAdapter.addJob({
			id: account_id,
			name: 'refresh-marketplace-credentials',
			data: { account_id },
			scheduler: {
				cron: MARKETPLACE_REFRESH_CREDENTIALS_CRON
			}
		})
	}
}

@Documentation({
	request: Type.Index(Validator.schema, ['data'], { $id: 'marketplace-accounts/ReAuthenticateMarketplaceAccountRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String(),
		data: Type.Object({
			code: Type.String()
		})
	})

	protected schema = Validator.schema
}

type IProcessOAuthCallbackParams = {
	provider_id: string
	code: string
}
type IProcessOAuthCallbackResponse = {
	credentials: Pick<
		IMarketplaceCredential,
		| 'access_token'
		| 'access_token_expires_at'
		| 'refresh_token'
		| 'refresh_token_expires_at'
		| 'scopes'
		| 'token_type'
	>
	account: Pick<IMarketplaceAccount, 'external_id' | 'external_email'>
}

type IEnqueueRefreshCredentialsJobParams = {
	account_id: string
}