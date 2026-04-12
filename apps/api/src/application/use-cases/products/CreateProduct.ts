import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IProduct, IVariant } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { ConflictException } from '@integrator-packages/use-case/exceptions'

import { IProductsRepository, ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'

import { productJsonSchema, variantJsonSchema } from '@utils/typebox'

type CreateProductRequest = {
	user_id: string
	product: {
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
			| 'attributes'
		>>
	} & Pick<IProduct, 'name' | 'description' | 'attributes'>
}
type T = CreateProductRequest
type CreateProductResponse = {
	product: {
		variants: Array<Pick<IVariant, 'id' | 'sku'>>
	} & Pick<IProduct, 'id'>
}
type K = CreateProductResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Products'],
	summary: 'Create product',
	description: 'Create a new product with variants',
	response: Type.Object({
		product: Type.Object({
			id: Type.String(),
			variants: Type.Array(Type.Object({
				id: Type.String(),
				sku: Type.String()
			}))
		})
	}, { $id: 'products/CreateProductResponse' })
})
export class CreateProduct implements IUseCase<T, K> {
	constructor(
		@inject(ProductsRepositorySymbol) private productsRepository: IProductsRepository,
		@inject(VariantsRepositorySymbol) private variantsRepository: IVariantsRepository
	) {}

	@Transactional()
	async execute({ user_id, ...data }: T): Promise<K> {
		const product = await this.productsRepository.create({
			user_id,
			name: data.product.name,
			description: data.product.description,
			attributes: data.product.attributes
		})
		if (data.product.variants.length === 0) {
			return {
				product: { id: product.id, variants: [] }
			}
		}

		await this.validateSkuUniqueness({
			user_id,
			sku: data.product.variants.map(variant => variant.sku)
		})

		const variants = await this.variantsRepository.createMany(
			data.product.variants.map(variant => ({
				...variant,
				user_id,
				product_id: product.id,
				is_primary: false
			}))
		)

		return {
			product: {
				id: product.id,
				variants: variants.map(variant => ({ id: variant.id, sku: variant.sku }))
			}
		}
	}

	/**
	 * @throws ConflictException if any of the provided SKUs already exist for the user
	 */
	private async validateSkuUniqueness({ user_id, sku }: IValidateSkuUniquenessParams): Promise<void> {
		const variants = await this.variantsRepository.findMany({ user_id, sku })
		if (variants.length > 0) {
			throw new ConflictException(`The following SKUs already exist: ${variants.map(v => v.sku).join(', ')}`)
		}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'products/CreateProductRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		product: Type.Composite([
			Type.Pick(productJsonSchema, ['name', 'description', 'attributes']),
			Type.Object({
				variants: Type.Array(Type.Pick(
					variantJsonSchema, [
						'sku',
						'ean',
						'price',
						'weight_kg',
						'height_cm',
						'width_cm',
						'depth_cm',
						'images',
						'attributes'
					]
				), { default: [], maxItems: 100 })
			})
		])
	})

	protected schema = Validator.schema
}

type IValidateSkuUniquenessParams = {
	user_id: string
	sku: string[]
}