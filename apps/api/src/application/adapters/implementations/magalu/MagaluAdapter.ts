import { inject, injectable } from 'tsyringe'
import { addDays, addSeconds } from 'date-fns'

import { IMarketplaceCredential, IMarketplaceProvider, IVariant, Provider } from '@integrator-packages/database/entities'

import { ILoggerAdapter, LoggerAdapterSymbol } from '@integrator-packages/adapters'

import { FailedDependencyException } from '@integrator-packages/use-case/exceptions'

import { tryCatch } from '@utils/try_catch'
import { parseDimension, parseWeightToGrams } from '@utils/dimensions'
import { UnknownObject } from '@utils/types'

import { MagaluClient } from '@adapters/implementations/magalu/MagaluClient'
import {
	Condition,
	DimensionType,
	IAttributeResponse,
	ICategoryResponse,
	IJwtPayload,
	IOAuthTokenPayload,
	IOAuthTokenResponse,
	IPaginatedResponse,
	IPricePayload,
	ISkuPayload,
	IStockPayload,
	ITraceResponse,
	Origin,
	SkuType,
	StockType
} from '@adapters/implementations/magalu/types'

import {
	IExchangeCodeParams,
	IExchangeCodeResponse,
	IGetAttributesParams,
	IGetAttributesResponse,
	IGetUserInfoParams,
	IGetUserInfoResponse,
	IMarketplaceAdapter,
	IPublishProductParams,
	IPublishProductResponse,
	IRefreshTokenParams,
	IRefreshTokenResponse,
	IRevokeAuthorizationParams,
	IRevokeAuthorizationResponse
} from '@adapters/IMarketplaceAdapter'

@injectable()
export class MagaluAdapter implements IMarketplaceAdapter {
	readonly provider: Provider = 'magalu'
	private client?: MagaluClient

