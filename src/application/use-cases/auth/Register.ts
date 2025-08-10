import { genSalt, hash } from 'bcrypt'
import { Type } from '@sinclair/typebox'

import { IUsersRepository } from '@repositories/IUsersRepository'

import { generateAppTokens } from '@utils/jwt'
import { ConflictException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'
import { appTokensJsonSchema } from '@utils/typebox/schema'

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

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Register',
	description: 'Register user, returning access and refresh tokens',
	is_public: true,
	response: Type.Object({
		tokens: Type.Ref(appTokensJsonSchema.$id)
	}, { $id: 'auth/RegisterResponse' })
})
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

@Documentation({
	request: { ...Validator.schema, $id: 'auth/RegisterRequest' }
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		name: Type.String({ minLength: 3, maxLength: 255 }),
		email: Type.String({ format: 'email' }),
		password: Type.String({ minLength: 8, maxLength: 128 })
	})

	protected $id = 'auth/RegisterValidator'
	protected schema = Validator.schema
}