import { finalize, switchMap, tap } from 'rxjs'
import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent } from '@shared/components/buttons/button.component'
import { InputTextComponent } from '@shared/components/input-text.component'

import { AuthService } from '@core/auth/auth.service'
import { ISignInRequest } from '@core/auth/models'

@Component({
	selector: 'app-sign-in',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		ButtonComponent,
		InputTextComponent
	],
	templateUrl: './sign-in.component.html'
})
export default class SignInComponent {
	signInForm = new FormGroup({
		email: new FormControl('lucas.ribeiro@specterlabs.com.br', [Validators.required, Validators.email]),
		password: new FormControl('password1', [Validators.required, Validators.minLength(6)])
	}, { updateOn: 'blur' })
	isLoading = false

	constructor(
		private authService: AuthService,
		private router: Router
	) {}

	onSubmit() {
		if (this.signInForm.valid) {
			const payload: ISignInRequest = {
				email: this.signInForm.value.email!,
				password: this.signInForm.value.password!
			}

			this.isLoading = true
			this.authService.signIn(payload).pipe(
				switchMap(() => this.authService.getUser()),
				tap(() => this.router.navigate(['/marketplace-accounts'])),
				finalize(() => this.isLoading = false)
			).subscribe()
		} else {
			this.signInForm.markAllAsTouched()
		}
	}
}