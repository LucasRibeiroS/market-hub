import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { DatePickerModule } from 'primeng/datepicker'
import { SkeletonModule } from 'primeng/skeleton'
import { MultiSelectModule } from 'primeng/multiselect'
import { MessageService } from 'primeng/api'

import { ApiKeysService } from '../../services/api-keys.service'
import { IApiKey } from '../../models/api-key.model'
import { ButtonComponent, CodeComponent, InputComponent, PageHeaderComponent } from '@shared/components'

interface City {
	name: string
	code: string
}
@Component({
	selector: 'app-api-keys-form',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		ReactiveFormsModule,
		DatePickerModule,
		SkeletonModule,
		MultiSelectModule,
		ButtonComponent,
		CodeComponent,
		InputComponent,
		PageHeaderComponent
	],
	providers: [MessageService],
	templateUrl: './api-keys-form.component.html',
	styles: [`
    /* Header */
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .back-btn {
      margin-top: 0.2rem;
      flex-shrink: 0;
    }

    .page-title {
      margin: 0 0 0.3rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--p-surface-900);
      letter-spacing: -0.02em;
    }

    .page-description {
      margin: 0;
      font-size: 0.875rem;
      color: var(--p-surface-500);
      line-height: 1.5;
    }

    /* Form card */
    .form-card {
      background-color: var(--p-surface-0);
      border: 1px solid var(--p-surface-200);
      border-radius: 10px;
      padding: 1.75rem;
    }

    .form-skeleton {
      display: flex;
      flex-direction: column;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.4rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--p-surface-700);
    }

    .required {
      color: var(--p-red-500);
      margin-left: 2px;
    }

    .form-hint {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--p-surface-400);
      margin-left: 4px;
    }

    .form-input {
      width: 100%;
    }

    :host ::ng-deep .form-calendar {
      width: 100%;
    }

    :host ::ng-deep .form-calendar .p-inputtext {
      width: 100%;
    }

    .form-error {
      color: var(--p-red-500);
      font-size: 0.8rem;
    }

    .form-hint-text {
      font-size: 0.8rem;
      color: var(--p-surface-400);
    }

    /* Prefix display */
    .prefix-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      background-color: var(--p-surface-50);
      border: 1px solid var(--p-surface-200);
      border-radius: 6px;
    }

    .prefix-display code {
      font-family: monospace;
      font-size: 0.875rem;
      color: var(--p-surface-700);
    }

    .prefix-note {
      font-size: 0.8rem;
      color: var(--p-surface-400);
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--p-surface-100);
      margin-top: 0.25rem;
    }
  `]
})
export class ApiKeysFormComponent implements OnInit {
	form!: FormGroup
	isEdit = false
	loadingKey = signal(false)
	saving = signal(false)
	existingKey = signal<IApiKey | null>(null)
	tomorrow = new Date(Date.now() + 86_400_000)

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private route: ActivatedRoute,
		private apiKeysService: ApiKeysService,
		private messageService: MessageService
	) {}

	cities!: City[]
	selectedCities!: any[]

	ngOnInit(): void {
		this.cities = [
			{ name: 'New York', code: 'NY' },
			{ name: 'Rome', code: 'RM' },
			{ name: 'London', code: 'LDN' },
			{ name: 'Istanbul', code: 'IST' },
			{ name: 'Paris', code: 'PRS' }
		]

		this.form = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(1)]],
			permissions: [[], [Validators.required, Validators.minLength(1)]]
		})

		const id = this.route.snapshot.paramMap.get('id')
		if (id) {
			this.isEdit = true
			this.loadingKey.set(true)
			this.apiKeysService.getById(id).subscribe(key => {
				this.loadingKey.set(false)
				if (!key) {
					this.goBack(); return
				}
				this.existingKey.set(key)
				// this.form.patchValue({ name: key.name, expiresAt: key.expiresAt })
			})
		}
	}

	isInvalid(field: string): boolean {
		const ctrl = this.form.get(field)
		return !!(ctrl?.invalid && ctrl.touched)
	}

	onSubmit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched()
			return
		}

		this.saving.set(true)
		const { name } = this.form.value

		if (this.isEdit) {
			const id = this.existingKey()!.id
			this.apiKeysService.update(id, { name }).subscribe({
				next: () => {
					this.saving.set(false)
					// Navigate back and pass the id so the list can highlight the row
					this.router.navigate(['../..'], {
						relativeTo: this.route,
						state: { editedId: id }
					})
				},
				error: () => {
					this.saving.set(false)
					this.messageService.add({ severity: 'error', summary: 'Erro ao salvar', life: 3000 })
				}
			})
		} else {
			this.apiKeysService.create({ name, permissions: ['user.products'] }).subscribe({
				next: () => {
					this.saving.set(false)
					this.router.navigate(['..'], { relativeTo: this.route })
				},
				error: () => {
					this.saving.set(false)
					this.messageService.add({ severity: 'error', summary: 'Erro ao criar', life: 3000 })
				}
			})
		}
	}

	goBack(): void {
		const id = this.existingKey()?.id
		this.router.navigate(this.isEdit ? ['../..'] : ['..'], {
			relativeTo: this.route,
			state: id ? { editedId: id } : {}
		})
	}
}