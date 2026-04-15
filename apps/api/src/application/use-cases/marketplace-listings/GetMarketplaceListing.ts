import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceAccount, IMarketplaceListing, IMarketplaceProvider, IVariant } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { IMarketplaceListingsRepository, MarketplaceListingsRepositorySymbol } from '@repositories/IMarketplaceListingsRepository'

import { omitKeys } from '@utils/objects'
import { marketplaceListingJsonSchema, providerEnumSchema, variantJsonSchema } from '@utils/typebox'

type GetMarketplaceListingRequest = {
	id: string
	user_id: string
}
type T = GetMarketplaceListingRequest
type GetMarketplaceListingResponse = {
	listing: {
		account: {
			provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
		} & Pick<IMarketplaceAccount, 'external_email'>
		variant: Pick<IVariant, 'id' | 'product_id' | 'sku'>
	} & Pick<IMarketplaceListing, 'id' | 'account_id' | 'variant_id' | 'status' | 'last_sync_at' | 'sync_message'>
}
type K = GetMarketplaceListingResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Listings'],
	summary: 'Get marketplace listing',
	description: 'Get a marketplace listing by ID',
	response: Type.Object({
		listing: Type.Intersect([
			Type.Pick(marketplaceListingJsonSchema, ['id', 'account_id', 'variant_id', 'status', 'last_sync_at', 'sync_message']),
			Type.Object({
				account: Type.Object({
					external_email: Type.String(),
					provider: Type.Object({
						provider: Type.Ref(providerEnumSchema.$id),
						display_name: Type.String()
					})
				}),
				variant: Type.Pick(variantJsonSchema, ['id', 'product_id', 'sku'])
			})
		])
	}, { $id: 'marketplace-listings/GetMarketplaceListingResponse' })
})
export class GetMarketplaceListing implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceListingsRepositorySymbol)
		private readonly marketplaceListingsRepository: IMarketplaceListingsRepository
	) {}

	async execute({ id, user_id }: T): Promise<K> {
		const listing = await this.marketplaceListingsRepository.findById(id)
		if (listing === null || listing.account.user_id !== user_id) {
			throw new NotFoundException('Marketplace listing not found')
		}

		return {
			listing: {
				...listing,
				account: omitKeys(listing.account, ['user_id'])
			}
		}
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String()
	})

	protected schema = Validator.schema
}