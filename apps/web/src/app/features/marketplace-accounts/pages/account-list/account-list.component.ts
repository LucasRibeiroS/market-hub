import { Component, inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { AuthService } from '@core/auth/auth.service'
import { Observable } from 'rxjs'
import { IUser } from '@core/auth/models'
import { PageHeaderComponent, ButtonComponent } from '@shared/components'

@Component({
	selector: 'app-account-list',
	standalone: true,
	imports: [AsyncPipe, PageHeaderComponent, ButtonComponent],
	templateUrl: './account-list.component.html',
	styleUrls: ['./account-list.component.css']
})
export class AccountListComponent {
	private authService = inject(AuthService)

	currentUser$: Observable<IUser | null> = this.authService.currentUser$

	onLogout(): void {
		this.authService.logout()
	}
}