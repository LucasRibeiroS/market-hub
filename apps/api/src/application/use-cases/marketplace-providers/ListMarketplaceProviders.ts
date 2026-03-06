import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceProvider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { IMarketplaceProvidersRepository, MarketplaceProvidersRepositorySymbol } from '@repositories/IMarketplaceProvidersRepository'

import { providerEnumSchema } from '@utils/typebox'

type ListMarketplaceProvidersRequest = never
type T = ListMarketplaceProvidersRequest
type ListMarketplaceProvidersResponse = {
	providers: Pick<IMarketplaceProvider, 'provider' | 'display_name' | 'auth_url'>[]
}
type K = ListMarketplaceProvidersResponse

@injectable()
@Documentation({
	tags: ['Marketplace Providers'],
	summary: 'List Marketplace Providers',
	description: 'List all Marketplace Providers for a user',
	response: Type.Object({
		providers: Type.Array(
			Type.Object({
				provider: Type.Ref(providerEnumSchema.$id),
				display_name: Type.String(),
				auth_url: Type.String()
			})
		)
	}, { $id: 'marketplace-providers/ListMarketplaceProvidersResponse' })
})
export class ListMarketplaceProviders implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceProvidersRepositorySymbol)
		private marketplaceProvidersRepository: IMarketplaceProvidersRepository
	) {}

	async execute(): Promise<K> {
		const providers = await this.marketplaceProvidersRepository.findMany({
			is_active: true
		})

		return {
			providers: providers.map(p => ({
				...p,
				auth_url: this.buildAuthUrl(p)
			}))
		}
	}

	private buildAuthUrl(provider: IMarketplaceProvider): string {
		const url = new URL(provider.auth_url)
		url.searchParams.append('client_id', provider.client_id)
		url.searchParams.append('redirect_uri', provider.redirect_url)
		url.searchParams.append('response_type', 'code')
		return url.toString()
	}
}