import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'
import { IMarketplaceAccount, IMarketplaceCredential, IMarketplaceProvider, ProviderEnum } from '@integrator-packages/database/entities'

import {
	IMarketplaceCredentialsRepository,
	MarketplaceCredentialsRepositorySymbol
} from '@repositories/IMarketplaceCredentialsRepository'
import { IMarketplaceAdapterFactory, MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'
import { IMarketplaceAccountsRepository, MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'

import { IGetOrderDetailsResponse } from '@adapters/IMarketplaceAdapter'

import { DeleteOrder, DeleteOrderSymbol } from '@use-cases/orders/DeleteOrder'
import { UpsertOrder, UpsertOrderSymbol } from '@use-cases/orders/UpsertOrder'

import { EmptyObject } from '@utils/types'
import { env } from '@config/env'

export type SyncMercadoLivreOrderRequest = {
	account_id?: string
	resource: string
	user_id: number
	// status comes from the test section on the web app
	status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
}
type T = SyncMercadoLivreOrderRequest

type SyncMercadoLivreOrderResponse = EmptyObject
type K = SyncMercadoLivreOrderResponse

@injectable()
@ValidateWith(() => Validator)
export class SyncMercadoLivreOrder implements IUseCase<T, K> {
	constructor(
		@inject(MarketplaceCredentialsRepositorySymbol)
		private marketplaceCredentialsRepository: IMarketplaceCredentialsRepository,
		@inject(MarketplaceAdapterFactorySymbol)
		private marketplaceAdapterFactory: IMarketplaceAdapterFactory,
		@inject(MarketplaceAccountsRepositorySymbol)
		private marketplaceAccountsRepository: IMarketplaceAccountsRepository,
		@inject(UpsertOrderSymbol)
		private upsertOrder: UpsertOrder,
		@inject(DeleteOrderSymbol)
		private deleteOrder: DeleteOrder
	) {}

	private DELETE_STATUSES = ['cancelled', 'refunded']

	async execute({ resource, user_id, account_id, status }: T): Promise<K> {
		const externalOrderId = this.getExternalOrderIdFromResource(resource)
		if (externalOrderId === null) {
			return {}
		}

		const { account } = await this.loadAccount({ user_id, account_id })

		// A cancellation/refund does not require fetching the order from the marketplace API
		if (status !== undefined && this.DELETE_STATUSES.includes(status.toLowerCase())) {
			await this.deleteOrder.execute({
				account_id: account.id,
				external_order_id: externalOrderId
			})

			return {}
		}

		const orderDetails = await this.marketplaceAdapterFactory
			.get(ProviderEnum.mercado_livre)
			.getOrderDetails({
				credentials: account.credentials,
				provider: account.provider,
				external_order_id: externalOrderId,
				resource
			})

		await this.processOrder({
			account,
			order_details: orderDetails,
			status_override: status
		})

		return {}
	}

	private getExternalOrderIdFromResource(resource: string): string | null {
		const match = resource.match(/\/orders\/(\d+)/)

		return match?.[1] || null
	}

	private async loadAccount({ user_id, account_id }: ILoadAccountParams): Promise<ILoadAccountResponse> {
		const account = account_id !== undefined && env.NODE_ENV !== 'production'
			? await this.marketplaceAccountsRepository.findByIdSimplified(account_id)
			: await this.marketplaceAccountsRepository.findFirstByExternalId(user_id.toString())
		if (account === null) {
			throw new NotFoundException('Marketplace account not found for user')
		}

		const credentials = await this.marketplaceCredentialsRepository.findFirst({ account_id: account.id })
		if (credentials === null || credentials.account.provider.provider !== ProviderEnum.mercado_livre) {
			throw new NotFoundException('Marketplace account not found for mercado livre webhook')
		}

		return {
			account: {
				id: account.id,
				user_id: account.user_id,
				credentials,
				provider: { base_url: credentials.account.provider.base_url }
			}
		}
	}

	private async processOrder({ account, order_details, status_override }: IProcessOrderParams): Promise<void> {
		const status = status_override ?? order_details.status

		// Only override the normalized internal status; external_status keeps the raw
		// provider value for auditability.
		order_details.status = status

		if (this.DELETE_STATUSES.includes(status.toLowerCase())) {
			await this.deleteOrder.execute({
				account_id: account.id,
				external_order_id: order_details.external_order_id
			})
			return
		}

		await this.upsertOrder.execute({
			user_id: account.user_id,
			account_id: account.id,
			order_details
		})
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.Optional(Type.String()),
		resource: Type.String(),
		user_id: Type.Number(),
		status: Type.Optional(Type.Union([
			Type.Literal('pending'),
			Type.Literal('paid'),
			Type.Literal('shipped'),
			Type.Literal('delivered'),
			Type.Literal('cancelled'),
			Type.Literal('refunded')
		]))
	})

	protected schema = Validator.schema
}

type ILoadAccountParams = {
	user_id: number
	account_id?: string
}
type ILoadAccountResponse = {
	account: {
		credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
		provider: Pick<IMarketplaceProvider, 'base_url'>
	} & Pick<IMarketplaceAccount, 'id' | 'user_id'>
}

type IProcessOrderParams = {
	account: Pick<IMarketplaceAccount, 'id' | 'user_id'>
	order_details: IGetOrderDetailsResponse
	status_override?: T['status']
}
