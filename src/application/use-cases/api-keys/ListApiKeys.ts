import { Type } from '@sinclair/typebox'

import { IApiKey } from '@entities'
import { IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { IPagination, IPaginator } from '@utils/pagination'
import { Documentation } from '@utils/documentation'
import { apiKeyJsonSchema, paginationJsonSchema, paginatorJsonSchema } from '@utils/typebox/schema'

type ListApiKeysRequest = { user_id: string } & IPaginator
type T = ListApiKeysRequest
type ListApiKeysResponse = {
	api_keys: IApiKey[]
	pagination: IPagination
}
type K = ListApiKeysResponse

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
	constructor(private apiKeysRepository: IApiKeysRepository) {}

	async execute(params: T): Promise<K> {
		const { data, pagination } = await this.apiKeysRepository.findMany(params)
		return { api_keys: data, pagination }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'api-keys/ListApiKeysRequest' })
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({ user_id: Type.String() }),
		paginatorJsonSchema
	])

	protected $id = 'api-keys/ListApiKeysValidator'
	protected schema = Validator.schema
}