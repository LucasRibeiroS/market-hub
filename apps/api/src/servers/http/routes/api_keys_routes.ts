import { registerRoutes } from '@utils/fastify/routes'

import { CreateApiKey, DeleteApiKey, GetApiKey, ListApiKeys, UpdateApiKey } from '@use-cases/api-keys'

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
		method: 'get',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: GetApiKey
	},
	{
		method: 'patch',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: UpdateApiKey,
		handler_options: { separate_request_data: true }
	},
	{
		method: 'delete',
		path: '/:id',
		auth_method: 'jwt',
		use_case_class: DeleteApiKey
	}
], { group: '/api-keys' })