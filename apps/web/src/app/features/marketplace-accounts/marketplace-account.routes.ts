import { Routes } from '@angular/router'

export const marketplaceAccountRoutes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/account-list/account-list.component').then(m => m.AccountListComponent)
	},
	{
		path: 'connect',
		loadComponent: () => import('./pages/account-connect/account-connect.component').then(m => m.AccountConnectComponent)
	},
	{
		path: 'oauth/callback/:provider',
		loadComponent: () => import('./pages/account-callback/account-callback.component').then(m => m.AccountCallbackComponent)
	},
	{
		path: ':id',
		loadComponent: () => import('./pages/account-detail/account-detail.component').then(m => m.AccountDetailComponent)
	}
]