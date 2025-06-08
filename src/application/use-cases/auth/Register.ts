import bcrypt from 'bcrypt'
import { Static, Type } from '@sinclair/typebox'

import { IUsersRepository } from '@repositories/IUsersRepository'

import { assertTypes } from '@utils/types'
import { generateAppTokens } from '@utils/jwt'
import { ConflictException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { appTokensJsonSchema, createSchema } from '@utils/typebox/schema'

type RegisterRequest = {
	email: string
	password: string
}
type T = RegisterRequest
type RegisterResponse = {
	tokens: {
		access_token: string
		refresh_token: string
	}
}
type K = RegisterResponse

export class Register implements IUseCase<T, K> {
	constructor(private usersRepository: IUsersRepository) {}

	async execute({ email, password }: T): Promise<K> {
		const userExists = await this.usersRepository.findFirst({ email })
		if (userExists !== null) {
			throw new ConflictException('Email already in use')
		}

		const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12))

		const user = await this.usersRepository.create({
			email,
			password: passwordHash
		})

		const { accessToken, refreshToken } = generateAppTokens({ id: user.id })

		return {
			tokens: {
				access_token: accessToken,
				refresh_token: refreshToken
			}
		}
	}

	documentation = {
		tags: ['Authentication'],
		summary: 'Register',
		description: 'Register user, returning access and refresh tokens',
		response: Type.Object({
			tokens: Type.Ref(appTokensJsonSchema.$id)
		}, { $id: 'auth/RegisterResponse' })
	}
}

export class RegisterValidator extends BaseValidator<T> {
	protected schema = createSchema(Type.Object({
		email: Type.String({ format: 'email' }),
		password: Type.String({ minLength: 8, maxLength: 128 })
	}), 'auth/RegisterValidator')

	constructor() {
		super()
		assertTypes<T, Static<typeof this.schema>>()
	}

	documentation = {
		request: Type.Pick(this.schema, ['email', 'password'], { $id: 'auth/RegisterRequest' })
	}
}