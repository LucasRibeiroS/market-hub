import { Type } from '@sinclair/typebox'

import { IUser } from '@entities'
import { IUsersRepository } from '@repositories/IUsersRepository'

import { CustomOmit } from '@utils/types'
import { NotFoundException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'
import { userJsonSchema } from '@utils/typebox/schema'

type GetUserRequest = { user_id: string }
type T = GetUserRequest
type GetUserResponse = {
	user: CustomOmit<IUser, 'password'>
}
type K = GetUserResponse

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
	constructor(private usersRepository: IUsersRepository) {}

	async execute({ user_id }: T): Promise<K> {
		const user = await this.usersRepository.findById(user_id)
		if (user === null) {
			throw new NotFoundException('User not found')
		}

		return { user }
	}
}

export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String()
	})

	protected $id = 'users/GetUserValidator'
	protected schema = Validator.schema
}