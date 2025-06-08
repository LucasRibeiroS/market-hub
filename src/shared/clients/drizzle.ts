import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { asc, desc, is, sql, SQL } from 'drizzle-orm'
import { PgSelect, PgTableWithColumns, PgTimestampString, SelectedFields } from 'drizzle-orm/pg-core'
import { SelectResultFields } from 'drizzle-orm/query-builders/select.types'

import * as schema from '@drizzle'
import { createPaginationResult, IPagination, IPaginator, paginate } from '@utils/pagination'
import { env } from '@utils/env'

const client = postgres(env.DATABASE_URL)

export const drizzleClient = drizzle(client, { schema })

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

type PaginatedQueryParams<T> = {
	query: T
	// eslint-disable-next-line typescript/no-explicit-any
	table: PgTableWithColumns<any> // Represents an table or enum of the schema
	counter: Promise<number>
	paginator: IPaginator
}
type PaginatedQueryResult<T extends PgSelect> = Promise<{
	data: Awaited<ReturnType<T['execute']>>
	pagination: IPagination
}>

export abstract class DrizzleBaseRepository {
	protected async paginatedQuery<T extends PgSelect>({
		query,
		table,
		counter,
		paginator
	}: PaginatedQueryParams<T>): PaginatedQueryResult<T> {
		const { limit, offset } = paginate(paginator.page, paginator.page_size)
		if (limit !== undefined) query.limit(limit)
		if (offset !== undefined) query.offset(offset)
		if (paginator.order_by && paginator.order_direction && paginator.order_by in table) {
			const column = table[paginator.order_by]
			query.orderBy(paginator.order_direction === 'asc' ? asc(column) : desc(column))
		}

		const [data, pagination] = await Promise.all([
			query.execute() as ReturnType<T['execute']>,
			createPaginationResult(counter, paginator.page_size)
		])

		return { data, pagination }
	}
}