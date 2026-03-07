import { IMarketplaceAccount } from '@features/marketplace-accounts/models/marketplace-account.model'
import { IMarketplaceProvider, Provider } from '@features/marketplace-accounts/models/marketplace-provider.model'

import { IPagination, IPaginator } from '@shared/utils/pagination'

export type ListMarketplaceAccountsRequest = IPaginator
export type ListMarketplaceAccountsResponse = {
	accounts: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount>
	pagination: IPagination
}

export type CreateMarketplaceAccountRequest = {
	provider: Provider
	code: string
}
export type CreateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}

export type ListMarketplaceProvidersResponse = {
	providers: Pick<IMarketplaceProvider, 'provider' | 'display_name' | 'auth_url'>[]
}