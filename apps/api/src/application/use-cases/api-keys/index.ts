import { container } from 'tsyringe'

import { UseCaseFactory } from '@integrator-packages/use-case'

import { ListApiKeys } from './ListApiKeys'
import { CreateApiKey } from './CreateApiKey'
import { DeleteApiKey } from './DeleteApiKey'

export const listApiKeys = UseCaseFactory.create(container.resolve(ListApiKeys))
export const createApiKey = UseCaseFactory.create(container.resolve(CreateApiKey))
export const deleteApiKey = UseCaseFactory.create(container.resolve(DeleteApiKey))