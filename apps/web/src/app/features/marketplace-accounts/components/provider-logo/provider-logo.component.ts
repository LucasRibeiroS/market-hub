import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'

import { Provider } from '@features/marketplace-accounts/models'

@Component({
	selector: 'app-marketplace-provider-logo',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './provider-logo.component.html',
	styleUrl: './provider-logo.component.css'
})
export class MarketplaceProviderLogoComponent {
	private readonly providerLogos: Record<Provider, string> = {
		mercado_livre: 'providers/mercado-livre.svg',
		magalu: 'providers/magalu.svg'
	}

	provider = input.required<Provider>()
	displayName = input.required<string>()
	size = input<'md' | 'lg' | 'xl'>('md')

	get providerLogo(): string {
		return this.providerLogos[this.provider()]
	}
}