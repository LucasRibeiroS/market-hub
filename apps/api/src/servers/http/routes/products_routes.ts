import { registerRoutes } from '@http/utils/routes'

import { CreateProduct, GetProduct, ListProducts } from '@use-cases/products'

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
	}
], { group: '/products' })