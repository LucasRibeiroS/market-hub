import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http'
import { catchError, map, throwError } from 'rxjs'

import { isApiResponse } from '@core/api/api-response.model'

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
	if (req.url.includes('/i18n/')) {
		return next(req)
	}

	return next(req).pipe(
		// Handle Successful Responses (200 OK)
		map((event) => {
			if (event instanceof HttpResponse && isApiResponse(event.body)) {
				const apiResponse = event.body
				// The API says "success" -> Return ONLY the inner body
				if (apiResponse.process === 'success') {
					return event.clone({ body: apiResponse.body })
				}

				// The API says "failed" -> Throw an error with the message from the body
				throw new Error(apiResponse.body)
			}

			return event
		}),

		// Handle HTTP Errors (400, 401, 500)
		catchError((error: HttpErrorResponse) => {
			// If the error comes from your API, it likely has the JSON wrapper too
			if (error.error && typeof error.error === 'object' && isApiResponse(error.error)) {
				const apiError = error.error

				if (apiError.process === 'failed' && apiError.body) {
					// Return a clean error with just the message string
					return throwError(() => new Error(apiError.body))
				}
			}

			// Fallback for standard network errors (offline, timeout)
			return throwError(() => error)
		})
	)
}