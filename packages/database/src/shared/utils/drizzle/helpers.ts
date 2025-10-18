import { is, sql, SQL } from 'drizzle-orm'
import { PgTimestampString, SelectedFields } from 'drizzle-orm/pg-core'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

export const jsonBuildObject = <T extends SelectedFields>(shape: T) => {
	const chunks: SQL[] = []

	Object.entries(shape).forEach(([key, value]) => {
		if (chunks.length > 0) {
			chunks.push(sql.raw(','))
		}

		chunks.push(sql.raw(`'${key}',`))

		// json_build_object formats to ISO 8601 ...
		if (is(value, PgTimestampString)) {
			chunks.push(sql`timezone('UTC', ${value})`)
		} else {
			chunks.push(sql`${value}`)
		}
	})

	return sql<SelectResultFields<T>>`coalesce(json_build_object(${sql.join(chunks)}), '{}')`
}

export const jsonAggBuildObject = <T extends SelectedFields>(shape: T, filter?: SQL) => {
	return sql<SelectResultFields<T>[]>`coalesce(jsonb_agg(${jsonBuildObject(
		shape
	)}) ${filter}, '${sql`[]`}')`
}