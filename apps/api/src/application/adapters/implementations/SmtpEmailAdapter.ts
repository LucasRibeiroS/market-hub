import { injectable } from 'tsyringe'

import { env } from '@config/env'

import { smtpClient } from '@clients/nodemailer'

import { IEmailAdapter, ISendEmailParams } from '@adapters/IEmailAdapter'

@injectable()
export class SmtpEmailAdapter implements IEmailAdapter {
	async sendEmail({ destination, subject, message }: ISendEmailParams): Promise<string> {
		const { messageId } = await smtpClient.sendMail({
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