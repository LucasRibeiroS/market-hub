import { map, Observable } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'

import { environment } from '@env/environment'

import { ListMarketplaceProvidersResponse } from '@features/marketplace-accounts/models'

@Injectable({ providedIn: 'root' })
export class MarketplaceProvidersService {
	private readonly apiUrl = `${environment.apiUrl}/marketplace-providers`

	constructor(private http: HttpClient) {}

	list(): Observable<ListMarketplaceProvidersResponse['providers']> {
		return this.http.get<ListMarketplaceProvidersResponse>(this.apiUrl).pipe(map(res => res.providers))
	}
}