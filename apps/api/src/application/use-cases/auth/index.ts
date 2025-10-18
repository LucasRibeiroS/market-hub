import { container } from 'tsyringe'

import { UseCaseFactory } from '@integrator-packages/use-case'

import { Register } from './Register'
import { Login } from './Login'
import { GenerateAccessToken } from './GenerateAccessToken'
import { CreatePasswordReset } from './CreatePasswordReset'
import { ResetPassword } from './ResetPassword'

export const register = UseCaseFactory.create(container.resolve(Register))
export const login = UseCaseFactory.create(container.resolve(Login))
export const generateAccessToken = UseCaseFactory.create(container.resolve(GenerateAccessToken))
export const createPasswordReset = UseCaseFactory.create(container.resolve(CreatePasswordReset))
export const resetPassword = UseCaseFactory.create(container.resolve(ResetPassword))