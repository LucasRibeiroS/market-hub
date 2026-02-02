export type Provider = 'mercado_livre' | 'magalu'

export const ProviderEnum: { [key in Provider]: key } = {
	mercado_livre: 'mercado_livre',
	magalu: 'magalu'
}