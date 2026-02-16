import { eq, sql } from 'drizzle-orm'

import { apiKeys } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IApiKey } from '@integrator-packages/database/entities'

import { IApiKeysRepository, ICountParams, ICreateParams, IFindByIdResponse, IFindFirstParams, IFindManyParams, IFindManyResponse, IUpdateParams } from '@repositories/IApiKeysRepository'

export class DrizzleApiKeysRepository extends DrizzleBaseRepository implements IApiKeysRepository {
	private findByIdQuery = this.drizzleClient.query.apiKeys
		.findFirst({
			where: eq(apiKeys.id, sql.placeholder('id')),
			columns: {
				id: true,
				user_id: true
			}
		})
		.prepare('findApiKeyById')

	private findFirstQuery = this.drizzleClient.query.apiKeys
		.findFirst({
			where: eq(apiKeys.key_lookup, sql.placeholder('key_lookup'))
		})
		.prepare('findApiKeyByPublicKey')

	async findMany({ user_id, ...paginator }: IFindManyParams): Promise<IFindManyResponse> {
		return await this.paginatedQuery({
			query: this.drizzleClient
				.select()
				.from(apiKeys)
				.where(eq(apiKeys.user_id, user_id))
				.$dynamic(),
			counter: this.count({ user_id }),
			paginator
		})
	}

	async findById(id: string): Promise<IFindByIdResponse | null> {
		return await this.findByIdQuery.execute({ id }) || null
	}

	async findFirst({ key_lookup }: IFindFirstParams): Promise<IApiKey | null> {
		return await this.findFirstQuery.execute({ key_lookup }) || null
	}

	async count(where: ICountParams): Promise<number> {
		return await this.drizzleClient.$count(apiKeys, eq(apiKeys.user_id, where.user_id))
	}

	async create(data: ICreateParams): Promise<IApiKey> {
		return await this.drizzleClient
			.insert(apiKeys)
			.values(data)
			.returning()
			.then(([result]) => result)
	}

	async update(id: string, data: IUpdateParams): Promise<IApiKey> {
		return await this.drizzleClient
			.update(apiKeys)
			.set(data)
			.where(eq(apiKeys.id, id))
			.returning()
			.then(([result]) => result)
	}

	async delete(id: string): Promise<void> {
		await this.drizzleClient
			.delete(apiKeys)
			.where(eq(apiKeys.id, id))
			.execute()
	}
}