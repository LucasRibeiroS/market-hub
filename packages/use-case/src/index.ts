import 'reflect-metadata'

import { IValidator } from '@modules/validator/types'
import { IDocumentation } from '@modules/documentation/types'

import { IResponse, SuccessResponse } from '@utils/response'
import { isHttpException, ServerErrorException } from '@utils/exceptions'
import { getMetadata, MetadataKeys } from '@utils/decorators'

/**
 * Represents a generic use case interface.
 * @template T - The input data type.
 * @template K - The output data type.
 */
export interface IUseCase<T, K> {
	/**
     * Executes the use case by processing the input data and returning a response.
     * @param data - The input data.
     * @returns A promise that resolves to a response of type K.
     */
	execute(data: T): Promise<K>

	/**
 	 * (Optional) Performs any deferred or cleanup operations after the use case execution.
 	 * @param data - The input data for deferred processing.
 	 * @returns A promise that resolves when the deferred operation is complete.
 	 */
	defer?(): Promise<void>
}

/**
 * Represents a wrapped use case that
 *
 * @template T - The type of data that the use case handles.
 * @template K - The type of response that the use case returns.
 */
export interface IWrappedUseCase<T, K> {
	documentation?: IDocumentation

	handle(data: T): Promise<IResponse<K>>
}

/**
 * Represents a handler for executing use cases.
 * @template T The input data type for the use case.
 * @template K The output data type for the use case.
 */
export class UseCaseHandler<T, K> implements IWrappedUseCase<T, K> {
	documentation: IWrappedUseCase<T, K>['documentation']

	constructor(
		private useCase: IUseCase<T, K>,
		private validator?: IValidator<T>
	) {}

	/**
     * Handles the internal calls of the use case.
     * @param data The input data for the use case.
     * @returns A promise that resolves to the response from the use case execution.
     */
	async handle(data: T): Promise<IResponse<K>> {
		try {
			const validated = this.validator !== undefined
				? await this.validator.validate(data)
				: data
			const result = await this.useCase.execute(validated)

			return new SuccessResponse(result)
		} catch(error) {
			if (isHttpException(error)) {
				return error
			}
			console.error(`${this.useCase.constructor.name} error:`, error)
			return new ServerErrorException('Internal server error')
		} finally {
			if (this.useCase.defer !== undefined) {
				await this.useCase.defer()
			}
		}
	}
}

/**
 * Factory class for creating wrapped use cases with optional validation.
 * Provides a standardized way to instantiate use cases with their associated validators,
 * ensuring type safety and proper error handling.
 */
export class UseCaseFactory {
	/**
   * Creates a wrapped use case with optional validation
   * @param useCase - The use case to wrap
   * @returns Wrapped use case instance
   * @throws Error if use case is null or undefined
   */
	static create<T, K>(use_case: IUseCase<T, K>): IWrappedUseCase<T, K> {
		// Get validator constructor with proper typing
		const getValidatorClass = getMetadata(MetadataKeys.VALIDATE_WITH)<T>(use_case.constructor)
		// Safely retrieve validator constructor
		const ValidatorClass = getValidatorClass?.()
		// Create validator instance only if ValidatorClass exists
		const validator = ValidatorClass ? new ValidatorClass() : undefined

		const documentation = getMetadata(MetadataKeys.DOCUMENTATION)<T>(use_case.constructor)
		if (validator && documentation) {
			documentation.request = getMetadata(MetadataKeys.DOCUMENTATION)<T>(validator.constructor)?.request
		}

		const handler = new UseCaseHandler(use_case, validator)
		handler.documentation = documentation
		return handler
	}
}

export * from './modules/orchestrator'