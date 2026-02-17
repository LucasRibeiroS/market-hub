import { CanActivateFn, Router } from '@angular/router'
import { inject } from '@angular/core'

import { AuthService } from '@core/auth/auth.service'

export const authGuard: CanActivateFn = (_, state) => {
	const authService = inject(AuthService)
	const router = inject(Router)

	if (authService.currentUserValue !== null) {
		return true
	}

	// Redirect to login
	return router.createUrlTree(['/auth/sign-in'], {
		queryParams: { returnUrl: state.url }
	})
}