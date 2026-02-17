import { Routes } from '@angular/router'
import { authGuard } from '@core/auth/auth.guard'
import { guestGuard } from '@core/auth/guest.guard'

export const routes: Routes = [
	{
		path: 'auth',
		canActivate: [guestGuard],
		loadChildren: () => import('@features/auth/auth.routes').then(m => m.authRoutes)
	},
	{
		path: 'marketplace-accounts',
		canActivate: [authGuard],
		loadChildren: () => import('@features/marketplace-accounts/marketplace-account.routes').then(m => m.marketplaceAccountRoutes)
	},

	// 3. Fallback (404)
	{
		path: '**',
		redirectTo: 'auth/sign-in'
	}
]