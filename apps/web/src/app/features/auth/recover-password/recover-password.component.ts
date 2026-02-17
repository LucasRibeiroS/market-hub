import { catchError, finalize, tap } from 'rxjs'
import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent } from '@shared/components/buttons/button.component'
import { ButtonTextComponent } from '@shared/components/buttons/button-text.component'
import { InputTextComponent } from '@shared/components/input-text.component'

import { AuthService } from '@core/auth/auth.service'
import { ICreatePasswordResetRequest, IResetPasswordRequest } from '@core/auth/models'

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
export default class RecoverPasswordComponent {
	recoverForm = new FormGroup({
		email: new FormControl('lucas.ribeiro@specterlabs.com.br', [Validators.required, Validators.email]),
		code: new FormControl(''),
		password: new FormControl('')
	}, { updateOn: 'blur' })
	currentStep: 'code' | 'reset' = 'code'
	isLoading = false

	constructor(
		private authService: AuthService,
		private router: Router
	) {}

	onSubmit() {
		if (this.currentStep === 'code') {
			this.createPasswordReset()
		}

		if (this.currentStep === 'reset') {
			this.resetPassword()
		}
	}

	createPasswordReset() {
		if (this.recoverForm.valid) {
			const payload: ICreatePasswordResetRequest = {
				email: this.recoverForm.value.email!
			}

			this.isLoading = true
			this.authService.createPasswordReset(payload).pipe(
				tap(() => this.moveToResetStep()),
				catchError(err => {
					if (err.message === 'Your code has not expired yet') {
						this.moveToResetStep()
					}
					return []
				}),
				finalize(() => this.isLoading = false)
			).subscribe()
		} else {
			this.recoverForm.get('email')?.markAsTouched()
		}
	}

	resetPassword() {
		if (this.recoverForm.valid) {
			const payload: IResetPasswordRequest = {
				email: this.recoverForm.value.email!,
				code: this.recoverForm.value.code!,
				password: this.recoverForm.value.password!
			}

			this.isLoading = true
			this.authService.resetPassword(payload).pipe(
				tap(() => this.router.navigate(['/auth/sign-in'])),
				finalize(() => this.isLoading = false)
			).subscribe()
		} else {
			this.recoverForm.markAllAsTouched()
		}
	}

	moveToResetStep() {
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

		this.currentStep = 'reset'
	}

	resendCode(e: Event) {
		e.preventDefault()
		const email = this.recoverForm.get('email')?.value
		console.log('Resending code to:', email)
		// TODO: Call API to resend code
	}
}