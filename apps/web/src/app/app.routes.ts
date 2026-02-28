import { Routes } from '@angular/router'
import { authGuard } from '@core/auth/auth.guard'
import { guestGuard } from '@core/auth/guest.guard'

import { AppLayoutComponent } from '@core/layouts/app-layout/app-layout.component'
import { AuthLayoutComponent } from '@core/layouts/auth-layout/auth-layout.component'

export const routes: Routes = [
	{
		path: '',
		canActivate: [authGuard],
		component: AppLayoutComponent,
		children: [
			{
				path: 'integrations',
				loadChildren: () => import('@features/marketplace-accounts/marketplace-account.routes').then(m => m.marketplaceAccountRoutes)
			},
			{
				path: 'settings/api-keys',
				loadChildren: () => import('@features/api-keys/api-keys.routes').then(m => m.apiKeysRoutes)
			}
		]
	},
	{
		path: 'auth',
		canActivate: [guestGuard],
		component: AuthLayoutComponent,
		loadChildren: () => import('@features/auth/auth.routes').then(m => m.authRoutes)
	},

	// 3. Fallback (404)
	{
		path: '**',
		redirectTo: 'auth/sign-in'
	}
]