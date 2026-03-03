export const enum Permissions {
	USER_PRODUCTS = 'user.products',
	USER_WEBHOOKS = 'user.webhooks'
}

export const getPermissionsOptions = (): { label: string, value: Permissions }[] => {
	return [
		{ label: 'Produtos', value: Permissions.USER_PRODUCTS },
		{ label: 'Webhooks', value: Permissions.USER_WEBHOOKS }
	]
}