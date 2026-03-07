import { UnknownObject } from '@utils/types'

// A base fetch client that can be extended for specific APIs, providing common functionality like error handling, request configuration, etc.
type Result<T> = [T, null] | [null, Error]

export class BaseHttpClient {
	protected baseURL: string
	protected defaultHeaders: Record<string, string> = {
		'Content-Type': 'application/json'
	}

	constructor(baseURL: string, headers: Record<string, string> = {}) {
		this.baseURL = baseURL
		this.defaultHeaders = { ...this.defaultHeaders, ...headers }
	}

	get<T>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Result<T>> {
		return this.request<T>(endpoint, { ...options, method: 'GET' })
	}

	post<T>(endpoint: string, body: UnknownObject, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Result<T>> {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: JSON.stringify(body),
			headers: { 'Content-Type': 'application/json', ...options?.headers }
		})
	}

	patch<T>(endpoint: string, body: UnknownObject, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Result<T>> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: options?.headers
		})
	}

	delete<T>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Result<T>> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' })
	}

	private async request<T>(endpoint: string, options?: RequestInit): Promise<Result<T>> {
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
}