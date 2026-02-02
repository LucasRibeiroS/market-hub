import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IVariant } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'
import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'

import { EmptyObject } from '@utils/types'

type BulkDeleteVariantsRequest = {
	user_id: string
	product_id: string
	variants: Array<Pick<IVariant, 'sku'>>
}
type T = BulkDeleteVariantsRequest
type BulkDeleteVariantsResponse = EmptyObject
type K = BulkDeleteVariantsResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Products', 'Variants'],
	summary: 'Bulk delete variants',
	description: 'Delete multiple variants of a product'
})
export class BulkDeleteVariants implements IUseCase<T, K> {
	constructor(
		@inject(VariantsRepositorySymbol) private variantsRepository: IVariantsRepository,
		@inject(ProductsRepositorySymbol) private productsRepository: IProductsRepository
	) {}

	@Transactional()
	async execute({ user_id, product_id, variants }: T): Promise<K> {
		const skusToDelete = variants.map(variant => variant.sku)

		const [productExists, variantsExisting] = await Promise.all([
			this.productsRepository.findByIdSimplified(product_id),
			this.variantsRepository.findMany({
				user_id,
				product_id,
				sku: skusToDelete
			})
		])
		if (productExists === null || productExists.user_id !== user_id) {
			throw new NotFoundException('Product not found')
		}
		if (skusToDelete.some(sku => !variantsExisting.find(v => v.sku === sku))) {
			throw new NotFoundException('One or more variants were not found')
		}

		await this.variantsRepository.deleteMany({ id: variantsExisting.map(v => v.id) })

		return {}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id', 'product_id'], { $id: 'variants/BulkDeleteVariantsRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		product_id: Type.String(),
		variants: Type.Array(
			Type.Object({
				sku: Type.String({ minLength: 3, maxLength: 100 })
			}), { minItems: 1, maxItems: 100 }
		)
	})

	protected $id = 'variants/BulkDeleteVariantsValidator'
	protected schema = Validator.schema
}
