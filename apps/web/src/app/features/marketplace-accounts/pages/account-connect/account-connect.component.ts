import { finalize, tap } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { SkeletonModule } from 'primeng/skeleton'

import { MarketplaceProviderLogoComponent } from '@features/marketplace-accounts/components'
import { ListMarketplaceProvidersResponse } from '@features/marketplace-accounts/models'
import { MarketplaceProvidersService } from '@features/marketplace-accounts/services'

import { ButtonComponent, PageHeaderComponent } from '@shared/components'
import { withLoadingDelay } from '@shared/utils/loading-delay'

type ProviderOption = ListMarketplaceProvidersResponse['providers'][number]

@Component({
	selector: 'app-account-connect',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		SkeletonModule,
		ButtonComponent,
		PageHeaderComponent,
		MarketplaceProviderLogoComponent
	],
	templateUrl: './account-connect.component.html',
	styleUrl: './account-connect.component.css'
})
export class AccountConnectComponent implements OnInit {
	private router = inject(Router)
	private providersService = inject(MarketplaceProvidersService)

	isLoading = signal(true)
	private loader = withLoadingDelay(this.isLoading)

	providers = signal<ProviderOption[]>([])
	skeletons = Array(3)

	ngOnInit(): void {
		this.loader.start()
		this.providersService.list().pipe(
			tap(providers => this.providers.set(providers)),
			finalize(() => this.loader.stop())
		).subscribe()
	}

	connect(provider: ProviderOption): void {
		window.location.href = provider.auth_url
	}

	goBack(): void {
		this.router.navigate(['/integrations'])
	}
}
