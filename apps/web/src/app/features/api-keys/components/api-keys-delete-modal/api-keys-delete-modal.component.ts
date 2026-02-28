import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormControl, FormsModule } from '@angular/forms'
import { DialogModule } from 'primeng/dialog'

import { IApiKey } from '@features/api-keys/models'

import { ButtonComponent, CodeComponent, InputComponent } from '@shared/components'

@Component({
	selector: 'app-api-key-delete-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, DialogModule, ButtonComponent, CodeComponent, InputComponent],
	templateUrl: './api-keys-delete-modal.component.html',
	styleUrls: ['./api-keys-delete-modal.component.css']
})
export class ApiKeyDeleteModalComponent implements OnChanges {
	@Input() visible = false
	@Input() apiKey: IApiKey | null = null
	@Input() loading = false
	@Output() visibleChange = new EventEmitter<boolean>()
	@Output() confirmed = new EventEmitter<void>()
	@Output() cancelled = new EventEmitter<void>()

	confirmValue = new FormControl('')

	ngOnChanges(): void {
		if (!this.visible) {
			this.confirmValue.setValue('')
		}
	}

	onConfirm(): void {
		if (this.confirmValue.value === this.apiKey?.name) {
			this.confirmed.emit()
		}
	}

	onCancel(): void {
		this.confirmValue.setValue('')
		this.cancelled.emit()
		this.visibleChange.emit(false)
	}
}