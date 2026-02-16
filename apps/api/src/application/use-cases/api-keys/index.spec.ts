import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/api-keys'

describe('api-keys use-cases', () => {
	test('should resolve use-cases without throwing', () => {
		// Fix: Wrap the resolution in a function to properly test if it throws
		expect(() => container.resolve(useCases.CreateApiKey)).not.toThrow()
		expect(() => container.resolve(useCases.DeleteApiKey)).not.toThrow()
		expect(() => container.resolve(useCases.ListApiKeys)).not.toThrow()
		expect(() => container.resolve(useCases.UpdateApiKey)).not.toThrow()
	})
})