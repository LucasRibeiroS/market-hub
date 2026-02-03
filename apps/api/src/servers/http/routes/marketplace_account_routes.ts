import { CreateMarketplaceAccount } from '@use-cases/marketplace-accounts'
import { registerRoutes } from '@utils/fastify/routes'

export const marketplaceAccountRoutes = registerRoutes([
	{
		method: 'post',
		path: '/',
		auth_method: 'jwt',
		use_case_class: CreateMarketplaceAccount,
		swagger_options: { hide: true }
	}
], { group: '/marketplace-accounts' })