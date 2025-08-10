import { IPermissions } from '@utils/permissions'

export type IApiKey = {
	id: string
	user_id: string
	public_key: string
	name: string
	permissions: IPermissions[]
	created_at: Date
	updated_at: Date
}