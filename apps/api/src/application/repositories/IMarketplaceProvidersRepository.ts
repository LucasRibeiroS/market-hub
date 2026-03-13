import { IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

export type IFindManyParams = {
	is_active: boolean
}

export type IFindFirstParams = {
	provider: Provider
	is_active: boolean
}

export interface IMarketplaceProvidersRepository {
	findMany(params: IFindManyParams): Promise<IMarketplaceProvider[]>
	findFirst(params: IFindFirstParams): Promise<IMarketplaceProvider | null>
	findById(id: string): Promise<IMarketplaceProvider | null>
}

export const MarketplaceProvidersRepositorySymbol = Symbol('IMarketplaceProvidersRepository')