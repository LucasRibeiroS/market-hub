import { finalize, switchMap, tap } from 'rxjs'
import { Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent, InputComponent } from '@shared/components'

import { AuthService } from '@core/auth/auth.service'
import { ISignUpRequest } from '@core/auth/models'
import { environment } from '@env/environment'

@Component({
	selector: 'app-sign-up',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		RouterModule,
		ButtonComponent,
		InputComponent
	],
	templateUrl: './sign-up.component.html'
})
export default class SignUpComponent {
	private authService = inject(AuthService)
	private router = inject(Router)

	signUpForm = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(3)]),
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required, Validators.minLength(6)])
	}, { updateOn: 'submit' })

	isLoading = signal(false)

	onSubmit(): void {
		if (this.signUpForm.valid) {
			const payload: ISignUpRequest = {
				name: this.signUpForm.value.name!,
				email: this.signUpForm.value.email!,
				password: this.signUpForm.value.password!
			}

			this.isLoading.set(true)
			this.authService.signUp(payload).pipe(
				switchMap(() => this.authService.getUser()),
				tap(() => this.router.navigate([environment.startingRoute])),
				finalize(() => this.isLoading.set(false))
			).subscribe()
		} else {
			this.signUpForm.markAllAsTouched()
		}
	}
}