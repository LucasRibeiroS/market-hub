import { Component, input, output, signal } from '@angular/core'
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard'

import { ButtonComponent, CodeComponent, ModalComponent } from '@shared/components'

@Component({
	selector: 'app-api-key-created-modal',
	standalone: true,
	imports: [
		ClipboardModule,
		ModalComponent,
		ButtonComponent,
		CodeComponent
	],
	templateUrl: './api-key-created-modal.component.html',
	styleUrls: ['./api-key-created-modal.component.css']
})
export class ApiKeyCreatedModalComponent {
	apiKey = input<string | null>(null)
	visible = input<boolean>(false)
	dismiss = output<void>()

	copied = signal(false)

	private copyTimer: ReturnType<typeof setTimeout> | null = null

	constructor(private clipboard: Clipboard) {}

	copy(): void {
		if (!this.apiKey()) return

		this.clipboard.copy(this.apiKey()!)
		this.copied.set(true)

		if (this.copyTimer) clearTimeout(this.copyTimer)
		this.copyTimer = setTimeout(() => this.copied.set(false), 3000)
	}

	onConfirm(): void {
		this.dismiss.emit()
		// Reset state for next use
		this.copied.set(false)
	}
}