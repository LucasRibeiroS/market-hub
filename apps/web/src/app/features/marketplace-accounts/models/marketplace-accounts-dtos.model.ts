import { IMarketplaceAccount, IMarketplaceProvider, Provider } from '@features/marketplace-accounts/models/marketplace-account.model'

import { IPagination, IPaginator } from '@shared/utils/pagination'

export type ListMarketplaceAccountsRequest = IPaginator
export type ListMarketplaceAccountsResponse = {
	accounts: Array<{
		provider: Pick<IMarketplaceProvider, 'provider' | 'display_name'>
	} & IMarketplaceAccount>
	pagination: IPagination
}

export type CreateMarketplaceAccountRequest = {
	user_id: string
	provider: Provider
	code: string // The code received from the marketplace after the user authorizes our app.
}
export type CreateMarketplaceAccountResponse = {
	account: IMarketplaceAccount
}