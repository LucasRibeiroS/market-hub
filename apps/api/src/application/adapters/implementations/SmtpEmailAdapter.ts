import nodemailer, { Transporter } from 'nodemailer'

import { env } from '@config/env'

import { IEmailAdapter, ISendEmailParams } from '@adapters/IEmailAdapter'

export class SmtpEmailAdapter implements IEmailAdapter {
	private readonly client: Transporter = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_USE_SSL === 'true',
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS
		}
	})

	async sendEmail({ destination, subject, message }: ISendEmailParams): Promise<string> {
		const { messageId } = await this.client.sendMail({
			from: env.SMTP_SOURCE,
			to: destination,
			subject,
			html: message
		})
		if (!messageId) {
			throw new Error('Error to obtain MessageId from content')
		}

		return messageId
	}
}