import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/marketplace-accounts'

describe('marketplace-accounts use-cases', () => {
	test('should resolve use-cases without throwing', () => {
		expect(() => container.resolve(useCases.CreateMarketplaceAccount)).not.toThrow()
		expect(() => container.resolve(useCases.DeleteMarketplaceAccount)).not.toThrow()
		expect(() => container.resolve(useCases.GetMarketplaceAccount)).not.toThrow()
		expect(() => container.resolve(useCases.ListMarketplaceAccounts)).not.toThrow()
		expect(() => container.resolve(useCases.UpdateMarketplaceAccount)).not.toThrow()
	})
})
