import { AccountStatus, IMarketplaceAccount } from '@features/marketplace-accounts/models/marketplace-account.model'
import { IMarketplaceProvider, Provider } from '@features/marketplace-accounts/models/marketplace-provider.model'

import { IPagination, IPaginator } from '@shared/utils/pagination'

export type ListMarketplaceAccountsRequest = IPaginator
export type ListMarketplaceAccountsResponse = {
	accounts: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount>
	pagination: IPagination
}

export type GetMarketplaceAccountResponse = {
	account: {
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount
}

export type CreateMarketplaceAccountRequest = {
	provider: Provider
	code: string
}
export type CreateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}

export type UpdateMarketplaceAccountRequest = {
	status: AccountStatus
}
export type UpdateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}

export type DeleteMarketplaceAccountRequest = { id: string }

export type ReAuthenticateMarketplaceAccountRequest = {
	code: string
}
export type ReAuthenticateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}

export type ListMarketplaceProvidersResponse = {
	providers: Pick<IMarketplaceProvider, 'provider' | 'display_name' | 'auth_url'>[]
}