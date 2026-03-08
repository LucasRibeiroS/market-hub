import { registerRoutes } from '@http/utils/routes'

import { GetVariantBySku } from '@use-cases/variants'

export const variantsRoutes = registerRoutes([
	{
		method: 'get',
		path: '/:sku',
		auth_method: 'any',
		use_case_class: GetVariantBySku
	}
], { group: '/variants' })