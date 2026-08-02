import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { Transactional } from '@integrator-packages/database/transaction'

import { IOrdersRepository, OrdersRepositorySymbol } from '@repositories/IOrdersRepository'
import { IOrderItemsRepository, OrderItemsRepositorySymbol } from '@repositories/IOrderItemsRepository'
import { IOrderShipmentsRepository, OrderShipmentsRepositorySymbol } from '@repositories/IOrderShipmentsRepository'
import { IOrderInvoicesRepository, OrderInvoicesRepositorySymbol } from '@repositories/IOrderInvoicesRepository'

import { EmptyObject } from '@utils/types'

type DeleteOrderRequest = {
	account_id: string
	external_order_id: string
}
type T = DeleteOrderRequest

type DeleteOrderResponse = EmptyObject
type K = DeleteOrderResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Orders'],
	summary: 'Delete order',
	description: 'Delete an internal order and its related items, shipments, and invoices',
	is_public: false
})
export class DeleteOrder implements IUseCase<T, K> {
	constructor(
		@inject(OrdersRepositorySymbol)
		private ordersRepository: IOrdersRepository,
		@inject(OrderItemsRepositorySymbol)
		private orderItemsRepository: IOrderItemsRepository,
		@inject(OrderShipmentsRepositorySymbol)
		private orderShipmentsRepository: IOrderShipmentsRepository,
		@inject(OrderInvoicesRepositorySymbol)
		private orderInvoicesRepository: IOrderInvoicesRepository
	) {}

	@Transactional()
	async execute({ account_id, external_order_id }: T): Promise<K> {
		const order = await this.ordersRepository.findFirst({ account_id, external_order_id })
		if (order === null) {
			return {}
		}

		// Delete related data
		await Promise.all([
			this.orderItemsRepository.deleteByOrderId(order.id),
			this.orderShipmentsRepository.deleteByOrderId(order.id),
			this.orderInvoicesRepository.deleteByOrderId(order.id)
		])

		// Delete the order
		await this.ordersRepository.deleteById(order.id)

		return {}
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		account_id: Type.String(),
		external_order_id: Type.String()
	})

	protected schema = Validator.schema
}

export const DeleteOrderSymbol = Symbol('DeleteOrder')