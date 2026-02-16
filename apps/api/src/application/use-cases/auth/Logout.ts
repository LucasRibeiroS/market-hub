import { injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { EmptyObject } from '@utils/types'

type LogoutRequest = {
	refresh_token: string
}
type T = LogoutRequest
type LogoutResponse = EmptyObject
type K = LogoutResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Logout',
	description: 'Logout user, invalidating access and refresh tokens',
	is_public: true
})
export class Logout implements IUseCase<T, K> {
	constructor() {}

	async execute(): Promise<K> {
		return {}
	}
}

@Documentation({
	request: { ...Validator.schema, $id: 'auth/LogoutRequest' }
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		refresh_token: Type.String()
	})

	protected $id = 'auth/LogoutValidator'
	protected schema = Validator.schema
}