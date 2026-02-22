import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IApiKey } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { omitKeys } from '@utils/objects'
import { apiKeyJsonSchema } from '@utils/typebox'
import { CustomOmit } from '@utils/types'

type GetApiKeyRequest = {
	id: string
	user_id: string
}
type T = GetApiKeyRequest
type GetApiKeyResponse = {
	api_key: CustomOmit<IApiKey, 'encrypted_key' | 'key_lookup'>
}
type K = GetApiKeyResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'Get Api key',
	description: 'Get an existing API key for a user',
	response: Type.Object({
		api_key: Type.Ref(apiKeyJsonSchema.$id)
	}, { $id: 'api-keys/GetApiKeyResponse' })
})
export class GetApiKey implements IUseCase<T, K> {
	constructor(@inject(ApiKeysRepositorySymbol) private apiKeysRepository: IApiKeysRepository) {}

	async execute({ id, user_id }: T): Promise<K> {
		const apiKey = await this.apiKeysRepository.findById(id)
		if (apiKey === null || apiKey.user_id !== user_id) {
			throw new NotFoundException('API key not found')
		}

		return { api_key: omitKeys(apiKey, ['encrypted_key', 'key_lookup']) }
	}
}

@Documentation({
	request: Type.Index(Validator.schema, ['data'], { $id: 'api-keys/GetApiKeyRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String()
	})

	protected schema = Validator.schema
}