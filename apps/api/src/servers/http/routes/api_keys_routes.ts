import { registerRoutes } from '@utils/fastify/routes'

import { CreateApiKey, DeleteApiKey, ListApiKeys } from '@use-cases/api-keys'

export const apiKeysRoutes = registerRoutes([
	{
		method: 'get',
		path: '/api-keys',
		auth_method: 'jwt',
		use_case_class: ListApiKeys
	},
	{
		method: 'post',
		path: '/api-keys',
		auth_method: 'jwt',
		use_case_class: CreateApiKey
	},
	{
		method: 'delete',
		path: '/api-keys/:public_key',
		auth_method: 'jwt',
		use_case_class: DeleteApiKey
	}
])