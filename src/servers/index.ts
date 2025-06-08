import cluster from 'node:cluster'
import process from 'node:process'
import { cpus } from 'node:os'

import { env } from '@utils/env'

import HttpServer from '@http/app'

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
	HttpServer.start()
}