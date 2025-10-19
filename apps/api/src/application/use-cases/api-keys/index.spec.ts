import { expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/api-keys'

test('api-keys use-cases should instantiate without throwing', () => {
	// The mere import below will throw if construction failed.
	expect(container.resolve(useCases.CreateApiKey)).not.toThrow()
	expect(container.resolve(useCases.ListApiKeys)).not.toThrow()
	expect(container.resolve(useCases.DeleteApiKey)).not.toThrow()
})