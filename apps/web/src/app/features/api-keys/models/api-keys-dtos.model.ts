import { IPagination, IPaginator } from '@shared/utils/pagination'

import { IApiKey } from '@features/api-keys/models/api-key.model'

export type ListApiKeysRequest = IPaginator
export type ListApiKeysResponse = {
	api_keys: IApiKey[]
	pagination: IPagination
}

export type GetApiKeyResponse = { api_key: IApiKey }

// TODO Change permissions from string[] to UserPermissions[]
export type CreateApiKeyRequest = { permissions: string[] } & Pick<IApiKey, 'name'>
export type CreateApiKeyResponse = {
	api_key: { key: string } & IApiKey
}

export type UpdateApiKeyRequest = Partial<{
	name: string
	// TODO Change permissions from string[] to UserPermissions[]
	permissions: string[]
	is_active: boolean
}>
export type UpdateApiKeyResponse = {
	api_key: IApiKey
}

export type DeleteApiKeyRequest = { id: string }