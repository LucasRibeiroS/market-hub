import { Component, input } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'

import { SelectModule } from 'primeng/select'
import { MultiSelectModule } from 'primeng/multiselect'

import { FormFieldBase } from '@shared/utils/form'

export interface DropdownOption {
	label: string
	value: unknown
	disabled?: boolean
}

@Component({
	selector: 'app-dropdown',
	standalone: true,
	imports: [SelectModule, MultiSelectModule, ReactiveFormsModule],
	templateUrl: './dropdown.component.html',
	styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent extends FormFieldBase<unknown> {
	id = input(`dropdown-${Math.random().toString(36).substring(2, 9)}`)
	label = input('')
	placeholder = input('Selecione')
	options = input<DropdownOption[]>([])
	optionLabel = input('label')
	optionValue = input('value')
	filter = input(false)
	showClear = input(false)
	loading = input(false)
	multiple = input(false)

	control = input(new FormControl<unknown>(null))
}
