import { Type } from '@sinclair/typebox'

import { defineOrchestrator } from '@integrator-packages/use-case/orchestrator'

import { CreateApiKey, DeleteApiKey, GetApiKey } from '@use-cases/api-keys'

import { Permissions, UserPermissions } from '@utils/permissions'

type DemoApiKeyProvisioningInput = {
	user_id: string
	api_key_name: string
	should_fail?: boolean
}

type DemoApiKeyProvisioningState = {
	api_key_id?: string
	api_key_name?: string
}

export const DemoApiKeyProvisioningOrchestrator = defineOrchestrator<DemoApiKeyProvisioningInput, DemoApiKeyProvisioningState>({
	name: 'demo-api-key-provisioning',
	queue_name: 'orchestrations',
	steps: [
		{
			name: 'create-api-key',
			use_case: CreateApiKey,
			compensate_use_case: DeleteApiKey,
			build_input: ({ input }) => ({
				user_id: input.user_id,
				name: input.api_key_name,
				permissions: [Permissions.user.products as UserPermissions]
			}),
			merge_state_on_success: (_, result) => {
				const apiKeyResult = result as { api_key: { id: string; name: string } }

				return {
					api_key_id: apiKeyResult.api_key.id,
					api_key_name: apiKeyResult.api_key.name
				}
			},
			build_compensation_input: (context) => {
				if (context.state.api_key_id === undefined) {
					return undefined as never
				}

				return {
					id: context.state.api_key_id,
					user_id: context.input.user_id
				}
			}
		},
		{
			name: 'verify-api-key',
			use_case: GetApiKey,
			build_input: ({ input, state }) => ({
				user_id: input.user_id,
				id: input.should_fail === true
					? '00000000-0000-0000-0000-000000000000'
					: String(state.api_key_id)
			})
		}
	]
})

export const DemoApiKeyProvisioningDocumentation = Type.Object({
	user_id: Type.String(),
	api_key_name: Type.String({ minLength: 1, maxLength: 100 }),
	should_fail: Type.Optional(Type.Boolean())
})