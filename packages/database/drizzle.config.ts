import type { Config } from 'drizzle-kit'

export default {
	schema: './src/modules/drizzle/schema.ts',
	out: './src/modules/drizzle/migrations',
	dialect: 'postgresql',
	migrations: {
		prefix: 'timestamp'
	},
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
} satisfies Config