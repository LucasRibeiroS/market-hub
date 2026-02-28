import { Component, input, signal } from '@angular/core'
import { ReactiveFormsModule, FormControl } from '@angular/forms'

import { InputTextModule } from 'primeng/inputtext'
import { InputOtpModule } from 'primeng/inputotp'

@Component({
selector: 'app-input-text',
standalone: true,
imports: [InputTextModule, InputOtpModule, ReactiveFormsModule],
templateUrl: './input.component.html',
styleUrls: ['./input.component.css']
})
export class InputComponent {
	id = input(`input-${Math.random().toString(36).substring(2, 9)}`)
	label = input('')
	placeholder = input('')
	type = input('text')
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

	get showError(): boolean {
		const ctrl = this.control()
		return ctrl.invalid && (ctrl.dirty || ctrl.touched) && ctrl.value !== ''
	}

	get errorMessage(): string {
		const ctrl = this.control()
		if (ctrl.hasError('required')) return 'Este campo é obrigatório'
		if (ctrl.hasError('email')) return 'E-mail inválido'
		if (ctrl.hasError('minlength')) {
			const min = ctrl.errors?.['minlength']?.requiredLength
			return `Mínimo de ${min} caracteres`
		}
		return ''
	}
}
