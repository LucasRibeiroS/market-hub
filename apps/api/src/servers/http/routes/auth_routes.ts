import { registerRoutes } from '@utils/fastify/routes'

import { CreatePasswordReset, GenerateAccessToken, Login, Register, ResetPassword } from '@use-cases/auth'

export const authRoutes = registerRoutes([
	{
		method: 'post',
		path: '/auth/register',
		use_case_class: Register
	},
	{
		method: 'post',
		path: '/auth/login',
		use_case_class: Login
	},
	{
		method: 'post',
		path: '/auth/generate-access-token',
		use_case_class: GenerateAccessToken

	},
	{
		method: 'post',
		path: '/auth/password/code',
		use_case_class: CreatePasswordReset
	},
	{
		method: 'post',
		path: '/auth/password/reset',
		use_case_class: ResetPassword
	}
])