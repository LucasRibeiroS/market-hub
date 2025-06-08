import { TSchema } from '@sinclair/typebox'

import { Require } from '@utils/types'
import { BadRequestException } from '@utils/exception'
import { IDocumentation } from '@utils/documentation'

import { ajv, formatValidationError } from '@clients/ajv'

export interface IValidator<T> {
	/**
	 * (Optional) The documentation for the use case, including tags, summary, description, and schemas.
	 */
	documentation?: Require<Pick<IDocumentation, 'request'>, 'request'>

	validate(data: T): Promise<T>
}

export abstract class BaseValidator<T> implements IValidator<T> {
	protected abstract schema: { $id: string } & TSchema
	documentation?: IValidator<T>['documentation']

	async validate(data: T): Promise<T> {
		const validator = ajv.getSchema(this.schema.$id) || ajv.compile(this.schema)
		if (validator(data)) {
			return data
		}
		throw new BadRequestException(formatValidationError(validator.errors))
	}
}