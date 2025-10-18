import { asc, desc } from 'drizzle-orm'
import { PgSelect } from 'drizzle-orm/pg-core'

import { createPaginationResult, IPagination, IPaginator, paginate } from '@utils/pagination'

type PaginatedQueryParams<T> = {
	query: T
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
		counter,
		paginator
	}: PaginatedQueryParams<T>): PaginatedQueryResult<T> {
		const { limit, offset } = paginate(paginator.page, paginator.page_size)
		query.limit(limit)
		query.offset(offset)

		if (paginator.order_by && paginator.order_direction) {
			const orderByField = paginator.order_by
			query.orderBy(fields => paginator.order_direction === 'asc'
				? asc(fields[orderByField])
				: desc(fields[orderByField]))
		}

		const [data, pagination] = await Promise.all([
			query.execute() as ReturnType<T['execute']>,
			createPaginationResult(counter, paginator.page_size)
		])

		return { data, pagination }
	}
}