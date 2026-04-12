import { registerRoutes } from '@http/utils/routes'

import { CreateProduct, GetProduct, GetProductRequiredAttributes, ListProducts, UpdateProduct } from '@use-cases/products'

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
		method: 'get',
		path: '/:id/required-attributes',
		auth_method: 'any',
		use_case_class: GetProductRequiredAttributes
	},
	{
		method: 'patch',
		path: '/:id',
		auth_method: 'any',
		use_case_class: UpdateProduct,
		handler_options: { separate_request_data: true }
	}
], { group: '/products' })