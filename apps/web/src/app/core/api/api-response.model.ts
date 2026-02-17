interface ISuccessResponse<T> {
	body: T
	process: 'success'
}

interface IFailedResponse {
	body: string
	process: 'failed'
}

export type ApiResponse<T> = ISuccessResponse<T> | IFailedResponse

export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
	return typeof obj === 'object' &&
		obj !== null &&
		'process' in obj &&
		typeof (obj as ApiResponse<T>).process === 'string' &&
		'body' in obj
}