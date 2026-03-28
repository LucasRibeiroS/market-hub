import { env } from '@config/env'

type StoppableServer = { stop: () => Promise<void> | void }

export const gracefulShutdown = async(servers: StoppableServer[]) => {
	console.log(`[${env.APPLICATION_NAME}] Shutting down gracefully...`)
	await Promise.all(servers.map(server => server.stop()))
	process.exit(0)
}