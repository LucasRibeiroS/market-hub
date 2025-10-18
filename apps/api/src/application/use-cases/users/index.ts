import { UseCaseFactory } from '@utils/use_case'

import { DrizzleUsersRepository } from '@repositories/implementations'

import { GetUser } from './GetUser'

export const getUser = UseCaseFactory.create(
	new GetUser(new DrizzleUsersRepository())
)