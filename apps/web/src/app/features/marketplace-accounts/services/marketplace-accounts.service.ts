import { Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { environment } from '@env/environment'

import {
	CreateMarketplaceAccountRequest,
	CreateMarketplaceAccountResponse,
	ListMarketplaceAccountsRequest,
	ListMarketplaceAccountsResponse
} from '@features/marketplace-accounts/models'

@Injectable({ providedIn: 'root' })
export class MarketplaceAccountsService {
	private readonly apiUrl = `${environment.apiUrl}/marketplace-accounts`

	constructor(private http: HttpClient) {}

	list(data: ListMarketplaceAccountsRequest): Observable<ListMarketplaceAccountsResponse> {
		return this.http.get<ListMarketplaceAccountsResponse>(this.apiUrl, { params: data })
	}

	create(data: CreateMarketplaceAccountRequest): Observable<CreateMarketplaceAccountResponse> {
		return this.http.post<CreateMarketplaceAccountResponse>(this.apiUrl, data)
	}
}
