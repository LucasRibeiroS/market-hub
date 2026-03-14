import { Component, input, model } from '@angular/core'
import { DialogModule } from 'primeng/dialog'

@Component({
	selector: 'app-modal',
	standalone: true,
	imports: [DialogModule],
	templateUrl: './modal.component.html',
	styleUrl: './modal.component.css'
})
export class ModalComponent {
	visible = model(false)
	header = input.required<string>()
	width = input('460px')
	closable = input(true)
}
