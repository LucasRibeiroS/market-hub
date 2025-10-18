import { Static, TSchema } from '@sinclair/typebox'

import { ajv, formatValidationError } from '@clients/ajv'

import { BadRequestException } from '@utils/exception'
import { MetadataKeys } from '@utils/decorators'

export interface IValidator<T> {
	validate(data: T): Promise<T>
	/**
	 * Optionally performs additional processing on the data after initial validation.
	 *
	 * @param data - The data to process
	 * @returns A Promise resolving to the processed data
	 */
	include?(data: T): Promise<T>
}

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
	return Reflect.defineMetadata(MetadataKeys.VALIDATE_WITH, validator_class, target)
}