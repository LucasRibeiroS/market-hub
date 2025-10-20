import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/users'

describe('users use-cases', () => {
	test('users use-cases should instantiate without throwing', () => {
		// The mere import below will throw if construction failed.
		expect(() => container.resolve(useCases.GetUser)).not.toThrow()
	})
})