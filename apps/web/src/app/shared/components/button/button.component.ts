import { Component, input, output } from '@angular/core'
import { ButtonModule } from 'primeng/button'
import { TooltipModule } from 'primeng/tooltip'

@Component({
	selector: 'app-button',
	standalone: true,
	imports: [ButtonModule, TooltipModule],
	templateUrl: './button.component.html',
	styleUrls: ['./button.component.css']
})
export class ButtonComponent {
	label = input('')
	tooltip = input('')
	type = input<'button' | 'submit' | 'reset'>('button')
	fluid = input(true)
	isLoading = input(false)
	disabled = input(false)
	severity = input<'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null>(null)
	text = input(false)
	outlined = input(false)
	icon = input('')
	iconPos = input<'left' | 'right' | 'top' | 'bottom'>('left')
	size = input<'small' | 'large' | undefined>(undefined)

	onClick = output<Event>()

	handleClick(event: Event): void {
		this.onClick.emit(event)
	}
}