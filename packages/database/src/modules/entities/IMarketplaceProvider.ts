import { Provider } from '@entities/enums'

export type IMarketplaceProvider = {
	id: string
	provider: Provider
	display_name: string
	is_active: boolean
	client_id: string
	client_secret: string
	redirect_uri: string
	base_url: string
	auth_url: string
}