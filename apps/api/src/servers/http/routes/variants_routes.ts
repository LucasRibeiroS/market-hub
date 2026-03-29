import { registerRoutes } from '@http/utils/routes'

import { BulkCreateVariants, BulkDeleteVariants, GetVariantBySku } from '@use-cases/variants'

export const variantsRoutes = registerRoutes([
	{
		method: 'get',
		path: '/variants/:sku',
		auth_method: 'any',
		use_case_class: GetVariantBySku
	},
	{
		method: 'post',
		path: '/products/:product_id/variants/bulk',
		auth_method: 'any',
		use_case_class: BulkCreateVariants
	},
	{
		method: 'post',
		path: '/products/:product_id/variants/bulk/delete',
		auth_method: 'any',
		use_case_class: BulkDeleteVariants
	}
])