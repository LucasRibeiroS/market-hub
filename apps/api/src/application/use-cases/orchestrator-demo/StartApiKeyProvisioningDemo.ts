import '@orchestrators/implementations'

import { inject, injectable } from 'tsyringe'
import { Type } from '@sinclair/typebox'

import { IUseCase } from '@integrator-packages/use-case'
import { IOrchestratorDispatcher, OrchestratorDispatcherSymbol, OrchestratorFactory } from '@integrator-packages/use-case/orchestrator'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'
import { Documentation } from '@integrator-packages/use-case/documentation'

type StartApiKeyProvisioningDemoRequest = {
	user_id: string
	api_key_name?: string
	should_fail?: boolean
}

type T = StartApiKeyProvisioningDemoRequest

type StartApiKeyProvisioningDemoResponse = {
	orchestration_id: string
	workflow: string
	queued: true
}

type K = StartApiKeyProvisioningDemoResponse

const DemoApiKeyProvisioningRequestSchema = Type.Object({
	user_id: Type.String(),
	api_key_name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
	should_fail: Type.Optional(Type.Boolean())
})

@injectable()
@ValidateWith(() => Validator)
@Documentation({
	tags: ['Orchestrator Demo'],
	summary: 'Start demo orchestrator',
	description: 'Starts a two-step saga that creates an API key and verifies it, with optional forced rollback.',
	request: Type.Omit(DemoApiKeyProvisioningRequestSchema, ['user_id'], { $id: 'orchestrator-demo/StartApiKeyProvisioningDemoRequest' }),
	response: Type.Object({
		orchestration_id: Type.String(),
		workflow: Type.String(),
		queued: Type.Literal(true)
	}, { $id: 'orchestrator-demo/StartApiKeyProvisioningDemoResponse' })
})
export class StartApiKeyProvisioningDemo implements IUseCase<T, K> {
	constructor(
		@inject(OrchestratorDispatcherSymbol)
		private orchestratorDispatcher: IOrchestratorDispatcher
	) {}

	async execute({ user_id, api_key_name, should_fail }: T): Promise<K> {
		const workflow = OrchestratorFactory.createFromRegistry<{
			user_id: string
			api_key_name: string
			should_fail?: boolean
		}>('demo-api-key-provisioning', this.orchestratorDispatcher)

		const context = await workflow.start({
			user_id,
			api_key_name: api_key_name ?? 'Demo orchestrator key',
			should_fail
		})

		return {
			orchestration_id: context.orchestration_id,
			workflow: context.orchestration_name,
			queued: true
		}
	}
}

class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = DemoApiKeyProvisioningRequestSchema

	protected schema = Validator.schema
}
