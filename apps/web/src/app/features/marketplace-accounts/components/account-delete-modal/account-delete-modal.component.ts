import { Component, effect, input, model, output } from '@angular/core'
import { FormControl } from '@angular/forms'

import { ButtonComponent, InputComponent, ModalComponent } from '@shared/components'

@Component({
	selector: 'app-account-delete-modal',
	standalone: true,
	imports: [ModalComponent, ButtonComponent, InputComponent],
	templateUrl: './account-delete-modal.component.html',
	styleUrl: './account-delete-modal.component.css'
})
export class AccountDeleteModalComponent {
	visible = model(false)
	providerName = input<string | null>(null)
	loading = input(false)
	confirmValue = new FormControl('')

	confirmed = output<void>()
	cancelled = output<void>()

	constructor() {
		effect(() => {
			if (!this.visible()) {
				this.confirmValue.setValue('')
			}
		})
	}

	onCancel(): void {
		this.confirmValue.setValue('')
		this.cancelled.emit()
		this.visible.set(false)
	}

	onConfirm(): void {
		if (this.confirmValue.value !== this.providerName()) {
			return
		}

		this.confirmed.emit()
	}
}
