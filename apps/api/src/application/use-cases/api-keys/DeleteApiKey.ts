import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { ApiKeysRepositorySymbol, IApiKeysRepository } from '@repositories/IApiKeysRepository'

import { EmptyObject } from '@utils/types'

type DeleteApiKeyRequest = {
	id: string
	user_id: string
}
type T = DeleteApiKeyRequest
type DeleteApiKeyResponse = EmptyObject
type K = DeleteApiKeyResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Api Keys'],
	summary: 'Delete Api key',
	description: 'Delete an existing API key for a user'
})
export class DeleteApiKey implements IUseCase<T, K> {
	constructor(@inject(ApiKeysRepositorySymbol) private apiKeysRepository: IApiKeysRepository) {}

	@Transactional()
	async execute({ id, user_id }: T): Promise<K> {
		const apiKey = await this.apiKeysRepository.findByIdSimplified(id)
		if (apiKey === null || apiKey.user_id !== user_id) {
			throw new NotFoundException('API key not found')
		}

		await this.apiKeysRepository.delete(apiKey.id)

		return {}
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({
			id: Type.String(),
			user_id: Type.String()
		})
	])

	protected schema = Validator.schema
}