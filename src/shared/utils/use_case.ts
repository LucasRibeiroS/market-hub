import { CustomOmit } from '@utils/types'
import { IResponse, SuccessResponse } from '@utils/response'
import { isHttpException, ServerErrorException } from '@utils/exception'
import { IValidator } from '@utils/validator'
import { IDocumentation } from '@utils/documentation'

/**
 * Represents a generic use case interface.
 * @template T - The input data type.
 * @template K - The output data type.
 */
export interface IUseCase<T, K> {
	/**
	 * (Optional) The documentation for the use case, including tags, summary, description, and schemas.
	 */
	documentation: CustomOmit<IDocumentation, 'request'>

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
	documentation: IDocumentation

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
	) {
		this.documentation = {
			...this.useCase.documentation,
			...this.validator?.documentation
		}
	}

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
		} catch (error) {
			if (isHttpException(error)) {
				return error
			}

			return new ServerErrorException(error.message)
		} finally {
			if (this.useCase.defer !== undefined) {
				await this.useCase.defer()
			}
		}
	}
}