import { filter, Observable } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router'

import { AvatarModule } from 'primeng/avatar'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'

import { AuthService } from '@core/auth/auth.service'
import { IUser } from '@core/auth/models'

import { PopoverComponent } from '@shared/components'

interface MenuItem {
	label: string
	icon: string
	route?: string
	children?: MenuItem[]
}

@Component({
	selector: 'app-layout',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		RouterOutlet,
		AvatarModule,
		RippleModule,
		TooltipModule,
		PopoverComponent
	],
	templateUrl: './app-layout.component.html',
	styleUrls: ['./app-layout.component.css']
})
export class AppLayoutComponent implements OnInit {
	private authService = inject(AuthService)
	currentUser$: Observable<IUser | null> = this.authService.currentUser$

	pageTitle = signal('Dashboard')
	collapsed = signal(false)
	expandedItems = signal<Set<string>>(new Set(['Configurações']))
	activePopoverChildren: MenuItem[] = []

	menuItems: MenuItem[] = [
		{
			label: 'Dashboard',
			icon: 'pi-home',
			route: '/dashboard'
		},
		{
			label: 'Integrações',
			icon: 'pi-link',
			route: '/integrations'
		},
		{
			label: 'Configurações',
			icon: 'pi-cog',
			children: [
				{
					label: 'Chaves',
					icon: 'pi-key',
					route: '/settings/api-keys'
				}
			]
		}
	]

	constructor(private router: Router) {
		this.router.events
			.pipe(filter(e => e instanceof NavigationEnd))
			.subscribe(() => {
				const url = this.router.url
				if (url.includes('dashboard')) this.pageTitle.set('Dashboard')
				else if (url.includes('integracoes')) this.pageTitle.set('Integrações')
				else if (url.includes('chaves')) this.pageTitle.set('Chaves')
				else this.pageTitle.set('')
			})
	}

	ngOnInit(): void {
		this.collapsed = signal(localStorage.getItem('sidebarCollapsed') === 'true')
	}

	toggleSidebar(): void {
		this.collapsed.update(v => !v)
		localStorage.setItem('sidebarCollapsed', this.collapsed() ? 'true' : 'false')
	}

	isExpanded(label: string): boolean {
		return this.expandedItems().has(label)
	}

	toggleExpand(label: string): void {
		this.expandedItems.update(set => {
			const next = new Set(set)
			if (next.has(label)) {
				next.delete(label)
			} else {
				next.add(label)
			}
			return next
		})
	}

	onParentClick(item: MenuItem, event: MouseEvent, subMenu: PopoverComponent): void {
		if (this.collapsed()) {
			this.activePopoverChildren = item.children ?? []
			subMenu.toggle(event.currentTarget as HTMLElement)
		} else {
			this.toggleExpand(item.label)
		}
	}

	/** Highlights a parent nav item when one of its children is the active route */
	isChildActive(item: MenuItem): boolean {
		if (!item.children?.length) return false
		return item.children.some(c => c.route && this.router.isActive(c.route, {
			paths: 'exact',
			queryParams: 'ignored',
			fragment: 'ignored',
			matrixParams: 'ignored'
		}))
	}

	logout(): void {
		this.authService.logout()
	}
}