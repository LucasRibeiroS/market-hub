import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

import * as schema from '@drizzle/schema'

export const drizzleClient = drizzle(postgres(process.env.DATABASE_URL!), { schema })

export * from '@utils/drizzle/helpers'
export * from '@utils/drizzle/repository'