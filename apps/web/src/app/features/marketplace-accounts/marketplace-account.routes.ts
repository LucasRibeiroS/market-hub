import { Routes } from '@angular/router'

import { AccountListComponent } from './pages/account-list/account-list.component'

export const marketplaceAccountRoutes: Routes = [
	{
		path: '',
		component: AccountListComponent // The main view for /marketplace-account
	}
]