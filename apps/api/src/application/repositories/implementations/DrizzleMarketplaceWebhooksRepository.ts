import { and, eq } from 'drizzle-orm'

import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { marketplaceWebhooks } from '@integrator-packages/database/drizzle/tables'
import { IMarketplaceWebhook } from '@integrator-packages/database/entities'

import {
	IDeleteParams,
	IFindFirstParams,
	IMarketplaceWebhooksRepository,
	IUpsertParams
} from '@repositories/IMarketplaceWebhooksRepository'

export class DrizzleMarketplaceWebhooksRepository
	extends DrizzleBaseRepository
	implements IMarketplaceWebhooksRepository {

	async findFirst({ account_id, topic }: IFindFirstParams): Promise<IMarketplaceWebhook | null> {
		return await this.drizzleClient.query.marketplaceWebhooks.findFirst({
			where: and(
				eq(marketplaceWebhooks.account_id, account_id),
				topic !== undefined ? eq(marketplaceWebhooks.topic, topic) : undefined
			)
		}) || null
	}

	async upsert(data: IUpsertParams): Promise<IMarketplaceWebhook> {
		return await this.drizzleClient
			.insert(marketplaceWebhooks)
			.values(data)
			.onConflictDoUpdate({
				target: [marketplaceWebhooks.account_id, marketplaceWebhooks.topic],
				set: data
			})
			.returning()
			.then(([result]) => result)
	}

	async delete({ account_id, topic }: IDeleteParams): Promise<void> {
		await this.drizzleClient
			.delete(marketplaceWebhooks)
			.where(and(
				eq(marketplaceWebhooks.account_id, account_id),
				eq(marketplaceWebhooks.topic, topic)
			))
	}
}