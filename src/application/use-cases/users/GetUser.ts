import { Static, Type } from '@sinclair/typebox'

import { IUser } from '@entities'
import { IUsersRepository } from '@repositories/IUsersRepository'

import { assertTypes, CustomOmit } from '@utils/types'
import { NotFoundException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { createSchema, userJsonSchema } from '@utils/typebox/schema'

type GetUserRequest = { user_id: string }
type T = GetUserRequest
type GetUserResponse = {
	user: CustomOmit<IUser, 'password'>
}
type K = GetUserResponse

export class GetUser implements IUseCase<T, K> {
	constructor(private usersRepository: IUsersRepository) {}

	async execute({ user_id }: T): Promise<K> {
		const user = await this.usersRepository.findById(user_id)
		if (user === null) {
			throw new NotFoundException('User not found')
		}

		return { user }
	}

	documentation = {
		tags: ['Users'],
		summary: 'Get user info',
		description: 'Get the logged user info',
		response: Type.Object({
			user: Type.Ref(userJsonSchema.$id)
		}, { $id: 'users/GetUserResponse' })
	}
}

export class GetUserValidator extends BaseValidator<T> {
	protected schema = createSchema(Type.Object({
		user_id: Type.String()
	}), 'users/GetUserValidator')

	constructor() {
		super()
		assertTypes<T, Static<typeof this.schema>>()
	}
}