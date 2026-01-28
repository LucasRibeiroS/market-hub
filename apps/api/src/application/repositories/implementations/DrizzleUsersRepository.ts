import { eq, sql } from 'drizzle-orm'

import { users } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IUser } from '@integrator-packages/database/entities'

import { ICreateParams, IFindFirstParams, IUpdateParams, IUsersRepository } from '@repositories/IUsersRepository'

export class DrizzleUsersRepository extends DrizzleBaseRepository implements IUsersRepository {
	private findByIdQuery = this.drizzleClient.query.users
		.findFirst({
			where: eq(users.id, sql.placeholder('id'))
		})
		.prepare('findUserById')

	private findFirstQuery = this.drizzleClient.query.users
		.findFirst({
			where: eq(users.email, sql.placeholder('email'))
		})
		.prepare('findFirstUser')

	async findById(id: string): Promise<IUser | null> {
		return await this.findByIdQuery.execute({ id }) || null
	}

	async findFirst({ email }: IFindFirstParams): Promise<IUser | null> {
		return await this.findFirstQuery.execute({ email }) || null
	}

	async create(data: ICreateParams): Promise<IUser> {
		return await this.drizzleClient
			.insert(users)
			.values(data)
			.returning()
			.then(([result]) => result)
	}

	async update({ id, data }: IUpdateParams): Promise<IUser> {
		return await this.drizzleClient
			.update(users)
			.set(data)
			.where(eq(users.id, id))
			.returning()
			.then(([result]) => result)
	}
}