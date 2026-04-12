import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceListing, IProduct, IVariant, ListingStatusEnum } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { ConflictException, NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IMarketplaceListingsRepository, MarketplaceListingsRepositorySymbol } from '@repositories/IMarketplaceListingsRepository'
import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { marketplaceListingJsonSchema } from '@utils/typebox'

type BulkCreateMarketplaceListingsRequest = {
	user_id: string
	account_id: string
	product_id: string
	main_variant_id: string
}
type BulkCreateMarketplaceListingsResponse = {
	listings: Array<Pick<IMarketplaceListing, 'id' | 'status'>>
}

type T = BulkCreateMarketplaceListingsRequest
type K = BulkCreateMarketplaceListingsResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	summary: 'Creates a marketplace listing',
	description: 'Creates a marketplace listing for a specified product and marketplace account. The listing will be created with a pending status and will be synchronized with the marketplace in the background.',
	tags: ['Marketplace Listings'],
	response: Type.Object({
		listings: Type.Array(Type.Pick(Type.Ref(marketplaceListingJsonSchema.$id), ['id', 'status']))
	}, { $id: 'marketplace-listings/BulkCreateMarketplaceListingsResponse' })
})
export class BulkCreateMarketplaceListings implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceListingsRepositorySymbol)
		private readonly marketplaceListingsRepository: IMarketplaceListingsRepository,
		@inject(MarketplaceAccountsRepositorySymbol)
		private readonly marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(ProductsRepositorySymbol)
		private readonly productsRepository: IProductsRepository,
		@inject(VariantsRepositorySymbol)
		private readonly variantsRepository: IVariantsRepository,
		@inject(QueueAdapterSymbol)
		private readonly queueAdapter: IQueueAdapter
	) {}

	@Transactional()
	async execute({ user_id, product_id, main_variant_id, account_id }: T): Promise<K> {
		const [{ product }] = await Promise.all([
			this.loadAndValidateProduct({ user_id, product_id, main_variant_id }),
			this.validateAccount({ user_id, account_id })
		])

		await this.validateListingUniqueness({
			account_id,
			variant_ids: product.variants.map(variant => variant.id)
		})

		const listings = await this.marketplaceListingsRepository.createMany(
			product.variants.map(variant => ({
				account_id,
				variant_id: variant.id,
				external_product_id: null,
				external_variant_id: null,
				status: ListingStatusEnum.pending,
				last_sync_at: null,
				sync_message: null,
				metadata: {}
			}))
		)

		await this.updateMainVariant({ product_id, main_variant_id })

		await this.enqueuePublishListingJob({
			product_id,
			listing_ids: listings.map(listing => listing.id)
		})

		return {
			listings: listings.map(listing => ({
				id: listing.id,
				status: listing.status
			}))
		}
	}

	/**
	 * @throws NotFoundException if the marketplace account
	 * @throws ConflictException if the marketplace account is not active
	 */
	private async validateAccount({ user_id, account_id }: IValidateAccountParams): Promise<void> {
		const account = await this.marketplaceAccountsRepository.findById(account_id)
		if (account === null || account.user_id !== user_id) {
			throw new NotFoundException('Marketplace account not found')
		}
		if (account.status !== 'active') {
			throw new ConflictException('Marketplace account is not active')
		}
	}

	/**
	 * @throws NotFoundException if the product is not found
	 * @throws ConflictException if the product has no variants
	 * @throws NotFoundException if the main variant is not found in the product variants
	 */
	private async loadAndValidateProduct({
		user_id, product_id, main_variant_id
	}: ILoadAndValidateProductParams): Promise<ILoadAndValidateProductResponse> {
		const product = await this.productsRepository.findById(product_id)
		if (product === null || product.user_id !== user_id) {
			throw new NotFoundException('Product not found')
		}
		if (product.variants.length === 0) {
			throw new ConflictException('Product has no variants')
		}
		const mainVariant = product.variants.find(variant => variant.id === main_variant_id)
		if (mainVariant === undefined) {
			throw new NotFoundException('Main variant not found in product variants')
		}

		return { product }
	}

	/**
	 * @throws ConflictException if any of the variants already have a listing for the specified marketplace account
	 */
	private async validateListingUniqueness({
		account_id, variant_ids
	}: IValidateListingUniquenessParams): Promise<void> {
		const listings = await this.marketplaceListingsRepository.findMany({
			account_id,
			variant_id: variant_ids
		})
		if (listings.length > 0) {
			throw new ConflictException(
				`The following variants already have listings for this marketplace account: ${listings.map(l => l.variant_id).join(', ')}`
			)
		}
	}

	/**
	 * Sets the specified variant as the main variant for the product
	 */
	private async updateMainVariant({ product_id, main_variant_id }: IUpdateMainVariantParams): Promise<void> {
		// There can only be one main variant per product
		await this.variantsRepository.updateMany(product_id, { is_primary: false })
		await this.variantsRepository.update(main_variant_id, { is_primary: true })
	}

	private async enqueuePublishListingJob({
		product_id, listing_ids
	}: IEnqueuePublishListingJobParams): Promise<void> {
		await this.queueAdapter.addJob({
			id: `publish-listing-${product_id}`,
			name: 'publish-marketplace-listings',
			data: { listing_ids }
		})
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-listings/BulkCreateMarketplaceListingsRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		product_id: Type.String(),
		main_variant_id: Type.String({ description: 'The variant to be used as the main product' }),
		account_id: Type.String()
	})

	protected schema = Validator.schema
}

type IValidateAccountParams = Pick<T, 'user_id' | 'account_id'>

type ILoadAndValidateProductParams = Pick<T, 'user_id' | 'product_id' | 'main_variant_id'>
type ILoadAndValidateProductResponse = {
	product: { variants: IVariant[] } & IProduct
}

type IValidateListingUniquenessParams = {
	account_id: string
	variant_ids: string[]
}

type IUpdateMainVariantParams = Pick<T, 'product_id' | 'main_variant_id'>

type IEnqueuePublishListingJobParams = {
	product_id: string
	listing_ids: string[]
}