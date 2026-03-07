import { Pipe, PipeTransform } from '@angular/core'
import { AccountStatus } from '@features/marketplace-accounts/models'

@Pipe({
	name: 'accountStatus',
	standalone: true
})
export class AccountStatusPipe implements PipeTransform {
	private readonly statusLabels: Record<AccountStatus, string> = {
		active: 'Ativa',
		disconnected: 'Desconectada',
		expired: 'Expirada',
		revoked: 'Revogada',
		error: 'Erro na conexão'
	}

	transform(status: AccountStatus): string {
		return this.statusLabels[status] ?? status
	}
}