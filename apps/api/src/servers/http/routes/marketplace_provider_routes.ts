import { registerRoutes } from '@http/utils/routes'

import { ListMarketplaceProviders } from '@use-cases/marketplace-providers/ListMarketplaceProviders'

export const marketplaceProviderRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'jwt',
		use_case_class: ListMarketplaceProviders
	}
], { group: '/marketplace-providers' })