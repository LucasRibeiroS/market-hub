import cluster from 'node:cluster'
import process from 'node:process'
import { cpus } from 'node:os'

import '@config/bootstrap'
import { env } from '@config/env'

import { HttpServer } from '@http/app'
import { QueueServer } from '@queue/app'

import { gracefulShutdown } from './shutdown'

if (cluster.isPrimary && env.NODE_ENV === 'production') {
	console.log(`[${env.APPLICATION_NAME}] Primary cluster with pid ${process.pid} is running`)

	// Fork workers.
	for (let i = 0; i < cpus().length; i++) {
		cluster.fork()
	}

	cluster.on('exit', (worker) => {
		console.log(`[${env.APPLICATION_NAME}] Worker with pid ${worker.process.pid} died`)
	})
} else {
	// Workers can share any TCP connection, in this case it is an http server
	console.log(`[${env.APPLICATION_NAME}] Worker with pid ${process.pid} started`)

	const servers = [new HttpServer(), new QueueServer()]

	servers.forEach(server => server.start())

	process.on('SIGTERM', () => gracefulShutdown(servers))
	process.on('SIGINT', () => gracefulShutdown(servers))

}