import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
	selector: 'app-button-text',
	standalone: true,
	imports: [CommonModule],
	template: `
    <button type="button" class="button-text" [disabled]="disabled">
      {{ label }}
    </button>
  `,
	styles: [`
    .button-text {
      padding: 0;
      background: none;
      border: none;
      color: var(--p-primary-600);
      font: inherit;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }

    .button-text:disabled {
      color: var(--text-secondary);
      cursor: not-allowed;
    }
  `]
})
export class ButtonTextComponent {
	@Input() label = ''
	@Input() disabled = false
}