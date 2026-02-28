import { WritableSignal } from '@angular/core'

export const withLoadingDelay = (
	loading: WritableSignal<boolean>,
	showDelay = 30,
	hideDelay = 150
) => {
	let showTimer: ReturnType<typeof setTimeout> | null = null
	let hideTimer: ReturnType<typeof setTimeout> | null = null
	let shownAt: number | null = null

	return {
		loading,
		start() {
			// Clear any pending hide
			if (hideTimer) {
				clearTimeout(hideTimer); hideTimer = null
			}

			showTimer = setTimeout(() => {
				loading.set(true)
				shownAt = Date.now()
			}, showDelay)
		},

		stop() {
			// Cancel scheduled show — request finished before 50ms
			if (showTimer) {
				clearTimeout(showTimer); showTimer = null
			}

			if (!loading()) return // never shown, nothing to do

			const elapsed = shownAt ? Date.now() - shownAt : hideDelay
			const remaining = Math.max(0, hideDelay - elapsed)

			hideTimer = setTimeout(() => {
				loading.set(false)
				shownAt = null
			}, remaining)
		}
	}
}