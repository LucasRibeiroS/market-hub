import { Provider } from '@integrator-packages/database/entities'

import { env } from '@config/env'

type IResolveOrderWebhookUrlParams = {
	account_id: string
	provider: Provider
}

const providerToPathMap: Record<Provider, string> = {
	'mercado_livre': 'mercado-livre',
	'magalu': 'magalu'
}

export const resolveOrderWebhookUrl = ({ account_id, provider }: IResolveOrderWebhookUrlParams) => {
	const providerPath = providerToPathMap[provider] || provider

	return `${env.APP_URL}/webhooks/orders/${account_id}/${providerPath}`
}