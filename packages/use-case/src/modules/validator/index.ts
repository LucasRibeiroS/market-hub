import hash from 'object-hash'
import { Static, TSchema } from '@sinclair/typebox'

import { IValidator } from '@modules/validator/types'
import { ValidatorMetadataKeys } from '@modules/validator/decorator'

import { ajv, formatValidationError } from '@clients/ajv'

import { BadRequestException } from '@utils/exceptions'

export abstract class BaseValidator<
	T extends Static<S>,
	S extends TSchema
> implements IValidator<T> {
	protected $id?: string

	protected abstract schema: S

	private get schemaId(): string {
		if (this.$id) return this.$id
		// Generates a unique string based on the structure of the schema itself
		return hash(this.schema)
	}

	async validate(data: T): Promise<T> {
		// Use the private getter instead of this.$id
		const id = this.schemaId
		const validator = ajv.getSchema(id) || ajv.compile({ ...this.schema, $id: id })

		if (validator(data)) {
			return this.include ? this.include(data) : data
		}
		throw new BadRequestException(formatValidationError(validator.errors))
	}

	include?(data: T): Promise<T>
}

export const ValidateWith = <T>(
	validator_class: () => new () => IValidator<T>
) => (target: object) => {
	return Reflect.defineMetadata(ValidatorMetadataKeys.VALIDATE_WITH, validator_class, target)
}