import { compare } from 'bcrypt'
import { Type } from '@sinclair/typebox'

import { IUsersRepository } from '@repositories/IUsersRepository'

import { generateAppTokens } from '@utils/jwt'
import { UnauthorizedException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'
import { appTokensJsonSchema } from '@utils/typebox/schema'

type LoginRequest = {
	email: string
	password: string
}
type T = LoginRequest
type LoginResponse = {
	tokens: {
		access_token: string
		refresh_token: string
	}
}
type K = LoginResponse

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Login',
	description: 'Login with email and password, returning access and refresh tokens',
	is_public: true,
	response: Type.Object({
		tokens: Type.Ref(appTokensJsonSchema.$id)
	}, { $id: 'auth/LoginResponse' })
})
export class Login implements IUseCase<T, K> {
	constructor(private usersRepository: IUsersRepository) {}

	async execute({ email, password }: T): Promise<K> {
		const user = await this.usersRepository.findFirst({ email })
		if (user === null) {
			throw new UnauthorizedException()
		}
		if (!await compare(password, user.password)) {
			throw new UnauthorizedException()
		}

		const { accessToken, refreshToken } = generateAppTokens({ id: user.id })

		return {
			tokens: {
				access_token: accessToken,
				refresh_token: refreshToken
			}
		}
	}
}

@Documentation({
	request: { ...Validator.schema, $id: 'auth/LoginRequest' }
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		email: Type.String({ format: 'email' }),
		password: Type.String({ minLength: 8, maxLength: 128 })
	})

	protected $id = 'auth/LoginValidator'
	protected schema = Validator.schema
}