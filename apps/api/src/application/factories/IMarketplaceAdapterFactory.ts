import { Provider } from '@integrator-packages/database/entities'

import { IMarketplaceAdapter } from '@adapters/IMarketplaceAdapter'

export interface IMarketplaceAdapterFactory {
	get(provider: Provider): IMarketplaceAdapter
}

export const MarketplaceAdapterFactorySymbol = Symbol('MarketplaceAdapterFactory')