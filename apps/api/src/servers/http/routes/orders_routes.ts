import { registerRoutes } from '@http/utils/routes'

import { ListOrders } from '@use-cases/orders'

export const ordersRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'any',
		use_case_class: ListOrders
	}
], { group: '/orders' })