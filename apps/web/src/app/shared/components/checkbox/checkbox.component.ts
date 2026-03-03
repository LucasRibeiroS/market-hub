import { Component, input } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { CheckboxModule } from 'primeng/checkbox'
import { CommonModule } from '@angular/common'
import { FormFieldBase } from '@shared/utils/form'

@Component({
	selector: 'app-checkbox',
	standalone: true,
	imports: [CommonModule, CheckboxModule, ReactiveFormsModule],
	templateUrl: './checkbox.component.html',
	styleUrl: './checkbox.component.css'
})
export class CheckboxComponent extends FormFieldBase<boolean> {
	id = input<string>(`checkbox-${Math.random().toString(36).substring(2, 9)}`)
	label = input<string>('')
	/** Optional helper text rendered below the label */
	description = input<string>('')
	disabled = input<boolean>(false)
	/** Text shown next to the toggle when value is true */
	activeLabel = input<string>('Ativa')
	/** Text shown next to the toggle when value is false */
	inactiveLabel = input<string>('Inativa')

	control = input.required<FormControl>()
}