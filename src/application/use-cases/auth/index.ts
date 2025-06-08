import { UseCaseHandler } from '@utils/use_case'

import { DrizzleUsersRepository } from '@repositories/implementations'

import { Register, RegisterValidator } from './Register'
import { Login, LoginValidator } from './Login'
import { GenerateAccessToken, GenerateAccessTokenValidator } from './GenerateAccessToken'

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