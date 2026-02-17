import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AuthService } from '@core/auth/auth.service'
import { Observable } from 'rxjs'
import { IUser } from '@core/auth/models'

@Component({
	selector: 'app-account-list',
	standalone: true,
	imports: [CommonModule], // Needed for the 'async' pipe
	template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Marketplace Account</h1>

      <div *ngIf="currentUser$ | async as user; else loading" class="bg-white shadow rounded-lg p-6">

        <div class="flex items-center space-x-4 mb-6">
          <div class="bg-blue-100 p-3 rounded-full">
            <span class="text-xl">👤</span>
          </div>
          <div>
            <h2 class="text-lg font-semibold">{{ user.name }}</h2>
            <p class="text-gray-500">{{ user.email }}</p>
          </div>
        </div>

        <div class="mt-8">
          <button (click)="onLogout()" class="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
            Sign Out
          </button>
        </div>

      </div>

      <ng-template #loading>
        <p class="text-gray-400">Loading account details...</p>
      </ng-template>
    </div>
  `
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