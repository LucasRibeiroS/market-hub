import { Component, input, signal } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { InputOtpModule } from 'primeng/inputotp'

import { FormFieldBase } from '@shared/utils/form'

@Component({
	selector: 'app-input-text',
	standalone: true,
	imports: [InputTextModule, InputOtpModule, ReactiveFormsModule],
	templateUrl: './input.component.html',
	styleUrls: ['./input.component.css']
})
export class InputComponent extends FormFieldBase<string> {
	id = input(`input-${Math.random().toString(36).substring(2, 9)}`)
	label = input('')
	placeholder = input('')
	type = input('text')
	disabled = input(false)
	maxLength = input(4096)

	control = input(new FormControl(''))

	showPassword = signal(false)

	togglePasswordVisibility(): void {
		this.showPassword.update(v => !v)
	}

	onOtpChange(event: { value: string }): void {
		this.control().setValue(event.value)
		this.control().markAsDirty()
	}
}
