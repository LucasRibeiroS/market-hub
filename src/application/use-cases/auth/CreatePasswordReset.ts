import crypto from 'node:crypto'
import { addMinutes, isBefore } from 'date-fns'
import { Type } from '@sinclair/typebox'

import { IPasswordResetsRepository } from '@repositories/IPasswordResetsRepository'
import { IUsersRepository } from '@repositories/IUsersRepository'
import { IEmailAdapter } from '@adapters/IEmailAdapter'

import { EmptyObject } from '@utils/types'
import { env } from '@utils/env'
import { ConflictException, NotFoundException } from '@utils/exception'
import { IUseCase } from '@utils/use_case'
import { BaseValidator, ValidateWith } from '@utils/validator'
import { Documentation } from '@utils/documentation'

import { getResetPasswordEmail } from '@views/reset-password'

type CreatePasswordResetRequest = {
	email: string
}
type T = CreatePasswordResetRequest
type CreatePasswordResetResponse = EmptyObject
type K = CreatePasswordResetResponse

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Create Password Reset',
	description: 'Create a password reset request by sending an email with a code',
	is_public: true
})
export class CreatePasswordReset implements IUseCase<T, K> {
	constructor(
		private passwordResetsRepository: IPasswordResetsRepository,
		private usersRepository: IUsersRepository,
		private emailAdapter: IEmailAdapter
	) {}

	async execute({ email }: T): Promise<K> {
		const user = await this.usersRepository.findFirst({ email })
		if (user === null) {
			throw new NotFoundException('User not found')
		}

		const lastReset = await this.passwordResetsRepository.findLast({ user_id: user.id })
		if (
			lastReset !== null &&
            isBefore(lastReset.expiration, new Date()) &&
			!lastReset.is_used
		) {
			throw new ConflictException('Your code has not expired yet')
		}

		const code = crypto.randomBytes(3).toString('hex').toUpperCase()
		const message = await getResetPasswordEmail({
			name: user.name,
			code
		})

		await Promise.all([
			this.passwordResetsRepository.create({
				code,
				expiration: addMinutes(new Date(), env.PASSWORD_RESET_EXPIRES),
				user_id: user.id,
				is_used: false
			}),
			this.emailAdapter.sendEmail({
				destination: email,
				message,
				subject: 'Redefinição de senha'
			})
		])

		return {}
	}
}

@Documentation({
	request: { ...Validator.schema, $id: 'auth/CreatePasswordResetRequest' }
})
export class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		email: Type.String({ format: 'email' })
	})

	protected $id = 'auth/CreatePasswordResetValidator'
	protected schema = Validator.schema
}