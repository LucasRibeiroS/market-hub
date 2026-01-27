import { redisClient } from '@clients/redis'
import {
	ICacheAdapter,
	IGetParams,
	ILengthParams,
	IPushParams,
	IRemoveParams,
	ISetParams
} from '@cache/ICacheAdapter'

type IMountKeyParams = {
	key: string
	path?: string
}

export class RedisCacheAdapter implements ICacheAdapter {
	constructor() {
		this.validateEnv()
	}

	async get<T>(path: IGetParams): Promise<T | null> {
		return await redisClient
			.get(this.mountKey(path))
			.then(data => data !== null ? JSON.parse(data) : null)
	}

	async set({ data, expiresIn, ...path }: ISetParams): Promise<void> {
		await redisClient.set(this.mountKey(path), JSON.stringify(data))
		if (expiresIn !== undefined) {
			await redisClient.expire(this.mountKey(path), expiresIn)
		}
	}

	async remove({ pattern }: IRemoveParams): Promise<void> {
		const keys = await redisClient.keys(pattern)
		if (keys.length > 0) {
			await redisClient.del(keys)
		}
	}

	async push({ path, data, expiresIn }: IPushParams): Promise<number> {
		const len = await redisClient.rpush(path, JSON.stringify(data))
		if (len === 1 && expiresIn !== undefined) {
			// set the expiration time for the list itself
			await redisClient.expire(path, expiresIn)
		}
		return len
	}

	async length({ path }: ILengthParams): Promise<number> {
		return await redisClient.llen(path)
	}

	private mountKey({ key, path }: IMountKeyParams): string {
		if (path !== undefined) {
			return `${path}:${key}`
		}
		return key
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