import { Routes } from '@angular/router'

export const authRoutes: Routes = [
	{
		path: 'sign-in',
		title: 'Entrar',
		loadComponent: () => import('@features/auth/pages/sign-in/sign-in.component')
	},
	{
		path: 'sign-up',
		title: 'Cadastro',
		loadComponent: () => import('@features/auth/pages/sign-up/sign-up.component')
	},
	{
		path: 'recover-password',
		title: 'Recuperar Senha',
		loadComponent: () => import('@features/auth/pages/recover-password/recover-password.component')
	}
]