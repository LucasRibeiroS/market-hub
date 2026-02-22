import { BehaviorSubject, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs'
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'

import { AuthService } from '@core/auth/auth.service'

// false = idle, true = currently refreshing
const isRefreshing$ = new BehaviorSubject<boolean>(false)

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService)

	// ensure cookies are sent with every request
	req = req.clone({ withCredentials: true })

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {

			// If it's a 401 AND it's not the refresh endpoint itself (to avoid infinite loops) we must try refreshing
			if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
				return handle401Error(req, next, authService)
			}

			// If it's not 401, or if Refresh failed, throw the error
			return throwError(() => error)
		})
	)
}

const handle401Error = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn,
	authService: AuthService
) => {
	// if already refreshing: wait
	if (isRefreshing$.value) {
		return isRefreshing$.pipe(
			filter(isRefreshing => !isRefreshing), // Wait until it switches back to false
			take(1), // Take the first "false" event
			switchMap(() => next(req)) // Retry the original request
		)
	}

	// if not refreshing: start refresh
	isRefreshing$.next(true) // Lock the mutex

	return authService.refreshToken().pipe(
		switchMap(() => {
			// Retry the original request
			// The browser will automatically attach the NEW cookies
			return next(req)
		}),
		catchError((err) => {
			authService.logout()

			return throwError(() => err)
		}),
		finalize(() => {
			// Ensure we always unlock
			isRefreshing$.next(false)
		})
	)
}