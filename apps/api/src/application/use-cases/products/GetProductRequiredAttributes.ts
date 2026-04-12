import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { AccountStatusEnum, IMarketplaceProvider, IProduct, IVariant } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { ConflictException, NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { MarketplaceAdapterFactory } from '@factories/implementations/MarketplaceAdapterFactory'

import { CustomOmit } from '@utils/types'

type IGetProductRequiredAttributesRequest = {
	id: string
	user_id: string
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
			allowed_in_variants: Type.Boolean(),
			allowed_values: Type.Optional(Type.Array(Type.String()))
		})),
		variants: Type.Array(Type.Object({
			id: Type.String(),
			sku: Type.String(),
			missing_attributes: Type.Array(Type.Object({
				id: Type.String(),
				name: Type.String(),
				allowed_values: Type.Optional(Type.Array(Type.String()))
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
		@inject(MarketplaceAdapterFactory)
		private readonly marketplaceAdapterFactory: MarketplaceAdapterFactory
	) {}

	async execute({ id, user_id }: T): Promise<K> {
		const [{ product }, { accounts }] = await Promise.all([
			this.loadAndValidateProduct({ id, user_id }),
			this.loadAccounts({ user_id })
		])

		const requiredAttributesList = await Promise.all(
			accounts.map(account => this.getRequiredAttributesForProvider({
				provider: account.provider,
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
	private async loadAccounts({ user_id }: ILoadAccountsParams): Promise<ILoadAccountsResponse> {
		const accounts = await this.marketplaceAccountsRepository.findManyWithDistinctProviders({
			user_id,
			status: AccountStatusEnum.active
		})
		if (accounts.length === 0) {
			throw new NotFoundException('No active marketplace accounts found for user')
		}

		return {
			accounts: accounts.map(account => ({
				provider: {
					provider: account.provider.provider,
					base_url: account.provider.base_url
				}
			}))
		}
	}

	private async getRequiredAttributesForProvider({
		provider, product
	}: IGetRequiredAttributesForProviderParams): Promise<IAttribute[]> {
		const adapter = this.marketplaceAdapterFactory.get(provider.provider)

		const { attributes } = await adapter.getAttributes({
			provider: { base_url: provider.base_url },
			product: { name: product.name }
		})

		return attributes.filter(attr => attr.required)
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String()
	})

	protected schema = Validator.schema
}

type IAttribute = {
	id: string
	name: string
	allowed_values?: string[]
	allowed_in_variants?: boolean
}

type ILoadAndValidateProductParams = Pick<T, 'id' | 'user_id'>
type ILoadAndValidateProductResponse = {
	product: { variants: IVariant[] } & IProduct
}

type ILoadAccountsParams = Pick<T, 'user_id'>
type ILoadAccountsResponse = {
	accounts: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
	}>
}

type IGetRequiredAttributesForProviderParams = {
	provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
	product: { name: string }
}