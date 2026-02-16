import { IApiKey } from '@integrator-packages/database/entities'

import { IPagination, IPaginator } from '@utils/pagination'
import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
} & IPaginator
export type IFindManyResponse = {
	data: IApiKey[]
	pagination: IPagination
}

export type IFindByIdResponse = Pick<IApiKey, 'id' | 'user_id'>

export type IFindFirstParams = Pick<IApiKey, 'key_lookup'>

export type ICountParams = {
	user_id: string
}

export type ICreateParams = CustomOmit<IApiKey, 'id' | 'created_at' | 'updated_at'>

export interface IApiKeysRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findById(id: string): Promise<IFindByIdResponse | null>
	findFirst(params: IFindFirstParams): Promise<IApiKey | null>
	count(params: ICountParams): Promise<number>
	create(params: ICreateParams): Promise<IApiKey>
	delete(id: string): Promise<void>
}

export const ApiKeysRepositorySymbol = 'ApiKeysRepository'