import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
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
		RouterModule,
		ReactiveFormsModule,
		SkeletonModule,
		MultiSelectModule,
		ButtonComponent,
		CodeComponent,
		InputComponent,
		PageHeaderComponent
	],
	providers: [MessageService],
	templateUrl: './api-keys-form.component.html',
	styleUrls: ['./api-keys-form.component.css']
})
export class ApiKeysFormComponent implements OnInit {
	form!: FormGroup
	isEdit = false
	loadingKey = signal(false)
	saving = signal(false)
	existingKey = signal<IApiKey | null>(null)

	private fb = inject(FormBuilder)
	private router = inject(Router)
	private route = inject(ActivatedRoute)
	private apiKeysService = inject(ApiKeysService)
	private messageService = inject(MessageService)

	cities!: City[]

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