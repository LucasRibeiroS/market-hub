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

import { TNullable, TNumeric } from '@utils/typebox/schema'

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
		>>
	} & Pick<IProduct, 'name' | 'description'>
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
			variants: Type.Array(Type.Object({ id: Type.String() }))
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
			attributes: {}
		})
		if (data.product.variants.length === 0) {
			return {
				product: { id: product.id, variants: [] }
			}
		}

		await this.validateSkuUniquenessOrThrow({
			user_id,
			sku: data.product.variants.map(variant => variant.sku)
		})

		const variants = await this.variantsRepository.createMany(
			data.product.variants.map(variant => ({
				...variant,
				user_id,
				product_id: product.id,
				attributes: {}
			}))
		)

		return {
			product: {
				id: product.id,
				variants: variants.map(variant => ({ id: variant.id, sku: variant.sku }))
			}
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
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'products/CreateProductRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		product: Type.Object({
			name: Type.String({ minLength: 3, maxLength: 150 }),
			description: Type.String({ minLength: 0, maxLength: 1000 }),
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
				}), { default: [], maxItems: 100 }
			)
		})
	})

	protected $id = 'products/CreateProductValidator'
	protected schema = Validator.schema
}

type IValidateSkuUniquenessParams = {
	user_id: string
	sku: string[]
}