import { CommonModule, DatePipe } from '@angular/common'
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { finalize, startWith } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MessageService } from 'primeng/api'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs'

import { ButtonComponent, CodeComponent, DropdownComponent, FormCardComponent, InputComponent, ModalComponent, PageHeaderComponent } from '@shared/components'
import { MarketplaceProviderLogoComponent } from '@features/marketplace-accounts/components'
import { MarketplaceAccountsService } from '@features/marketplace-accounts/services'
import {
	TestCreateProductRequest,
	TestRequiredAttribute,
	TestSectionService
} from '@features/marketplace-accounts/services/test-section.service'

type TestAccountOption = {
	id: string
	provider: 'magalu' | 'mercado_livre'
	display_name: string
	external_id: string
	status: string
}

type TestHistoryItem = {
	id: string
	kind: 'product' | 'webhook'
	title: string
	status: 'success' | 'error'
	message: string
	created_at: string
	context: string
	payload: string
}

type TestAttributeGroup = {
	product: TestRequiredAttribute[]
	variant: TestRequiredAttribute[]
}

type MercadoLivreWebhookStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

const MERCADO_LIVRE_WEBHOOK_BASE = {
	_id: 'a3a08133-6d4e-41db-914f-dacf6a1a15c4',
	topic: 'orders_v2' as const,
	resource: '/orders/2000016588362532',
	user_id: 3307966640,
	application_id: 5574472740054031,
	sent: '2026-05-24T22:44:39.195Z',
	attempts: 1,
	received: '2026-05-24T22:44:39.065Z',
	actions: ['action:new_tag', 'pack_order:false', 'site_id:mlb', 'channel:marketplace', 'date_closed', 'payments', 'is_test:true', 'hidden_for_seller', 'status']
}

const MERCADO_LIVRE_WEBHOOK_STATUS_OPTIONS: Array<{ label: string, value: MercadoLivreWebhookStatus }> = [
	{ label: 'Pendente', value: 'pending' },
	{ label: 'Pago', value: 'paid' },
	{ label: 'Enviado', value: 'shipped' },
	{ label: 'Entregue', value: 'delivered' },
	{ label: 'Cancelado', value: 'cancelled' },
	{ label: 'Reembolsado', value: 'refunded' }
]

const HISTORY_STORAGE_KEY = 'test-history'

@Component({
	selector: 'app-test-section',
	standalone: true,
	imports: [
		CommonModule,
		DatePipe,
		ReactiveFormsModule,
		PageHeaderComponent,
		FormCardComponent,
		ButtonComponent,
		InputComponent,
		DropdownComponent,
		CodeComponent,
		ModalComponent,
		Tabs,
		TabList,
		Tab,
		TabPanels,
		TabPanel,
		MarketplaceProviderLogoComponent
	],
	templateUrl: './test-section.component.html',
	styleUrl: './test-section.component.css'
})
export class TestSectionComponent implements OnInit {
	private route = inject(ActivatedRoute)
	private router = inject(Router)
	private accountsService = inject(MarketplaceAccountsService)
	private testSectionService = inject(TestSectionService)
	private messageService = inject(MessageService)
	private destroyRef = inject(DestroyRef)

	accounts = signal<TestAccountOption[]>([])
	history = signal<TestHistoryItem[]>(this.loadHistory())
	requiredAttributes = signal<TestAttributeGroup>({ product: [], variant: [] })
	accountOptions = computed(() => this.accounts().map(account => ({
		label: `${account.display_name} · ${account.external_id}`,
		value: account.id
	})))

	isAccountsLoading = signal(true)
	isAttributesLoading = signal(false)
	isProductSubmitting = signal(false)
	isWebhookSubmitting = signal(false)

	isPayloadPreviewVisible = signal(false)
	payloadPreviewTitle = signal('')
	payloadPreviewContent = signal('')

	areAttributesLoaded = signal(false)

	activeTab = signal<'product' | 'webhook'>('product')

	onTabChange(value: string | number | undefined): void {
		if (value === 'product' || value === 'webhook') {
			this.activeTab.set(value)
		}
	}

