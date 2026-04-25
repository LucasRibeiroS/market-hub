import { IMarketplaceCredential } from '@integrator-packages/database/entities/IMarketplaceCredential'

import { tryParseJson } from '@utils/try_catch'

import { BaseHttpClient } from '@clients/BaseHttpClient'
import { IMeliErrorResponse } from '@adapters/implementations/mercado-livre/types'

export class MercadoLivreClient extends BaseHttpClient {
	constructor(
		baseURL: string,
		credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>
	) {
		super(baseURL)
		this.updateCredentials(credentials)
	}

	updateCredentials(credentials: Pick<IMarketplaceCredential, 'access_token' | 'token_type'>): void {
		if (credentials.token_type !== 'Bearer') {
			throw new Error(`Unsupported token type: ${credentials.token_type}`)
		}
		if (credentials.access_token === '') {
			return
		}

		this.defaultHeaders['Authorization'] = `${credentials.token_type} ${credentials.access_token}`
	}

	getMessageFromError(error: Error): string {
		const message = this.getRawErrorMessage(error)

		const [payload, parseError] = tryParseJson<IMeliErrorResponse>(message)
		if (parseError) {
			return message
		}

		const errors = payload.cause.filter(c => c.type === 'error')
		if (errors.length === 0) {
			return payload.message
		}

		const messages = errors.map(cause => {
			switch (cause.code) {
				case 'item.attributes.missing_required':
				case 'item.attribute.missing_conditional_required':
					return `Missing required attributes: ${this.extractAttributes(cause.message)}`

				case 'item.attribute.missing_catalog_required':
					return `Missing catalog attribute: ${cause.message.replace('O campo ', '').replace(' é obrigatório e não foi adicionado.', '')}`

				case 'item.variations.attribute_combinations.missing':
				case 'item.variations.attribute_combinations.invalid':
					return 'Invalid variation attributes: each variation must have distinct attribute combinations'

				case 'item.variations.price.different':
					return 'Product price must match the lowest variation price'

				case 'item.attributes.invalid':
					return 'Duplicate attributes: same attribute cannot appear in both product and variation fields'

				case 'item.condition.invalid':
					return 'Invalid product condition for this category'

				case 'body.required_fields':
					return `Missing required fields in variations: ${cause.references.join(', ')}`

				case 'error.item.attribute.anatel_homologation_number.value_name':
					return 'Invalid Anatel homologation number — must match a product registered at sistemas.anatel.gov.br/sch'

				case 'item.attribute.product_identifier.invalid_format':
					return 'Invalid GTIN/EAN format — check that the barcode has a valid checksum'

				case 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES':
					return 'Account is not authorized to publish listings — check account registration status on Mercado Livre'

				default:
					return cause.message
			}
		})

		return messages.join('. ')
	}

	private extractAttributes(message: string): string {
		const match = message.match(/\[([^\]]+)\]/)
		return match ? match[1] : message
	}
}