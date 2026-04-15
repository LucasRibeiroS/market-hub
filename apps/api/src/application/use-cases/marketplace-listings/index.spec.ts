import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/marketplace-listings'

describe('marketplace-listings use-cases', () => {
	test('marketplace-listings use-cases should instantiate without throwing', () => {
		// The mere import below will throw if construction failed.
		expect(() => container.resolve(useCases.BulkCreateMarketplaceListings)).not.toThrow()
		expect(() => container.resolve(useCases.GetMarketplaceListing)).not.toThrow()
		expect(() => container.resolve(useCases.ListMarketplaceListings)).not.toThrow()
		expect(() => container.resolve(useCases.PublishMarketplaceListings)).not.toThrow()
	})
})