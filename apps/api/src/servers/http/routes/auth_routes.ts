import { registerRoutes } from '@utils/fastify/routes'

import { CreatePasswordReset, GenerateAccessToken, Login, Register, ResetPassword } from '@use-cases/auth'

export const authRoutes = registerRoutes([
	{
		method: 'post',
		path: '/register',
		use_case_class: Register
	},
	{
		method: 'post',
		path: '/login',
		use_case_class: Login
	},
	{
		method: 'post',
		path: '/generate-access-token',
		use_case_class: GenerateAccessToken

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
	}
], { group: '/auth' })