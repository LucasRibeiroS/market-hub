import { IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

export type IFindFirstParams = {
	provider: Provider
	is_active: boolean
}

export interface IMarketplaceProvidersRepository {
	findFirst(params: IFindFirstParams): Promise<IMarketplaceProvider | null>
}

export const MarketplaceProvidersRepositorySymbol = Symbol('IMarketplaceProvidersRepository')