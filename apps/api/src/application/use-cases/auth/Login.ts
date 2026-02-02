import { inject, injectable } from 'tsyringe'
import { compare } from 'bcrypt'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { UnauthorizedException } from '@integrator-packages/use-case/exceptions'

import { IUsersRepository, UsersRepositorySymbol } from '@repositories/IUsersRepository'

import { generateAppTokens } from '@utils/jwt'
import { appTokensJsonSchema } from '@utils/typebox'

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

@injectable()
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
	constructor(@inject(UsersRepositorySymbol) private usersRepository: IUsersRepository) {}

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
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		email: Type.String({ format: 'email' }),
		password: Type.String({ minLength: 8, maxLength: 128 })
	})

	protected $id = 'auth/LoginValidator'
	protected schema = Validator.schema
}