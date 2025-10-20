import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUser } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IUsersRepository, UsersRepositorySymbol } from '@repositories/IUsersRepository'

import { CustomOmit } from '@utils/types'
import { userJsonSchema } from '@utils/typebox/schema'

type GetUserRequest = { user_id: string }
type T = GetUserRequest
type GetUserResponse = {
	user: CustomOmit<IUser, 'password'>
}
type K = GetUserResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Users'],
	summary: 'Get user info',
	description: 'Get the logged user info',
	response: Type.Object({
		user: Type.Ref(userJsonSchema.$id)
	}, { $id: 'users/GetUserResponse' })
})
export class GetUser implements IUseCase<T, K> {
	constructor(@inject(UsersRepositorySymbol) private usersRepository: IUsersRepository) {}

	async execute({ user_id }: T): Promise<K> {
		const user = await this.usersRepository.findById(user_id)
		if (user === null) {
			throw new NotFoundException('User not found')
		}

		return { user }
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String()
	})

	protected $id = 'users/GetUserValidator'
	protected schema = Validator.schema
}