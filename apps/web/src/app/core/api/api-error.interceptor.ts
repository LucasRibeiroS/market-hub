import { catchError, throwError } from 'rxjs'
import { inject } from '@angular/core'
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core'
import { MessageService } from 'primeng/api'

export const IGNORED_ERRORS = new HttpContextToken<string[]>(() => [])

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
	const translateService = inject(TranslateService)
	const messageService = inject(MessageService)

	return next(req).pipe(
		catchError((error: HttpErrorResponse | Error) => {
			const errorMessage = error.message || 'generic_api_error'
			const ignoredErrors = req.context.get(IGNORED_ERRORS)

			if (ignoredErrors.includes(errorMessage)) {
				return throwError(() => error)
			}

			const translationKey = `errors.${errorMessage}`

			// Use .get() to ensure the translation file is loaded first
			translateService.get(translationKey).subscribe((translatedMessage) => {
				messageService.add({
					severity: 'error',
					summary: translateService.instant('errors.generic_api_error_summary'),
					detail: translatedMessage
				})
			})

			return throwError(() => error)
		})
	)
}