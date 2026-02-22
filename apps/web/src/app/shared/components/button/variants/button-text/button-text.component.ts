import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
	selector: 'app-button-text',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './button-text.component.html',
	styleUrls: ['./button-text.component.css']
})
export class ButtonTextComponent {
	@Input() label = ''
	@Input() disabled = false
}