export type ISendEmailParams = {
	destination: string
	message: string
	subject: string
}

export interface IEmailAdapter {
	sendEmail(params: ISendEmailParams): Promise<string>
}

export const EmailAdapterSymbol = Symbol('IEmailAdapter')