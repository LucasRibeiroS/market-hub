import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IApiKey } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { omitKeys } from '@utils/objects'
import { IPagination, IPaginator } from '@utils/pagination'
import { CustomOmit } from '@utils/types'
import { apiKeyJsonSchema, paginationJsonSchema, paginatorJsonSchema } from '@utils/typebox'

type ListApiKeysRequest = { user_id: string } & IPaginator
type T = ListApiKeysRequest
type ListApiKeysResponse = {
	api_keys: Array<CustomOmit<IApiKey, 'encrypted_key' | 'key_lookup'>>
	pagination: IPagination
}
type K = ListApiKeysResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'List Api keys',
	description: 'List all API keys for a user',
	response: Type.Object({
		api_keys: Type.Array(Type.Ref(apiKeyJsonSchema.$id)),
		pagination: Type.Ref(paginationJsonSchema.$id)
	}, { $id: 'api-keys/ListApiKeysResponse' })
})
export class ListApiKeys implements IUseCase<T, K> {
	constructor(@inject(ApiKeysRepositorySymbol) private apiKeysRepository: IApiKeysRepository) {}

	async execute(params: T): Promise<K> {
		const { data, pagination } = await this.apiKeysRepository.findMany(params)

		return {
			api_keys: data.map(apiKey => omitKeys(apiKey, ['encrypted_key', 'key_lookup'])),
			pagination
		}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'api-keys/ListApiKeysRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({ user_id: Type.String() }),
		paginatorJsonSchema
	])

	protected $id = 'api-keys/ListApiKeysValidator'
	protected schema = Validator.schema
}