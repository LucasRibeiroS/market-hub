import { UseCaseHandler } from '@utils/use_case'

import { DrizzlePasswordResetsRepository, DrizzleUsersRepository } from '@repositories/implementations'
import { SmtpEmailAdapter } from '@adapters/implementations'

import { Register, RegisterValidator } from './Register'
import { Login, LoginValidator } from './Login'
import { GenerateAccessToken, GenerateAccessTokenValidator } from './GenerateAccessToken'
import { CreatePasswordReset, CreatePasswordResetValidator } from './CreatePasswordReset'
import { ResetPassword, ResetPasswordValidator } from './ResetPassword'

export const register = new UseCaseHandler(
	new Register(new DrizzleUsersRepository()),
	new RegisterValidator()
)

export const login = new UseCaseHandler(
	new Login(new DrizzleUsersRepository()),
	new LoginValidator()
)

export const generateAccessToken = new UseCaseHandler(
	new GenerateAccessToken(),
	new GenerateAccessTokenValidator()
)

export const createPasswordReset = new UseCaseHandler(
	new CreatePasswordReset(
		new DrizzlePasswordResetsRepository(),
		new DrizzleUsersRepository(),
		new SmtpEmailAdapter()
	),
	new CreatePasswordResetValidator()
)

export const resetPassword = new UseCaseHandler(
	new ResetPassword(
		new DrizzlePasswordResetsRepository(),
		new DrizzleUsersRepository()
	),
	new ResetPasswordValidator()
)