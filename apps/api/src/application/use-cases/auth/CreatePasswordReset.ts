import crypto from 'node:crypto'
import { addMinutes, isAfter } from 'date-fns'
import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { ConflictException, NotFoundException } from '@integrator-packages/use-case/exceptions'

import { env } from '@config/env'

import { IPasswordResetsRepository, PasswordResetsRepositorySymbol } from '@repositories/IPasswordResetsRepository'
import { IUsersRepository, UsersRepositorySymbol } from '@repositories/IUsersRepository'
import { EmailAdapterSymbol, IEmailAdapter } from '@adapters/IEmailAdapter'

import { EmptyObject } from '@utils/types'

import { getResetPasswordEmail } from '@views/reset-password'

type CreatePasswordResetRequest = {
	email: string
}
type T = CreatePasswordResetRequest
type CreatePasswordResetResponse = EmptyObject
type K = CreatePasswordResetResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Authentication'],
	summary: 'Create Password Reset',
	description: 'Create a password reset request by sending an email with a code',
	is_public: true
})
export class CreatePasswordReset implements IUseCase<T, K> {
	constructor(
		@inject(PasswordResetsRepositorySymbol) private passwordResetsRepository: IPasswordResetsRepository,
		@inject(UsersRepositorySymbol) private usersRepository: IUsersRepository,
		@inject(EmailAdapterSymbol) private emailAdapter: IEmailAdapter
	) {}

	@Transactional()
	async execute({ email }: T): Promise<K> {
		const user = await this.usersRepository.findFirst({ email })
		if (user === null) {
			throw new NotFoundException('User not found')
		}

		const lastReset = await this.passwordResetsRepository.findLast({ user_id: user.id })
		if (
			lastReset !== null &&
            isAfter(lastReset.expiration, new Date()) &&
			!lastReset.is_used
		) {
			throw new ConflictException('Your code has not expired yet')
		}

		const code = this.generateCode()

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

	private generateCode(): string {
		const code = crypto.randomBytes(3).toString('hex').toUpperCase()

		// Changing confusing characters to common ones to avoid user errors
		return code.replace(/[O0]/g, 'A').replace(/I/g, '1')
	}
}

@Documentation({
	request: { ...Validator.schema, $id: 'auth/CreatePasswordResetRequest' }
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		email: Type.String({ format: 'email' })
	})

	protected $id = 'auth/CreatePasswordResetValidator'
	protected schema = Validator.schema
}