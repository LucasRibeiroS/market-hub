import { finalize, tap } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { SkeletonModule } from 'primeng/skeleton'

import { AccountStatus, AccountStatusEnum, IMarketplaceAccount, ListMarketplaceAccountsResponse, Provider } from '@features/marketplace-accounts/models'
import { MarketplaceAccountsService } from '@features/marketplace-accounts/services/marketplace-accounts.service'

import { ButtonComponent, PageHeaderComponent } from '@shared/components'
import { withLoadingDelay } from '@shared/utils/loading-delay'

const PROVIDER_META: Record<Provider, { name: string, logo: string }> = {
	mercado_livre: {
		name: 'Mercado Livre',
		logo: 'providers/mercado-livre.svg'
	},
	magalu: {
		name: 'Magazine Luiza',
		logo: 'providers/magalu.svg'
	}
}
const STATUS_LABELS: Record<AccountStatus, string> = {
	active: 'Ativa',
	disconnected: 'Desconectada',
	expired: 'Expirada',
	revoked: 'Revogada',
	error: 'Erro na conexão'
}

@Component({
	selector: 'app-integrations',
	standalone: true,
	imports: [
		CommonModule,
		SkeletonModule,
		ButtonComponent,
		PageHeaderComponent
	],
	templateUrl: './account-list.component.html',
	styleUrl: './account-list.component.css'
})
export class AccountListComponent implements OnInit {
	private router = inject(Router)
	private accountsService = inject(MarketplaceAccountsService)

	accounts = signal<ListMarketplaceAccountsResponse['accounts']>([])
	isLoading = signal(true)
	private loader = withLoadingDelay(this.isLoading)
	skeletons = Array(3)

	readonly AccountStatusEnum = AccountStatusEnum

	ngOnInit(): void {
		this.loadAccounts()
	}

	loadAccounts(): void {
		this.loader.start()

		this.accountsService.list({ page: 1, page_size: 100 })
			.pipe(
				tap(({ accounts }) => {
					this.accounts.set(accounts)
				}),
				finalize(() => this.loader.stop())
			)
			.subscribe()
	}

	getProviderLogo(provider: Provider): string {
		return PROVIDER_META[provider]?.logo ?? ''
	}

	getStatusLabel(status: AccountStatus): string {
		return STATUS_LABELS[status] ?? status
	}

	goToAdd(): void {
		this.router.navigate(['/integrations/add'])
	}

	onConfigClick(account: IMarketplaceAccount): void {
		this.router.navigate(['/integrations', account.id])
	}
}