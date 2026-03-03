import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { SkeletonModule } from 'primeng/skeleton'

@Component({
	selector: 'app-form-card',
	standalone: true,
	imports: [SkeletonModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './form-card.component.html',
	styleUrls: ['./form-card.component.css']
})
export class FormCardComponent {
	isLoading = input(false)
	skeletonRows = input(2)

	protected rows = computed(() => Array.from({ length: this.skeletonRows() }))
}
