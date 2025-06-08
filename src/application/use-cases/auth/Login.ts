import bcrypt from 'bcrypt'
import { Static, Type } from '@sinclair/typebox'

import { IUsersRepository } from '@repositories/IUsersRepository'

import { assertTypes } from '@utils/types'
import { generateAppTokens } from '@utils/jwt'
import { UnauthorizedException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { appTokensJsonSchema, createSchema } from '@utils/typebox/schema'

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

export class Login implements IUseCase<T, K> {
	constructor(private usersRepository: IUsersRepository) {}

	async execute({ email, password }: T): Promise<K> {
		const user = await this.usersRepository.findFirst({ email })
		if (user === null) {
			throw new UnauthorizedException()
		}
		if (!await bcrypt.compare(password, user.password)) {
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

	documentation = {
		tags: ['Authentication'],
		summary: 'Login',
		description: 'Login with email and password, returning access and refresh tokens',
		response: Type.Object({
			tokens: Type.Ref(appTokensJsonSchema.$id)
		}, { $id: 'auth/LoginResponse' })
	}
}

export class LoginValidator extends BaseValidator<T> {
	protected schema = createSchema(Type.Object({
		email: Type.String({ format: 'email' }),
		password: Type.String({ minLength: 8, maxLength: 128 })
	}), 'auth/LoginValidator')

	constructor() {
		super()
		assertTypes<T, Static<typeof this.schema>>()
	}

	documentation = {
		request: { ...this.schema, $id: 'auth/LoginRequest' }
	}
}