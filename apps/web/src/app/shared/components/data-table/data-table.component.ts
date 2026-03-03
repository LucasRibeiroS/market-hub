import {
	AfterContentInit,
	Component,
	ContentChildren,
	input,
	model,
	output,
	QueryList,
	TemplateRef
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TableModule, TablePageEvent } from 'primeng/table'
import { SkeletonModule } from 'primeng/skeleton'
import { PrimeTemplate } from 'primeng/api'

import { defaultPageSize, IPagination, IPaginator } from '@shared/utils/pagination'

export interface TableColumn {
	field: string
	header: string
	sortable?: boolean
	width?: string
	align?: 'left' | 'center' | 'right'
}

@Component({
	selector: 'app-data-table',
	standalone: true,
	imports: [CommonModule, TableModule, SkeletonModule],
	templateUrl: './data-table.component.html',
	styleUrls: ['./data-table.component.css']
})
export class DataTableComponent<T extends object> implements AfterContentInit {
	/** Column definitions */
	columns = input<TableColumn[]>([])
	/** Data rows */
	rows = input<T[]>([])
	/** Show skeleton loaders instead of data */
	loading = input(false)
	/** Field used as unique row key */
	dataKey = input('id')
	/** Row id to highlight (fades out automatically via CSS animation) */
	highlightedId = input<string | null>(null)
	/** Enable pagination */
	paginator = model<IPaginator>({ page: 1, page_size: defaultPageSize })
	/** Page size options for the paginator */
	pageSizeOptions = input<number[]>([5, 10, 25])
	/** Minimum table width before horizontal scroll kicks in */
	minWidth = input('600px')
	/** Message shown in the empty state when no custom empty template is provided */
	emptyMessage = input('Nenhum resultado encontrado.')
	/** Pagination metadata */
	pagination = input<IPagination | null>(null)

	onPaginatorChange = output<IPaginator>()

	@ContentChildren(PrimeTemplate) templates!: QueryList<PrimeTemplate>

	actionsTemplate: TemplateRef<unknown> | null = null
	emptyTemplate: TemplateRef<unknown> | null = null
	private cellTemplates = new Map<string, TemplateRef<unknown>>()

	hasActionsTemplate = false

	skeletonRows = Array(5).fill({})
	skeletonWidths = ['90%', '75%', '80%', '65%', '85%']

	ngAfterContentInit(): void {
		this.templates.forEach(t => {
			switch (t.getType()) {
				case 'actions':
					this.actionsTemplate = t.template
					this.hasActionsTemplate = true
					break
				case 'empty':
					this.emptyTemplate = t.template
					break
				default:
					this.cellTemplates.set(t.getType(), t.template)
			}
		})
	}

	onPage(event: TablePageEvent): void {
		const next: IPaginator = {
			...this.paginator(),
			page: event.first / event.rows + 1,
			page_size: event.rows
		}
		this.paginator.set(next)
		this.onPaginatorChange.emit(next)
	}

	onSort(event: { field: string, order: -1 | 1 }): void {
		const direction = event.order === 1 ? 'asc' : 'desc'
		const current = this.paginator()

		if (event.field === current.order_by && direction === current.order_direction) return

		const next: IPaginator = {
			...current,
			page: 1,
			order_by: event.field,
			order_direction: direction
		}
		this.paginator.set(next)
		this.onPaginatorChange.emit(next)
	}

	get showPaginator(): boolean {
		const minPageSize = Math.min(...this.pageSizeOptions())
		return !this.loading() && this.rows().length > minPageSize
	}

	getCellTemplate(field: string): TemplateRef<unknown> | null {
		return this.cellTemplates.get(field) ?? null
	}

	rowClass(row: T): string {
		return this.highlightedId() && (row as Record<string, unknown>)[this.dataKey()] === this.highlightedId()
			? 'row-highlighted'
			: ''
	}
}