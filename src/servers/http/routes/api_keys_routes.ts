import { registerRoutes } from '@utils/fastify/routes'

import { createApiKey, deleteApiKey, listApiKeys } from '@use-cases/api-keys'

export const apiKeysRoutes = registerRoutes([
	{
		method: 'get',
		path: '/api-keys',
		auth_method: 'jwt',
		use_case: listApiKeys
	},
	{
		method: 'post',
		path: '/api-keys',
		auth_method: 'jwt',
		use_case: createApiKey
	},
	{
		method: 'delete',
		path: '/api-keys/:public_key',
		auth_method: 'jwt',
		use_case: deleteApiKey
	}
])