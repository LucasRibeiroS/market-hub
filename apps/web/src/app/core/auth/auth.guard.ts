import { CanActivateFn, Router } from '@angular/router'
import { inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common' // Import this
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = (_, state) => {
	const authService = inject(AuthService)
	const router = inject(Router)
	const platformId = inject(PLATFORM_ID) // Inject Platform ID

	// 1. SSR CHECK (The Fix)
	// If we are on the server, we CANNOT check auth (no localStorage).
	// We must allow the navigation so the browser can take over and check the real token.
	if (!isPlatformBrowser(platformId)) {
		return true
	}

	// 2. BROWSER CHECK (Standard Logic)
	// Now we know we are in the browser, so this check is valid.
	if (authService.currentUserValue) {
		return true
	}

	// Redirect to login
	return router.createUrlTree(['/auth/sign-in'], {
		queryParams: { returnUrl: state.url }
	})
}