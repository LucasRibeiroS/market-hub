import { IVariant } from '@integrator-packages/database/entities'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
	product_id?: string
	sku: string[]
}
export type IFindManyResponse = Array<Pick<IVariant, 'id' | 'sku'>>

export type IFindFirstParams = {
	user_id: string
	sku?: string
	is_primary?: boolean
}

export type ICreateManyParams = Array<
	CustomOmit<IVariant, 'id' | 'created_at' | 'updated_at'>
>

export type IUpdateParams = Partial<
	CustomOmit<IVariant, 'id' | 'user_id' | 'product_id' | 'created_at' | 'updated_at'>
>

export type IUpdateManyParams = IUpdateParams

export type IDeleteManyParams = { id: string[] }

export interface IVariantsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	findFirst(params: IFindFirstParams): Promise<IVariant | null>
	createMany(data: ICreateManyParams): Promise<IVariant[]>
	update(id: string, data: IUpdateParams): Promise<IVariant>
	/**
	 * Updates multiple variants that belong to the same product.
	 */
	updateMany(product_id: string, data: IUpdateManyParams): Promise<void>
	deleteMany(params: IDeleteManyParams): Promise<void>
}

export const VariantsRepositorySymbol = Symbol('IVariantsRepository')