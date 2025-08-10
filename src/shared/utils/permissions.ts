type UserSections =
	| 'products'
	| 'webhooks'

type UserPermissions = `user.${UserSections}`
type _UserPermissionsPermissionsTypeObject = {
	[key in UserSections]: `user.${key}`
}
const UserPermissions: _UserPermissionsPermissionsTypeObject = {
	'products': 'user.products',
	'webhooks': 'user.webhooks'
}

type _PermissionsObject = {
	user: _UserPermissionsPermissionsTypeObject
}
export const Permissions: _PermissionsObject = {
	user: UserPermissions
}

export type IPermissions = UserPermissions