import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, RouterOutlet } from '@angular/router'
import { AvatarModule } from 'primeng/avatar'
import { BadgeModule } from 'primeng/badge'
import { RippleModule } from 'primeng/ripple'
import { TooltipModule } from 'primeng/tooltip'

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
		BadgeModule,
		RippleModule,
		TooltipModule
	],
	templateUrl: './app-layout.component.html',
	styleUrls: ['./app-layout.component.css']
})
export class AppLayoutComponent {
	expandedItems = signal<Set<string>>(new Set(['Configurações']))

	pageTitle = signal('Dashboard')

	menuItems: MenuItem[] = [
		{
			label: 'Dashboard',
			icon: 'pi-home',
			route: '/dashboard'
		},
		{
			label: 'Integrações',
			icon: 'pi-link',
			route: '/integracoes'
		},
		{
			label: 'Configurações',
			icon: 'pi-cog',
			children: [
				{
					label: 'Chaves',
					icon: 'pi-key',
					route: '/configuracoes/chaves'
				}
			]
		}
	]

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
}