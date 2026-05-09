import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatusEnum, IMarketplaceAccount, IMarketplaceCredential, IMarketplaceProvider } from '@integrator-packages/database/entities'
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

import { UpsertMarketplaceWebhook, UpsertMarketplaceWebhookSymbol } from '@use-cases/marketplace-webhooks/UpsertMarketplaceWebhook'

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
		private queueAdapter: IQueueAdapter,
		@inject(UpsertMarketplaceWebhookSymbol)
		private upsertMarketplaceWebhook: UpsertMarketplaceWebhook
	) {}

	@Transactional()
	async execute({ id, user_id, data }: T): Promise<K> {
		const { account: existingAccount, provider } = await this.loadAccountAndProvider({ account_id: id, user_id })

		const oauth = await this.processOAuthCallback({ provider, code: data.code })

		const [account] = await Promise.all([
			this.marketplaceAccountsRepository.update(id, {
				...oauth.account,
				status: AccountStatusEnum.active
			}),
			this.upsertMarketplaceWebhook.execute({
				account_id: existingAccount.id,
				provider,
				credentials: {
					access_token: oauth.credentials.access_token,
					token_type: oauth.credentials.token_type
				}
			}),
			this.marketplaceCredentialsRepository.upsert({
				...oauth.credentials,
				account_id: existingAccount.id
			}),
			this.enqueueRefreshCredentialsJob({ account_id: existingAccount.id })
		])

		return { account }
	}

	/**
	 * @throws NotFoundException if the marketplace account is not found
	 * @throws ConflictException if the marketplace account is not active
	 * @throws NotFoundException if the marketplace provider is not found
	 * @throws ConflictException if the marketplace provider is not active
	 */
	private async loadAccountAndProvider({
		account_id, user_id
	}: ILoadAccountAndProviderParams): Promise<ILoadAccountAndProviderResponse> {
		const account = await this.marketplaceAccountsRepository.findByIdSimplified(account_id)
		if (account === null || account.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}
		if (account.status === AccountStatusEnum.active) {
			throw new ConflictException('Marketplace account is already active')
		}

		const provider = await this.marketplaceProvidersRepository.findById(account.provider_id)
		if (provider === null) {
			throw new NotFoundException('Marketplace provider not found')
		}
		if (!provider.is_active) {
			throw new ConflictException('Marketplace provider is inactive')
		}

		return { account, provider }
	}

	/**
	 * Process the OAuth callback by exchanging the code for tokens and updating the marketplace credentials for the account.
	 */
	private async processOAuthCallback({
		provider, code
	}: IProcessOAuthCallbackParams): Promise<IProcessOAuthCallbackResponse> {
		const adapter = this.marketplaceAdapterFactory.get(provider.provider)

		const { credentials } = await adapter.exchangeCode({ code, provider })
		const { account } = await adapter.getUserInfo({ credentials, provider })

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

type ILoadAccountAndProviderParams = {
	account_id: string
	user_id: string
}
type ILoadAccountAndProviderResponse = {
	account: Pick<IMarketplaceAccount, 'id' | 'user_id' | 'provider_id' | 'status'>
	provider: IMarketplaceProvider
}

type IProcessOAuthCallbackParams = {
	provider: IMarketplaceProvider
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