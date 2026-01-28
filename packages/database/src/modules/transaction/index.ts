import { drizzleClient } from '@drizzle/client'

import { txStorage } from '@transaction/context'

export const Transactional = () => (
	_: unknown,
	__: string,
	descriptor: PropertyDescriptor
) => {
	const originalMethod = descriptor.value

	descriptor.value = async function(...args: unknown[]) {
		const currentTx = txStorage.getStore()

		// Check if we are already inside an active transaction
		// if yes, just execute the method using the existing transaction
		if (currentTx) {
			return originalMethod.apply(this, args)
		}

		// Start a new transaction
		return drizzleClient.transaction(async(tx) => {
			// Wrap the execution in the AsyncLocalStorage context
			return txStorage.run(tx, async() => {
				return originalMethod.apply(this, args)
			})
		})
	}

	return descriptor
}