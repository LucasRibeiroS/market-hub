import { UseCaseHandler } from '@utils/use_case'

import { DrizzleApiKeysRepository } from '@repositories/implementations'

import { ListApiKeys, ListApiKeysValidator } from './ListApiKeys'
import { CreateApiKey, CreateApiKeyValidator } from './CreateApiKey'

export const listApiKeys = new UseCaseHandler(
	new ListApiKeys(new DrizzleApiKeysRepository()),
	new ListApiKeysValidator()
)

export const createApiKey = new UseCaseHandler(
	new CreateApiKey(new DrizzleApiKeysRepository()),
	new CreateApiKeyValidator()
)