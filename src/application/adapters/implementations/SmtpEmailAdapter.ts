import { smtpClient } from '@clients/nodemailer'

import { env } from '@utils/env'

import { IEmailAdapter, ISendEmailParams } from '@adapters/IEmailAdapter'

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