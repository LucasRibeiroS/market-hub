import { Routes } from '@angular/router'

export const apiKeysRoutes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/api-keys-list/api-keys-list.component').then(m => m.ApiKeysListComponent)
	},
	{
		path: 'new',
		loadComponent: () => import('./pages/api-keys-form/api-keys-form.component').then(m => m.ApiKeysFormComponent)
	},
	{
		path: ':id/edit',
		loadComponent: () => import('./pages/api-keys-form/api-keys-form.component').then(m => m.ApiKeysFormComponent)
	}
]