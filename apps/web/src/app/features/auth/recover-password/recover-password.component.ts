import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent } from '@shared/components/buttons/button.component'
import { ButtonTextComponent } from '@shared/components/buttons/button-text.component'
import { InputTextComponent } from '@shared/components/input-text.component'

import { AuthLayoutComponent } from '@features/auth/auth-layout.component'

@Component({
	selector: 'app-recover-password',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		AuthLayoutComponent,
		ButtonComponent,
		ButtonTextComponent,
		InputTextComponent
	],
	templateUrl: './recover-password.component.html'
})
export default class RecoverPasswordComponent implements OnInit {
	recoverForm: FormGroup
	codeSent = false

	constructor(
		private formBuilder: FormBuilder,
		private router: Router
	) {
		this.recoverForm = this.formBuilder.group({
			email: ['', [Validators.required, Validators.email]],
			code: ['', []],
			password: ['', []]
		}, { updateOn: 'blur' })
	}

	ngOnInit() {
		// Initialization logic here
	}

	onSubmit() {
		if (!this.codeSent) {
			// First step: send recovery code
			const emailControl = this.recoverForm.get('email')
			if (emailControl?.valid) {
				console.log('Sending recovery code to:', emailControl.value)
				// TODO: Call API to send recovery code
				this.codeSent = true

				// Add validators for code and password
				this.recoverForm.get('code')?.setValidators([
					Validators.required,
					Validators.minLength(6),
					Validators.maxLength(6)
				])
				this.recoverForm.get('password')?.setValidators([
					Validators.required,
					Validators.minLength(6)
				])
				this.recoverForm.get('code')?.updateValueAndValidity()
				this.recoverForm.get('password')?.updateValueAndValidity()
			} else {
				emailControl?.markAsTouched()
			}
		} else {
			// Second step: reset password with code
			if (this.recoverForm.valid) {
				const { email, code, password } = this.recoverForm.value
				console.log('Resetting password:', { email, code, password })
				// TODO: Call API to reset password
				this.router.navigate(['/auth/sign-in'])
			} else {
				this.recoverForm.markAllAsTouched()
			}
		}
	}

	resendCode(e: Event) {
		e.preventDefault()
		const email = this.recoverForm.get('email')?.value
		console.log('Resending code to:', email)
		// TODO: Call API to resend code
	}
}