import { catchError, throwError } from 'rxjs'
import { inject } from '@angular/core'
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core'
import { MessageService } from 'primeng/api'

export const IGNORED_ERRORS = new HttpContextToken<string[]>(() => [])

const DETAIL_SEPARATOR = ' - '

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
	const translateService = inject(TranslateService)
	const messageService = inject(MessageService)

	return next(req).pipe(
		catchError((error: HttpErrorResponse | Error) => {
			let errorMessage = error.message || 'generic_api_error'
			const ignoredErrors = req.context.get(IGNORED_ERRORS)

			// Check for network errors
			if (error instanceof HttpErrorResponse && error.status === 0) {
				errorMessage = 'network_error'
			}

			if (ignoredErrors.includes(errorMessage)) {
				return throwError(() => error)
			}

			// Messages like "<message> - <detail>" are translated by their fixed part, the detail stays in the API logs
			const [message] = errorMessage.split(DETAIL_SEPARATOR)
			const translationKeys = [`errors.${errorMessage}`, `errors.${message}`, 'errors.generic_api_error']

			// Use .get() to ensure the translation file is loaded first
			translateService.get(translationKeys).subscribe((translations: Record<string, string>) => {
				// A missing translation comes back as its own key
				const translationKey = translationKeys.find(key => translations[key] !== key) ?? 'errors.generic_api_error'

				messageService.add({
					severity: 'error',
					summary: translateService.instant('errors.generic_api_error_summary'),
					detail: translations[translationKey]
				})
			})

			return throwError(() => error)
		})
	)
}