import { Component, input } from '@angular/core'

@Component({
	selector: 'app-button-text',
	standalone: true,
	templateUrl: './button-text.component.html',
	styleUrls: ['./button-text.component.css']
})
export class ButtonTextComponent {
	label = input('')
	disabled = input(false)
}