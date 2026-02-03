import { Type } from '@sinclair/typebox'

import { IMarketplaceAccount, Provider } from '@integrator-packages/database/entities'

import { IUseCase } from '@integrator-packages/use-case'
import { BaseValidator, ValidateWith } from '@integrator-packages/use-case/validator'

import { providerEnumSchema } from '@utils/typebox'
import { Documentation } from '@integrator-packages/use-case/documentation/index'

type CreateMarketplaceAccountRequest = {
	user_id: string
	provider: Provider
	code: string
}
type T = CreateMarketplaceAccountRequest
type CreateMarketplaceAccountResponse = {
	account: Pick<IMarketplaceAccount, 'id' | 'provider'>
}
type K = CreateMarketplaceAccountResponse

@ValidateWith(() => Validator)
@Documentation({
	tags: ['Marketplace Accounts'],
	summary: 'Create a marketplace account',
	description: 'Creates a new marketplace account for the specified provider using the provided authorization code.'
})
export class CreateMarketplaceAccount implements IUseCase<T, K> {
	async execute({ user_id, provider, code }: T): Promise<K> {
		console.log('Creating marketplace account with:', { user_id, provider, code })
		// Implementation logic to create a marketplace account goes here
		return {
			account: {
				id: 'generated-account-id',
				provider: provider
			}
		}
	}
}

@Documentation({
	request: Type.Omit(Validator.schema, ['user_id'], { $id: 'marketplace-accounts/CreateMarketplaceAccountRequest' })
})
class Validator extends BaseValidator<T, typeof Validator.schema> {
	static schema = Type.Object({
		user_id: Type.String(),
		provider: Type.Ref(providerEnumSchema.$id),
		code: Type.String()
	})

	protected $id = 'marketplace-accounts/CreateMarketplaceAccountValidator'
	protected schema = Validator.schema
}