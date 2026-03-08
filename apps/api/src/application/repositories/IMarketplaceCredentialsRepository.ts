import { IMarketplaceCredential, IMarketplaceProvider } from '@integrator-packages/database/entities'
import { CustomOmit } from '@utils/types'

export type IFindFirstParams = {
	account_id: string
}
export type IFindFirstResponse = {
	account: { provider: IMarketplaceProvider }
} & IMarketplaceCredential

export type ICreateParams = CustomOmit<IMarketplaceCredential, 'id'>

export type IUpdateParams = Partial<
	CustomOmit<IMarketplaceCredential, 'id'>
>

export interface IMarketplaceCredentialsRepository {
	findFirst(params: IFindFirstParams): Promise<IFindFirstResponse | null>
	create(params: ICreateParams): Promise<IMarketplaceCredential>
	update(id: string, params: IUpdateParams): Promise<void>
}

export const MarketplaceCredentialsRepositorySymbol = Symbol('IMarketplaceCredentialsRepository')