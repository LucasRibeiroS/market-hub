import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output
} from '@angular/core'
import { ButtonComponent } from '@shared/components/button/button.component'

@Component({
	selector: 'app-page-header',
	standalone: true,
	imports: [ButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './page-header.component.html',
	styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
	title = input('')
	description = input('')

	actionLabel = input<string | undefined>(undefined)
	actionIcon = input<string | undefined>(undefined)
	actionClick = output<void>()

	showBackButton = input(false)
	backClick = output<void>()

	showActionButton = computed(() => Boolean(this.actionLabel() || this.actionIcon()))
}