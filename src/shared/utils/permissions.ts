type UserSections =
	| 'products'
	| 'webhooks'

type UserPermissions = `user.${UserSections}`
type _UserPermissionsPermissionsTypeObject = {
	[key in UserSections]: `producer.${key}`
}
const UserPermissions: _UserPermissionsPermissionsTypeObject = {
	'products': 'producer.products',
	'webhooks': 'producer.webhooks'
}

type _PermissionsObject = {
	user: _UserPermissionsPermissionsTypeObject
}
export const Permissions: _PermissionsObject = {
	user: UserPermissions
}

export type Permissions = UserPermissions