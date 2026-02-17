import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs'
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'

import { AuthService } from '@core/auth/auth.service'

// MUTEX: Controls access to the refresh logic
// false = idle, true = currently refreshing
const isRefreshing$ = new BehaviorSubject<boolean>(false)

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService)

	// 1. ENABLE COOKIES (Standard)
	req = req.clone({ withCredentials: true })

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {

			// 2. CHECK FOR 401 (Unauthorized)
			// We only retry if it's a 401 AND it's not the refresh endpoint itself (to avoid infinite loops)
			if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
				return handle401Error(req, next, authService)
			}

			// If it's not 401, or if Refresh failed, throw the error
			return throwError(() => error)
		})
	)
}

// --- HELPER FUNCTION ---

const handle401Error = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
	authService: AuthService
) => {
	// A. IF ALREADY REFRESHING: WAIT
	if (isRefreshing$.value) {
		return isRefreshing$.pipe(
			filter(isRefreshing => !isRefreshing), // Wait until it switches back to false
			take(1), // Take the first "false" event
			switchMap(() => next(req)) // Retry the original request
		)
	}

	// B. IF NOT REFRESHING: START REFRESH
	isRefreshing$.next(true) // Lock the mutex

	return authService.refreshToken().pipe(
		switchMap(() => {
			// 1. Success! Unlock the mutex
			isRefreshing$.next(false)

			// 2. Retry the original request
			// The browser will automatically attach the NEW cookies
			return next(req)
		}),
		catchError((err) => {
			isRefreshing$.next(false) // Unlock
			authService.logout()

			return throwError(() => err)
		})
	)
}