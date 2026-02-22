import { catchError, EMPTY, finalize, tap } from 'rxjs'
import { ChangeDetectorRef, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent, ButtonTextComponent, InputComponent } from '@shared/components'

import { AuthService } from '@core/auth/auth.service'
import { ICreatePasswordResetRequest, IResetPasswordRequest } from '@core/auth/models'

@Component({
	selector: 'app-recover-password',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		ButtonComponent,
		ButtonTextComponent,
		InputTextComponent
	],
		InputComponent
})
export default class RecoverPasswordComponent {
	recoverForm = new FormGroup({
		email: new FormControl('', [Validators.required, Validators.email]),
		code: new FormControl(''),
		password: new FormControl('')
	}, { updateOn: 'blur' })
	currentStep: 'code' | 'reset' = 'code'
	isLoading = false

	constructor(
		private authService: AuthService,
		private router: Router,
		private ref: ChangeDetectorRef
	) {}

	onSubmit() {
		if (this.currentStep === 'code') {
			this.createPasswordReset()
		}

		if (this.currentStep === 'reset') {
			this.resetPassword()
		}
	}

	async createPasswordReset() {
		const emailControl = this.recoverForm.get('email')

		if (emailControl?.valid) {
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
					return EMPTY
				}),
				finalize(() => {
					this.isLoading = false
					this.ref.markForCheck()
				})
			).subscribe()
		} else {
			emailControl?.markAsTouched()
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
		const codeControl = this.recoverForm.get('code')
		const passwordControl = this.recoverForm.get('password')

		if (!codeControl?.hasValidator(Validators.required)) {
			codeControl?.setValidators([
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(6)
			])
			codeControl?.updateValueAndValidity()
		}

		if (!passwordControl?.hasValidator(Validators.required)) {
			passwordControl?.setValidators([
				Validators.required,
				Validators.minLength(6)
			])
			passwordControl?.updateValueAndValidity()
		}

		this.currentStep = 'reset'
	}

	resendCode() {
		this.createPasswordReset()
	}
}