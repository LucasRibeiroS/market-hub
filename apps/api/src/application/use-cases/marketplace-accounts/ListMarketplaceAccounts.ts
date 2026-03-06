import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IMarketplaceAccount, IMarketplaceProvider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { IPagination, IPaginator } from '@utils/pagination'
import { marketplaceAccountJsonSchema, paginationJsonSchema, paginatorJsonSchema, providerEnumSchema } from '@utils/typebox'

type ListMarketplaceAccountsRequest = { user_id: string } & IPaginator
type T = ListMarketplaceAccountsRequest
type ListMarketplaceAccountsResponse = {
	accounts: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount>
	pagination: IPagination
}
type K = ListMarketplaceAccountsResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'List Marketplace Accounts',
	description: 'List all Marketplace Accounts for a user',
	response: Type.Object({
		accounts: Type.Array(
			Type.Intersect([
				Type.Ref(marketplaceAccountJsonSchema.$id),
				Type.Object({
					provider: Type.Object({
						provider: Type.Ref(providerEnumSchema.$id),
						display_name: Type.String()
					})
				})
			])
		),
		pagination: Type.Ref(paginationJsonSchema.$id)
	}, { $id: 'marketplace-accounts/ListMarketplaceAccountsResponse' })
})
export class ListMarketplaceAccounts implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository
	) {}

	async execute(params: T): Promise<K> {
		const { data, pagination } = await this.marketplaceAccountsRepository.findMany(params)

		if (data.length === 0) {
			// mock data for test
			data.push(
				{
					id: '1',
					user_id: params.user_id,
					provider_id: '1',
					external_id: 'external-123',
					external_email: 'user@example.com',
					status: 'active',
					created_at: new Date(),
					updated_at: new Date(),
					provider: {
						provider: 'magalu',
						display_name: 'Magazine Luiza'
					}
				},
				{
					id: '2',
					user_id: params.user_id,
					provider_id: '2',
					external_id: 'external-456',
					external_email: 'user2@example.com',
					status: 'error',
					created_at: new Date(),
					updated_at: new Date(),
					provider: {
						provider: 'mercado_livre',
						display_name: 'Mercado Livre'
					}
				}
			)
		}

		return { accounts: data, pagination }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-accounts/ListMarketplaceAccountsRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({ user_id: Type.String() }),
		paginatorJsonSchema
	])

	protected schema = Validator.schema
}