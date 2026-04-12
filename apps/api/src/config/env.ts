import 'dotenv/config'

import Ajv from 'ajv'
import { Static, Type } from '@sinclair/typebox'

import { assertTypes } from '@utils/types'

const ajv = new Ajv({
	removeAdditional: 'all',
	coerceTypes: 'array',
	useDefaults: true
})

type IEnv = {
	TZ: string
	NODE_ENV: 'local' | 'production' | 'test'
	APPLICATION_NAME: string
	PORT: number
	QUEUE_MONITORING_PORT: number
	APP_URL: string
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
	// Encryption
	ENCRYPTION_SALT: string
	ENCRYPTION_KEY: string
	HASH_KEY: string
}

const schema = Type.Object({
	TZ: Type.String({ default: 'America/Sao_Paulo' }),
	NODE_ENV: Type.Union([
		Type.Literal('production'),
		Type.Literal('local'),
		Type.Literal('test')
	], { default: 'local' }),
	APPLICATION_NAME: Type.String({ default: 'integrator' }),
	PORT: Type.Number({ default: 3000 }),
	QUEUE_MONITORING_PORT: Type.Number({ default: 13000 }),
	APP_URL: Type.String({ default: 'http://localhost' }),
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
	SMTP_SOURCE: Type.String(),
	// Encryption
	ENCRYPTION_SALT: Type.String({ minLength: 32, maxLength: 32 }),
	ENCRYPTION_KEY: Type.String({ minLength: 32, maxLength: 32 }),
	HASH_KEY: Type.String({ minLength: 32, maxLength: 32 })
})

assertTypes<Static<typeof schema>, IEnv>()
assertTypes<IEnv, Static<typeof schema>>()

const envValidator = ajv.compile(schema)

if (!envValidator(process.env)) {
	throw new Error(`Invalid environment variables: ${JSON.stringify(envValidator.errors)}`)
}

export const env = process.env as unknown as IEnv