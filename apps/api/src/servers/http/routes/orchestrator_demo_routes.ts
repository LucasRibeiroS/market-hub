import { registerRoutes } from '@http/utils/routes'

import { StartApiKeyProvisioningDemo } from '@use-cases/orchestrator-demo/StartApiKeyProvisioningDemo'

export const orchestratorDemoRoutes = registerRoutes([
	{
		method: 'post',
		path: '/api-keys',
		auth_method: 'jwt',
		use_case_class: StartApiKeyProvisioningDemo
	}
], { group: '/demo/orchestrator' })