import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IVariant } from '@integrator-packages/database/entities'
import { Transactional } from '@integrator-packages/database/transaction'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'

import { variantJsonSchema } from '@utils/typebox'

type UpdateVariantBySkuRequest = {
	sku: string
	user_id: string
	data: Partial<Pick<
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
}
type UpdateVariantBySkuResponse = {
	variant: IVariant
}
type T = UpdateVariantBySkuRequest
type K = UpdateVariantBySkuResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Variants'],
	summary: 'Update a variant by SKU',
	description: 'Update the details of an existing variant',
	response: Type.Object({
		variant: Type.Ref(variantJsonSchema.$id)
	}, { $id: 'variants/UpdateVariantBySkuResponse' })
})
export class UpdateVariantBySku implements IUseCase<T, K> {
	constructor(
		@inject(VariantsRepositorySymbol)
		private readonly variantsRepository: IVariantsRepository
	) {}

	@Transactional()
	async execute({ sku, user_id, data }: T): Promise<K> {
		const existingVariant = await this.variantsRepository.findFirst({ user_id, sku })
		if (existingVariant === null || existingVariant.user_id !== user_id) {
			throw new NotFoundException('Variant not found')
		}

		const variant = await this.variantsRepository.update(existingVariant.id, data)

		return { variant }
	}
}

@Documentation({
	request: Type.Index(Validator.schema, ['data'], { $id: 'variants/UpdateVariantBySkuRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		sku: Type.String({ minLength: 3, maxLength: 100 }),
		user_id: Type.String(),
		data: Type.Partial(
			Type.Pick(variantJsonSchema, [
				'sku',
				'ean',
				'price',
				'weight_kg',
				'height_cm',
				'width_cm',
				'depth_cm',
				'images',
				'attributes'
			])
		)
	})

	protected schema = Validator.schema
}