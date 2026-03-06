import { IPasswordReset } from '@integrator-packages/database/entities'

import { CustomOmit } from '@utils/types'

export type ICreateParams = CustomOmit<
	IPasswordReset,
    | 'id'
    | 'created_at'
    | 'updated_at'
>

export type IFindLastParams = {
	user_id: string
}

export type IUpdateParams = {
	id: string
	data: Pick<IPasswordReset, 'is_used'>
}

export interface IPasswordResetsRepository {
	create(params: ICreateParams): Promise<IPasswordReset>
	findLast(params: IFindLastParams): Promise<IPasswordReset | null>
	update(params: IUpdateParams): Promise<IPasswordReset>
}

export const PasswordResetsRepositorySymbol = Symbol('IPasswordResetsRepository')