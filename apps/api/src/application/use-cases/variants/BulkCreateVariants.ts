import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IVariant } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { ConflictException, NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'
import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'

import { TNullable, TNumeric } from '@utils/typebox/schema'

type BulkCreateVariantsRequest = {
	user_id: string
	product_id: string
	variants: Array<Pick<
		IVariant,
        | 'sku'
        | 'ean'
        | 'price'
        | 'weight_kg'
        | 'height_cm'
        | 'width_cm'
        | 'depth_cm'
        | 'images'
	>>
}
type T = BulkCreateVariantsRequest
type BulkCreateVariantsResponse = {
	variants: Array<Pick<IVariant, 'id' | 'sku'>>
}
type K = BulkCreateVariantsResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Products', 'Variants'],
	summary: 'Bulk create variants',
	description: 'Create multiple variants for a product',
	response: Type.Object({
		variants: Type.Array(Type.Object({ id: Type.String(), sku: Type.String() }))
	}, { $id: 'variants/BulkCreateVariantsResponse' })
})
export class BulkCreateVariants implements IUseCase<T, K> {
	constructor(
		@inject(VariantsRepositorySymbol) private variantsRepository: IVariantsRepository,
		@inject(ProductsRepositorySymbol) private productsRepository: IProductsRepository
	) {}

	@Transactional()
	async execute({ user_id, product_id, ...data }: T): Promise<K> {
		const productExists = await this.productsRepository.findByIdSimplified(product_id)
		if (productExists === null || productExists.user_id !== user_id) {
			throw new NotFoundException('Product not found')
		}

		await this.validateSkuUniquenessOrThrow({ user_id, sku: data.variants.map(v => v.sku) })

		const variants = await this.variantsRepository.createMany(
			data.variants.map(variant => ({
				...variant,
				user_id,
				product_id,
				attributes: {}
			}))
		)

		return {
			variants: variants.map(variant => ({ id: variant.id, sku: variant.sku }))
		}
	}

	private async validateSkuUniquenessOrThrow({ user_id, sku }: IValidateSkuUniquenessParams): Promise<void> {
		const variants = await this.variantsRepository.findMany({ user_id, sku })
		if (variants.length > 0) {
			throw new ConflictException(`The following SKUs already exist: ${variants.map(v => v.sku).join(', ')}`)
		}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id', 'product_id'], { $id: 'variants/BulkCreateVariantsRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		product_id: Type.String(),
		variants: Type.Array(
			Type.Object({
				sku: Type.String({ minLength: 3, maxLength: 100 }),
				ean: TNullable(Type.String({ minLength: 3, maxLength: 50 })),
				price: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
				weight_kg: TNumeric({ precision: 10, scale: 3, minimum: 0.001 }),
				height_cm: TNumeric({ precision: 10, scale: 2, minimum: 0.1 }),
				width_cm: TNumeric({ precision: 10, scale: 2, minimum: 0.1 }),
				depth_cm: TNumeric({ precision: 10, scale: 2, minimum: 0.1 }),
				images: Type.Array(Type.String({ format: 'uri', maxLength: 20 }))
			}), { minItems: 1, maxItems: 100 }
		)
	})

	protected $id = 'variants/BulkCreateVariantsValidator'
	protected schema = Validator.schema
}

type IValidateSkuUniquenessParams = {
	user_id: string
	sku: string[]
}