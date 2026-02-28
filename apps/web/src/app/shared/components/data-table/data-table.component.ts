import {
	AfterContentInit,
	Component,
	ContentChildren,
	EventEmitter,
	Input,
	Output,
	QueryList,
	TemplateRef
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { TableModule, TablePageEvent } from 'primeng/table'
import { SkeletonModule } from 'primeng/skeleton'
import { ButtonModule } from 'primeng/button'
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
	imports: [CommonModule, TableModule, SkeletonModule, ButtonModule],
	templateUrl: './data-table.component.html',
	styleUrls: ['./data-table.component.css']
})
export class DataTableComponent<T extends object> implements AfterContentInit {
	/** Column definitions */
	@Input() columns: TableColumn[] = []
	/** Data rows */
	@Input() rows: T[] = []
	/** Show skeleton loaders instead of data */
	@Input() loading = false
	/** Field used as unique row key */
	@Input() dataKey = 'id'
	/** Row id to highlight (fades out automatically via CSS animation) */
	@Input() highlightedId: string | null = null
	/** Enable pagination */
	@Input() paginator: IPaginator = { page: 1, page_size: defaultPageSize }
	/** Page size options for the paginator */
	@Input() pageSizeOptions: number[] = [5, 10, 25]
	/** Minimum table width before horizontal scroll kicks in */
	@Input() minWidth = '600px'
	/** Message shown in the empty state when no custom empty template is provided */
	@Input() emptyMessage = 'Nenhum resultado encontrado.'

	@Input() pagination: IPagination | null = null
	@Output() onPaginatorChange = new EventEmitter<IPaginator>()

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
					// anything else is treated as a cell template named after the column field
					this.cellTemplates.set(t.getType(), t.template)
			}
		})
	}

	onPage(event: TablePageEvent): void {
		this.paginator = {
			...this.paginator,
			page: event.first / event.rows + 1,
			page_size: event.rows
		}
		this.onPaginatorChange.emit(this.paginator)
	}

	onSort(event: { field: string, order: -1 | 1 }): void {
		const direction = event.order === 1 ? 'asc' : 'desc'

		// avoiding infinite loop
		if (event.field === this.paginator.order_by && direction === this.paginator.order_direction) {
			return
		}

		this.paginator = {
			...this.paginator,
			page: 1,
			order_by: event.field,
			order_direction: direction
		}
		this.onPaginatorChange.emit(this.paginator)
	}

	get showPaginator(): boolean {
		const minPageSize = Math.min(...this.pageSizeOptions)
		return !this.loading && this.rows.length > minPageSize
	}

	getCellTemplate(field: string): TemplateRef<unknown> | null {
		return this.cellTemplates.get(field) ?? null
	}

	rowClass(row: T): string {
		return this.highlightedId && (row as Record<string, unknown>)[this.dataKey] === this.highlightedId
			? 'row-highlighted'
			: ''
	}
}