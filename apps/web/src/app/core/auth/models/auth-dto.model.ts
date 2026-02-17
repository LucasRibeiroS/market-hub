import { ITokens } from '@core/auth/models/token.model'

// Request and response types for authentication operations

export type ISignInRequest = {
	email: string
	password: string
}
export type ISignInResponse = {
	tokens: ITokens
}

export type ISignUpRequest = {
	name: string
	email: string
	password: string
}
export type ISignUpResponse = ISignInResponse

export type ICreatePasswordResetRequest = {
	email: string
}

export type IResetPasswordRequest = {
	email: string
	code: string
	password: string
}