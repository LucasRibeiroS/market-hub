import { desc, eq, sql } from 'drizzle-orm'

import { passwordResets } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IPasswordReset } from '@integrator-packages/database/entities'

import {
	ICreateParams,
	IFindLastParams,
	IPasswordResetsRepository,
	IUpdateParams
} from '@repositories/IPasswordResetsRepository'

export class DrizzlePasswordResetsRepository extends DrizzleBaseRepository implements IPasswordResetsRepository {
	private createQuery = this.drizzleClient
		.insert(passwordResets)
		.values({
			user_id: sql.placeholder('user_id'),
			code: sql.placeholder('code'),
			expiration: sql.placeholder('expiration')
		})
		.returning()
		.prepare('createPasswordReset')

	private findLastQuery = this.drizzleClient.query.passwordResets
		.findFirst({
			where: eq(passwordResets.user_id, sql.placeholder('user_id')),
			orderBy: desc(passwordResets.created_at)
		})
		.prepare('findLastPasswordReset')

	async create(data: ICreateParams): Promise<IPasswordReset> {
		return await this.createQuery.execute(data).then(([passwordReset]) => passwordReset)
	}

	async findLast(data: IFindLastParams): Promise<IPasswordReset | null> {
		return await this.findLastQuery.execute(data) || null
	}

	async update({ id, data }: IUpdateParams): Promise<IPasswordReset> {
		return await this.drizzleClient
			.update(passwordResets)
			.set(data)
			.where(eq(passwordResets.id, id))
			.returning()
			.then(([passwordReset]) => passwordReset)
	}
}