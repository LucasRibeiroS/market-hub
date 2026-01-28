import { IVariant } from '@integrator-packages/database/entities'

import { CustomOmit } from '@utils/types'

export type IFindManyParams = {
	user_id: string
	sku: string[]
}
export type IFindManyResponse = Array<Pick<IVariant, 'id' | 'sku'>>

export type ICreateManyParams = Array<
	CustomOmit<IVariant, 'id' | 'created_at' | 'updated_at'>
>

export interface IVariantsRepository {
	findMany(params: IFindManyParams): Promise<IFindManyResponse>
	createMany(data: ICreateManyParams): Promise<IVariant[]>
}

export const VariantsRepositorySymbol = Symbol('IVariantsRepository')