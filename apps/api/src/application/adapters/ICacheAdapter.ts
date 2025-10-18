export type IGetParams = {
	key: string
	path?: string
}
export type ISetParams = {
	key: string
	path?: string
	data: unknown
	expiresIn?: number
}
export type IRemoveParams = {
	pattern: string
}

export type IPushParams = {
	path: string
	data: unknown
	// Only used when the list is created
	expiresIn?: number
}

export interface ICacheAdapter {
	// Generic methods
	get<T = unknown>(params: IGetParams): Promise<T>
	set(params: ISetParams): Promise<void>
	remove(params: IRemoveParams): Promise<void>
	// List methods
	push(params: IPushParams): Promise<number> // Returns the length of the list after the push operation
}