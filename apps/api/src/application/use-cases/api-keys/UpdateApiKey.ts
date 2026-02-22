import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IApiKey } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { omitKeys } from '@utils/objects'
import { UserPermissions } from '@utils/permissions'
import { apiKeyJsonSchema, permissionsEnumSchema } from '@utils/typebox'
import { CustomOmit } from '@utils/types'

type UpdateApiKeyRequest = {
	id: string
	user_id: string
	data: Partial<{
		name: string
		permissions: UserPermissions[]
		is_active: boolean
	}>
}
type T = UpdateApiKeyRequest
type UpdateApiKeyResponse = {
	api_key: CustomOmit<IApiKey, 'encrypted_key' | 'key_lookup'>
}
type K = UpdateApiKeyResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'Update Api key',
	description: 'Update an existing API key for a user',
	response: Type.Object({
		api_key: Type.Ref(apiKeyJsonSchema.$id)
	}, { $id: 'api-keys/UpdateApiKeyResponse' })
})
export class UpdateApiKey implements IUseCase<T, K> {
	constructor(@inject(ApiKeysRepositorySymbol) private apiKeysRepository: IApiKeysRepository) {}

	async execute({ id, user_id, data }: T): Promise<K> {
		const existingApiKey = await this.apiKeysRepository.findById(id)
		if (existingApiKey === null || existingApiKey.user_id !== user_id) {
			throw new NotFoundException('API key not found')
		}

		const apiKey = await this.apiKeysRepository.update(id, data)

		return { api_key: omitKeys(apiKey, ['encrypted_key', 'key_lookup']) }
	}
}

@Documentation({
	request: Type.Index(Validator.schema, ['data'], { $id: 'api-keys/UpdateApiKeyRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String(),
		data: Type.Partial(Type.Object({
			name: Type.String({ minLength: 3, maxLength: 100 }),
			permissions: Type.Array(Type.Ref(permissionsEnumSchema.$id), { minItems: 1 }),
			is_active: Type.Boolean()
		}))
	})

	protected schema = Validator.schema
}