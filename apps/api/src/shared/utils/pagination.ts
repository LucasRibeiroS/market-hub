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