import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'
import { filter } from 'rxjs'

@Component({
	selector: 'app-auth-layout',
	standalone: true,
	imports: [CommonModule, RouterOutlet],
	templateUrl: './auth-layout.component.html',
	styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent {
	title: string = ''

	constructor(private router: Router) {
		this.router.events
			.pipe(filter(e => e instanceof NavigationEnd))
			.subscribe(() => {
				const url = this.router.url
				if (url.includes('sign-up')) this.title = 'Crie sua conta'
				else if (url.includes('sign-in')) this.title = 'Bem-vindo ao MarketHub'
				else if (url.includes('recover-password')) this.title = 'Recuperar senha'
			})
	}

}