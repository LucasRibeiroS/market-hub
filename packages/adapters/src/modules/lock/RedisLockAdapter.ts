import { redisClient } from '@clients/redis'
import {
	AvailableLocks,
	IAcquireParams,
	ILockAdapter,
	IReleaseParams
} from '@lock/ILockAdapter'

export class RedisLockAdapter implements ILockAdapter {
	constructor() {
		this.validateEnv()
	}

	private lockToPath: Record<AvailableLocks, string> = {
		'TRANSACTIONS:ONGOING': 'transactions:ongoing',
		'AFFILIATEDS:EXPORT': 'affiliateds:export',
		'CHARGEBACKS:EXPORT': 'chargebacks:export',
		'DROPOUTS:EXPORT': 'dropouts:export',
		'REFUNDS:EXPORT': 'refunds:export',
		'SALES:EXPORT': 'transactions:export',
		'SUBSCRIPTIONS:EXPORT': 'subscriptions:export',
		'WITHDRAWALS:CREATE': 'withdrawals:create',
		'WITHDRAWALS:ONGOING': 'withdrawals:ongoing'
	}

	async acquire({ lock, key }: IAcquireParams): Promise<boolean> {
		const path = this.lockToPath[lock]
		const result = await redisClient.set(
			`${path}:${key}`,
			new Date().toISOString(),
			'EX', 60, // Expire after 60 seconds
			'NX' // Only set if not exists

		)
		return result === 'OK'
	}

	async release({ lock, key }: IReleaseParams): Promise<void> {
		const path = this.lockToPath[lock]
		await redisClient.del(`${path}:${key}`)
	}

	private validateEnv(): void {
		if (!process.env.REDIS_HOST) {
			throw new Error('Invalid environment variables: "REDIS_HOST" is required')
		}
		if (!process.env.REDIS_PORT) {
			throw new Error('Invalid environment variables: "REDIS_PORT" is required')
		}
	}
}