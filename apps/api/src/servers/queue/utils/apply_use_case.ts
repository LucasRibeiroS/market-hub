import { container } from 'tsyringe'

import { IUseCase, UseCaseFactory } from '@integrator-packages/use-case'

export const applyUseCase = async <T, K>(
	// eslint-disable-next-line typescript/no-explicit-any
	use_case_class: new (...args: any[]) => IUseCase<T, K>,
	data: T
) => {
	const useCase = UseCaseFactory.create(container.resolve(use_case_class))

	const { process, body } = await useCase.handle(data)

	if (process === 'failed') {
		throw new Error(body)
	}

	return body
}