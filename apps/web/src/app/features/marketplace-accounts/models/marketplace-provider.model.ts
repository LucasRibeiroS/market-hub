export type Provider = 'mercado_livre' | 'magalu'

export const ProviderEnum: { [key in Provider]: key } = {
	mercado_livre: 'mercado_livre',
	magalu: 'magalu'
}

export type IMarketplaceProvider = {
	id: string
	provider: Provider
	display_name: string
	is_active: boolean
	auth_url: string
}