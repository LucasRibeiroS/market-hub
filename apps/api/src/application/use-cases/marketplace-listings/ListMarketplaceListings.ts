import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceAccount, IMarketplaceListing, IMarketplaceProvider, IVariant, ListingStatus, Provider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { IMarketplaceListingsRepository, MarketplaceListingsRepositorySymbol } from '@repositories/IMarketplaceListingsRepository'

import { IPagination, IPaginator } from '@utils/pagination'
import { accountStatusEnumSchema, listingStatusEnumSchema, marketplaceListingJsonSchema, paginationJsonSchema, paginatorJsonSchema, providerEnumSchema, variantJsonSchema } from '@utils/typebox'

type ListMarketplaceListingsRequest = {
	user_id: string
	account_id?: string
	product_id?: string
	status?: ListingStatus
	provider?: Provider
} & IPaginator
type T = ListMarketplaceListingsRequest
type ListMarketplaceListingsResponse = {
	listings: Array<{
		account: {
			provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
		} & Pick<IMarketplaceAccount, 'external_email' | 'status'>
		variant: Pick<IVariant, 'id' | 'product_id' | 'sku'>
	} & Pick<
		IMarketplaceListing,
        | 'id'
        | 'account_id'
        | 'variant_id'
        | 'status'
        | 'last_sync_at'
        | 'sync_message'
	>>
	pagination: IPagination
}
type K = ListMarketplaceListingsResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Listings'],
	summary: 'List marketplace listings',
	description: 'List marketplace listings for a user with optional filters by account, provider, product and status',
	response: Type.Object({
		listings: Type.Array(
			Type.Intersect([
				Type.Pick(marketplaceListingJsonSchema, ['id', 'account_id', 'variant_id', 'status', 'last_sync_at', 'sync_message']),
				Type.Object({
					account: Type.Object({
						external_email: Type.String(),
						status: Type.Ref(accountStatusEnumSchema.$id),
						provider: Type.Object({
							provider: Type.Ref(providerEnumSchema.$id),
							display_name: Type.String()
						})
					}),
					variant: Type.Pick(variantJsonSchema, ['id', 'product_id', 'sku'])
				})
			])
		),
		pagination: Type.Ref(paginationJsonSchema.$id)
	}, { $id: 'marketplace-listings/ListMarketplaceListingsResponse' })
})
export class ListMarketplaceListings implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceListingsRepositorySymbol)
		private readonly marketplaceListingsRepository: IMarketplaceListingsRepository
	) {}

	async execute(params: T): Promise<K> {
		const { data: listings, pagination } = await this.marketplaceListingsRepository.findMany(params)
		return { listings, pagination }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-listings/ListMarketplaceListingsRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({
			user_id: Type.String(),
			account_id: Type.Optional(Type.String()),
			product_id: Type.Optional(Type.String()),
			provider: Type.Optional(Type.Ref(providerEnumSchema.$id)),
			status: Type.Optional(Type.Ref(listingStatusEnumSchema.$id))
		}),
		paginatorJsonSchema
	])

	protected schema = Validator.schema
}