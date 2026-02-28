import { Component, inject, signal, OnInit } from '@angular/core'
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs'

@Component({
	selector: 'app-auth-layout',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './auth-layout.component.html',
	styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent implements OnInit {
	private router = inject(Router)

	title = signal('')
	readonly year = new Date().getFullYear()

	ngOnInit(): void {
		this.updateTitle()
		this.router.events
			.pipe(filter(e => e instanceof NavigationEnd))
			.subscribe(() => this.updateTitle())
	}

	private updateTitle(): void {
		const url = this.router.url
		if (url.includes('sign-up')) this.title.set('Crie sua conta')
		else if (url.includes('sign-in')) this.title.set('Bem-vindo de volta')
		else if (url.includes('recover-password')) this.title.set('Recuperar senha')
		else this.title.set('')
	}
}