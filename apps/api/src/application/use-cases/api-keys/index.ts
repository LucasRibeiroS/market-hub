import { UseCaseFactory } from '@utils/use_case'

import { DrizzleApiKeysRepository } from '@repositories/implementations'

import { ListApiKeys } from './ListApiKeys'
import { CreateApiKey } from './CreateApiKey'
import { DeleteApiKey } from './DeleteApiKey'

export const listApiKeys = UseCaseFactory.create(
	new ListApiKeys(new DrizzleApiKeysRepository())
)

export const createApiKey = UseCaseFactory.create(
	new CreateApiKey(new DrizzleApiKeysRepository())
)

export const deleteApiKey = UseCaseFactory.create(
	new DeleteApiKey(new DrizzleApiKeysRepository())
)