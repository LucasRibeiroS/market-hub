import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/products'

describe('products use-cases', () => {
	test('products use-cases should instantiate without throwing', () => {
		// The mere import below will throw if construction failed.
		expect(() => container.resolve(useCases.CreateProduct)).not.toThrow()
		expect(() => container.resolve(useCases.GetProduct)).not.toThrow()
		expect(() => container.resolve(useCases.GetProductRequiredAttributes)).not.toThrow()
		expect(() => container.resolve(useCases.ListProducts)).not.toThrow()
		expect(() => container.resolve(useCases.UpdateProduct)).not.toThrow()
	})
})