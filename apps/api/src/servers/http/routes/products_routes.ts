import { registerRoutes } from '@utils/fastify/routes'

import { CreateProduct, GetProduct, ListProducts } from '@use-cases/products'
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
		method: 'get',
		path: '/:id',
		auth_method: 'any',
		use_case_class: GetProduct
	},
	{
		method: 'post',
		path: '/:id/variants',
		auth_method: 'any',
		use_case_class: CreateManyVariants,
		handler_options: {
			map_params: (params) => ({ product_id: params.id })
		}
	}
], { group: '/products' })