	private static readonly MAGALU_SALES_CHANNEL_ID_PRODUCTION = '9fe0d853-732b-4e4a-a0b0-cff988ed043d'
	private static readonly MAGALU_SALES_CHANNEL_ID_SANDBOX = '5f62650a-0039-4d65-9b96-266d498c03bd'

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
			this.loggerAdapter.error(`Magalu exchange code error: ${err}`)
			throw new FailedDependencyException('Failed to exchange code for Magalu')
		}

		this.ensureRequiredScopes(res.scope)

		return {
			credentials: {
				access_token: res.access_token,
				access_token_expires_at: addSeconds(new Date(), res.expires_in),
				refresh_token: res.refresh_token,
				// Magalu refresh tokens may have a longer expiration, but if it stays invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: res.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: res.token_type
			}
		}
	}

	/** @throws FailedDependencyException if any of the required scopes are missing from the granted scopes */
	private ensureRequiredScopes(scopes: string): void {
		const required = [
			'open:portfolio-skus-seller:read',
			'open:portfolio-skus-seller:write',
			'open:portfolio-prices-seller:read',
			'open:portfolio-prices-seller:write',
			'open:portfolio-stocks-seller:read',
			'open:portfolio-stocks-seller:write',
			'open:portfolio-categories-seller:read',
			'open:order-order-seller:read'
		]

		const granted = new Set(scopes.split(' '))
		const missing = required.filter(s => !granted.has(s))
		if (missing.length > 0) {
			throw new FailedDependencyException(`Authorization incomplete — the following permissions were not granted: ${missing.join(', ')}`)
		}
	}

	async getUserInfo({ credentials }: IGetUserInfoParams): Promise<IGetUserInfoResponse> {
		const jwtPayload = this.decodeJwtPayload(credentials.access_token)

		if (jwtPayload === null) {
			this.loggerAdapter.error('Magalu get user info error: could not decode sub from JWT')
			throw new FailedDependencyException('Failed to get user info from Magalu token')
		}

		return {
			account: {
				external_id: jwtPayload.sub,
				external_email: jwtPayload.email || null
			}
		}
	}

	/** Decode the payload segment of a JWT without verifying the signature. */
	private decodeJwtPayload(token: string): IJwtPayload | null {
		try {
			const [, payloadB64] = token.split('.')
			const json = Buffer.from(payloadB64, 'base64url').toString('utf-8')
			return JSON.parse(json) as IJwtPayload
		} catch {
			return null
		}
	}

	async refreshToken({ provider, refresh_token }: IRefreshTokenParams): Promise<IRefreshTokenResponse> {
		const client = this.getUnauthenticatedClient({ base_url: provider.token_url })

		const payload: IOAuthTokenPayload = {
			client_id: provider.client_id,
			client_secret: provider.client_secret,
			grant_type: 'refresh_token',
			refresh_token
		}

		const [res, err] = await client.post<IOAuthTokenResponse>(
			'/oauth/token',
			new URLSearchParams(payload).toString(),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		)

		if (err) {
			this.loggerAdapter.error(`Magalu refresh token error: ${err.message}`)
			throw new FailedDependencyException('Failed to refresh token for Magalu')
		}

		return {
			credentials: {
				access_token: res.access_token,
				access_token_expires_at: addSeconds(new Date(), res.expires_in),
				refresh_token: res.refresh_token,
				// Magalu refresh tokens may have a longer expiration, but if it stays invalid for 60 days, it's likely to be expired or revoked
				refresh_token_expires_at: addDays(new Date(), 60),
				scopes: res.scope.split(' ').reduce((acc, scope) => ({ ...acc, [scope]: true }), {}),
				token_type: res.token_type
			}
		}
	}

	async revokeAuthorization({ account }: IRevokeAuthorizationParams): Promise<IRevokeAuthorizationResponse> {
		this.loggerAdapter.warn(`Magalu does not expose a revoke endpoint. Marking account ${account.external_id} as revoked locally only.`)

		return { external_id: account.external_id }
	}

	async getAttributes({ provider, credentials, product }: IGetAttributesParams): Promise<IGetAttributesResponse> {
		const client = this.getClient({ base_url: provider.base_url, credentials })

		const [categories, catErr] = await client.get<IPaginatedResponse<ICategoryResponse>>(
			`/seller/v1/portfolios/categories?name=${encodeURIComponent(product.name)}&_limit=1`
		)
		if (catErr || categories.results.length === 0) {
			this.loggerAdapter.error(`Magalu category search error: ${catErr?.message ?? 'No results'}`)
			throw new FailedDependencyException('Failed to find category for Magalu')
		}

		const category = categories.results[0]

		const [
			[attributes, attrErr],
			[datasheet, datasheetErr]
		] = await Promise.all([
			client.get<IPaginatedResponse<IAttributeResponse>>(`/seller/v1/portfolios/categories/${category.id}/attributes`),
			client.get<IPaginatedResponse<IAttributeResponse>>(`/seller/v1/portfolios/categories/${category.id}/datasheet`)
		])

		if (attrErr) {
			this.loggerAdapter.error(`Magalu fetch variation attributes error: ${attrErr.message}`)
			throw new FailedDependencyException('Failed to fetch variation attributes for Magalu')
		}
		if (datasheetErr) {
			this.loggerAdapter.error(`Magalu fetch datasheet attributes error: ${datasheetErr.message}`)
			throw new FailedDependencyException('Failed to fetch datasheet attributes for Magalu')
		}

		return {
			category_id: category.id,
			category_name: category.name,
			attributes: [
				...this.mapAttributes({ attributes: attributes.results, type: 'variation' }),
				...this.mapAttributes({ attributes: datasheet.results, type: 'datasheet' })
			]
		}
	}

	private mapAttributes({ attributes, type }: IMapAttributesParams): IGetAttributesResponse['attributes'] {
		return attributes.map(attr => ({
			id: attr.name,
			name: attr.display_name,
			description: attr.example || undefined,
			required: attr.required === 'required',
			allowed_in_variants: type === 'variation',
			allowed_values: attr.choices !== null ? attr.choices : undefined
		}))
	}

	async publishProduct({ provider, credentials, product }: IPublishProductParams): Promise<IPublishProductResponse> {
		// Note: this function call is setting the internal adapter client
		// and therefore the client won't be passed as parameter to the subsequent function calls within the publish flow
		const { category_id, attributes } = await this.getAttributes({
			credentials,
			provider,
			product: { name: product.name }
		})

		const salesChannelId = this.resolveSalesChannelId(provider.base_url)

		const listings: IPublishProductResponse['listings'] = []

		for (const variant of product.variants) {
			const [sku, skuError] = await tryCatch(() => this.publishSku({
				category_id,
				sales_channel_id: salesChannelId,
				product,
				variant,
				attributes
			}))
			if (skuError !== null) {
				listings.push({
					variant_id: variant.id,
					external_product_id: null,
					external_variant_id: null,
					status: 'error',
					sync_message: skuError.message
				})

				continue
			}

			const [, priceError] = await tryCatch(() => this.publishPrice({
				variant,
				trace_id: sku.trace_id,
				sales_channel_id: salesChannelId
			}))
			if (priceError !== null) {
				listings.push({
					variant_id: variant.id,
					external_product_id: null,
					external_variant_id: variant.sku,
					status: 'error',
					sync_message: priceError.message
				})

				continue
			}

			const [, stockError] = await tryCatch(() => this.publishStock({
				variant,
				trace_id: sku.trace_id,
				sales_channel_id: salesChannelId
			}))
			if (stockError !== null) {
				listings.push({
					variant_id: variant.id,
					external_product_id: null,
					external_variant_id: variant.sku,
					status: 'error',
					sync_message: stockError.message
				})

				continue
			}

			listings.push({
				variant_id: variant.id,
				external_product_id: null,
				external_variant_id: variant.sku,
				status: 'active',
				sync_message: 'Published successfully'
			})
		}

		return { listings }
	}

	private async publishSku({
		category_id, sales_channel_id, product, variant, attributes
	}: IPublishSkuParams): Promise<IPublishSkuResponse> {
		const client = this.client!

		const { attributes: skuAttributes, datasheet } = this.mapSkuAttributes({
			product,
			variant,
			allowed_variation_attributes: attributes
				.filter(attribute => attribute.allowed_in_variants)
				.map(attribute => attribute.id)
		})

		const hasEan = variant.ean !== null && variant.ean.length > 0

		const payload: ISkuPayload = {
			active: true,
			attributes: skuAttributes,
			brand: datasheet.find(
				attr => attr.name.toLowerCase() === 'brand' || attr.name.toLowerCase() === 'marca'
			)?.value || 'Generic',
			category: { id: category_id },
			channels: [{ id: sales_channel_id }],
			condition: Condition.NEW,
			datasheet,
			description: product.description.substring(0, 7000),
			dimensions: [
				this.mapProductDimensions({ variant, type: DimensionType.PRODUCT }),
				this.mapProductDimensions({ variant, type: DimensionType.PACKAGE })
			],
			extra_data: [],
			fulfillment: false,
			group: { id: product.id },
			has_ean: hasEan,
			identifiers: hasEan ? [{ type: 'ean', value: variant.ean! }] : [],
			images: variant.images.map(reference => ({
				reference,
				type: 'image/jpeg'
			})),
			metadata: {},
			origin: Origin.NATIONAL,
			perishable: false,
			podcasts: [],
			sku: variant.sku,
			title: product.name.substring(0, 150),
			type: SkuType.product,
			videos: []
		}

		const [res, err] = await client.post<ITraceResponse>('/seller/v1/portfolios/skus', payload)
		if (err) {
			if (err.message.includes('status: 409') && err.message.includes('already exists')) {
				this.loggerAdapter.warn(`Magalu SKU already exists for ${variant.sku}, updating existing SKU`)

				return await this.updateSku({ sku: variant.sku, payload })
			}

			const message = client.getMessageFromError(err)

			this.loggerAdapter.error(`Magalu publish SKU payload: ${JSON.stringify(payload)}`)
			this.loggerAdapter.error(`Magalu publish SKU error: ${err.message}`)

			throw new Error(`Failed to publish SKU to Magalu - ${message}`)
		}

		return { trace_id: res.trace_id }
	}

	private mapSkuAttributes({
		product, variant, allowed_variation_attributes
	}: IMapSkuAttributesParams): IMapSkuAttributesResponse {
		const mergedAttributes = Object
			.entries({ ...product.attributes, ...variant.attributes })
			.map(([name, value]) => ({ name, value: String(value) }))

		const variationAttributeIds = new Set(allowed_variation_attributes.map(attribute => attribute.toUpperCase()))

		return {
			attributes: mergedAttributes.filter(
				attribute => variationAttributeIds.has(attribute.name.toUpperCase())
			),
			datasheet: mergedAttributes.filter(
				attribute => !variationAttributeIds.has(attribute.name.toUpperCase())
			)
		}
	}

	private mapProductDimensions({ variant, type }: IMapProductDimensionsParams): IMapProductDimensionsResponse {
		const height = parseDimension(variant.height_cm)
		const width = parseDimension(variant.width_cm)
		const length = parseDimension(variant.depth_cm)
		const weight = parseWeightToGrams(variant.weight_kg)

		return {
			name: type,
			height: { unit: 'cm', value: height },
			width: { unit: 'cm', value: width },
			length: { unit: 'cm', value: length },
			weight: { unit: 'g', value: weight }
		}
	}

	private async updateSku({ sku, payload }: IUpdateSkuParams): Promise<IUpdateSkuResponse> {
		const client = this.client!

		const [res, err] = await client.patch<ITraceResponse>(
			`/seller/v1/portfolios/skus/${encodeURIComponent(sku)}`,
			payload
		)
		if (err) {
			this.loggerAdapter.error(`Magalu update SKU payload: ${JSON.stringify(payload)}`)
			this.loggerAdapter.error(`Magalu update SKU error: ${err.message}`)

			throw new Error(`Failed to update existing SKU ${sku} in Magalu - ${client.getMessageFromError(err)}`)
		}

		return { trace_id: res.trace_id }
	}

	private async publishPrice({ variant, trace_id, sales_channel_id }: IPublishPriceParams): Promise<void> {
		const client = this.client!

		const payload: IPricePayload = {
			channel: { id: sales_channel_id },
			currency: 'BRL',
			list_price: variant.price,
			price: variant.price,
			metadata: { trace_id }
		}

		const [, err] = await client.post<ITraceResponse>(
			`/seller/v1/portfolios/prices/${encodeURIComponent(variant.sku)}`,
			payload
		)
		if (err) {
			const message = client.getMessageFromError(err)

			this.loggerAdapter.error(`Magalu publish price payload: ${JSON.stringify(payload)}`)
			this.loggerAdapter.error(`Magalu publish price error: ${err.message}`)

			throw new Error(`Failed to publish price for SKU ${variant.sku} to Magalu - ${message}`)
		}
	}

	private async publishStock({ variant, trace_id, sales_channel_id }: IPublishStockParams): Promise<void> {
		const client = this.client!

		const payload: IStockPayload = {
			channel: { id: sales_channel_id },
			quantity: 0,
			type: StockType.AVAILABLE,
			metadata: { trace_id }
		}

		const [, err] = await client.post<ITraceResponse>(
			`/seller/v1/portfolios/stocks/${encodeURIComponent(variant.sku)}`,
			payload
		)
		if (err) {
			const message = client.getMessageFromError(err)

			this.loggerAdapter.error(`Magalu publish stock payload: ${JSON.stringify(payload)}`)
			this.loggerAdapter.error(`Magalu publish stock error: ${err.message}`)

			throw new Error(`Failed to publish stock for SKU ${variant.sku} to Magalu - ${message}`)
		}
	}

	private resolveSalesChannelId(base_url: string): string {
		if (base_url.toLowerCase().includes('sandbox')) {
			return MagaluAdapter.MAGALU_SALES_CHANNEL_ID_SANDBOX
		}

		return MagaluAdapter.MAGALU_SALES_CHANNEL_ID_PRODUCTION
	}

	protected getUnauthenticatedClient({ base_url }: IGetUnauthenticatedClientParams): MagaluClient {
		return new MagaluClient(base_url, { access_token: '', token_type: 'Bearer' })
	}

	protected getClient({ base_url, credentials }: IGetClientParams): MagaluClient {
		if (!this.client) {
			this.client = new MagaluClient(base_url, credentials)
		} else {
			this.client.updateCredentials(credentials)
		}

		return this.client
	}
}

