import { randomUUID } from 'node:crypto'
import { Type } from '@sinclair/typebox'

import { IApiKey } from '@entities'
import { IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { Permissions } from '@utils/permissions'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'
import { apiKeyJsonSchema, TEnumObject } from '@utils/typebox/schema'

type CreateApiKeyRequest = Pick<IApiKey, 'user_id' | 'name' | 'permissions'>
type T = CreateApiKeyRequest
type CreateApiKeyResponse = {
	api_key: IApiKey
}
type K = CreateApiKeyResponse

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'Create Api key',
	description: 'Create a new API key for a user',
	response: Type.Object({
		api_key: Type.Ref(apiKeyJsonSchema.$id)
	}, { $id: 'api-keys/CreateApiKeyResponse' })
})
export class CreateApiKey implements IUseCase<T, K> {
	constructor(private apiKeysRepository: IApiKeysRepository) {}

	async execute(data: T): Promise<K> {
		const apiKey = await this.apiKeysRepository.create({
			...data,
			public_key: `pk_${randomUUID().replaceAll('-', '_')}`
		})

		return { api_key: apiKey }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'api-keys/CreateApiKeyRequest' })
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({
			user_id: Type.String(),
			name: Type.String({ minLength: 3, maxLength: 100 }),
			permissions: Type.Array(TEnumObject(Permissions.user), { minItems: 1 })
		})
	])

	protected $id = 'api-keys/CreateApiKeyValidator'
	protected schema = Validator.schema
}