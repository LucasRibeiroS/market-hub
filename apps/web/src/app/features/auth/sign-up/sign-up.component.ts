import { finalize, switchMap, tap } from 'rxjs'
import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'

import { ButtonComponent } from '@shared/components/buttons/button.component'
import { InputTextComponent } from '@shared/components/input-text.component'

import { AuthService } from '@core/auth/auth.service'
import { ISignUpRequest } from '@core/auth/models'

@Component({
	selector: 'app-sign-up',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		ButtonComponent,
		InputTextComponent
	],
	templateUrl: './sign-up.component.html'
})
export default class SignUpComponent {
	signUpForm = new FormGroup({
		name: new FormControl('Lucas Ribeiro', [Validators.required, Validators.minLength(3)]),
		email: new FormControl('lucas.ribeiro@specterlabs.com.br', [Validators.required, Validators.email]),
		password: new FormControl('password1', [Validators.required, Validators.minLength(6)])
	}, { updateOn: 'blur' })
	isLoading = false

	constructor(
		private authService: AuthService,
		private router: Router
	) {}

	onSubmit() {
		if (this.signUpForm.valid) {
			const payload: ISignUpRequest = {
				name: this.signUpForm.value.name!,
				email: this.signUpForm.value.email!,
				password: this.signUpForm.value.password!
			}

			this.isLoading = true
			this.authService.signUp(payload).pipe(
				switchMap(() => this.authService.getUser()),
				tap(() => this.router.navigate(['/marketplace-accounts'])),
				finalize(() => this.isLoading = false)
			).subscribe()
		} else {
			this.signUpForm.markAllAsTouched()
		}
	}
}