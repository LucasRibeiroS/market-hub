import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'

import { ILoggerAdapter } from '@logger/ILoggerAdapter'

export class FileLoggerAdapter implements ILoggerAdapter {
	private readonly _opts = {
		logger: format.combine(
			format.timestamp({
				format: 'YYYY-MM-DD HH:mm:ss'
			}),
			format.errors({ stack: true }),
			format.splat(),
			format.json()
		),
		transport: {
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			filename: '%DATE%.log'
		}
	}

	private readonly infoLogger = createLogger({
		...this._opts.logger,
		transports: [
			new transports.DailyRotateFile({
				...this._opts.transport,
				dirname: 'logs/info'
			})
		]
	})
	private readonly errorLogger = createLogger({
		...this._opts.logger,
		level: 'error',
		transports: [
			new transports.DailyRotateFile({
				...this._opts.transport,
				level: 'error',
				dirname: 'logs/error'
			})
		]
	})

	info(message: string): void {
		this.infoLogger.log('info', message)
	}

	warn(message: string): void {
		this.infoLogger.log('warn', message)
	}

	error(message: string): void {
		this.errorLogger.log('error', message)
	}
}
