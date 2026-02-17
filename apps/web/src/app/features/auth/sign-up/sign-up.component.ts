import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { MessageService } from 'primeng/api'

import { AuthService } from '@core/auth/auth.service'
import { ISignUpRequest } from '@core/auth/models'

import { AuthLayoutComponent } from '@features/auth/auth-layout.component'

import { ButtonComponent } from '@shared/components/buttons/button.component'
import { InputTextComponent } from '@shared/components/input-text.component'
import { catchError, tap } from 'rxjs'

@Component({
	selector: 'app-sign-up',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		AuthLayoutComponent,
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

	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private router: Router
	) {}

	onSubmit() {
		if (this.signUpForm.valid) {
			const payload: ISignUpRequest = {
				name: this.signUpForm.value.name!,
				email: this.signUpForm.value.email!,
				password: this.signUpForm.value.password!
			}

			this.authService.signUp(payload).pipe(
				tap(() => this.router.navigate(['/marketplace-account'])),
				catchError(_ => {
					this.messageService.add({
						severity: 'error',
						summary: 'Erro',
						detail: 'Falha ao cadastrar. Verifique se os dados estão corretos'
					})
					return []
				})
			).subscribe()
		} else {
			this.signUpForm.markAllAsTouched()
		}
	}
}