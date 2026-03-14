import { map, Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { environment } from '@env/environment'

import {
	CreateMarketplaceAccountRequest,
	CreateMarketplaceAccountResponse,
	DeleteMarketplaceAccountRequest,
	GetMarketplaceAccountResponse,
	IMarketplaceAccount,
	ListMarketplaceAccountsRequest,
	ListMarketplaceAccountsResponse,
	ReAuthenticateMarketplaceAccountRequest,
	ReAuthenticateMarketplaceAccountResponse,
	UpdateMarketplaceAccountRequest,
	UpdateMarketplaceAccountResponse
} from '@features/marketplace-accounts/models'

@Injectable({ providedIn: 'root' })
export class MarketplaceAccountsService {
	private readonly apiUrl = `${environment.apiUrl}/marketplace-accounts`

	constructor(private http: HttpClient) {}

	list(data: ListMarketplaceAccountsRequest): Observable<ListMarketplaceAccountsResponse> {
		return this.http.get<ListMarketplaceAccountsResponse>(this.apiUrl, { params: data })
	}

	getById(id: string): Observable<GetMarketplaceAccountResponse['account']> {
		return this.http.get<GetMarketplaceAccountResponse>(`${this.apiUrl}/${id}`).pipe(map(res => res.account))
	}

	create(data: CreateMarketplaceAccountRequest): Observable<IMarketplaceAccount> {
		return this.http.post<CreateMarketplaceAccountResponse>(this.apiUrl, data).pipe(map(res => res.account))
	}

	update(id: string, data: UpdateMarketplaceAccountRequest): Observable<IMarketplaceAccount> {
		return this.http.patch<UpdateMarketplaceAccountResponse>(`${this.apiUrl}/${id}`, data).pipe(map(res => res.account))
	}

	reAuthenticate(id: string, data: ReAuthenticateMarketplaceAccountRequest): Observable<IMarketplaceAccount> {
		return this.http.put<ReAuthenticateMarketplaceAccountResponse>(`${this.apiUrl}/${id}/credentials`, data).pipe(map(res => res.account))
	}

	delete({ id }: DeleteMarketplaceAccountRequest): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`)
	}
}
