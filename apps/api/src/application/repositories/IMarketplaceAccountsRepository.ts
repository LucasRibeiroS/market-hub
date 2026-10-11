import { AccountStatus, IMarketplaceAccount, IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

import { IPagination, IPaginator } from '@utils/pagination'
import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
} & IPaginator

export type IFindManyResponse = {
	data: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount>
	pagination: IPagination
}

export type IFindManyWithDistinctProvidersParams = {
	user_id: string
	status: AccountStatus
	provider?: Provider[]
}
export type IFindManyWithDistinctProvidersResponse = Array<{
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	provider: Pick<IMarketplaceProvider, 'provider' | 'base_url'>
} & IMarketplaceAccount>

export type IFindByIdResponse = {
	provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
} & IMarketplaceAccount

export type IFindByIdSimplifiedResponse = Pick<IMarketplaceAccount, 'id' | 'user_id' | 'provider_id' | 'status'>

export type IFindFirstByExternalIdResponse = Pick<IMarketplaceAccount, 'id' | 'user_id'>

export type ICountParams = {
	user_id: string
}

export type ICreateParams = CustomOmit<IMarketplaceAccount, 'id' | 'created_at' | 'updated_at'>

export type IUpdateParams = Partial<
	CustomOmit<IMarketplaceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>

export interface IMarketplaceAccountsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	/** A method that will not return a provider more than once */
	findManyWithDistinctProviders(
		params: IFindManyWithDistinctProvidersParams
	): Promise<IFindManyWithDistinctProvidersResponse>
	findById(id: string): Promise<IFindByIdResponse | null>
	findByIdSimplified(id: string): Promise<IFindByIdSimplifiedResponse | null>
	findFirstByExternalId(external_id: string): Promise<IFindFirstByExternalIdResponse | null>
	findManyIdsByStatus(status: AccountStatus): Promise<string[]>
	count(params: ICountParams): Promise<number>
	create(params: ICreateParams): Promise<IMarketplaceAccount>
	update(id: string, data: IUpdateParams): Promise<IMarketplaceAccount>
	delete(id: string): Promise<void>
}

export const MarketplaceAccountsRepositorySymbol = Symbol('IMarketplaceAccountsRepository')