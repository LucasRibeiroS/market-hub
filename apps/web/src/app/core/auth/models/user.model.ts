export type IUser = {
	id: string
	name: string
	email: string
}

export class User {
	constructor(
		public id: string,
		public name: string,
		public email: string
	) {}
}