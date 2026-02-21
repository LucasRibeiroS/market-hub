import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AuthService } from '@core/auth/auth.service'
import { Observable } from 'rxjs'
import { IUser } from '@core/auth/models'

@Component({
	selector: 'app-account-list',
	standalone: true,
	imports: [CommonModule], // Needed for the 'async' pipe
	templateUrl: './account-list.component.html'
})
export class AccountListComponent {
	private authService = inject(AuthService)

	// 1. Connect to the global state
	// We don't fetch data here; we just listen to the stream the AuthService manages.
	currentUser$: Observable<IUser | null> = this.authService.currentUser$

	onLogout(): void {
		this.authService.logout()
	}
}