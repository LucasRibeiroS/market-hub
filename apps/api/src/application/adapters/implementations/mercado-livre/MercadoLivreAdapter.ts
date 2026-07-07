import { addDays, addSeconds } from 'date-fns'
import { inject, injectable } from 'tsyringe'

import { IMarketplaceCredential, IMarketplaceProvider, Provider } from '@integrator-packages/database/entities'

import { ILoggerAdapter, LoggerAdapterSymbol } from '@integrator-packages/adapters'

import { FailedDependencyException } from '@integrator-packages/use-case/exceptions'

import { UnknownObject } from '@utils/types'

import { MercadoLivreClient } from '@adapters/implementations/mercado-livre/MercadoLivreClient'
import {
	BuyingMode,
	Condition,
	IAttribute,
	ICategoryAttributesResponse,
	ICategoryPredictionResponse,
	IItemPayload,
	IItemResponse,
	IOAuthTokenPayload,
	IOAuthTokenResponse,
	IOrderResponse,
	IUserResponse,
	ListingType
} from '@adapters/implementations/mercado-livre/types'

import {
	IExchangeCodeParams,
	IExchangeCodeResponse,
	IGetAttributesParams,
	IGetAttributesResponse,
	IGetOrderDetailsParams,
	IGetOrderDetailsResponse,
	IGetUserInfoParams,
	IGetUserInfoResponse,
	IMarketplaceAdapter,
	IPublishProductParams,
	IPublishProductResponse,
	IRefreshTokenParams,
	IRefreshTokenResponse,
	IRevokeAuthorizationParams,
	IRevokeAuthorizationResponse,
	ISubscribeOrderWebhooksParams,
	ISubscribeOrderWebhooksResponse,
	IUnsubscribeOrderWebhooksParams,
	IUnsubscribeOrderWebhooksResponse
} from '@adapters/IMarketplaceAdapter'

@injectable()
export class MercadoLivreAdapter implements IMarketplaceAdapter {
	readonly provider: Provider = 'mercado_livre'
	private client?: MercadoLivreClient

	constructor(
		@inject(LoggerAdapterSymbol)
		private readonly loggerAdapter: ILoggerAdapter
	) {}

	async exchangeCode({ code, provider }: IExchangeCodeParams): Promise<IExchangeCodeResponse> {
		const client = this.getUnauthenticatedClient({ base_url: provider.token_url })

		const payload: IOAuthTokenPayload = {
			client_id: provider.client_id,
			client_secret: provider.client_secret,
			grant_type: 'authorization_code',
			redirect_uri: provider.redirect_uri,
			code
		}

		const [res, err] = await client.post<IOAuthTokenResponse>('/oauth/token', payload)
		if (err) {
			this.loggerAdapter.error(`Mercado Livre exchange code error: ${err.message}`)
			throw new FailedDependencyException('Failed to exchange code for mercado livre')
		}

		return {
			credentials: {
				access_token: res.access_token,
				access_token_expires_at: addSeconds(new Date(), res.expires_in),
				refresh_token: res.refresh_token,
				// Mercado livre refresh tokens may have a longer expiration, but if it stays invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: res.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: res.token_type
			}
		}
	}

	async getUserInfo({ credentials, provider }: IGetUserInfoParams): Promise<IGetUserInfoResponse> {
		const client = this.getClient({ base_url: provider.base_url, credentials })

		const [res, err] = await client.get<IUserResponse>('/users/me')
		if (err) {
			this.loggerAdapter.error(`Mercado Livre get user info error: ${err.message}`)
			throw new FailedDependencyException('Failed to get user info on mercado livre')
		}

		return {
			account: {
				external_id: res.id.toString(),
				external_email: res.email
			}
		}
	}

