import { eq, sql } from 'drizzle-orm'
import { users } from '@drizzle/schema'
import { drizzleClient } from '@clients/drizzle'

import { IUser } from '@entities'
import { ICreateParams, IFindFirstParams, IUpdateParams, IUsersRepository } from '@repositories/IUsersRepository'

export class DrizzleUsersRepository implements IUsersRepository {
	private findByIdQuery = drizzleClient.query.users
		.findFirst({
			where: eq(users.id, sql.placeholder('id'))
		})
		.prepare('findUserById')

	private findFirstQuery = drizzleClient.query.users
		.findFirst({
			where: eq(users.email, sql.placeholder('email'))
		})
		.prepare('findFirstUser')

	async findById(id: string): Promise<IUser | null> {
		return this.findByIdQuery.execute({ id }).then(result => result || null)
	}

	async findFirst({ email }: IFindFirstParams): Promise<IUser | null> {
		return this.findFirstQuery.execute({ email }).then(result => result || null)
	}

	async create(data: ICreateParams): Promise<IUser> {
		return drizzleClient
			.insert(users)
			.values(data)
			.returning()
			.then(([result]) => result)
	}

	async update({ id, data }: IUpdateParams): Promise<IUser> {
		return drizzleClient
			.update(users)
			.set(data)
			.where(eq(users.id, id))
			.returning()
			.then(([result]) => result)
	}
}