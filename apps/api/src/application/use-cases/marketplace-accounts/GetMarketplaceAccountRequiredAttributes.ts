import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { providerEnumSchema } from '@utils/typebox'

type IGetMarketplaceAccountRequiredAttributesRequest = {
	id: string
	user_id: string
	product_name: string
}
type IGetMarketplaceAccountRequiredAttributesResponse = {
	required_attributes: {
		product: IRequiredAttribute[]
		variant: IRequiredAttribute[]
	}
}

type T = IGetMarketplaceAccountRequiredAttributesRequest
type K = IGetMarketplaceAccountRequiredAttributesResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Get required attributes for a marketplace account',
	description: 'Retrieves the required product and variant attributes for the selected account provider.',
	response: Type.Object({
		required_attributes: Type.Object({
			product: Type.Array(Type.Object({
				id: Type.String(),
				name: Type.String(),
				description: Type.Optional(Type.String()),
				allowed_values: Type.Optional(Type.Array(Type.String())),
				allowed_in_variants: Type.Optional(Type.Boolean()),
				provider: Type.Ref(providerEnumSchema.$id)
			})),
			variant: Type.Array(Type.Object({
				id: Type.String(),
				name: Type.String(),
				description: Type.Optional(Type.String()),
				allowed_values: Type.Optional(Type.Array(Type.String())),
				allowed_in_variants: Type.Optional(Type.Boolean()),
				provider: Type.Ref(providerEnumSchema.$id)
			}))
		})
	}, { $id: 'marketplace-accounts/GetMarketplaceAccountRequiredAttributesResponse' })
})
export class GetMarketplaceAccountRequiredAttributes implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private readonly marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(MarketplaceCredentialsRepositorySymbol)
		private readonly marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private readonly marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	async execute({ id, user_id, product_name }: T): Promise<K> {
		const { provider, credentials } = await this.loadAccount({ id, user_id })

		const requiredAttributes = await this.getRequiredAttributesForProvider({
			provider,
			credentials,
			product: { name: product_name }
		})

		return {
			required_attributes: {
				product: requiredAttributes.filter(attribute => !attribute.allowed_in_variants),
				variant: requiredAttributes.filter(attribute => attribute.allowed_in_variants)
			}
		}
	}

	/**
	 * @throws NotFoundException if the account is not found or does not belong to the user
	 * @throws NotFoundException if the account has no credentials
	 */
	private async loadAccount({ id, user_id }: ILoadAccountParams): Promise<ILoadAccountResponse> {
		const account = await this.marketplaceAccountsRepository.findByIdSimplified(id)
		if (account === null || account.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}

		const credential = await this.marketplaceCredentialsRepository.findFirst({ account_id: id })
		if (credential === null) {
			throw new NotFoundException('Marketplace credentials not found')
		}

		return {
			provider: {
				provider: credential.account.provider.provider,
				base_url: credential.account.provider.base_url
			},
			credentials: {
				access_token: credential.access_token,
				token_type: credential.token_type
			}
		}
	}

	private async getRequiredAttributesForProvider({
		provider, credentials, product
	}: IGetRequiredAttributesForProviderParams): Promise<IRequiredAttribute[]> {
		const adapter = this.marketplaceAdapterFactory.get(provider.provider)

		const { attributes } = await adapter.getAttributes({
			provider: { base_url: provider.base_url },
			credentials: {
				access_token: credentials.access_token,
				token_type: credentials.token_type
			},
			product: { name: product.name }
		})

		return attributes
			.filter(attribute => attribute.required)
			.map(attribute => ({
				id: attribute.id,
				name: attribute.name,
				description: attribute.description,
				allowed_values: attribute.allowed_values,
				allowed_in_variants: attribute.allowed_in_variants,
				provider: provider.provider
			}))
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['id', 'user_id'], { $id: 'marketplace-accounts/GetMarketplaceAccountRequiredAttributesRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String(),
		product_name: Type.String()
	})

	protected schema = Validator.schema
}

type IRequiredAttribute = {
	id: string
	name: string
	description?: string
	allowed_values?: string[]
	allowed_in_variants?: boolean
	provider: Provider
}

type ILoadAccountParams = Pick<T, 'id' | 'user_id'>
type ILoadAccountResponse = {
	provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
}

type IGetRequiredAttributesForProviderParams = {
	provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	product: { name: string }
}
