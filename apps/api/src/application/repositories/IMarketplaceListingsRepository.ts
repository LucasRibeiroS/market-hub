import { IMarketplaceAccount, IMarketplaceListing, IMarketplaceProvider, IProduct, IVariant, ListingStatus, Provider } from '@integrator-packages/database/entities'

import { IPagination, IPaginator } from '@utils/pagination'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
	account_id?: string
	product_id?: string
	status?: ListingStatus
	provider?: Provider
} & IPaginator
export type IFindManyResponse = {
	data: Array<{
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

export type IFindManyForPublishParams = Partial<{
	id: string[]
	account_id: string
	variant_id: string[]
}>
export type IFindManyForPublishResponse = Array<{
	variant: {
		product: IProduct
	} & IVariant
} & IMarketplaceListing>

export type IFindByIdResponse = {
	account: {
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & Pick<IMarketplaceAccount, 'user_id' | 'external_email' | 'status'>
	variant: Pick<IVariant, 'id' | 'product_id' | 'sku'>
} & Pick<
	IMarketplaceListing,
	| 'id'
	| 'account_id'
	| 'variant_id'
	| 'status'
	| 'last_sync_at'
	| 'sync_message'
>

export type ICountParams = {
	user_id: string
	account_id?: string
	product_id?: string
	status?: ListingStatus
	provider?: Provider
}

export type ICreateManyParams = CustomOmit<IMarketplaceListing, 'id'>[]

export type IUpdateParams = Partial<CustomOmit<IMarketplaceListing, 'id'>>

export interface IMarketplaceListingsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findManyForPublish(params: IFindManyForPublishParams): Promise<IFindManyForPublishResponse>
	findById(id: string): Promise<IFindByIdResponse | null>
	count(params: ICountParams): Promise<number>
	createMany(params: ICreateManyParams): Promise<IMarketplaceListing[]>
	update(id: string, params: IUpdateParams): Promise<void>
	updateMany(ids: string[], params: IUpdateParams): Promise<void>
}

export const MarketplaceListingsRepositorySymbol = Symbol('IMarketplaceListingsRepository')