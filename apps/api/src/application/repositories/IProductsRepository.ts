import { IProduct, IVariant } from '@integrator-packages/database/entities'
import { IPagination, IPaginator } from '@utils/pagination'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
} & IPaginator
export type IFindManyResponse = {
	data: Array<{ variants: IVariant[] } & IProduct>
	pagination: IPagination
}

export type IFindByIdResponse = Pick<IProduct, 'id' | 'user_id'>

export type ICountParams = { user_id: string }

export type ICreateParams = CustomOmit<IProduct, 'id' | 'created_at' | 'updated_at'>

export interface IProductsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findById(id: string): Promise<IFindByIdResponse | null>
	count(params: ICountParams): Promise<number>
	create(params: ICreateParams): Promise<IProduct>
}

export const ProductsRepositorySymbol = Symbol('IProductsRepository')