import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IApiKey } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { omitKeys } from '@utils/objects'
import { UserPermissions } from '@utils/permissions'
import { encrypt, hash } from '@utils/cryptography'
import { apiKeyJsonSchema, permissionsEnumSchema } from '@utils/typebox'
import { CustomOmit } from '@utils/types'

type CreateApiKeyRequest = { permissions: UserPermissions[] } & Pick<IApiKey, 'user_id' | 'name'>
type T = CreateApiKeyRequest
type CreateApiKeyResponse = {
	api_key: { key: string } & CustomOmit<IApiKey, 'encrypted_key' | 'key_lookup'>
}
type K = CreateApiKeyResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'Create Api key',
	description: 'Create a new API key for a user',
	response: Type.Object({
		api_key: Type.Intersect([
			Type.Ref(apiKeyJsonSchema.$id),
			Type.Object({ key: Type.String() })
		])
	}, { $id: 'api-keys/CreateApiKeyResponse' })
})
export class CreateApiKey implements IUseCase<T, K> {
	constructor(@inject(ApiKeysRepositorySymbol) private apiKeysRepository: IApiKeysRepository) {}

	@Transactional()
	async execute(data: T): Promise<K> {
		const key = `pk_${randomUUID().replaceAll('-', '_')}`

		const apiKey = await this.apiKeysRepository.create({
			...data,
			encrypted_key: encrypt(key),
			key_lookup: hash(key),
			key_preview: `${key.substring(0, 6)}***${key.substring(key.length - 4)}`,
			is_active: true
		})

		return {
			api_key: {
				...omitKeys(apiKey, ['encrypted_key', 'key_lookup']),
				key
			}
		}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'api-keys/CreateApiKeyRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		name: Type.String({ minLength: 3, maxLength: 100 }),
		permissions: Type.Array(Type.Ref(permissionsEnumSchema.$id), { minItems: 1 })
	})

	protected $id = 'api-keys/CreateApiKeyValidator'
	protected schema = Validator.schema
}