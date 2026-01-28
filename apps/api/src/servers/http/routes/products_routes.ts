import { registerRoutes } from '@utils/fastify/routes'

import { CreateProduct, ListProducts } from '@use-cases/products'
import { CreateManyVariants } from '@use-cases/variants'

export const productsRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'any',
		use_case_class: ListProducts
	},
	{
		method: 'post',
		path: '/',
		auth_method: 'any',
		use_case_class: CreateProduct
	},
	{
		method: 'post',
		path: '/:product_id/variants',
		auth_method: 'any',
		use_case_class: CreateManyVariants
	}
], { group: '/products' })