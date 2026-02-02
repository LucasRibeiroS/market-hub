import { inject, injectable } from 'tsyringe'

import { IVariant } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { Documentation } from '@integrator-packages/use-case/documentation'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { NotFoundException } from '@integrator-packages/use-case/exceptions'

import { IVariantsRepository, VariantsRepositorySymbol } from '@repositories/IVariantsRepository'
import { Type } from '@sinclair/typebox'
import { variantJsonSchema } from '@utils/typebox/schema'

type GetVariantBySkuRequest = {
	sku: string
	user_id: string
}
type T = GetVariantBySkuRequest
type GetVariantBySkuResponse = {
	variant: IVariant
}
type K = GetVariantBySkuResponse

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Variants'],
	summary: 'Get Variant by SKU',
	description: 'Retrieves a variant based on the provided SKU.',
	response: Type.Object({
		variant: Type.Ref(variantJsonSchema.$id)
	}, { $id: 'variants/GetVariantBySkuResponse' })
})
export class GetVariantBySku implements IUseCase<T, K> {
	constructor(
		@inject(VariantsRepositorySymbol) private variantsRepository: IVariantsRepository
	) {}

	async execute({ sku, user_id }: T): Promise<K> {
		const variant = await this.variantsRepository.findFirst({ sku })
		if (variant === null || variant.user_id !== user_id) {
			throw new NotFoundException('Variant not found')
		}

		return { variant }
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'variants/GetVariantBySkuRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		sku: Type.String({ minLength: 3, maxLength: 100 })
	})

	protected $id: string = 'variants/GetVariantBySkuValidator'
	protected schema = Validator.schema
}