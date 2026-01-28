import { AsyncLocalStorage } from 'node:async_hooks'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import * as schema from '@drizzle/schema'
import { drizzleClient } from '@drizzle/client'

// Define the specific type of your Database/Transaction
type DrizzleDatabaseClient = PostgresJsDatabase<typeof schema>

// Create the storage for the transaction
export const txStorage = new AsyncLocalStorage<DrizzleDatabaseClient>()

// The helper function your Repositories will use
export const getDatabaseClient = (): DrizzleDatabaseClient => {
	const tx = txStorage.getStore()
	// If we are inside a transaction, return it. Otherwise, return the global client.
	return tx ?? drizzleClient
}