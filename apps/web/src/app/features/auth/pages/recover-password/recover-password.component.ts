import { catchError, EMPTY, finalize, tap } from 'rxjs'
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent, ButtonTextComponent, InputComponent } from '@shared/components'

import { AuthService } from '@core/auth/auth.service'
import { ICreatePasswordResetRequest, IResetPasswordRequest } from '@core/auth/models'

@Component({
	selector: 'app-recover-password',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		RouterModule,
		ButtonComponent,
		ButtonTextComponent,
		InputComponent
	],
	templateUrl: './recover-password.component.html',
	styleUrls: ['./recover-password.component.css']
})
export default class RecoverPasswordComponent {
	private authService = inject(AuthService)
	private router = inject(Router)
	private ref = inject(ChangeDetectorRef)

	recoverForm = new FormGroup({
		email: new FormControl('', [Validators.required, Validators.email]),
		code: new FormControl(''),
		password: new FormControl('')
	}, { updateOn: 'submit' })

	currentStep = signal<'code' | 'reset'>('code')
	isLoading = signal(false)

	onSubmit(): void {
		if (this.currentStep() === 'code') {
			this.createPasswordReset()
		} else {
			this.resetPassword()
		}
	}

	createPasswordReset(): void {
		const emailControl = this.recoverForm.get('email')

		if (emailControl?.valid) {
			const payload: ICreatePasswordResetRequest = {
				email: this.recoverForm.value.email!
			}

			this.isLoading.set(true)
			this.authService.createPasswordReset(payload).pipe(
				tap(() => this.moveToResetStep()),
				catchError(err => {
					if (err.message === 'Your code has not expired yet') {
						this.moveToResetStep()
					}
					return EMPTY
				}),
				finalize(() => {
					this.isLoading.set(false)
					this.ref.markForCheck()
				})
			).subscribe()
		} else {
			emailControl?.markAsTouched()
		}
	}

	resetPassword(): void {
		if (this.recoverForm.valid) {
			const payload: IResetPasswordRequest = {
				email: this.recoverForm.value.email!,
				code: this.recoverForm.value.code!,
				password: this.recoverForm.value.password!
			}

			this.isLoading.set(true)
			this.authService.resetPassword(payload).pipe(
				tap(() => this.router.navigate(['/auth/sign-in'])),
				finalize(() => this.isLoading.set(false))
			).subscribe()
		} else {
			this.recoverForm.markAllAsTouched()
		}
	}

	moveToResetStep(): void {
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

		this.currentStep.set('reset')
	}

	resendCode(): void {
		this.createPasswordReset()
	}
}