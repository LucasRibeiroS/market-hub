import { Routes } from '@angular/router'
import { authGuard } from '@core/auth/auth.guard'

import { authRoutes } from '@features/auth/auth.routes'

export const routes: Routes = [
	{
		path: 'auth',
		children: authRoutes
	},
	{
		path: '',
		canActivate: [authGuard], // <--- Prevents access if not logged in
		children: [
			{
				path: '',
				redirectTo: 'marketplace-account', // Default to this page
				pathMatch: 'full'
			},
			{
				path: 'marketplace-account',
				// Lazy load the feature module
				loadChildren: () => import('./features/marketplace-account/marketplace-account.routes')
					.then(m => m.marketplaceAccountRoutes)
			}
			// Future features like 'products', 'sales' go here...
		]
	},

	// 3. Fallback (404)
	{
		path: '**',
		redirectTo: 'auth/sign-in'
	}
]