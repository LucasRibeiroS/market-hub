import { Type } from '@sinclair/typebox'

import { IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { EmptyObject } from '@utils/types'
import { IUseCase } from '@utils/use_case'
import { ForbiddenException, NotFoundException } from '@utils/exception'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'

type DeleteApiKeyRequest = {
	public_key: string
	user_id: string
}
type T = DeleteApiKeyRequest
type DeleteApiKeyResponse = EmptyObject
type K = DeleteApiKeyResponse

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'Delete Api key',
	description: 'Delete an existing API key for a user'
})
export class DeleteApiKey implements IUseCase<T, K> {
	constructor(private apiKeysRepository: IApiKeysRepository) {}

	async execute({ public_key, user_id }: T): Promise<K> {
		const apiKey = await this.apiKeysRepository.findFirst({ public_key })
		if (apiKey === null) {
			throw new NotFoundException('API key not found')
		}
		if (apiKey.user_id !== user_id) {
			throw new ForbiddenException()
		}

		await this.apiKeysRepository.delete(apiKey.id)

		return {}
	}
}

export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({
			public_key: Type.String(),
			user_id: Type.String()
		})
	])

	protected $id = 'api-keys/DeleteApiKeyValidator'
	protected schema = Validator.schema
}