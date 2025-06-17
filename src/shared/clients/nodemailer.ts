import nodemailer from 'nodemailer'

import { env } from '@utils/env'

export const smtpClient = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_USE_SSL === 'true',
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS
	}
})