import { ILoggerAdapter } from '@logger/ILoggerAdapter'

export class ConsoleLoggerAdapter implements ILoggerAdapter {
	log(message: string): void {
		console.log(message)
	}

	warn(message: string): void {
		console.warn(message)
	}

	error(message: string): void {
		console.error(message)
	}
}