import { finalize, tap } from 'rxjs'
import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MessageService } from 'primeng/api'
import { CheckboxModule } from 'primeng/checkbox'

import { ApiKeysService } from '@features/api-keys/services/api-keys.service'
import { CreateApiKeyRequest, getPermissionsOptions, IApiKey, UpdateApiKeyRequest } from '@features/api-keys/models'
import { ApiKeyCreatedModalComponent } from '@features/api-keys/components'

import { ButtonComponent, CheckboxComponent, CodeComponent, DropdownComponent, FormCardComponent, InputComponent, PageHeaderComponent } from '@shared/components'
import { withLoadingDelay } from '@shared/utils/loading-delay'

@Component({
	selector: 'app-api-keys-form',
	standalone: true,
	imports: [
		RouterModule,
		ReactiveFormsModule,
		CheckboxModule,
		ButtonComponent,
		CodeComponent,
		CheckboxComponent,
		DropdownComponent,
		FormCardComponent,
		InputComponent,
		PageHeaderComponent,
		ApiKeyCreatedModalComponent
	],
	templateUrl: './api-keys-form.component.html',
	styleUrls: ['./api-keys-form.component.css']
})
export class ApiKeysFormComponent implements OnInit {
	private router = inject(Router)
	private route = inject(ActivatedRoute)
	private apiKeysService = inject(ApiKeysService)
	private messageService = inject(MessageService)

	form = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(1)]),
		permissions: new FormControl<string[]>([], [Validators.required, Validators.minLength(1)]),
		is_active: new FormControl(true),
		key_preview: new FormControl({ value: '', disabled: true })
	})

	permissions = signal<{ label: string, value: string }[]>(getPermissionsOptions())

	existingKey = signal<IApiKey | null>(null)
	newKeyValue = signal<string | null>(null)

	isEdit = false
	isLoading = signal(false)
	private loader = withLoadingDelay(this.isLoading)

	isSaving = signal(false)
	private saver = withLoadingDelay(this.isSaving)

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id')
		if (id !== null) {
			this.isEdit = true
			this.loader.start()

			this.apiKeysService.getById(id).pipe(
				tap(apiKey => {
					this.existingKey.set(apiKey)
					this.form.setValue({
						name: apiKey.name,
						permissions: apiKey.permissions,
						is_active: apiKey.is_active,
						key_preview: apiKey.key_preview
					})
				}),
				finalize(() => this.loader.stop())
			).subscribe()
		}
	}

	onSubmit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched()
			return
		}

		const payload = {
			name: this.form.value.name!,
			permissions: this.form.value.permissions!,
			is_active: this.form.value.is_active!
		}

		if (!this.isEdit) {
			return this.create(payload)
		}

		if (!this.existingKey()) {
			this.messageService.add({
				severity: 'error',
				summary: 'Erro ao atualizar chave',
				detail: 'Não foi possível encontrar a chave API para atualizar.'
			})
			return
		}

		return this.update(payload)
	}

	private create(payload: CreateApiKeyRequest): void {
		this.saver.start()

		this.apiKeysService.create(payload).pipe(
			tap((response) => {
				this.messageService.add({
					severity: 'success',
					summary: 'Chave criada',
					detail: 'A nova chave API foi criada com sucesso.'
				})
				// Show the created key in the modal before navigating back to the list
				this.newKeyValue.set(response.key)
			}),
			finalize(() => this.saver.stop())
		).subscribe()
	}

	onCreatedModalDismiss(): void {
		this.newKeyValue.set(null)
		this.goBack()
	}

	private update(payload: UpdateApiKeyRequest): void {
		this.saver.start()

		this.apiKeysService.update(this.existingKey()!.id, payload).pipe(
			tap(() => {
				this.messageService.add({
					severity: 'success',
					summary: 'Chave atualizada',
					detail: 'A chave API foi atualizada com sucesso.'
				})
				this.goBack()
			}),
			finalize(() => this.saver.stop())
		).subscribe()
	}

	goBack(): void {
		const id = this.existingKey()?.id
		this.router.navigate(this.isEdit ? ['../..'] : ['..'], {
			relativeTo: this.route,
			state: id ? { editedId: id } : {}
		})
	}
}