import type { Config } from 'drizzle-kit'

import { env } from '@utils/env'

export default {
	schema: './drizzle/schema.ts',
	out: './drizzle/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL
	}
} satisfies Config