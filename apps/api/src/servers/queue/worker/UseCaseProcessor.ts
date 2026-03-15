import { container } from 'tsyringe'

import { IUseCase, UseCaseFactory } from '@integrator-packages/use-case'

export class UseCaseProcessor {
	// eslint-disable-next-line typescript/no-explicit-any
	async apply<T, K>(useCaseClass: new (...args: any[]) => IUseCase<T, K>, data: T) {
		const useCase = UseCaseFactory.create(container.resolve(useCaseClass))

		const { process, body } = await useCase.handle(data)

		if (process === 'failed') {
			throw new Error(body)
		}

		return body
	}
}