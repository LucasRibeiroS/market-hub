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
      background: none;
      border: none;
      color: #007bff;
      cursor: pointer;
      padding: 0;
      font: inherit;
      text-decoration: underline;
    }

    .button-text:hover:not(:disabled) {
      color: #0056b3;
    }

    .button-text:disabled {
      color: #6c757d;
      cursor: not-allowed;
    }
  `]
})
export class ButtonTextComponent {
	@Input() label = ''
	@Input() disabled = false
}