	async refreshToken({ refresh_token, provider }: IRefreshTokenParams): Promise<IRefreshTokenResponse> {
		const client = this.getUnauthenticatedClient({ base_url: provider.token_url })

		const payload: IOAuthTokenPayload = {
			client_id: provider.client_id,
			client_secret: provider.client_secret,
			redirect_uri: provider.redirect_uri,
			grant_type: 'refresh_token',
			refresh_token
		}

		const [res, err] = await client.post<IOAuthTokenResponse>('/oauth/token', payload)
		if (err) {
			this.loggerAdapter.error(`Mercado Livre refresh token error: ${err.message}`)
			throw new FailedDependencyException('Failed to refresh token for mercado livre')
		}

		return {
			credentials: {
				access_token: res.access_token,
				access_token_expires_at: addSeconds(new Date(), res.expires_in),
				refresh_token: res.refresh_token,
				// Mercado livre refresh tokens may have a longer expiration, but if it statys invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: res.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: res.token_type
			}
		}
	}

	async revokeAuthorization({
		account, credentials, provider
	}: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse> {
		const client = this.getClient({ base_url: provider.base_url, credentials })

		const [, err] = await client.delete(`/users/${account.external_id}/applications/${provider.client_id}`)
		if (err) {
			this.loggerAdapter.error(`Mercado Livre revoke authorization error: ${err.message}`)
			throw new FailedDependencyException('Failed to revoke authorization for mercado livre')
		}

		return { external_id: account.external_id }
	}

	async subscribeOrderWebhooks(_: ISubscribeOrderWebhooksParams): Promise<ISubscribeOrderWebhooksResponse> {
		this.loggerAdapter.warn('Mercado Livre order notifications are configured at app/provider level, not per account. Skipping account webhook setup.')

		return {}
	}

	async unsubscribeOrderWebhooks(_: IUnsubscribeOrderWebhooksParams): Promise<IUnsubscribeOrderWebhooksResponse> {
		this.loggerAdapter.warn('Mercado Livre order notifications are configured at app/provider level, not per account. Skipping account webhook removal.')

		return
	}

	async getOrderDetails({
		credentials,
		provider,
		external_order_id
	}: IGetOrderDetailsParams): Promise<IGetOrderDetailsResponse> {
		const client = this.getClient({ base_url: provider.base_url, credentials })

		const [res, err] = await client.get<IOrderResponse>(`/orders/${external_order_id}`)
		if (err) {
			this.loggerAdapter.error(`Mercado Livre get order details error: ${err.message}`)
			throw new FailedDependencyException('Failed to fetch order details on mercado livre')
		}

		const status = this.mapMercadoLivreStatus(res.status)

		return {
			external_order_id: external_order_id,
			external_status: res.status,
			status,
			ordered_at: new Date(res.date_created),
			approved_at: status === 'paid' ? new Date(res.last_updated) : null,
			total_amount: res.total_amount * 100, // Convert to cents
			shipping_amount: (res.shipping_cost || 0) * 100,
			discount_amount: (res.coupon_amount || 0) * 100,
			buyer: {
				name: res.buyer.name || null,
				document: res.buyer.document || null,
				email: res.buyer.email || null,
				phone: res.buyer.phone || null
			},
			items: res.order_items.map(orderItem => ({
				external_item_id: orderItem.item.id,
				external_variant_id: orderItem.item.variation_id?.toString() || null,
				title: orderItem.item.title,
				sku: orderItem.item.seller_custom_field || orderItem.item.seller_sku || null,
				quantity: orderItem.quantity,
				unit_amount: Math.round(orderItem.unit_price * 100), // Convert to cents
				total_amount: Math.round(orderItem.gross_price * 100) // Convert to cents
			}))
		}
	}

	private mapMercadoLivreStatus(status: string): IGetOrderDetailsResponse['status'] {
		const s = status.toLowerCase()

		switch (s) {
			case 'paid':
				return 'paid'
			case 'shipped':
				return 'shipped'
			case 'delivered':
				return 'delivered'
			case 'cancelled':
			case 'cancel':
			case 'canceled':
				return 'cancelled'
			case 'refunded':
			case 'partially_refunded':
				return 'refunded'
			default:
				return 'pending'
		}
	}

	async getAttributes({
		product, provider
	}: IGetAttributesParams): Promise<IGetAttributesResponse> {
		const client = this.getUnauthenticatedClient({ base_url: provider.base_url })

		const [predictions, predErr] = await client.get<ICategoryPredictionResponse[]>(
			`/sites/MLB/domain_discovery/search?q=${encodeURIComponent(product.name)}&limit=1`
		)
		if (predErr || predictions.length === 0) {
			this.loggerAdapter.error(`Mercado Livre category prediction error: ${predErr?.message || 'No predictions returned'}`)
			throw new FailedDependencyException('Failed to predict category for mercado livre')
		}

		const { category_id, category_name } = predictions[0]

		const [attributes, attrErr] = await client.get<ICategoryAttributesResponse[]>(`/categories/${category_id}/attributes`)
		if (attrErr) {
			this.loggerAdapter.error(`Mercado Livre fetch category attributes error: ${attrErr.message}`)
			throw new FailedDependencyException('Failed to fetch category attributes for mercado livre')
		}

		return {
			category_id,
			category_name,
			attributes: attributes.map(attr => ({
				id: attr.id,
				name: attr.name,
				description: this.buildAttributeDescription({
					tooltip: attr.tooltip,
					example: attr.example,
					hint: attr.hint
				}),
				required: attr.tags?.required || false,
				allowed_in_variants: attr.tags?.allow_variations || false,
				allowed_values: attr.values?.map(v => v.name)
			}))
		}
	}

	private buildAttributeDescription({
		tooltip, hint, example
	}: IBuildAttributeDescriptionParams): string | undefined {
		const parts = [tooltip, hint].filter((value): value is string => Boolean(value))
		if (example !== undefined) {
			parts.push(`Eg: ${example}`)
		}

		return parts.length > 0 ? parts.join(' ') : undefined
	}

	async publishProduct({
		product,
		credentials,
		provider
	}: IPublishProductParams): Promise<IPublishProductResponse> {
		const client = this.getClient({ base_url: provider.base_url, credentials })

		const { category_id, attributes } = await this.getAttributes({
			credentials,
			provider,
			product: { name: product.name }
		})

		const primaryVariant = product.variants.find(variant => variant.is_primary)
		if (primaryVariant === undefined) {
			throw new FailedDependencyException('No primary variant found for product')
		}

		const hasVariations = product.variants.length > 1

		// precomputed attribute_combinations per variant
		const attributeCombinations = this.mapAttributeCombinations({
			product,
			allowed_variation_attributes: attributes.filter(attr => attr.allowed_in_variants).map(attr => attr.id)
		})

		const variations: IItemPayload['variations'] = hasVariations
			? product.variants.map(variant => ({
				price: this.formatPrice(variant.price),
				available_quantity: 0,
				attribute_combinations: attributeCombinations[variant.id],
				picture_ids: variant.images,
				seller_custom_field: variant.sku
			}))
			: undefined

		const payload: IItemPayload = {
			title: product.name.substring(0, 60),
			category_id,
			// ML rule: If the product has variations, the price of the main item must be the lowest price among the variations, otherwise it will cause an error when publishing
			price: this.formatPrice(Math.min(...product.variants.map(v => v.price))),
			currency_id: 'BRL',
			available_quantity: 0,
			buying_mode: BuyingMode.BUY_IT_NOW,
			listing_type_id: ListingType.GOLD_PRO,
			condition: Condition.NEW,
			pictures: primaryVariant.images.map(source => ({ source })),
			attributes: this.mapRootAttributes({
				product,
				primary_variant: primaryVariant,
				combination_keys: attributeCombinations[primaryVariant.id].map(a => a.id)
			}),
			variations
		}

		const [res, err] = await client.post<IItemResponse>('/items', payload)
		if (err) {
			const message = client.getMessageFromError(err)

			this.loggerAdapter.error(`Mercado Livre publish product payload: ${JSON.stringify(payload)}`)
			this.loggerAdapter.error(`Mercado Livre publish product error: ${err.message}`)

			throw new FailedDependencyException('Failed to publish product to Mercado Livre - ' + message)
		}

		if (res.variations !== undefined) {
			return {
				listings: res.variations.map(meliVariation => {
					const variant = product.variants.find(v => v.sku === meliVariation.seller_custom_field)!
					return {
						variant_id: variant.id,
						external_product_id: res.id,
						external_variant_id: meliVariation.id.toString(),
						status: 'active',
						sync_message: 'Published successfully'
					}
				})
			}
		}

		return {
			listings: [{
				variant_id: primaryVariant.id,
				external_product_id: res.id,
				external_variant_id: null,
				status: 'active',
				sync_message: 'Published successfully'
			}]
		}
	}

	private mapAttributeCombinations({
		product,
		allowed_variation_attributes
	}: IMapAttributeCombinationsParams): IMapAttributeCombinationsResponse {
		const attrKeys = new Set<string>()

		const mergedAttributesPerVariant = product.variants.map(variant => {
			const merged = { ...product.attributes, ...variant.attributes }
			const normalized = Object.entries(merged).map(([k, v]) => {
				const key = k.toUpperCase()
				attrKeys.add(key)
				return [key, String(v)]
			})

			return {
				variant_id: variant.id,
				attributes: Object.fromEntries(normalized) as Record<string, string>
			}
		})

		const varyingKeys = [...attrKeys].filter(key => {
			const varies = new Set(mergedAttributesPerVariant.map(i => i.attributes[key])).size > 1
			const allowed = allowed_variation_attributes.includes(key)
			return varies && allowed
		})

		return Object.fromEntries(
			mergedAttributesPerVariant.map(({ variant_id, attributes }) => [
				variant_id,
				varyingKeys
					.filter(key => attributes[key])
					.map(key => ({ id: key, value_name: attributes[key] }))
			])
		)
	}

	private mapRootAttributes({ product, primary_variant, combination_keys }: IMapRootAttributesParams): IAttribute[] {
		const entries = this
			.mapAttributes({ ...product.attributes, ...primary_variant.attributes })
			.filter(attr => !combination_keys.includes(attr.id))

		if (primary_variant.ean !== null) {
			entries.push({ id: 'GTIN', value_name: primary_variant.ean })
		}

		return entries
	}

	private mapAttributes(attrs: UnknownObject): IAttribute[] {
		const result: IAttribute[] = []

		for (const [key, value] of Object.entries(attrs)) {
			result.push({
				id: key.toUpperCase(),
				value_name: String(value)
			})
		}

		return result
	}

	private formatPrice(price: number): number {
		return price / 100
	}

	// This is used to avoid unathenticated requests clearing the credentials of the authenticated client
	protected getUnauthenticatedClient({ base_url }: IGetUnauthenticatedClientParams): MercadoLivreClient {
		return new MercadoLivreClient(base_url, { access_token: '', token_type: 'Bearer' })
	}

	protected getClient({ base_url, credentials }: IGetClientParams): MercadoLivreClient {
		if (!this.client) {
			this.client = new MercadoLivreClient(base_url, credentials)
		} else {
			this.client.updateCredentials(credentials)
		}

		return this.client
	}
}

type IBuildAttributeDescriptionParams = Pick<ICategoryAttributesResponse, 'tooltip' | 'example' | 'hint'>

type IMapAttributeCombinationsParams = {
	product: {
		attributes: UnknownObject
		variants: Array<{
			id: string
			ean: string | null
			attributes: UnknownObject
		}>
	}
	allowed_variation_attributes: string[]
}
type IMapAttributeCombinationsResponse = {
	[variant_id: string]: IAttribute[]
}

type IMapRootAttributesParams = {
	product: {
		attributes: UnknownObject
	}
	primary_variant: {
		attributes: UnknownObject
		ean: string | null
	}
	combination_keys: string[]
}

type IGetUnauthenticatedClientParams = Pick<IMarketplaceProvider, 'base_url'>

type IGetClientParams = {
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
} & Pick <IMarketplaceProvider, 'base_url'>