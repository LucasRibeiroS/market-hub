import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, ReactiveFormsModule } from '@angular/forms'

import { InputTextModule } from 'primeng/inputtext'
import { InputOtpModule } from 'primeng/inputotp'

@Component({
	selector: 'app-input-text',
	standalone: true,
	imports: [CommonModule, InputTextModule, InputOtpModule, ReactiveFormsModule],
	template: `
        <div class="field">
            <label [for]="id" *ngIf="label">{{ label }}</label>
            <div class="input-wrapper" [class.has-icon]="type === 'password'">

                <div *ngIf="type !== 'otp'" class="input-wrapper" [class.has-icon]="type === 'password'">
                    <input
                        pInputText
                        [id]="id"
                        [type]="type === 'password' ? (showPassword ? 'text' : 'password') : type"
                        [placeholder]="placeholder"
                        [maxLength]="maxLength"
                        [formControl]="control"
                    />
                    <i
                        *ngIf="type === 'password'"
                        [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                        (click)="togglePasswordVisibility()"
                        class="password-toggle"
                    ></i>
                </div>

                <p-inputotp
                    *ngIf="type === 'otp'"
                    [id]="id"
                    [formControl]="control"
                    [length]="maxLength > 6 ? 6 : maxLength"
                    (onChange)="onOtpChange($event)"
                />

            </div>
            <small class="p-error" *ngIf="showError">{{ errorMessage }}</small>
        </div>
    `,
	styles: [`
        .field {
            margin-bottom: 1.5rem;
        }

        .field label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 0.825rem;
            letter-spacing: -0.02rem;
            color: var(--p-slate-800);
        }

        .input-wrapper {
            position: relative;
        }

        .input-wrapper.has-icon input {
            padding-right: 2.5rem;
        }

        .password-toggle {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--p-gray-500);
            cursor: pointer;
        }

        .field input {
            width: 100%;
            border-radius: 4px;
        }

        .p-error {
            display: block;
            margin-top: 0.5rem;
            color: #c40006d3;
            font-size: 0.775rem;
        }

        :host ::ng-deep .p-inputtext {
            border: 1.5px solid var(--p-gray-300);
        }

        :host ::ng-deep .p-inputtext.ng-invalid.ng-touched,
        :host ::ng-deep .p-inputtext.ng-invalid.ng-dirty {
            border: 1.5px solid var(--p-gray-300);
        }

        :host ::ng-deep .p-inputtext::placeholder {
            color: var(--p-gray-500) !important;
            font-size: 0.95rem;
        }

        :host ::ng-deep .p-inputotp {
            width: 100%;
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
        }

        :host ::ng-deep .p-inputotp input {
            flex: 1;
            text-align: center;
            text-transform: uppercase;
        }
    `]
})
export class InputTextComponent {
	@Input() id: string = `input-${Math.random().toString(36).substring(2, 9)}`
	@Input() label: string = ''
	@Input() placeholder: string = ''
	@Input() type: string = 'text'
	@Input() maxLength: number = 4096
	@Input() control: FormControl = new FormControl('')

	showPassword: boolean = false

	togglePasswordVisibility(): void {
		this.showPassword = !this.showPassword
	}

	onOtpChange(event: { value: string }): void {
		// Manually ensure the control stays in sync if the binding
		this.control.setValue(event.value)
		this.control.markAsDirty()
	}

	get showError(): boolean {
		return this.control.invalid && (this.control.dirty || this.control.touched) && this.control.value !== ''
	}

	get errorMessage(): string {
		if (this.control.hasError('required')) {
			return 'Este campo é obrigatório'
		}

		if (this.control.hasError('email')) {
			return 'E-mail inválido'
		}

		if (this.control.hasError('minlength')) {
			const minLength = this.control.errors?.['minlength']?.requiredLength
			return `Mínimo de ${minLength} caracteres`
		}

		return ''
	}
}