	selectedAccountId = signal('')
	selectedAccount = computed(() => this.accounts().find(account => account.id === this.selectedAccountId()) ?? null)
	productRequiredAttributes = computed(() => this.requiredAttributes().product)
	variantRequiredAttributes = computed(() => this.requiredAttributes().variant)
	selectedProvider = computed(() => this.selectedAccount()?.provider ?? null)
	selectedProviderName = computed(() => this.selectedAccount()?.display_name ?? 'Nenhuma conta selecionada')
	webhookEndpointLabel = computed(() => this.selectedProvider() === 'magalu'
		? '/webhooks/orders/:account_id/magalu'
		: '/webhooks/orders/mercado-livre')
	webhookTopicLabel = computed(() => this.selectedProvider() === 'magalu' ? 'orders_order' : 'orders_v2')
	mercadoLivreWebhookStatusOptions = computed(() => MERCADO_LIVRE_WEBHOOK_STATUS_OPTIONS)

	accountControl = new FormControl('', { nonNullable: true, validators: [Validators.required] })
	productAttributesForm = new FormGroup({})
	variantAttributesForm = new FormGroup({})

	productForm = new FormGroup({
		name: new FormControl('Caderno Universitário Capa Dura 10 Matérias', { nonNullable: true, validators: [Validators.required] }),
		description: new FormControl('Caderno universitário de alta qualidade, capa dura, 10 matérias, espiral reforçada. Ideal para estudos e organização.', { nonNullable: true, validators: [Validators.required] }),
		sku: new FormControl('CAD-UNI-10M-001', { nonNullable: true, validators: [Validators.required] }),
		ean: new FormControl('7898297693936', { nonNullable: true }),
		price: new FormControl('2590', { nonNullable: true, validators: [Validators.required] }),
		weightKg: new FormControl('0.5', { nonNullable: true, validators: [Validators.required] }),
		heightCm: new FormControl('27.5', { nonNullable: true, validators: [Validators.required] }),
		widthCm: new FormControl('20', { nonNullable: true, validators: [Validators.required] }),
		depthCm: new FormControl('2', { nonNullable: true, validators: [Validators.required] }),
		imageUrl: new FormControl('https://i.postimg.cc/QxhJwwKw/caderno-de-disco-sistema-inteligente-color-classico-reposicionavel-azul-nobre-921-1-9b1a0c484f51581a.webp', { nonNullable: true, validators: [Validators.required] })
	})

	mercadoLivreWebhookStatusControl = new FormControl<MercadoLivreWebhookStatus | ''>('', { nonNullable: true, validators: [Validators.required] })
	webhookForm = new FormGroup({
		orderId: new FormControl('2000016588362532', { nonNullable: true, validators: [Validators.required] }),
		status: new FormControl('approved', { nonNullable: true, validators: [Validators.required] })
	})

