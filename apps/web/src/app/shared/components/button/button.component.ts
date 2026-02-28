import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ButtonModule } from 'primeng/button'
import { TooltipModule } from 'primeng/tooltip'

@Component({
	selector: 'app-button',
	standalone: true,
	imports: [CommonModule, ButtonModule, TooltipModule],
	templateUrl: './button.component.html',
	styleUrls: ['./button.component.css']
})
export class ButtonComponent {
	@Input() label: string = ''
	@Input() tooltip: string = ''
	@Input() type: 'button' | 'submit' | 'reset' = 'button'
	@Input() fluid: boolean = true
	@Input() isLoading: boolean = false
	@Input() disabled: boolean = false
	@Input() severity: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null = null
	@Input() text: boolean = false
	@Input() outlined: boolean = false
	@Input() icon: string = ''
	@Input() iconPos: 'left' | 'right' | 'top' | 'bottom' = 'left'
	@Input() size: 'small' | 'large' | undefined = undefined

	@Output() onClick = new EventEmitter<Event>()

	handleClick(event: Event) {
		this.onClick.emit(event)
	}
}