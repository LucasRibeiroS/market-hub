import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatusEnum, IMarketplaceAccount, IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { IMarketplaceProvidersRepository, MarketplaceProvidersRepositorySymbol } from '@repositories/IMarketplaceProvidersRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { UpsertMarketplaceWebhook, UpsertMarketplaceWebhookSymbol } from '@use-cases/marketplace-webhooks/UpsertMarketplaceWebhook'

import { MARKETPLACE_REFRESH_CREDENTIALS_CRON } from '@constants/crons'
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
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory,
		@inject(QueueAdapterSymbol)
		private queueAdapter: IQueueAdapter,
		@inject(UpsertMarketplaceWebhookSymbol)
		private upsertMarketplaceWebhook: UpsertMarketplaceWebhook
	) {}

	@Transactional()
	async execute({ user_id, provider, code }: T): Promise<K> {
		const mktProvider = await this.marketplaceProvidersRepository.findFirst({
			provider: provider,
			is_active: true
		})
		if (mktProvider === null) {
			throw new NotFoundException('Marketplace provider not found or inactive')
		}

		const oauth = await this.processOAuthCallback({ provider: mktProvider, code })

		const account = await this.marketplaceAccountsRepository.create({
			user_id: user_id,
			provider_id: mktProvider.id,
			external_id: oauth.account.external_id,
			external_email: oauth.account.external_email,
			status: AccountStatusEnum.active
		})

		await Promise.all([
			this.upsertMarketplaceWebhook.execute({
				account_id: account.id,
				provider: mktProvider,
				credentials: oauth.credentials
			}),
			this.marketplaceCredentialsRepository.create({
				...oauth.credentials,
				account_id: account.id
			}),
			this.enqueueRefreshCredentialsJob({ account_id: account.id })
		])

		return { account: account }
	}

	/**
	 * Process the OAuth callback by exchanging the code for tokens and retrieving user info from the marketplace provider.
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