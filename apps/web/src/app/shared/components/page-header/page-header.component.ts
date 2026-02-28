import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { ButtonComponent } from '@shared/components/button/button.component'

@Component({
	selector: 'app-page-header',
	standalone: true,
	imports: [CommonModule, ButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './page-header.component.html',
	styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
	@Input() title = ''
	@Input() description = ''

	// optional action button event handlers
	@Input() actionLabel?: string
	@Input() actionIcon?: string
	@Output() actionClick = new EventEmitter<void>()

	// optional backbutton
	@Input() showBackButton = false
	@Output() backClick = new EventEmitter<void>()

	get showActionButton(): boolean {
		return Boolean(this.actionLabel || this.actionIcon)
	}
}