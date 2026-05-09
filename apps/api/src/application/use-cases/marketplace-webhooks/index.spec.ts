import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/marketplace-webhooks'

describe('marketplace-webhooks use-cases', () => {
	test('should resolve use-cases without throwing', () => {
		expect(() => container.resolve(useCases.UpsertMarketplaceWebhook)).not.toThrow()
		expect(() => container.resolve(useCases.DeleteMarketplaceWebhook)).not.toThrow()
	})
})
