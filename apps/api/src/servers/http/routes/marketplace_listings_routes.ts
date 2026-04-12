import { registerRoutes } from '@http/utils/routes'

import { BulkCreateMarketplaceListings } from '@use-cases/marketplace-listings/BulkCreateMarketplaceListings'

export const marketplaceListingsRoutes = registerRoutes([
	{
		method: 'post',
		path: '/bulk',
		auth_method: 'any',
		use_case_class: BulkCreateMarketplaceListings
	}
], { group: '/marketplace-listings' })