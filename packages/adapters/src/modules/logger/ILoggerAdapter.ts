export interface ILoggerAdapter {
	log(message: string): void
	warn(message: string): void
	error(message: string): void
}

export const LoggerAdapterSymbol = Symbol('ILoggerAdapter')