import { IMarketplaceWebhook } from '@integrator-packages/database/entities'
import { CustomOmit } from '@utils/types'

export type IFindFirstParams = {
	account_id: string
	topic?: string
}

export type IUpsertParams = CustomOmit<IMarketplaceWebhook, 'id' | 'created_at' | 'updated_at'>

export type IDeleteParams = {
	account_id: string
	topic: string
}

export interface IMarketplaceWebhooksRepository {
	findFirst(params: IFindFirstParams): Promise<IMarketplaceWebhook | null>
	upsert(params: IUpsertParams): Promise<IMarketplaceWebhook>
	delete(params: IDeleteParams): Promise<void>
}

export const MarketplaceWebhooksRepositorySymbol = Symbol('IMarketplaceWebhooksRepository')