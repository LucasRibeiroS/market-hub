import { Static, Type } from '@sinclair/typebox'

import { assertTypes } from '@utils/types'
import { generateAppTokens, verifyRefreshToken } from '@utils/jwt'
import { isHttpException, UnauthorizedException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { appTokensJsonSchema, createSchema } from '@utils/typebox/schema'

type GenerateAccessTokenRequest = {
	refresh_token: string
}
type T = GenerateAccessTokenRequest
type GenerateAccessTokenResponse = {
	tokens: {
		access_token: string
	}
}
type K = GenerateAccessTokenResponse

export class GenerateAccessToken implements IUseCase<T, K> {
	async execute({ refresh_token }: T): Promise<K> {
		try {
			const data = verifyRefreshToken(refresh_token)

			const { accessToken } = generateAppTokens({ id: data.id })

			return {
				tokens: { access_token: accessToken }
			}
		} catch (error) {
			if (isHttpException(error)) {
				throw error
			}
		}

		throw new UnauthorizedException()
	}

	documentation = {
		tags: ['Authentication'],
		summary: 'Generate Access Token',
		description: 'Generate a new access token using a valid refresh token',
		response: Type.Object({
			tokens: Type.Pick(appTokensJsonSchema, ['access_token'])
		}, { $id: 'auth/GenerateAccessTokenResponse' })
	}
}

export class GenerateAccessTokenValidator extends BaseValidator<T> {
	protected schema = createSchema(Type.Object({
		refresh_token: Type.String()
	}), 'auth/GenerateAccessTokenRequest')

	constructor() {
		super()
		assertTypes<T, Static<typeof this.schema>>()
	}

	documentation = {
		request: Type.Pick(this.schema, ['refresh_token'], { $id: 'auth/GenerateAccessTokenRequest' })
	}
}