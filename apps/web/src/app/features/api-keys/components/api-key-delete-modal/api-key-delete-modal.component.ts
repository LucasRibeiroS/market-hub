import { Component, effect, input, model, output } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { DialogModule } from 'primeng/dialog'

import { IApiKey } from '@features/api-keys/models'

import { ButtonComponent, CodeComponent, InputComponent } from '@shared/components'

@Component({
	selector: 'app-api-key-delete-modal',
	standalone: true,
	imports: [ReactiveFormsModule, DialogModule, ButtonComponent, CodeComponent, InputComponent],
	templateUrl: './api-key-delete-modal.component.html',
	styleUrls: ['./api-key-delete-modal.component.css']
})
export class ApiKeyDeleteModalComponent {
	visible = model(false)
	apiKey = input<IApiKey | null>(null)
	loading = input(false)

	confirmed = output<void>()
	cancelled = output<void>()

	confirmValue = new FormControl('')

	constructor() {
		effect(() => {
			if (!this.visible()) {
				this.confirmValue.setValue('')
			}
		})
	}

	onConfirm(): void {
		if (this.confirmValue.value === this.apiKey()?.name) {
			this.confirmed.emit()
		}
	}

	onCancel(): void {
		this.confirmValue.setValue('')
		this.cancelled.emit()
		this.visible.set(false)
	}
}