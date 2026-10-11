import { env } from '@config/env'
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from '@constants/units'

/**
 * Periodically requests the public URL of the service. Hosts that suspend idle services (e.g. Render free
 * instances, after 15 minutes without inbound traffic) count these requests as traffic.
 */
export class KeepAlive {
	private static readonly INTERVAL_IN_MS = 10 * ONE_MINUTE_IN_MS
	private static readonly TIMEOUT_IN_MS = 30 * ONE_SECOND_IN_MS

	private timer?: NodeJS.Timeout

	constructor(private readonly url: string) {}

	start() {
		this.timer = setInterval(() => this.ping(), KeepAlive.INTERVAL_IN_MS)
		// Must not hold the process open during shutdown
		this.timer.unref()

		console.log(`[${env.APPLICATION_NAME}] Keep alive enabled for ${this.url}`)
	}

	stop() {
		clearInterval(this.timer)
	}

	async ping(): Promise<boolean> {
		try {
			const res = await fetch(this.url, { signal: AbortSignal.timeout(KeepAlive.TIMEOUT_IN_MS) })
			if (!res.ok) {
				console.warn(`[${env.APPLICATION_NAME}] Keep alive request returned status ${res.status}`)
			}

			return res.ok
		} catch(error) {
			console.warn(`[${env.APPLICATION_NAME}] Keep alive request failed`, error)

			return false
		}
	}
}
