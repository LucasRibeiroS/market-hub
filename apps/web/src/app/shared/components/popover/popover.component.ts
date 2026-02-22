import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	ViewChild
} from '@angular/core'
import { CommonModule } from '@angular/common'

export type PopoverPosition = 'top' | 'bottom' | 'right' | 'left'

@Component({
	selector: 'app-popover',
	standalone: true,
	imports: [CommonModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './popover.component.html',
	styleUrls: ['./popover.component.css']
})
export class PopoverComponent implements OnDestroy {
	@Input() position: PopoverPosition = 'right'
	@Input() offset = 8
	@Output() closed = new EventEmitter<void>()

	@ViewChild('popover') popoverRef!: ElementRef<HTMLDivElement>

	isOpen = false
	popoverStyles: Record<string, string> = {}

	private anchor: HTMLElement | null = null

	constructor(private cdr: ChangeDetectorRef) {}

	toggle(anchor: HTMLElement): void {
		if (this.isOpen) {
			this.hide()
		} else {
			this.show(anchor)
		}
	}

	show(anchor: HTMLElement): void {
		this.anchor = anchor
		this.isOpen = true
		this.cdr.detectChanges()
		// defer one frame so the element is rendered and has dimensions
		requestAnimationFrame(() => {
			this.updatePosition()
			this.cdr.markForCheck()
		})
	}

	hide(): void {
		this.isOpen = false
		this.anchor = null
		this.closed.emit()
		this.cdr.markForCheck()
	}

	private updatePosition(): void {
		if (!this.anchor || !this.popoverRef) return

		const anchorRect = this.anchor.getBoundingClientRect()
		const popoverEl = this.popoverRef.nativeElement
		const popoverRect = popoverEl.getBoundingClientRect()
		const gap = this.offset

		let top = 0
		let left = 0

		switch (this.position) {
			case 'right':
				top = anchorRect.top + anchorRect.height / 2 - popoverRect.height / 2
				left = anchorRect.right + gap
				break
			case 'left':
				top = anchorRect.top + anchorRect.height / 2 - popoverRect.height / 2
				left = anchorRect.left - popoverRect.width - gap
				break
			case 'bottom':
				top = anchorRect.bottom + gap
				left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2
				break
			case 'top':
				top = anchorRect.top - popoverRect.height - gap
				left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2
				break
		}

		// Keep within viewport bounds
		const vw = window.innerWidth
		const vh = window.innerHeight
		top = Math.max(8, Math.min(top, vh - popoverRect.height - 8))
		left = Math.max(8, Math.min(left, vw - popoverRect.width - 8))

		this.popoverStyles = {
			top: `${top}px`,
			left: `${left}px`
		}
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: MouseEvent): void {
		if (!this.isOpen) return
		const target = event.target as Node
		const clickedInsidePopover = this.popoverRef?.nativeElement.contains(target)
		const clickedAnchor = this.anchor?.contains(target)
		if (!clickedInsidePopover && !clickedAnchor) {
			this.hide()
		}
	}

	@HostListener('document:keydown.escape')
	onEscape(): void {
		if (this.isOpen) this.hide()
	}

	ngOnDestroy(): void {
		this.hide()
	}
}