import { UseCaseFactory } from '@utils/use_case'

import { DrizzlePasswordResetsRepository, DrizzleUsersRepository } from '@repositories/implementations'
import { SmtpEmailAdapter } from '@adapters/implementations'

import { Register } from './Register'
import { Login } from './Login'
import { GenerateAccessToken } from './GenerateAccessToken'
import { CreatePasswordReset } from './CreatePasswordReset'
import { ResetPassword } from './ResetPassword'

export const register = UseCaseFactory.create(
	new Register(new DrizzleUsersRepository())
)

export const login = UseCaseFactory.create(
	new Login(new DrizzleUsersRepository())
)

export const generateAccessToken = UseCaseFactory.create(new GenerateAccessToken())

export const createPasswordReset = UseCaseFactory.create(
	new CreatePasswordReset(
		new DrizzlePasswordResetsRepository(),
		new DrizzleUsersRepository(),
		new SmtpEmailAdapter()
	)
)

export const resetPassword = UseCaseFactory.create(
	new ResetPassword(
		new DrizzlePasswordResetsRepository(),
		new DrizzleUsersRepository()
	)
)