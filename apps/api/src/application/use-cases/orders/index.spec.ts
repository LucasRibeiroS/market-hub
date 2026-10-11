import { describe, expect, test } from 'vitest'
import { container } from 'tsyringe'

import * as useCases from '@use-cases/orders'

describe('orders use-cases', () => {
	test('orders use-cases should instantiate without throwing', () => {
		expect(() => container.resolve(useCases.DeleteOrder)).not.toThrow()
		expect(() => container.resolve(useCases.ProcessMagaluOrderWebhook)).not.toThrow()
		expect(() => container.resolve(useCases.ProcessMercadoLivreOrderWebhook)).not.toThrow()
		expect(() => container.resolve(useCases.SyncMercadoLivreOrder)).not.toThrow()
		expect(() => container.resolve(useCases.ListOrders)).not.toThrow()
		expect(() => container.resolve(useCases.UpsertOrder)).not.toThrow()
	})
})