import { Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ButtonModule } from 'primeng/button'

@Component({
	selector: 'app-button',
	standalone: true,
	imports: [CommonModule, ButtonModule],
	template: `
        <p-button
            [label]="label"
            [type]="type"
            [fluid]="fluid"
            [loading]="isLoading"
            [disabled]="disabled"
            [severity]="severity"
            [text]="text"
            [outlined]="outlined"
            [icon]="icon"
            [iconPos]="iconPos"
            [size]="size"
            (onClick)="handleClick($event)">
        </p-button>
    `,
	styles: [`
        :host ::ng-deep .p-button {
            border-radius: 4px;
        }
        :host ::ng-deep .p-button-label {
			font-weight: 500;
			font-size: 0.9rem;
        }
    `]
})
export class ButtonComponent {
	@Input() label: string = ''
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