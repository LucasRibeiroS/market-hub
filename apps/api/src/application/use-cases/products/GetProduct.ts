import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IProduct, IVariant } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'

import { productJsonSchema, variantJsonSchema } from '@utils/typebox/schema'

type GetProductRequest = {
	id: string
	user_id: string
}
type T = GetProductRequest
type GetProductResponse = {
	product: { variants: IVariant[] } & IProduct
}
type K = GetProductResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Products'],
	summary: 'Get product',
	description: 'Get a product by ID',
	response: Type.Object({
		product: Type.Intersect([
			Type.Ref(productJsonSchema.$id),
			Type.Object({
				variants: Type.Array(Type.Ref(variantJsonSchema.$id))
			})
		])
	}, { $id: 'products/GetProductResponse' })
})
export class GetProduct implements IUseCase<T, K> {
	constructor(@inject(ProductsRepositorySymbol) private productsRepository: IProductsRepository) {}

	async execute({ id, user_id }: T): Promise<K> {
		const product = await this.productsRepository.findById(id)
		if (product === null || product.user_id !== user_id) {
			throw new NotFoundException('Product not found')
		}

		return { product }
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		id: Type.String(),
		user_id: Type.String()
	})

	protected $id = 'products/GetProductValidator'
	protected schema = Validator.schema
}