import { Pipe, PipeTransform } from '@angular/core'
import { Provider } from '@features/marketplace-accounts/models'

@Pipe({
	name: 'providerLogo',
	standalone: true
})
export class ProviderLogoPipe implements PipeTransform {
	private readonly providerLogos: Record<Provider, string> = {
		mercado_livre: 'providers/mercado-livre.svg',
		magalu: 'providers/magalu.svg'
	}

	transform(provider: Provider): string {
		return this.providerLogos[provider]
	}
}