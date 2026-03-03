import { finalize, tap } from 'rxjs'
import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { BadgeModule } from 'primeng/badge'
import { MessageService } from 'primeng/api'

import { IApiKey } from '@features/api-keys/models'
import { ApiKeysService } from '@features/api-keys/services/api-keys.service'
import { ApiKeyDeleteModalComponent } from '@features/api-keys/components'

import { ButtonComponent, CodeComponent, DataTableComponent, PageHeaderComponent } from '@shared/components'
import { TableColumn } from '@shared/components/data-table/data-table.component'

import { defaultPageSize, IPagination, IPaginator } from '@shared/utils/pagination'
import { withLoadingDelay } from '@shared/utils/loading-delay'

@Component({
	selector: 'app-api-keys-list',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		BadgeModule,
		ButtonComponent,
		CodeComponent,
		DataTableComponent,
		PageHeaderComponent,
		ApiKeyDeleteModalComponent
	],
	providers: [MessageService],
	templateUrl: './api-keys-list.component.html'
})
export class ApiKeysListComponent implements OnInit {
	apiKeys = signal<IApiKey[]>([])
	pagination = signal<IPagination | null>(null)
	paginator = signal<IPaginator>({ page: 1, page_size: defaultPageSize })

	isLoading = signal(false)
	private loader = withLoadingDelay(this.isLoading)

	isDeleting = signal(false)
	keyToDelete = signal<IApiKey | null>(null)
	highlightedId = signal<string | null>(null)

	columns: TableColumn[] = [
		{ field: 'name', header: 'Nome', sortable: true, width: '30%' },
		{ field: 'key_preview', header: 'Preview', width: '30%' },
		{ field: 'created_at', header: 'Criada em', sortable: true, width: '25%' },
		{ field: 'is_active', header: 'Ativa', sortable: true, width: '15%' }
	]

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private apiKeysService: ApiKeysService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		const editedId = history.state?.editedId as string | undefined
		if (editedId) {
			this.highlightedId.set(editedId)
			// remove the editedId from history state to prevent unintended highlighting on future navigations
			history.replaceState({ ...history.state, editedId: undefined }, '')
		}

		this.loadKeys()
	}

	loadKeys(paginator = this.paginator()): void {
		this.loader.start()

		this.apiKeysService.list(paginator)
			.pipe(
				tap(({ api_keys, pagination }) => {
					this.apiKeys.set(api_keys)
					this.pagination.set(pagination)
				}),
				finalize(() => this.loader.stop())
			)
			.subscribe()
	}

	onPaginatorChange(event: IPaginator): void {
		this.loadKeys(event)
	}

	openDeleteModal(key: IApiKey): void {
		this.keyToDelete.set(key)
		this.highlightedId.set(key.id)
	}

	onDeleteConfirmed(): void {
		const key = this.keyToDelete()
		if (!key) return
		this.isDeleting.set(true)
		this.apiKeysService.delete({ id: key.id }).subscribe({
			next: () => {
				this.keyToDelete.set(null)
				this.isDeleting.set(false)
				this.highlightedId.set(null)
				this.keyToDelete.set(null)
				this.loadKeys()
				this.messageService.add({
					severity: 'success',
					summary: 'Chave excluída',
					detail: `"${key.name}" foi removida com sucesso.`,
					life: 4000
				})
			},
			error: () => {
				this.isDeleting.set(false)
				this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir a chave.', life: 4000 })
			}
		})
	}

	onDeleteCancelled(): void {
		this.keyToDelete.set(null)
		this.highlightedId.set(null)
	}

	navigateToCreate(): void {
		this.router.navigate(['new'], { relativeTo: this.route })
	}

	navigateToEdit(key: IApiKey): void {
		this.highlightedId.set(key.id)
		this.router.navigate([key.id, 'edit'], { relativeTo: this.route })
	}
}