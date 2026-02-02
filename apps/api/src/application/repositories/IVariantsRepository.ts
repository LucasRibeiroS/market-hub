import { IVariant } from '@integrator-packages/database/entities'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
	product_id?: string
	sku: string[]
}
export type IFindManyResponse = Array<Pick<IVariant, 'id' | 'sku'>>

export type IFindFirstParams = {
	sku: string
}

export type ICreateManyParams = Array<
	CustomOmit<IVariant, 'id' | 'created_at' | 'updated_at'>
>

export type IDeleteManyParams = { id: string[] }

export interface IVariantsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findFirst(params: IFindFirstParams): Promise<IVariant | null>
	createMany(data: ICreateManyParams): Promise<IVariant[]>
	deleteMany(params: IDeleteManyParams): Promise<void>
}

export const VariantsRepositorySymbol = Symbol('IVariantsRepository')