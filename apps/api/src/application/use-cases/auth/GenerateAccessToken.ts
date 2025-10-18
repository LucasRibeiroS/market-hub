import { Type } from '@sinclair/typebox'

import { generateAppTokens, verifyRefreshToken } from '@utils/jwt'
import { isHttpException, UnauthorizedException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'
import { appTokensJsonSchema } from '@utils/typebox/schema'

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

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Generate Access Token',
	description: 'Generate a new access token using a valid refresh token',
	is_public: true,
	response: Type.Object({
		tokens: Type.Pick(appTokensJsonSchema, ['access_token'])
	}, { $id: 'auth/GenerateAccessTokenResponse' })
})
export class GenerateAccessToken implements IUseCase<T, K> {
	async execute({ refresh_token }: T): Promise<K> {
		try {
			const data = verifyRefreshToken(refresh_token)

			const { accessToken } = generateAppTokens({ id: data.id })

			return {
				tokens: { access_token: accessToken }
			}
		} catch(error) {
			if (isHttpException(error)) {
				throw error
			}
		}

		throw new UnauthorizedException()
	}
}

@Documentation({
	request: Type.Pick(Validator.schema, ['refresh_token'], { $id: 'auth/GenerateAccessTokenRequest' })
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({ refresh_token: Type.String() })

	protected $id = 'auth/GenerateAccessTokenValidator'
	protected schema = Validator.schema
}