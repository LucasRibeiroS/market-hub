import { Static, Type } from '@sinclair/typebox'

import { IApiKey } from '@entities'
import { IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { assertTypes } from '@utils/types'
import { IUseCase } from '@utils/use_case'
import { BaseValidator } from '@utils/validator'
import { IPagination, IPaginator } from '@utils/pagination'
import { apiKeyJsonSchema, createSchema, paginationJsonSchema, paginatorJsonSchema } from '@utils/typebox/schema'

type ListApiKeysRequest = { user_id: string } & IPaginator
type T = ListApiKeysRequest
type ListApiKeysResponse = {
	api_keys: IApiKey[]
	pagination?: IPagination
}
type K = ListApiKeysResponse

export class ListApiKeys implements IUseCase<T, K> {
	constructor(private apiKeysRepository: IApiKeysRepository) {}

	async execute({ user_id, ...paginator }: T): Promise<K> {
		const { data, pagination } = await this.apiKeysRepository.findMany({
			...paginator,
			user_id
		})
		return { api_keys: data, pagination }
	}

	documentation = {
		tags: ['Api Keys'],
		summary: 'List Api keys',
		description: 'List all API keys for a user',
		response: Type.Object({
			api_keys: Type.Array(Type.Ref(apiKeyJsonSchema.$id)),
			pagination: Type.Ref(paginationJsonSchema.$id)
		}, { $id: 'api-keys/ListApiKeysResponse' })
	}
}

export class ListApiKeysValidator extends BaseValidator<T> {
	protected schema = createSchema(Type.Composite([
		Type.Object({ user_id: Type.String() }),
		paginatorJsonSchema
	]), 'api-keys/ListApiKeysValidator')

	constructor() {
		super()
		assertTypes<T, Static<typeof this.schema>>()
	}

	documentation = {
		request: Type.Omit(this.schema, ['user_id'], { $id: 'api-keys/ListApiKeysRequest' })
	}
}