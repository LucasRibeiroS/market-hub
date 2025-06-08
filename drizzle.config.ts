import type { Config } from 'drizzle-kit'

import { env } from '@utils/env'

export default {
	schema: './database/drizzle/schema.ts',
	out: './database/drizzle/migrations',
	dialect: 'postgresql',
	migrations: {
		prefix: 'timestamp'
	},
	dbCredentials: {
		url: env.DATABASE_URL
	}
} satisfies Config