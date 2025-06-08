import { eq, sql } from 'drizzle-orm'
import { apiKeys } from '@drizzle'
import { DrizzleBaseRepository, drizzleClient } from '@clients/drizzle'

import { IApiKey } from '@entities'
import { IApiKeysRepository, ICountParams, IFindFirstParams, IFindManyParams, IFindManyResponse } from '@repositories/IApiKeysRepository'

export class DrizzleApiKeysRepository extends DrizzleBaseRepository implements IApiKeysRepository {
	private findFirstQuery = drizzleClient.query.apiKeys
		.findFirst({
			where: eq(apiKeys.public_key, sql.placeholder('public_key'))
		})
		.prepare('findApiKeyByPublicKey')

	async findMany({ user_id, ...paginator }: IFindManyParams): Promise<IFindManyResponse> {
		return this.paginatedQuery({
			query: drizzleClient
				.select()
				.from(apiKeys)
				.where(eq(apiKeys.user_id, user_id))
				.$dynamic(),
			table: apiKeys,
			counter: this.count({ user_id }),
			paginator
		})
	}

	async findFirst({ public_key }: IFindFirstParams): Promise<IApiKey | null> {
		return this.findFirstQuery.execute({ public_key }).then(result => result || null)
	}

	async count(where: ICountParams): Promise<number> {
		return drizzleClient.$count(apiKeys, eq(apiKeys.user_id, where.user_id))
	}

	async create(data: IApiKey): Promise<IApiKey> {
		return drizzleClient
			.insert(apiKeys)
			.values(data)
			.returning()
			.then(([result]) => result)
	}
}