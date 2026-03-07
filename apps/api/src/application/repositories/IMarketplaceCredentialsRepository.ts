import { IMarketplaceCredential } from '@integrator-packages/database/entities'
import { CustomOmit } from '@utils/types'

export type ICreateParams = CustomOmit<IMarketplaceCredential, 'id'>

export interface IMarketplaceCredentialsRepository {
	create(params: ICreateParams): Promise<IMarketplaceCredential>
}

export const MarketplaceCredentialsRepositorySymbol = Symbol('IMarketplaceCredentialsRepository')