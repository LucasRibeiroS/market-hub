import { registerRoutes } from '@http/utils/routes'

import {
	CreateMarketplaceAccount,
	DeleteMarketplaceAccount,
	GetMarketplaceAccount,
	GetMarketplaceAccountRequiredAttributes,
	ListMarketplaceAccounts,
	ReAuthenticateMarketplaceAccount,
	UpdateMarketplaceAccount
} from '@use-cases/marketplace-accounts'
import { RefreshMarketplaceCredential } from '@use-cases/marketplace-credentials'

export const marketplaceAccountRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'any',
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
		auth_method: 'any',
		use_case_class: GetMarketplaceAccount
	},
	{
		method: 'get',
		path: '/:id/required-attributes',
		auth_method: 'any',
		use_case_class: GetMarketplaceAccountRequiredAttributes
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
		method: 'post',
		path: '/:id/refresh-credentials',
		auth_method: 'jwt',
		use_case_class: RefreshMarketplaceCredential,
		handler_options: { map_params: (params) => ({ account_id: params.id }) }
	},
	{
		method: 'delete',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: DeleteMarketplaceAccount
	}
], { group: '/marketplace-accounts' })