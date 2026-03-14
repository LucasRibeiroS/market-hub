import { registerRoutes } from '@http/utils/routes'

import {
	CreateMarketplaceAccount,
	DeleteMarketplaceAccount,
	GetMarketplaceAccount,
	ListMarketplaceAccounts,
	ReAuthenticateMarketplaceAccount,
	UpdateMarketplaceAccount
} from '@use-cases/marketplace-accounts'

export const marketplaceAccountRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'jwt',
		use_case_class: ListMarketplaceAccounts
	},
	{
		method: 'post',
		path: '/',
		auth_method: 'jwt',
		use_case_class: CreateMarketplaceAccount
	},
	{
		method: 'get',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: GetMarketplaceAccount
	},
	{
		method: 'patch',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: UpdateMarketplaceAccount,
		handler_options: { separate_request_data: true }
	},
	{
		method: 'put',
		path: '/:id/credentials',
		auth_method: 'jwt',
		use_case_class: ReAuthenticateMarketplaceAccount,
		handler_options: { separate_request_data: true }
	},
	{
		method: 'delete',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: DeleteMarketplaceAccount
	}
], { group: '/marketplace-accounts' })