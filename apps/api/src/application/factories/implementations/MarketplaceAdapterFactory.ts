import { injectable, injectAll } from 'tsyringe'

import { Provider } from '@integrator-packages/database/entities'

import { IMarketplaceAdapter, MarketplaceAdapterSymbol } from '@adapters/IMarketplaceAdapter'

import { IMarketplaceAdapterFactory } from '@factories/IMarketplaceAdapterFactory'

@injectable()
export class MarketplaceAdapterFactory implements IMarketplaceAdapterFactory {
	private readonly registry: Map<Provider, IMarketplaceAdapter>

	constructor(
		@injectAll(MarketplaceAdapterSymbol) adapters: IMarketplaceAdapter[]
	) {
		this.registry = new Map(adapters.map(a => [a.provider, a]))
	}

	get(provider: Provider): IMarketplaceAdapter {
		const adapter = this.registry.get(provider)
		if (!adapter) {
			throw new Error(`No adapter registered for provider: ${provider}`)
		}
		return adapter
	}
}