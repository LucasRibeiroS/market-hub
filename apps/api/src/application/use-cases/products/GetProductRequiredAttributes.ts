import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatusEnum, IMarketplaceCredential, IMarketplaceProvider, IProduct, IVariant, Provider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { ConflictException, NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { CustomOmit } from '@utils/types'
import { providerEnumSchema } from '@utils/typebox'

type IGetProductRequiredAttributesRequest = {
	id: string
	user_id: string
	provider?: Provider[]
}
type IGetProductRequiredAttributesResponse = {
	required_attributes: IAttribute[]
	variants: Array<{
		id: string
		sku: string
		missing_attributes: CustomOmit<IAttribute, 'allowed_in_variants'>[]
	}>
}

type T = IGetProductRequiredAttributesRequest
type K = IGetProductRequiredAttributesResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	summary: 'Get required attributes for a product',
	description: 'Retrieves the list of required attributes for the specified product on the marketplaces connected to the user',
	tags: ['Products'],
	response: Type.Object({
		required_attributes: Type.Array(Type.Object({
			id: Type.String(),
			name: Type.String(),
			description: Type.Optional(Type.String()),
			allowed_in_variants: Type.Boolean(),
			allowed_values: Type.Optional(Type.Array(Type.String())),
			provider: Type.Ref(providerEnumSchema.$id)
		})),
		variants: Type.Array(Type.Object({
			id: Type.String(),
			sku: Type.String(),
			missing_attributes: Type.Array(Type.Object({
				id: Type.String(),
				name: Type.String(),
				description: Type.Optional(Type.String()),
				allowed_values: Type.Optional(Type.Array(Type.String())),
				provider: Type.Ref(providerEnumSchema.$id)
			}))
		}))
	}, { $id: 'products/GetProductRequiredAttributesResponse' })
})
export class GetProductRequiredAttributes implements IUseCase<T, K> {
	constructor(
		@inject(ProductsRepositorySymbol)
		private readonly productsRepository: IProductsRepository,
		@inject(MarketplaceAccountsRepositorySymbol)
		private readonly marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private readonly marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	async execute({ id, user_id, provider }: T): Promise<K> {
		const [{ product }, { accounts }] = await Promise.all([
			this.loadAndValidateProduct({ id, user_id }),
			this.loadAccounts({ user_id, provider })
		])

		const requiredAttributesList = await Promise.all(
			accounts.map(account => this.getRequiredAttributesForProvider({
				provider: account.provider,
				credentials: account.credentials,
				product: { name: product.name }
			}))
		)

		const requiredAttributes = requiredAttributesList.flat()

		const variants = product.variants.map(variant => {
			const attributes = {
				...product.attributes,
				...variant.attributes
			}

			return {
				id: variant.id,
				sku: variant.sku,
				missing_attributes: requiredAttributes.filter(
					attr => !(attr.id in attributes) ||
						attr.allowed_values !== undefined && !attr.allowed_values?.includes(String(attributes[attr.id]))
				)
			}
		})

		return {
			required_attributes: requiredAttributes,
			variants
		}
	}

	/**
	 * @throws NotFoundException if the product is not found
	 * @throws ConflictException if the product has no variants
	 * @throws NotFoundException if the main variant is not found in the product variants
	 */
	private async loadAndValidateProduct({
		id, user_id
	}: ILoadAndValidateProductParams): Promise<ILoadAndValidateProductResponse> {
		const product = await this.productsRepository.findById(id)
		if (product === null || product.user_id !== user_id) {
			throw new NotFoundException('Product not found')
		}
		if (product.variants.length === 0) {
			throw new ConflictException('Product has no variants')
		}

		return { product }
	}

	/**
	 * @throws NotFoundException if no marketplace account is found
	 */
	private async loadAccounts({ user_id, provider }: ILoadAccountsParams): Promise<ILoadAccountsResponse> {
		const accounts = await this.marketplaceAccountsRepository.findManyWithDistinctProviders({
			user_id,
			status: AccountStatusEnum.active,
			provider
		})
		if (accounts.length === 0) {
			throw new NotFoundException('No active marketplace accounts found for user')
		}

		return {
			accounts: accounts.map(account => ({
				provider: {
					provider: account.provider.provider,
					base_url: account.provider.base_url
				},
				credentials: {
					access_token: account.credentials.access_token,
					token_type: account.credentials.token_type
				}
			}))
		}
	}

	private async getRequiredAttributesForProvider({
		provider, credentials, product
	}: IGetRequiredAttributesForProviderParams): Promise<IAttribute[]> {
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
			.filter(attr => attr.required)
			.map(attr => ({
				...attr,
				provider: provider.provider
			}))
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['id', 'user_id'], { $id: 'products/GetProductRequiredAttributesRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String(),
		provider: Type.Optional(
			Type.Array(Type.Ref(providerEnumSchema.$id), { minItems: 1 })
		)
	})

	protected schema = Validator.schema
}

type IAttribute = {
	id: string
	name: string
	description?: string
	allowed_values?: string[]
	allowed_in_variants?: boolean
	provider: Provider
}

type ILoadAndValidateProductParams = Pick<T, 'id' | 'user_id'>
type ILoadAndValidateProductResponse = {
	product: { variants: IVariant[] } & IProduct
}

type ILoadAccountsParams = Pick<T, 'user_id' | 'provider'>
type ILoadAccountsResponse = {
	accounts: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
		credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	}>
}

type IGetRequiredAttributesForProviderParams = {
	provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	product: { name: string }
}