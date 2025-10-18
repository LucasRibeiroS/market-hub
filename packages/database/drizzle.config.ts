import type { Config } from 'drizzle-kit'

export default {
	schema: './src/modules/database/schema.ts',
	out: './src/modules/database/migrations',
	dialect: 'postgresql',
	migrations: {
		prefix: 'timestamp'
	},
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
} satisfies Config