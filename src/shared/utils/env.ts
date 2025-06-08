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
	AUTH_ACCESS_SECRET: string
	AUTH_ACCESS_EXPIRES: string
	AUTH_REFRESH_SECRET: string
	AUTH_REFRESH_EXPIRES: string
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
	AUTH_ACCESS_SECRET: Type.String(),
	AUTH_ACCESS_EXPIRES: Type.String({ default: '15m' }),
	AUTH_REFRESH_SECRET: Type.String(),
	AUTH_REFRESH_EXPIRES: Type.String({ default: '30d' })
})

assertTypes<Static<typeof schema>, IEnv>()
assertTypes<IEnv, Static<typeof schema>>()

const envValidator = ajv.compile(schema)

if (!envValidator(process.env)) {
	throw new Error(`Invalid environment variables: ${JSON.stringify(envValidator.errors)}`)
}

export const env = process.env as unknown as IEnv