import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IProduct, IVariant } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'

import { IPagination, IPaginator } from '@utils/pagination'
import { paginationJsonSchema, paginatorJsonSchema, productJsonSchema, variantJsonSchema } from '@utils/typebox/schema'

type ListProductRequest = { user_id: string } & IPaginator
type T = ListProductRequest
type ListProductResponse = {
	products: Array<{ variants: IVariant[] } & IProduct>
	pagination: IPagination
}
type K = ListProductResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Products'],
	summary: 'List products',
	description: 'List all products for a user',
	response: Type.Object({
		products: Type.Array(
			Type.Intersect([
				Type.Ref(productJsonSchema.$id),
				Type.Object({
					variants: Type.Array(Type.Ref(variantJsonSchema.$id))
				})
			])
		),
		pagination: Type.Ref(paginationJsonSchema.$id)
	}, { $id: 'products/ListProductsResponse' })
})
export class ListProducts implements IUseCase<T, K> {
	constructor(@inject(ProductsRepositorySymbol) private productsRepository: IProductsRepository) {}

	async execute(params: T): Promise<K> {
		const { data: products, pagination } = await this.productsRepository.findMany(params)
		return { products, pagination }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'products/ListProductsRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Composite([
		Type.Object({ user_id: Type.String() }),
		paginatorJsonSchema
	])

	protected $id = 'products/ListProductsValidator'
	protected schema = Validator.schema
}