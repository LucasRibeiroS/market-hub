import { registerRoutes } from '@http/utils/routes'

import { ProcessMagaluOrderWebhook, ProcessMercadoLivreOrderWebhook } from '@use-cases/orders'

export const orderWebhooksRoutes = registerRoutes([
	{
		method: 'post',
		path: '/:account_id/magalu',
		use_case_class: ProcessMagaluOrderWebhook,
		swagger_options: { hide: true }
	},
	{
		method: 'post',
		path: '/mercado-livre',
		use_case_class: ProcessMercadoLivreOrderWebhook,
		swagger_options: { hide: true }
	}
], { group: '/webhooks/orders' })