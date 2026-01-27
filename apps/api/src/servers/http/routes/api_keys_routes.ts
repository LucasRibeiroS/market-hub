import { registerRoutes } from '@utils/fastify/routes'

import { CreateApiKey, DeleteApiKey, ListApiKeys } from '@use-cases/api-keys'

export const apiKeysRoutes = registerRoutes([
	{
		method: 'get',
		path: '/',
		auth_method: 'jwt',
		use_case_class: ListApiKeys
	},
	{
		method: 'post',
		path: '/',
		auth_method: 'jwt',
		use_case_class: CreateApiKey
	},
	{
		method: 'delete',
		path: '/:public_key',
		auth_method: 'jwt',
		use_case_class: DeleteApiKey
	}
], { group: '/api-keys' })