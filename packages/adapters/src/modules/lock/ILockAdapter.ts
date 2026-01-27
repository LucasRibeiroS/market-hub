export type AvailableLocks =
	| 'TRANSACTIONS:ONGOING'
	| 'AFFILIATEDS:EXPORT'
	| 'CHARGEBACKS:EXPORT'
	| 'DROPOUTS:EXPORT'
	| 'REFUNDS:EXPORT'
	| 'SALES:EXPORT'
	| 'SUBSCRIPTIONS:EXPORT'
	| 'WITHDRAWALS:CREATE'
	| 'WITHDRAWALS:ONGOING'

export type IAcquireParams = {
	lock: AvailableLocks
	key: string
}
export type IReleaseParams = {
	lock: AvailableLocks
	key: string
}

export interface ILockAdapter {
	/**
	 * Attempts to acquire a distributed lock with the specified parameters.
	 *
	 * @param params - The parameters required to acquire the lock.
	 * @returns A promise that resolves to `true` if the lock was successfully acquired, or `false` otherwise.
	 */
	acquire(params: IAcquireParams): Promise<boolean>

	/**
	 * Releases a previously acquired distributed lock with the specified parameters.
	 *
	 * @param params - The parameters required to release the lock.
	 * @returns A promise that resolves when the lock has been successfully released.
	 */
	release(params: IReleaseParams): Promise<void>
}