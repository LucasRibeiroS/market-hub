import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'

import { providePrimeNG } from 'primeng/config'
import { definePreset } from '@primeuix/themes'
import { MessageService } from 'primeng/api'
import Aura from '@primeuix/themes/aura'

import translationsPTBR from '../../public/i18n/pt-BR.json'

import { apiResponseInterceptor } from '@core/api/api-response.interceptor'
import { apiErrorInterceptor } from '@core/api/api-error.interceptor'
import { authInterceptor } from '@core/auth/auth.interceptor'
import { AuthService } from '@core/auth/auth.service'

import { routes } from './app.routes'

const ThemePreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '#fffbf0',
			100: '#fff3d6',
			200: '#ffe3a3',
			300: '#ffd070',
			400: '#ffbc3d',
			500: '#ff9900',
			600: '#e67a00',
			700: '#cc6100',
			800: '#a34800',
			900: '#7a3300',
			950: '#4d1e00'
		},
		colorScheme: {
			light: {
				surface: {
					0: '#ffffff',
					50: '#EFF1EC',
					100: '{zinc.100}',
					200: '{zinc.200}',
					300: '{zinc.300}',
					400: '{zinc.400}',
					500: '{zinc.500}',
					600: '{zinc.600}',
					700: '{zinc.700}',
					800: '{zinc.800}',
					900: '{zinc.900}',
					950: '{zinc.950}'
				}
			}
		}
	}
})

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		provideClientHydration(withEventReplay()),
		provideHttpClient(
			withFetch(),
			withInterceptors([apiErrorInterceptor, apiResponseInterceptor, authInterceptor])
		),
		provideTranslateService({
			lang: 'pt-BR',
			fallbackLang: 'pt-BR'
		}),
		providePrimeNG({
			theme: {
				preset: ThemePreset,
				options: {
					prefix: 'p',
					darkModeSelector: 'none',
					cssLayer: false,
					primary: '#FF9900'
				}
			}
		}),
		MessageService,
		provideAppInitializer(async() => {
			const authService = inject(AuthService)
			const translate = inject(TranslateService)

			translate.setTranslation('pt-BR', translationsPTBR)

			await authService.init()
		})
	]
}
