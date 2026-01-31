import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/variants'

describe('variants use-cases', () => {
	test('variants use-cases should instantiate without throwing', () => {
		// The mere import below will throw if construction failed.
		expect(() => container.resolve(useCases.BulkCreateVariants)).not.toThrow()
		expect(() => container.resolve(useCases.BulkDeleteVariants)).not.toThrow()
	})
})