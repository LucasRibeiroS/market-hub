import { IMarketplaceCredential } from '@integrator-packages/database/entities/IMarketplaceCredential'

import { tryParseJson } from '@utils/try_catch'

import { BaseHttpClient } from '@clients/BaseHttpClient'
import {
	IMagaluErrorDetail,
	IMagaluErrorResponse,
	IMagaluValidationErrorDetail,
	IMagaluValidationErrorResponse
} from '@adapters/implementations/magalu/types'

export class MagaluClient extends BaseHttpClient {
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
		const rawMessage = this.getRawErrorMessage(error)
		const [payload, parseError] = tryParseJson<IMagaluErrorResponse | IMagaluValidationErrorResponse>(rawMessage)

		if (parseError !== null) {
			return rawMessage.trim() || 'Unknown Magalu error'
		}

		// First, try to extract message from standard error response
		if ('message' in payload) {
			const message = payload.message.trim()
			const details = this.formatErrorDetails(payload.details)

			if (details !== null) {
				return `${message}. ${details}`
			}

			return message
		}

		// If it's not a standard error response, try to extract details from validation error response
		const details = this.formatValidationErrorDetails(payload.detail)
		if (details !== null) {
			return details
		}

		return rawMessage.trim() || 'Unknown Magalu error'
	}

	private formatErrorDetails(details: IMagaluErrorDetail[] | undefined): string | null {
		return details
			?.map(detail => {
				const message = detail.message.trim()
				if (message.length === 0) {
					return null
				}

				const path = [detail.location, detail.field].filter(item => item.length > 0).join('.')
				if (path.length > 0) {
					return `${path}: ${message}`
				}

				return message
			})
			.filter((item): item is string => item !== null)
			.join('. ') || null
	}

	private formatValidationErrorDetails(details: IMagaluValidationErrorDetail[]): string | null {
		return details
			?.map(detail => {
				const message = detail.msg.trim()
				if (message.length === 0) {
					return null
				}

				const path = detail.loc.map(String).join('.')
				if (path.length > 0) {
					return `${path}: ${message}`
				}

				return message
			})
			.filter((item): item is string => item !== null)
			.join('. ') || null
	}
}
