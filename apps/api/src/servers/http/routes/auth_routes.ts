import { registerRoutes } from '@utils/fastify/routes'

import { createPasswordReset, generateAccessToken, login, register, resetPassword } from '@use-cases/auth'

export const authRoutes = registerRoutes([
	{
		method: 'post',
		path: '/auth/register',
		use_case: register
	},
	{
		method: 'post',
		path: '/auth/login',
		use_case: login
	},
	{
		method: 'post',
		path: '/auth/generate-access-token',
		use_case: generateAccessToken
	},
	{
		method: 'post',
		path: '/auth/password/code',
		use_case: createPasswordReset
	},
	{
		method: 'post',
		path: '/auth/password/reset',
		use_case: resetPassword
	}
])