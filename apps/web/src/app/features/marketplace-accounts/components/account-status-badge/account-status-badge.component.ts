import { Component, input } from '@angular/core'

import { AccountStatus } from '@features/marketplace-accounts/models'

@Component({
	selector: 'app-marketplace-account-status-badge',
	standalone: true,
	templateUrl: './account-status-badge.component.html',
	styleUrl: './account-status-badge.component.css'
})
export class MarketplaceAccountStatusBadgeComponent {
	private readonly statusLabels: Record<AccountStatus, string> = {
		active: 'Ativa',
		disconnected: 'Desconectada',
		expired: 'Expirada',
		revoked: 'Revogada',
		error: 'Erro na conexão'
	}

	status = input.required<AccountStatus>()
	size = input<'sm' | 'md'>('sm')

	get statusLabel(): string {
		return this.statusLabels[this.status()]
	}
}