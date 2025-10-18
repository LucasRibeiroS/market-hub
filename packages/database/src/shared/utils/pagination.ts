export type IPaginator = {
	page: number
	page_size: number
	order_by?: string
	order_direction?: 'asc' | 'desc'
}

export type IPagination = {
	page_size: number
	total_pages: number
	total_count: number
}

export const defaultPageSize = 25

export const paginate = (page: number, size: number) => ({
	limit: size,
	offset: page >= 1
		? (page - 1) * size
		: size
})

export const createPaginationResult = async(
	counter: Promise<number>,
	page_size: number
): Promise<IPagination> => {
	const count = await Promise.resolve(counter)
	return {
		page_size,
		total_pages: Math.ceil(count / page_size),
		total_count: count
	}
}