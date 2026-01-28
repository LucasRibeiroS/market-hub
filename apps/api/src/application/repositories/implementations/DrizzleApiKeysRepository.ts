import { eq, sql } from 'drizzle-orm'

import { apiKeys } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IApiKey } from '@integrator-packages/database/entities'

import { IApiKeysRepository, ICountParams, ICreateParams, IFindFirstParams, IFindManyParams, IFindManyResponse } from '@repositories/IApiKeysRepository'

export class DrizzleApiKeysRepository extends DrizzleBaseRepository implements IApiKeysRepository {
	private findFirstQuery = this.drizzleClient.query.apiKeys
		.findFirst({
			where: eq(apiKeys.public_key, sql.placeholder('public_key'))
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

	async findFirst({ public_key }: IFindFirstParams): Promise<IApiKey | null> {
		return await this.findFirstQuery.execute({ public_key }) || null
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

	async delete(id: string): Promise<void> {
		await this.drizzleClient
			.delete(apiKeys)
			.where(eq(apiKeys.id, id))
			.execute()
	}
}