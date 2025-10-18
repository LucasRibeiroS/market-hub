import { IUser } from '@integrator-packages/database/entities'

import { CustomOmit } from '@utils/types'

export type IFindFirstParams = {
	email: string
}

export type ICreateParams = CustomOmit<IUser, 'id' | 'created_at' | 'updated_at'>

export type IUpdateParams = {
	id: string
	data: Partial<ICreateParams>
}

export interface IUsersRepository {
	findById(id: string): Promise<IUser | null>
	findFirst(data: IFindFirstParams): Promise<IUser | null>
	create(data: ICreateParams): Promise<IUser>
	update(data: IUpdateParams): Promise<IUser>
}

export const UsersRepositorySymbol = 'UsersRepository'