type IMapAttributesParams = {
	attributes: IAttributeResponse[]
	type: 'variation' | 'datasheet'
}

type IPublishSkuParams = {
	category_id: string
	sales_channel_id: string
	product: IPublishProductParams['product']
	variant: IPublishProductParams['product']['variants'][number]
	attributes: IGetAttributesResponse['attributes']
}
type IPublishSkuResponse = {
	trace_id: string
}

type IMapSkuAttributesParams = {
	product: {
		attributes: UnknownObject
	}
	variant: {
		attributes: UnknownObject
	}
	allowed_variation_attributes: string[]
}
type IMapSkuAttributesResponse = {
	datasheet: Array<{ name: string, value: string }>
	attributes: Array<{ name: string, value: string }>
}

type IMapProductDimensionsParams = {
	variant: Pick<IVariant, 'height_cm' | 'width_cm' | 'depth_cm' | 'weight_kg'>
	type: DimensionType
}
type IMapProductDimensionsResponse = ISkuPayload['dimensions'][number]

type IUpdateSkuParams = {
	sku: string
	payload: ISkuPayload
}
type IUpdateSkuResponse = {
	trace_id: string
}

type IPublishPriceParams = {
	variant: Pick<IVariant, 'sku' | 'price'>
	trace_id: string
	sales_channel_id: string
}

type IPublishStockParams = {
	variant: Pick<IVariant, 'sku'>
	trace_id: string
	sales_channel_id: string
}

type IGetUnauthenticatedClientParams = Pick<IMarketplaceProvider, 'base_url'>

type IGetClientParams = {
	credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
} & Pick<IMarketplaceProvider, 'base_url'>