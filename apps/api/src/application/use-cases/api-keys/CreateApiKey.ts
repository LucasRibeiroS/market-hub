import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IApiKey } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { Permissions, UserPermissions } from '@utils/permissions'
import { apiKeyJsonSchema, TEnumObject } from '@utils/typebox'

type CreateApiKeyRequest = { permissions: UserPermissions[] } & Pick<IApiKey, 'user_id' | 'name'>
type T = CreateApiKeyRequest
type CreateApiKeyResponse = {
	api_key: IApiKey
}
type K = CreateApiKeyResponse

@injectable()
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
	constructor(@inject(ApiKeysRepositorySymbol) private apiKeysRepository: IApiKeysRepository) {}

	@Transactional()
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
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		name: Type.String({ minLength: 3, maxLength: 100 }),
		permissions: Type.Array(TEnumObject(Permissions.user), { minItems: 1 })
	})

	protected $id = 'api-keys/CreateApiKeyValidator'
	protected schema = Validator.schema
}