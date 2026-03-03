import { FormControl } from '@angular/forms'

import { Signal } from '@angular/core'

export abstract class FormFieldBase<T> {
	abstract control: Signal<FormControl<T | null>>

	get showError(): boolean {
		const ctrl = this.control()
		return ctrl.invalid && (ctrl.dirty || ctrl.touched)
	}

	get errorMessage(): string {
		const control = this.control()
		if (control.hasError('required')) return 'Este campo é obrigatório'
		if (control.hasError('email')) return 'E-mail inválido'
		if (control.hasError('minlength')) {
			const min = control.errors?.['minlength']?.requiredLength
			return `Mínimo de ${min} caracteres`
		}
		return ''
	}
}