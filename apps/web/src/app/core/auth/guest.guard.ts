import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'

import { AuthService } from '@core/auth/auth.service'

export const guestGuard: CanActivateFn = () => {
	const authService = inject(AuthService)
	const router = inject(Router)

	if (authService.currentUserValue !== null) {
		return router.createUrlTree(['/marketplace-accounts'])
	}

	return true
}