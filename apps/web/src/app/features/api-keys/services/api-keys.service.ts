import { map, Observable } from 'rxjs'
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { environment } from '@env/environment'

import {
	CreateApiKeyRequest,
	CreateApiKeyResponse,
	DeleteApiKeyRequest,
	GetApiKeyResponse,
	IApiKey,
	ListApiKeysRequest,
	ListApiKeysResponse,
	UpdateApiKeyRequest,
	UpdateApiKeyResponse
} from '@features/api-keys/models'

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
	private readonly apiUrl = `${environment.apiUrl}/api-keys`

	constructor(private http: HttpClient) {}

	list(data: ListApiKeysRequest): Observable<ListApiKeysResponse> {
		return this.http.get<ListApiKeysResponse>(this.apiUrl, { params: data })
	}

	getById(id: string): Observable<IApiKey> {
		return this.http.get<GetApiKeyResponse>(`${this.apiUrl}/${id}`).pipe(map(res => res.api_key))
	}

	/**
	 * Creates a new API key.
	 * @param data The data to create the API key with
	 * @returns An observable of the created API key, including the plaintext key. Note that the plaintext key is only returned on creation and cannot be retrieved afterwards for security reasons.
	 */
	create(data: CreateApiKeyRequest): Observable<{ key: string } & IApiKey> {
		return this.http.post<CreateApiKeyResponse>(this.apiUrl, data).pipe(map(res => res.api_key))
	}

	/**
	 * Updates an API key. Note that the API only allows updating the name and expiration date, so only those fields are accepted.
	 * @param id The ID of the API key to update
	 * @param data The data to update
	 * @returns An observable of the updated API key
	 */
	update(id: string, data: UpdateApiKeyRequest): Observable<IApiKey> {
		return this.http.patch<UpdateApiKeyResponse>(`${this.apiUrl}/${id}`, data).pipe(map(res => res.api_key))
	}

	delete({ id }: DeleteApiKeyRequest): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`)
	}
}