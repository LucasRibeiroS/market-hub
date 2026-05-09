import { UnknownObject } from '@utils/types'
import { TryCatchResult } from '@utils/try_catch'

export type IRequestOptions = Omit<RequestInit, 'method' | 'body'>

// A base fetch client that can be extended for specific APIs, providing common functionality like error handling, request configuration, etc.
export class BaseHttpClient {
	protected baseURL: string
	protected defaultHeaders: Record<string, string> = {
		'Content-Type': 'application/json'
	}

	constructor(baseURL: string, headers: Record<string, string> = {}) {
		this.baseURL = baseURL
		this.defaultHeaders = { ...this.defaultHeaders, ...headers }
	}

	get<T>(endpoint: string, options?: IRequestOptions): Promise<TryCatchResult<T>> {
		return this.request<T>(endpoint, { ...options, method: 'GET' })
	}

	post<T>(endpoint: string, body: UnknownObject | string, options?: IRequestOptions): Promise<TryCatchResult<T>> {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: this.serializeBody(body),
			headers: options?.headers
		})
	}

	patch<T>(endpoint: string, body: UnknownObject | string, options?: IRequestOptions): Promise<TryCatchResult<T>> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PATCH',
			body: this.serializeBody(body),
			headers: options?.headers
		})
	}

	put<T>(endpoint: string, body: UnknownObject | string, options?: IRequestOptions): Promise<TryCatchResult<T>> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body: this.serializeBody(body),
			headers: options?.headers
		})
	}

	delete<T>(endpoint: string, options?: IRequestOptions): Promise<TryCatchResult<T>> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' })
	}

	private serializeBody(body: UnknownObject | string): string {
		return typeof body === 'string' ? body : JSON.stringify(body)
	}

	protected async request<T>(endpoint: string, options?: RequestInit): Promise<TryCatchResult<T>> {
		try {
			const url = `${this.baseURL}${endpoint}`
			const response = await fetch(url, {
				...options,
				headers: { ...this.defaultHeaders, ...options?.headers }
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
			}

			return [await response.json() as T, null]
		} catch(error) {
			return [null, error instanceof Error ? error : new Error(String(error))]
		}
	}

	protected getRawErrorMessage(error: Error): string {
		const message = error.message
		const marker = ', message: '

		try {
			// Always try to extract the json part of the message first, as it's more likely to contain structured error information
			const jsonIdx = message.indexOf('{')
			if (jsonIdx !== -1) {
				return message.substring(jsonIdx).trim()
			}

			// If the json extraction fails, extract from the error format present in the request method
			// "HTTP error! status: <code>, message: <response.text()>"
			const markerIdx = message.indexOf(marker)
			if (markerIdx !== -1) {
				const rawResponseText = message.substring(markerIdx + marker.length).trim()
				if (rawResponseText.length > 0) {
					return rawResponseText
				}
			}

		} catch {
			// If none of the above parsing strategies work, just return the original error message
		}

		return message
	}
}