import { IMarketplaceAccount, IMarketplaceListing, IMarketplaceProvider, IProduct, IVariant } from '@integrator-packages/database/entities'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = Partial<{
	id: string[]
	account_id: string
	variant_id: string[]
}>
export type IFindManyResponse = Array<{
	variant: {
		product: IProduct
	} & IVariant
} & IMarketplaceListing>

export type IFindByIdResponse = {
	account: { provider: IMarketplaceProvider } & Pick<IMarketplaceAccount, 'status'>
} & IMarketplaceListing

export type ICreateManyParams = CustomOmit<IMarketplaceListing, 'id'>[]

export type IUpdateParams = Partial<
	CustomOmit<IMarketplaceListing, 'id'>
>

export interface IMarketplaceListingsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findById(id: string): Promise<IFindByIdResponse | null>
	createMany(params: ICreateManyParams): Promise<IMarketplaceListing[]>
	update(id: string, params: IUpdateParams): Promise<void>
	updateMany(ids: string[], params: IUpdateParams): Promise<void>
}

export const MarketplaceListingsRepositorySymbol = Symbol('IMarketplaceListingsRepository')