import { randomUUID } from 'node:crypto'
import { Static, Type } from '@sinclair/typebox'

import { IApiKey } from '@entities'
import { IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { assertTypes } from '@utils/types'
import { Permissions } from '@utils/permissions'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { apiKeyJsonSchema, createSchema, TEnumObject } from '@utils/typebox/schema'

type CreateApiKeyRequest = Pick<IApiKey, 'user_id' | 'name' | 'permissions'>
type T = CreateApiKeyRequest
type CreateApiKeyResponse = {
	api_key: IApiKey
}
type K = CreateApiKeyResponse

export class CreateApiKey implements IUseCase<T, K> {
	constructor(private apiKeysRepository: IApiKeysRepository) {}

	async execute(data: T): Promise<K> {
		const apiKey = await this.apiKeysRepository.create({
			...data,
			public_key: `pk-${randomUUID()}`
		})

		return { api_key: apiKey }
	}

	documentation = {
		tags: ['Api Keys'],
		summary: 'Create Api key',
		description: 'Create a new API key for a user',
		response: Type.Object({
			api_key: Type.Ref(apiKeyJsonSchema.$id)
		}, { $id: 'api-keys/CreateApiKeyResponse' })
	}
}

export class CreateApiKeyValidator extends BaseValidator<T> {
	protected schema = createSchema(Type.Composite([
		Type.Object({
			user_id: Type.String(),
			name: Type.String({ minLength: 3, maxLength: 100 }),
			permissions: Type.Array(TEnumObject(Permissions.user), { minItems: 1 })
		})
	]), 'api-keys/CreateApiKeyValidator')

	constructor() {
		super()
		assertTypes<T, Static<typeof this.schema>>()
	}

	documentation = {
		request: Type.Omit(this.schema, ['user_id'], { $id: 'api-keys/CreateApiKeyRequest' })
	}
}