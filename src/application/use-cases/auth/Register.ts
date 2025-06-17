import { genSalt, hash } from 'bcrypt'
import { Static, Type } from '@sinclair/typebox'

import { IUsersRepository } from '@repositories/IUsersRepository'

import { assertTypes } from '@utils/types'
import { generateAppTokens } from '@utils/jwt'
import { ConflictException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { appTokensJsonSchema, createSchema } from '@utils/typebox/schema'

type RegisterRequest = {
	name: string
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

	async execute({ name, email, password }: T): Promise<K> {
		const userExists = await this.usersRepository.findFirst({ email })
		if (userExists !== null) {
			throw new ConflictException('Email already in use')
		}

		const passwordHash = await hash(password, await genSalt(12))

		const user = await this.usersRepository.create({
			name,
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
		name: Type.String({ minLength: 3, maxLength: 255 }),
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