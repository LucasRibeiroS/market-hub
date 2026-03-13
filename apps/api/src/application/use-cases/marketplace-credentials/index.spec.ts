import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/marketplace-credentials'

describe('marketplace-credentials use-cases', () => {
	test('should resolve use-cases without throwing', () => {
		// Fix: Wrap the resolution in a function to properly test if it throws
		expect(() => container.resolve(useCases.RefreshMarketplaceCredential)).not.toThrow()
	})
})