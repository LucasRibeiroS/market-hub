import { registerRoutes } from '@utils/fastify/routes'

import { getUser } from '@use-cases/users'

export const usersRoutes = registerRoutes([
	{
		method: 'get',
		path: '/users/me',
		auth_method: 'any',
		use_case: getUser
	}
])