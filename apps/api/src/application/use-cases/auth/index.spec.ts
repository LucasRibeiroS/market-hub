import { expect, test } from 'vitest'

import * as useCases from '@use-cases/auth'

test('auth use-cases should instantiate without throwing', () => {
	// The mere import below will throw if construction failed.
	expect(useCases.createPasswordReset).toBeDefined()
	expect(useCases.generateAccessToken).toBeDefined()
	expect(useCases.login).toBeDefined()
	expect(useCases.register).toBeDefined()
	expect(useCases.resetPassword).toBeDefined()
})