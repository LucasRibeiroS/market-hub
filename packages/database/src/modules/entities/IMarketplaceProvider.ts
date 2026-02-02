import { Provider } from '@entities/enums'

export type IMarketplaceProvider = {
	id: string
	provider: Provider
	display_name: string
	auth_url: string
	token_url: string
	client_id: string
	client_secret: string
	is_active: boolean
}