import { catchError, throwError } from 'rxjs'
import { inject } from '@angular/core'
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core'
import { MessageService } from 'primeng/api'

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
	const translateService = inject(TranslateService)
	const messageService = inject(MessageService)

	return next(req).pipe(
		catchError((error: HttpErrorResponse | Error) => {
			console.log('Current Lang:', translateService.currentLang)
			console.log('Stored Translations:', translateService.getLangs())

			const errorMessage = error.message || 'generic_api_error'
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