	ngOnInit(): void {
		this.accountControl.valueChanges.pipe(
			startWith(this.accountControl.value),
			takeUntilDestroyed(this.destroyRef)
		).subscribe(accountId => {
			this.selectedAccountId.set(accountId)
			this.clearRequiredAttributes()
			this.mercadoLivreWebhookStatusControl.setValue('')
		})

		this.productForm.controls.name.valueChanges.pipe(
			takeUntilDestroyed(this.destroyRef)
		).subscribe(() => {
			if (this.areAttributesLoaded()) {
				this.clearRequiredAttributes()
			}
		})

		this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
			const accountId = params.get('accountId')
			if (accountId) {
				this.accountControl.setValue(accountId)
			}
		})

		this.accountsService.list({ page: 1, page_size: 100 }).pipe(
			finalize(() => this.isAccountsLoading.set(false))
		).subscribe({
			next: ({ accounts }) => {
				this.accounts.set(accounts.map(account => ({
					id: account.id,
					provider: account.provider.provider,
					display_name: account.provider.display_name,
					external_id: account.external_id,
					status: account.status
				})))

				const selectedAccount = this.accounts().find(account => account.id === this.accountControl.value)
				const fallbackAccount = this.accounts().find(account => account.status === 'active') ?? this.accounts()[0]
				const nextAccountId = selectedAccount?.id ?? fallbackAccount?.id ?? ''

				if (nextAccountId && nextAccountId !== this.accountControl.value) {
					this.accountControl.setValue(nextAccountId)
				}
			},
			error: () => {
				this.messageService.add({
					severity: 'warn',
					summary: 'Integrações',
					detail: 'Não foi possível carregar as contas conectadas. A simulação de webhook ficará indisponível até a lista ser carregada.'
				})
			}
		})
	}

	loadRequiredAttributes(): void {
		const account = this.selectedAccount()
		const productName = this.productForm.controls.name.value.trim()

		if (!account) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Atributos',
				detail: 'Selecione uma conta antes de carregar os atributos.'
			})
			return
		}

		if (!productName) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Atributos',
				detail: 'Informe o nome do produto antes de carregar os atributos.'
			})
			return
		}

		this.isAttributesLoading.set(true)
		this.testSectionService.getRequiredAttributes(account.id, productName).pipe(
			finalize(() => this.isAttributesLoading.set(false))
		).subscribe({
			next: ({ required_attributes }) => {
				this.requiredAttributes.set(required_attributes)
				this.rebuildAttributeForms(required_attributes)
				this.areAttributesLoaded.set(true)
				this.messageService.add({
					severity: 'success',
					summary: 'Atributos carregados',
					detail: 'Os atributos obrigatórios foram carregados para o provedor selecionado.'
				})
			},
			error: (error) => {
				this.messageService.add({
					severity: 'error',
					summary: 'Erro',
					detail: error?.message ?? 'Não foi possível carregar os atributos obrigatórios.'
				})
			}
		})
	}

	get canCreateProduct(): boolean {
		return this.productForm.valid
			&& this.areAttributesLoaded()
			&& this.productAttributesForm.valid
			&& this.variantAttributesForm.valid
			&& !this.isProductSubmitting()
	}

	get canSubmitWebhook(): boolean {
		const account = this.selectedAccount()
		if (!account) {
			return false
		}

		if (account.provider === 'mercado_livre') {
			return Boolean(this.getMercadoLivreWebhookStatus())
				&& this.webhookForm.controls.orderId.value.trim() !== ''
				&& !this.isWebhookSubmitting()
		}

		return this.webhookForm.valid && !this.isWebhookSubmitting()
	}

	goBack(): void {
		this.router.navigate(['/integrations'])
	}

	fillExampleProduct(): void {
		this.productForm.patchValue({
			name: 'Caderno Universitário Capa Dura 10 Matérias',
			description: 'Caderno universitário de alta qualidade, capa dura, 10 matérias, espiral reforçada. Ideal para estudos e organização.',
			sku: 'CAD-UNI-10M-001',
			ean: '7898297693936',
			price: '2590',
			weightKg: '0.5',
			heightCm: '27.5',
			widthCm: '20',
			depthCm: '2',
			imageUrl: 'https://placehold.co/800x800/png'
		})
	}

	resetExample(): void {
		this.productForm.reset({
			name: 'Caderno Universitário Capa Dura 10 Matérias',
			description: 'Caderno universitário de alta qualidade, capa dura, 10 matérias, espiral reforçada. Ideal para estudos e organização.',
			sku: 'CAD-UNI-10M-001',
			ean: '7898297693936',
			price: '2590',
			weightKg: '0.5',
			heightCm: '27.5',
			widthCm: '20',
			depthCm: '2',
			imageUrl: 'https://placehold.co/800x800/png'
		})
	}

	createProduct(): void {
		if (!this.canCreateProduct) {
			this.productForm.markAllAsTouched()
			this.productAttributesForm.markAllAsTouched()
			this.variantAttributesForm.markAllAsTouched()

			if (!this.areAttributesLoaded()) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Atributos obrigatórios',
					detail: 'Clique em "Carregar atributos" antes de criar o produto.'
				})
			} else if (this.productAttributesForm.invalid || this.variantAttributesForm.invalid) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Atributos obrigatórios',
					detail: 'Preencha todos os atributos obrigatórios do provedor antes de criar o produto.'
				})
			}

			return
		}

		this.isProductSubmitting.set(true)
		this.testSectionService.createProduct(this.buildProductPayload()).pipe(
			finalize(() => this.isProductSubmitting.set(false))
		).subscribe({
			next: (response) => {
				this.messageService.add({
					severity: 'success',
					summary: 'Produto criado',
					detail: 'O produto de teste foi criado com sucesso.'
				})
				this.appendHistory({
					kind: 'product',
					title: `Produto ${response.product.id}`,
					status: 'success',
					message: 'Produto de teste criado com sucesso.',
					context: response.product.variants.map(variant => variant.sku).join(', '),
					payload: JSON.stringify(response, null, 2)
				})
			},
			error: (error) => {
				const message = error?.message ?? 'Não foi possível criar o produto de teste.'
				this.messageService.add({
					severity: 'error',
					summary: 'Erro',
					detail: message
				})
				this.appendHistory({
					kind: 'product',
					title: 'Falha ao criar produto',
					status: 'error',
					message,
					context: 'Produto',
					payload: JSON.stringify(this.buildProductPayload(), null, 2)
				})
			}
		})
	}

	simulateWebhook(): void {
		const account = this.selectedAccount()
		if (!account || this.isWebhookSubmitting()) return

		if (account.provider === 'mercado_livre' && !this.getMercadoLivreWebhookStatus()) return
		if (account.provider === 'magalu' && this.webhookForm.invalid) return

		this.isWebhookSubmitting.set(true)
		this.sendWebhookRequest(account).pipe(
			finalize(() => this.isWebhookSubmitting.set(false))
		).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Webhook enviado',
					detail: `A simulação para ${account.display_name} foi enviada.`
				})
				this.appendHistory({
					kind: 'webhook',
					title: `Webhook ${account.display_name}`,
					status: 'success',
					message: 'Simulação entregue ao endpoint.',
					context: account.external_id,
					payload: JSON.stringify(this.buildWebhookPayload(account), null, 2)
				})
			},
			error: (error) => {
				const message = error?.message ?? 'Não foi possível enviar o webhook de teste.'
				this.messageService.add({
					severity: 'error',
					summary: 'Erro',
					detail: message
				})
				this.appendHistory({
					kind: 'webhook',
					title: `Webhook ${account.display_name}`,
					status: 'error',
					message,
					context: account.external_id,
					payload: JSON.stringify(this.buildWebhookPayload(account), null, 2)
				})
			}
		})
	}

	buildProductPayload(): TestCreateProductRequest {
		const values = this.productForm.getRawValue()

		return {
			product: {
				name: values.name.trim(),
				description: values.description.trim(),
				attributes: this.buildAttributesPayload(this.productAttributesForm),
				variants: [{
					sku: values.sku.trim(),
					ean: values.ean.trim() ? values.ean.trim() : null,
					price: Number(values.price),
					weight_kg: Number(values.weightKg),
					height_cm: Number(values.heightCm),
					width_cm: Number(values.widthCm),
					depth_cm: Number(values.depthCm),
					images: [values.imageUrl.trim()],
					attributes: this.buildAttributesPayload(this.variantAttributesForm)
				}]
			}
		}
	}

	openProductPayloadPreview(): void {
		this.openPayloadPreview('Payload de criação de produto · POST /products', this.buildProductPayload())
	}

	openHistoryPayloadPreview(item: TestHistoryItem): void {
		this.payloadPreviewTitle.set(item.title)
		this.payloadPreviewContent.set(item.payload)
		this.isPayloadPreviewVisible.set(true)
	}

	openWebhookPayloadPreview(): void {
		const account = this.selectedAccount()
		if (!account) return

		this.openPayloadPreview(`Payload de webhook · POST ${this.webhookEndpointLabel()}`, this.buildWebhookPayload(account))
	}

	private openPayloadPreview(title: string, payload: unknown): void {
		this.payloadPreviewTitle.set(title)
		this.payloadPreviewContent.set(JSON.stringify(payload, null, 2))
		this.isPayloadPreviewVisible.set(true)
	}

	buildWebhookPayload(account: TestAccountOption) {
		if (account.provider === 'magalu') {
			return this.buildMagaluWebhookPayload(account)
		}

		return this.buildMercadoLivreWebhookPreview(account)
	}

	private sendWebhookRequest(account: TestAccountOption) {
		if (account.provider === 'magalu') {
			return this.testSectionService.sendMagaluWebhook(this.buildMagaluWebhookPayload(account))
		}

		return this.testSectionService.sendMercadoLivreWebhook(this.buildMercadoLivreWebhookPayload(account))
	}

	getProductAttributeControl(id: string): FormControl<string> {
		return this.ensureAttributeControl(this.productAttributesForm, id)
	}

	getVariantAttributeControl(id: string): FormControl<string> {
		return this.ensureAttributeControl(this.variantAttributesForm, id)
	}

	private rebuildAttributeForms(attributes: TestAttributeGroup): void {
		this.productAttributesForm = new FormGroup({})
		this.variantAttributesForm = new FormGroup({})

		// Todo atributo retornado por GetMarketplaceAccountRequiredAttributes já é obrigatório
		// (a API filtra por required=true antes de responder), por isso o Validators.required aqui.
		for (const attribute of attributes.product) {
			this.productAttributesForm.addControl(attribute.id, new FormControl('', { nonNullable: true, validators: [Validators.required] }))
		}

		for (const attribute of attributes.variant) {
			this.variantAttributesForm.addControl(attribute.id, new FormControl('', { nonNullable: true, validators: [Validators.required] }))
		}
	}

	private clearRequiredAttributes(): void {
		this.requiredAttributes.set({ product: [], variant: [] })
		this.areAttributesLoaded.set(false)
		this.productAttributesForm = new FormGroup({})
		this.variantAttributesForm = new FormGroup({})
	}

	private ensureAttributeControl(form: FormGroup, id: string): FormControl<string> {
		const control = form.get(id)
		if (control instanceof FormControl) {
			return control as FormControl<string>
		}

		const nextControl = new FormControl('', { nonNullable: true })
		form.addControl(id, nextControl)
		return nextControl
	}

	private buildAttributesPayload(form: FormGroup): Record<string, string> {
		return Object.entries(form.getRawValue()).reduce<Record<string, string>>((payload, [key, value]) => {
			if (value !== null && value !== undefined && String(value).trim() !== '') {
				payload[key] = String(value).trim()
			}

			return payload
		}, {})
	}

	private buildMagaluWebhookPayload(account: TestAccountOption) {
		const values = this.webhookForm.getRawValue()

		return {
			account_id: account.id,
			topic: 'orders_order',
			data: {
				status: values.status.trim(),
				params: { id: values.orderId.trim() },
				resource: `/orders/${values.orderId.trim()}`
			}
		}
	}

	private buildMercadoLivreWebhookPreview(account: TestAccountOption) {
		const status = this.getMercadoLivreWebhookStatus()
		if (status === null) {
			return { account_id: account.id }
		}

		return {
			...MERCADO_LIVRE_WEBHOOK_BASE,
			resource: this.mercadoLivreResource(),
			status
		}
	}

	private buildMercadoLivreWebhookPayload(account: TestAccountOption) {
		const status = this.getMercadoLivreWebhookStatus()
		if (status === null) {
			return {
				account_id: account.id,
				topic: 'orders_v2',
				resource: this.mercadoLivreResource()
			}
		}

		return {
			account_id: account.id,
			topic: MERCADO_LIVRE_WEBHOOK_BASE.topic,
			resource: this.mercadoLivreResource(),
			user_id: MERCADO_LIVRE_WEBHOOK_BASE.user_id,
			status
		}
	}

	private mercadoLivreResource(): string {
		return `/orders/${this.webhookForm.controls.orderId.value.trim()}`
	}

	private getMercadoLivreWebhookStatus(): MercadoLivreWebhookStatus | null {
		const status = this.mercadoLivreWebhookStatusControl.value
		return status === '' ? null : status
	}

	private appendHistory(item: Omit<TestHistoryItem, 'id' | 'created_at'>): void {
		const nextItem: TestHistoryItem = {
			...item,
			id: crypto.randomUUID(),
			created_at: new Date().toISOString()
		}

		const nextHistory = [nextItem, ...this.history()].slice(0, 12)
		this.history.set(nextHistory)
		localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
	}

	private loadHistory(): TestHistoryItem[] {
		try {
			const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
			if (!raw) return []

			const parsed = JSON.parse(raw) as TestHistoryItem[]
			return Array.isArray(parsed) ? parsed : []
		} catch {
			return []
		}
	}
}
