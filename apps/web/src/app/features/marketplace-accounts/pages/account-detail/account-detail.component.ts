import { catchError, finalize, tap, throwError } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { MessageService } from 'primeng/api'
import { SkeletonModule } from 'primeng/skeleton'

import { AccountDeleteModalComponent, MarketplaceAccountStatusBadgeComponent, MarketplaceProviderLogoComponent } from '@features/marketplace-accounts/components'
import { AccountStatusEnum, GetMarketplaceAccountResponse } from '@features/marketplace-accounts/models'
import { MarketplaceAccountsService, MarketplaceProvidersService } from '@features/marketplace-accounts/services'

import { ButtonComponent, FormCardComponent, PageHeaderComponent } from '@shared/components'
import { withLoadingDelay } from '@shared/utils/loading-delay'

type AccountWithProvider = GetMarketplaceAccountResponse['account']

@Component({
	selector: 'app-account-detail',
	standalone: true,
	imports: [
		CommonModule,
		DatePipe,
		SkeletonModule,
		ButtonComponent,
		FormCardComponent,
		PageHeaderComponent,
		AccountDeleteModalComponent,
		MarketplaceAccountStatusBadgeComponent,
		MarketplaceProviderLogoComponent
	],
	templateUrl: './account-detail.component.html',
	styleUrl: './account-detail.component.css'
})
export class AccountDetailComponent implements OnInit {
	private route = inject(ActivatedRoute)
	private router = inject(Router)
	private accountsService = inject(MarketplaceAccountsService)
	private providersService = inject(MarketplaceProvidersService)
	private messageService = inject(MessageService)

	account = signal<AccountWithProvider | null>(null)

	isLoading = signal(true)
	private loader = withLoadingDelay(this.isLoading)

	isUpdating = signal(false)
	isDeleting = signal(false)

	showDeleteDialog = signal(false)

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id')
		if (!id) {
			this.router.navigate(['/integrations'])
			return
		}

		this.loader.start()

		this.accountsService.getById(id).pipe(
			tap(account => this.account.set(account)),
			finalize(() => this.loader.stop())
		).subscribe()
	}

	get canReconnect(): boolean {
		const status = this.account()?.status
		return status === AccountStatusEnum.disconnected
			|| status === AccountStatusEnum.expired
			|| status === AccountStatusEnum.error
			|| status === AccountStatusEnum.revoked
	}

	get canDisconnect(): boolean {
		return this.account()?.status === AccountStatusEnum.active
	}

	reconnect(): void {
		const account = this.account()
		if (!account) return

		this.isUpdating.set(true)

		this.providersService.list().pipe(
			finalize(() => this.isUpdating.set(false))
		).subscribe({
			next: (providers) => {
				const provider = providers.find(p => p.provider === account.provider.provider)
				if (!provider) {
					this.messageService.add({
						severity: 'error',
						summary: 'Erro',
						detail: 'Não foi possível obter o link de autenticação do provedor.'
					})
					return
				}
				sessionStorage.setItem('reconnect_account_id', account.id)
				window.location.href = provider.auth_url
			},
			error: () => {
				this.messageService.add({
					severity: 'error',
					summary: 'Erro',
					detail: 'Não foi possível carregar os provedores disponíveis.'
				})
			}
		})
	}

	disconnect(): void {
		const account = this.account()
		if (!account) return

		this.isUpdating.set(true)

		this.accountsService.update(account.id, { status: AccountStatusEnum.disconnected }).pipe(
			tap(updated => {
				this.account.update(a => a ? { ...a, status: updated.status } : a)
				this.messageService.add({
					severity: 'success',
					summary: 'Conta desconectada',
					detail: 'A integração foi desconectada com sucesso.'
				})
			}),
			catchError(err => {
				this.messageService.add({
					severity: 'error',
					summary: 'Erro',
					detail: err?.error?.message ?? 'Não foi possível desconectar a integração.'
				})
				return throwError(() => err)
			}),
			finalize(() => this.isUpdating.set(false))
		).subscribe()
	}

	openDeleteDialog(): void {
		this.showDeleteDialog.set(true)
	}

	confirmDelete(): void {
		const account = this.account()
		if (!account) return

		this.isDeleting.set(true)

		this.accountsService.delete({ id: account.id }).pipe(
			tap(() => {
				this.showDeleteDialog.set(false)
				this.messageService.add({
					severity: 'success',
					summary: 'Integração removida',
					detail: 'A integração foi excluída com sucesso.'
				})
				this.router.navigate(['/integrations'])
			}),
			catchError(err => {
				this.messageService.add({
					severity: 'error',
					summary: 'Erro',
					detail: err?.error?.message ?? 'Não foi possível excluir a integração.'
				})
				return throwError(() => err)
			}),
			finalize(() => this.isDeleting.set(false))
		).subscribe()
	}

	goBack(): void {
		this.router.navigate(['/integrations'])
	}
}
