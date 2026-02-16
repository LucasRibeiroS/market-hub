import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/auth'

describe('auth use-cases', () => {
	test('auth use-cases should instantiate without throwing', () => {
		// The mere import below will throw if construction failed.
		expect(() => container.resolve(useCases.CreatePasswordReset)).not.toThrow()
		expect(() => container.resolve(useCases.GenerateAccessToken)).not.toThrow()
		expect(() => container.resolve(useCases.Login)).not.toThrow()
		expect(() => container.resolve(useCases.Logout)).not.toThrow()
		expect(() => container.resolve(useCases.Register)).not.toThrow()
		expect(() => container.resolve(useCases.ResetPassword)).not.toThrow()
	})
})