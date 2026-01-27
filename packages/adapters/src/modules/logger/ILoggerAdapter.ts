export interface ILoggerAdapter {
	log(message: string): void
	error(message: string): void
}