export type IGetParams = {
	key: string
	path?: string
}
export type ISetParams = {
	key: string
	path?: string
	data: unknown
	/**
 	 * In seconds
 	 */
	expiresIn?: number
}
export type IRemoveParams = {
	pattern: string
}

export type IPushParams = {
	path: string
	data: unknown
	/**
 	 * In seconds. Only used when the list is created
 	 */
	expiresIn?: number
}

export type ILengthParams = {
	path: string
}

export interface ICacheAdapter {
	// Generic methods
	get<T = unknown>(params: IGetParams): Promise<T | null>
	set(params: ISetParams): Promise<void>
	remove(params: IRemoveParams): Promise<void>
	// List methods
	push(params: IPushParams): Promise<number> // Returns the length of the list after the push operation
	length(params: ILengthParams): Promise<number>
}

export const CacheAdapterSymbol = Symbol('ICacheAdapter')