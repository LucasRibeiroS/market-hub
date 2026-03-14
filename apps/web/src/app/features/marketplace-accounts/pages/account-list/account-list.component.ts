import { finalize, tap } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { SkeletonModule } from 'primeng/skeleton'

import { AccountStatusEnum, IMarketplaceAccount, ListMarketplaceAccountsResponse } from '@features/marketplace-accounts/models'
import { MarketplaceAccountStatusBadgeComponent, MarketplaceProviderLogoComponent } from '@features/marketplace-accounts/components'
import { MarketplaceAccountsService } from '@features/marketplace-accounts/services'

import { ButtonComponent, PageHeaderComponent } from '@shared/components'
import { withLoadingDelay } from '@shared/utils/loading-delay'

@Component({
	selector: 'app-integrations',
	standalone: true,
	imports: [
		CommonModule,
		SkeletonModule,
		ButtonComponent,
		PageHeaderComponent,
		MarketplaceProviderLogoComponent,
		MarketplaceAccountStatusBadgeComponent
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

	navigateToConnect(): void {
		this.router.navigate(['/integrations/connect'])
	}

	onConfigClick(account: IMarketplaceAccount): void {
		this.router.navigate(['/integrations', account.id])
	}
}