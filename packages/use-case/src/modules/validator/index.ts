import { Static, TSchema } from '@sinclair/typebox'

import { IValidator } from '@modules/validator/types'
import { ValidatorMetadataKeys } from '@modules/validator/decorator'

import { ajv, formatValidationError } from '@clients/ajv'

import { BadRequestException } from '@utils/exceptions'

export abstract class BaseValidator<
	T extends Static<S>,
	S extends TSchema
> implements IValidator<T> {
	protected abstract $id: string
	protected abstract schema: S

	include?(data: T): Promise<T>

	async validate(data: T): Promise<T> {
		const validator = ajv.getSchema(this.$id) || ajv.compile({ ...this.schema, $id: this.$id })
		if (validator(data)) {
			if (this.include !== undefined) {
				return this.include(data)
			}
			return data
		}
		throw new BadRequestException(formatValidationError(validator.errors))
	}
}

export const ValidateWith = <T>(
	validator_class: () => new () => IValidator<T>
) => (target: object) => {
	return Reflect.defineMetadata(ValidatorMetadataKeys.VALIDATE_WITH, validator_class, target)
}