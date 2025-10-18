import 'dotenv/config'

import { Static, Type } from '@sinclair/typebox'

import { assertTypes } from '@utils/types'
import { ajv } from '@clients/ajv'

type IEnv = {
	TZ: string
	NODE_ENV: 'local' | 'production'
	APPLICATION_NAME: string
	PORT: number
	DATABASE_URL: string
	REDIS_HOST: string
	REDIS_PORT: number
	// Authentication
	ACCESS_TOKEN_SECRET: string
	ACCESS_TOKEN_EXPIRES: string
	REFRESH_TOKEN_SECRET: string
	REFRESH_TOKEN_EXPIRES: string
	PASSWORD_RESET_EXPIRES: number // in minutes
	// Send email
	SMTP_HOST: string
	SMTP_PORT: number
	SMTP_USE_SSL: string
	SMTP_USER: string
	SMTP_PASS: string
	SMTP_SOURCE: string
}

const schema = Type.Object({
	TZ: Type.String({ default: 'America/Sao_Paulo' }),
	NODE_ENV: Type.Union([Type.Literal('production'), Type.Literal('local')], { default: 'local' }),
	APPLICATION_NAME: Type.String({ default: 'integrator' }),
	PORT: Type.Number({ default: 3000 }),
	DATABASE_URL: Type.String(),
	REDIS_HOST: Type.String(),
	REDIS_PORT: Type.Number(),
	// Authentication
	ACCESS_TOKEN_SECRET: Type.String(),
	ACCESS_TOKEN_EXPIRES: Type.String({ default: '15m' }),
	REFRESH_TOKEN_SECRET: Type.String(),
	REFRESH_TOKEN_EXPIRES: Type.String({ default: '30d' }),
	PASSWORD_RESET_EXPIRES: Type.Number({ default: 5 }),
	// Send email
	SMTP_HOST: Type.String(),
	SMTP_PORT: Type.Number({ default: 587 }),
	SMTP_USE_SSL: Type.String({ default: 'false' }),
	SMTP_USER: Type.String(),
	SMTP_PASS: Type.String(),
	SMTP_SOURCE: Type.String()
})

assertTypes<Static<typeof schema>, IEnv>()
assertTypes<IEnv, Static<typeof schema>>()

const envValidator = ajv.compile(schema)

if (!envValidator(process.env)) {
	throw new Error(`Invalid environment variables: ${JSON.stringify(envValidator.errors)}`)
}

export const env = process.env as unknown as IEnv