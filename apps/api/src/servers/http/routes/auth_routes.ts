import { registerRoutes } from '@utils/fastify/routes'

import { CreatePasswordReset, GenerateAccessToken, Login, Logout, Register, ResetPassword } from '@use-cases/auth'

export const authRoutes = registerRoutes([
	{
		method: 'post',
		path: '/register',
		use_case_class: Register,
		handler_options: { manage_auth_cookies: 'set' }
	},
	{
		method: 'post',
		path: '/login',
		use_case_class: Login,
		handler_options: { manage_auth_cookies: 'set' }
	},
	{
		method: 'post',
		path: '/generate-access-token',
		use_case_class: GenerateAccessToken,
		handler_options: { manage_auth_cookies: 'set' }

	},
	{
		method: 'post',
		path: '/password/code',
		use_case_class: CreatePasswordReset
	},
	{
		method: 'post',
		path: '/password/reset',
		use_case_class: ResetPassword
	},
	{
		method: 'post',
		path: '/logout',
		use_case_class: Logout,
		handler_options: { manage_auth_cookies: 'unset' }
	}
], { group: '/auth' })