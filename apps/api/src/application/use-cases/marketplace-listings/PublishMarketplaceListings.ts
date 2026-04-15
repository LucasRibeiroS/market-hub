import { inject, injectable } from 'tsyringe'

import { ListingStatusEnum } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IFindManyForPublishResponse as IFindManyListingsResponse, IMarketplaceListingsRepository, MarketplaceListingsRepositorySymbol } from '@repositories/IMarketplaceListingsRepository'
import { IMarketplaceCredentialsRepository, MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'

import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'

import { omitKeys } from '@utils/objects'
import { tryCatch } from '@utils/try_catch'
import { EmptyObject } from '@utils/types'

export type PublishMarketplaceListingsRequest = {
	listing_ids: string[]
}
type PublishMarketplaceListingsResponse = EmptyObject
type T = PublishMarketplaceListingsRequest
type K = PublishMarketplaceListingsResponse

@injectable()
export class PublishMarketplaceListings implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceListingsRepositorySymbol)
		private readonly marketplaceListingsRepository: IMarketplaceListingsRepository,
		@inject(MarketplaceCredentialsRepositorySymbol)
		private readonly marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private readonly marketplaceAdapterFactory: IMarketplaceAdapterFactory
	) {}

	async execute({ listing_ids }: T): Promise<K> {
		const listings = await this.marketplaceListingsRepository.findManyForPublish({ id: listing_ids })
		if (listings.length === 0) {
			throw new NotFoundException('No marketplace listings found for the provided IDs')
		}

		const { account_id } = listings[0]

		const credentials = await this.marketplaceCredentialsRepository.findFirst({ account_id })
		if (credentials === null) {
			throw new NotFoundException('No marketplace credentials found for the provided account ID')
		}

		const adapter = this.marketplaceAdapterFactory.get(credentials.account.provider.provider)

		const [res, err] = await tryCatch(() => adapter.publishProduct({
			credentials: {
				access_token: credentials.access_token,
				token_type: credentials.token_type
			},
			provider: { base_url: credentials.account.provider.base_url },
			product: this.mapListingstoProductWithVariants(listings)
		}))
		if (err !== null) {
			await this.marketplaceListingsRepository.updateMany(listing_ids, {
				status: ListingStatusEnum.error,
				sync_message: err.message
			})
			throw err
		}

		// mapping the response from the marketplace adapter to our internal listing representation and updating the listings with the marketplace IDs and status
		await Promise.allSettled(
			listings.map(listing => {
				const adapterListing = res.listings.find(l => l.variant_id === listing.variant_id)
				if (adapterListing === undefined) {
					return this.marketplaceListingsRepository.update(listing.id, {
						status: ListingStatusEnum.error,
						sync_message: 'Marketplace did not return data for this listing'
					})
				}

				return this.marketplaceListingsRepository.update(listing.id, {
					external_product_id: adapterListing.external_product_id,
					external_variant_id: adapterListing.external_variant_id,
					status: ListingStatusEnum.active,
					last_sync_at: new Date(),
					sync_message: adapterListing.sync_message
				})
			})
		)

		return {}
	}

	private mapListingstoProductWithVariants(listings: IFindManyListingsResponse) {
		// The listing IDs should all belong to the same account and product, because they are created together on BulkCreateMarketplaceListings
		const product = listings[0].variant.product
		const variants = listings.map(listing => omitKeys(listing.variant, ['product']))

		return {
			...product,
			variants
		}
	}
}