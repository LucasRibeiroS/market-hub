import { registerRoutes } from '@http/utils/routes'

import { BulkCreateMarketplaceListings } from '@use-cases/marketplace-listings/BulkCreateMarketplaceListings'
import { GetMarketplaceListing } from '@use-cases/marketplace-listings/GetMarketplaceListing'
import { ListMarketplaceListings } from '@use-cases/marketplace-listings/ListMarketplaceListings'

export const marketplaceListingsRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'api_key',
		use_case_class: ListMarketplaceListings
	},
	{
		method: 'get',
		path: '/:id',
		auth_method: 'api_key',
		use_case_class: GetMarketplaceListing
	},
	{
		method: 'post',
		path: '/bulk',
		auth_method: 'api_key',
		use_case_class: BulkCreateMarketplaceListings
	}
], { group: '/marketplace-listings' })