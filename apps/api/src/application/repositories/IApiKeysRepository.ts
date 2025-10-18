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

export type IFindFirstParams = {
	public_key: string
}

export type ICountParams = {
	user_id: string
}

export type ICreateParams = CustomOmit<IApiKey, 'id' | 'created_at' | 'updated_at'>

export interface IApiKeysRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findFirst(params: IFindFirstParams): Promise<IApiKey | null>
	count(params: ICountParams): Promise<number>
	create(params: ICreateParams): Promise<IApiKey>
	delete(id: string): Promise<void>
}