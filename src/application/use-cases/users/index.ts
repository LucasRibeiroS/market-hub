import { UseCaseHandler } from '@utils/use_case'

import { DrizzleUsersRepository } from '@repositories/implementations'

import { GetUser, GetUserValidator } from './GetUser'

export const getUser = new UseCaseHandler(
	new GetUser(new DrizzleUsersRepository()),
	new GetUserValidator()
)