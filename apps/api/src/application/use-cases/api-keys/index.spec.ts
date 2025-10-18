import { expect, test } from 'vitest'

import * as useCases from '@use-cases/api-keys'

test('api-keys use-cases should instantiate without throwing', () => {
	// The mere import below will throw if construction failed.
	expect(useCases.createApiKey).toBeDefined()
	expect(useCases.listApiKeys).toBeDefined()
	expect(useCases.deleteApiKey).toBeDefined()
})