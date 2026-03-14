import { catchError, finalize, tap, throwError } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MessageService } from 'primeng/api'
import { ProgressSpinnerModule } from 'primeng/progressspinner'

import { Provider } from '@features/marketplace-accounts/models'
import { MarketplaceAccountsService } from '@features/marketplace-accounts/services'

import { ButtonComponent } from '@shared/components'
import { withLoadingDelay } from '@shared/utils/loading-delay'

const RECONNECT_STORAGE_KEY = 'reconnect_account_id'

@Component({
	selector: 'app-account-callback',
	standalone: true,
	imports: [ProgressSpinnerModule, ButtonComponent],
	templateUrl: './account-callback.component.html',
	styleUrl: './account-callback.component.css'
})
export class AccountCallbackComponent implements OnInit {
	private route = inject(ActivatedRoute)
	private router = inject(Router)
	private accountsService = inject(MarketplaceAccountsService)
	private messageService = inject(MessageService)

	isLoading = signal(true)
	private loader = withLoadingDelay(this.isLoading)

	hasError = signal(false)
	errorMessage = signal<string | null>(null)

	ngOnInit(): void {
		const provider = this.route.snapshot.paramMap.get('provider')?.replace('-', '_') as Provider | null
		const code = this.route.snapshot.queryParamMap.get('code')

		if (!code || !provider) {
			this.router.navigate(['/integrations'])
			return
		}

		const reconnectAccountId = sessionStorage.getItem(RECONNECT_STORAGE_KEY)

		if (reconnectAccountId) {
			sessionStorage.removeItem(RECONNECT_STORAGE_KEY)
			this.reAuthenticate(reconnectAccountId, code)
		} else {
			this.create(provider, code)
		}
	}

	private create(provider: Provider, code: string): void {
		this.accountsService.create({ code, provider }).pipe(
			tap(() => {
				this.messageService.add({
					severity: 'success',
					summary: 'Integração conectada',
					detail: 'Sua conta foi conectada com sucesso.'
				})
				this.router.navigate(['/integrations'])
			}),
			catchError((err) => {
				this.hasError.set(true)
				this.errorMessage.set(
					err?.error?.message ?? 'Não foi possível concluir a integração. Tente novamente.'
				)
				return throwError(() => err)
			}),
			finalize(() => this.loader.stop())
		).subscribe()
	}

	private reAuthenticate(accountId: string, code: string): void {
		this.accountsService.reAuthenticate(accountId, { code }).pipe(
			tap(() => {
				this.messageService.add({
					severity: 'success',
					summary: 'Integração reconectada',
					detail: 'Sua conta foi reconectada com sucesso.'
				})
				this.router.navigate(['/integrations', accountId])
			}),
			catchError((err) => {
				this.hasError.set(true)
				this.errorMessage.set(
					err?.error?.message ?? 'Não foi possível reconectar a integração. Tente novamente.'
				)
				return throwError(() => err)
			}),
			finalize(() => this.loader.stop())
		).subscribe()
	}

	retry(): void {
		this.router.navigate(['/integrations/connect'])
	}
}
