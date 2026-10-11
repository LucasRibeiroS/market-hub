import { inject, injectable } from 'tsyringe'

import { AccountStatusEnum } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'

import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { IQueueAdapter, QueueAdapterSymbol } from '@adapters/IQueueAadpter'

import { MARKETPLACE_REFRESH_CREDENTIALS_CRON } from '@constants/crons'

type RescheduleMarketplaceCredentialRefreshesRequest = never
type T = RescheduleMarketplaceCredentialRefreshesRequest
type RescheduleMarketplaceCredentialRefreshesResponse = {
	/** Ids of the accounts that had no refresh scheduled */
	rescheduled: string[]
}
type K = RescheduleMarketplaceCredentialRefreshesResponse

/**
 * Restores the credentials refresh schedule of the active accounts that lost it, e.g. after the queue storage was wiped.
 */
@injectable()
export class RescheduleMarketplaceCredentialRefreshes implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(QueueAdapterSymbol)
		private queueAdapter: IQueueAdapter
	) {}

	async execute(): Promise<K> {
		const accountIds = await this.marketplaceAccountsRepository.findManyIdsByStatus(AccountStatusEnum.active)

		const rescheduled: string[] = []

		for (const account_id of accountIds) {
			// An existing schedule is left untouched, so a refresh that is already due is not postponed
			const isScheduled = await this.queueAdapter.hasScheduledJob({
				id: account_id,
				name: 'refresh-marketplace-credentials'
			})
			if (isScheduled) {
				continue
			}

			await this.queueAdapter.addJob({
				id: account_id,
				name: 'refresh-marketplace-credentials',
				data: { account_id },
				scheduler: {
					cron: MARKETPLACE_REFRESH_CREDENTIALS_CRON
				}
			})
			rescheduled.push(account_id)
		}

		return { rescheduled }
	}
}
