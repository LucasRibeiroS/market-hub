import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IProduct } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'

import { productJsonSchema } from '@utils/typebox'

type UpdateProductRequest = {
	id: string
	user_id: string
	data: Partial<Pick<IProduct, 'name' | 'description' | 'attributes'>>
}
type UpdateProductResponse = {
	product: IProduct
}
type T = UpdateProductRequest
type K = UpdateProductResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Products'],
	summary: 'Update product',
	description: 'Update the details of an existing product',
	response: Type.Object({
		product: Type.Ref(productJsonSchema.$id)
	}, { $id: 'products/UpdateProductResponse' })
})
export class UpdateProduct implements IUseCase<T, K> {
	constructor(
		@inject(ProductsRepositorySymbol)
		private readonly productsRepository: IProductsRepository
	) {}

	@Transactional()
	async execute({ id, user_id, data }: T): Promise<K> {
		const existingProduct = await this.productsRepository.findById(id)
		if (existingProduct === null || existingProduct.user_id !== user_id) {
			throw new NotFoundException('Product not found')
		}

		const product = await this.productsRepository.update(id, data)

		return { product }
	}
}

@Documentation({
	request: Type.Index(Validator.schema, ['data'], { $id: 'products/UpdateProductRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String(),
		data: Type.Partial(
			Type.Pick(productJsonSchema, ['name', 'description', 'attributes'])
		)
	})

	protected schema = Validator.schema
}