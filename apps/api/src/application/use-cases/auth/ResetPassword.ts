import { genSalt, hash } from 'bcrypt'
import { isAfter } from 'date-fns'
import { Type } from '@sinclair/typebox'

import { IPasswordResetsRepository } from '@repositories/IPasswordResetsRepository'
import { IUsersRepository } from '@repositories/IUsersRepository'

import { EmptyObject } from '@utils/types'
import { ConflictException, NotFoundException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'

type ResetPasswordRequest = {
	email: string
	code: string
	password: string
}
type T = ResetPasswordRequest
type ResetPasswordResponse = EmptyObject
type K = ResetPasswordResponse

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Password Reset',
	description: 'Reset user password using a code sent via email',
	is_public: true
})
export class ResetPassword implements IUseCase<T, K> {
	constructor(
		private passwordResetsRepository: IPasswordResetsRepository,
		private usersRepository: IUsersRepository
	) {}

	async execute({ code, email, password }: T): Promise<K> {
		const user = await this.usersRepository.findFirst({ email })
		if (user === null) {
			throw new NotFoundException('User not found')
		}

		const lastReset = await this.passwordResetsRepository.findLast({ user_id: user.id })
		if (lastReset === null) {
			throw new ConflictException('Action not available')
		}
		if (
			lastReset.is_used ||
			lastReset.code !== code ||
			isAfter(new Date(), lastReset.expiration)
		) {
			throw new ConflictException('Invalid or expired code')
		}

		const passwordHash = await hash(password, await genSalt(12))

		await Promise.all([
			this.usersRepository.update({
				id: user.id,
				data: { password: passwordHash }
			}),
			this.passwordResetsRepository.update({
				id: lastReset.id,
				data: { is_used: true }
			})
		])

		return {}
	}
}
@Documentation({
	request: { ...Validator.schema, $id: 'auth/ResetPasswordRequest' }
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		email: Type.String({ format: 'email' }),
		code: Type.String({ minLength: 6, maxLength: 6 }),
		password: Type.String({ minLength: 8, maxLength: 128 })
	})

	protected $id = 'auth/ResetPasswordValidator'
	protected schema = Validator.schema
}