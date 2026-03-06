import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/marketplace-providers'

describe('marketplace-providers use-cases', () => {
	test('should resolve use-cases without throwing', () => {
		expect(() => container.resolve(useCases.ListMarketplaceProviders)).not.toThrow()
	})
})
