import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { environment } from '@env/environment'

export type TestCreateProductRequest = {
	product: {
		name: string
		description: string
		attributes: Record<string, unknown>
		variants: Array<{
			sku: string
			ean: string | null
			price: number
			weight_kg: number
			height_cm: number
			width_cm: number
			depth_cm: number
			images: string[]
			attributes: Record<string, unknown>
		}>
	}
}

export type TestCreateProductResponse = {
	product: {
		id: string
		variants: Array<{
			id: string
			sku: string
		}>
	}
}

export type TestMagaluWebhookRequest = {
	account_id: string
	topic: string
	data: {
		status: string
		params: {
			id: string
		}
		resource?: string
	}
}

export type TestMercadoLivreWebhookRequest = {
	account_id: string
	topic: string
	resource: string
	user_id?: number
	status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
}

export type TestRequiredAttribute = {
	id: string
	name: string
	description?: string
	allowed_values?: string[]
	allowed_in_variants?: boolean
	provider: 'magalu' | 'mercado_livre'
}

export type TestRequiredAttributesResponse = {
	required_attributes: {
		product: TestRequiredAttribute[]
		variant: TestRequiredAttribute[]
	}
}

@Injectable({ providedIn: 'root' })
export class TestSectionService {
	private readonly apiUrl = environment.apiUrl

	constructor(private http: HttpClient) {}

	createProduct(data: TestCreateProductRequest): Observable<TestCreateProductResponse> {
		return this.http.post<TestCreateProductResponse>(`${this.apiUrl}/products`, data)
	}

	getRequiredAttributes(accountId: string, productName: string): Observable<TestRequiredAttributesResponse> {
		return this.http.get<TestRequiredAttributesResponse>(`${this.apiUrl}/marketplace-accounts/${accountId}/required-attributes`, {
			params: { product_name: productName }
		})
	}

	sendMagaluWebhook(data: TestMagaluWebhookRequest): Observable<Record<string, never>> {
		return this.http.post<Record<string, never>>(`${this.apiUrl}/webhooks/orders/${data.account_id}/magalu`, data)
	}

	sendMercadoLivreWebhook(data: TestMercadoLivreWebhookRequest): Observable<Record<string, never>> {
		return this.http.post<Record<string, never>>(`${this.apiUrl}/webhooks/orders/mercado-livre`, data)
	}
}
