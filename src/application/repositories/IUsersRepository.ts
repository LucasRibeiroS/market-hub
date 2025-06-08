import { IUser } from '@entities'

export type IFindFirstParams = {
	email: string
}

export type ICreateParams = {
	email: string
	password: string
}

export interface IUsersRepository {
	findById(id: string): Promise<IUser | null>
	findFirst(params: IFindFirstParams): Promise<IUser | null>
	create(data: ICreateParams): Promise<IUser>
}