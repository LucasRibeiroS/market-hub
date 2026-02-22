import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, ReactiveFormsModule } from '@angular/forms'

import { InputTextModule } from 'primeng/inputtext'
import { InputOtpModule } from 'primeng/inputotp'

@Component({
	selector: 'app-input-text',
	standalone: true,
	imports: [CommonModule, InputTextModule, InputOtpModule, ReactiveFormsModule],
	templateUrl: './input.component.html',
	styleUrls: ['./input.component.css']
})
export class InputComponent {
	@Input() id: string = `input-${Math.random().toString(36).substring(2, 9)}`
	@Input() label: string = ''
	@Input() placeholder: string = ''
	@Input() type: string = 'text'
	@Input() maxLength: number = 4096
	@Input() control: FormControl = new FormControl('')

	showPassword: boolean = false

	togglePasswordVisibility(): void {
		this.showPassword = !this.showPassword
	}

	onOtpChange(event: { value: string }): void {
		// Manually ensure the control stays in sync if the binding
		this.control.setValue(event.value)
		this.control.markAsDirty()
	}

	get showError(): boolean {
		return this.control.invalid && (this.control.dirty || this.control.touched) && this.control.value !== ''
	}

	get errorMessage(): string {
		if (this.control.hasError('required')) {
			return 'Este campo é obrigatório'
		}

		if (this.control.hasError('email')) {
			return 'E-mail inválido'
		}

		if (this.control.hasError('minlength')) {
			const minLength = this.control.errors?.['minlength']?.requiredLength
			return `Mínimo de ${minLength} caracteres`
		}

		return ''
	}
}