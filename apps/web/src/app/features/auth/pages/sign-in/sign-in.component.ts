import { finalize, switchMap, tap } from 'rxjs'
import { Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent, InputComponent } from '@shared/components'

import { AuthService } from '@core/auth/auth.service'
import { ISignInRequest } from '@core/auth/models'
import { environment } from '@env/environment'

@Component({
	selector: 'app-sign-in',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		RouterModule,
		ButtonComponent,
		InputComponent
	],
	templateUrl: './sign-in.component.html'
})
export default class SignInComponent {
	private authService = inject(AuthService)
	private router = inject(Router)

	signInForm = new FormGroup({
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required, Validators.minLength(6)])
	}, { updateOn: 'blur' })

	isLoading = signal(false)

	onSubmit(): void {
		if (this.signInForm.valid) {
			const payload: ISignInRequest = {
				email: this.signInForm.value.email!,
				password: this.signInForm.value.password!
			}

			this.isLoading.set(true)
			this.authService.signIn(payload).pipe(
				switchMap(() => this.authService.getUser()),
				tap(() => this.router.navigate([environment.startingRoute])),
				finalize(() => this.isLoading.set(false))
			).subscribe()
		} else {
			this.signInForm.markAllAsTouched()
		}
	}
}