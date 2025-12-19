/**
 * Timer display component
 * Displays the remaining time in the game
 */
export class TimerDisplay {
	private container: HTMLElement | null = null;
	private timerElement: HTMLElement | null = null;
	private isWarning = false;
	private isCritical = false;

	/**
	 * Initialize the timer display
	 */
	init(container: HTMLElement): void {
		this.container = container;

		// Create timer display element
		this.timerElement = document.createElement("div");
		this.timerElement.className = "timer-display";
		this.timerElement.textContent = "30";

		this.container.appendChild(this.timerElement);

		console.log("[TimerDisplay] Initialized");
	}

	/**
	 * Update the timer display
	 */
	update(remainingTime: number): void {
		if (!this.timerElement) {
			return;
		}

		// Display time in seconds (rounded)
		const seconds = Math.ceil(remainingTime);
		this.timerElement.textContent = seconds.toString();

		// Check for warning state (10 seconds or less)
		if (seconds <= 10 && !this.isWarning) {
			this.showWarning();
		} else if (seconds > 10 && this.isWarning) {
			this.hideWarning();
		}

		// Check for critical state (5 seconds or less)
		if (seconds <= 5 && !this.isCritical) {
			this.showCritical();
		} else if (seconds > 5 && this.isCritical) {
			this.hideCritical();
		}
	}

	/**
	 * Show warning state (red color)
	 */
	showWarning(): void {
		if (!this.timerElement) {
			return;
		}

		this.timerElement.classList.add("timer-warning");
		this.isWarning = true;
		console.log("[TimerDisplay] Warning state activated");
	}

	/**
	 * Hide warning state
	 */
	hideWarning(): void {
		if (!this.timerElement) {
			return;
		}

		this.timerElement.classList.remove("timer-warning");
		this.isWarning = false;
	}

	/**
	 * Show critical state (blinking)
	 */
	showCritical(): void {
		if (!this.timerElement) {
			return;
		}

		this.timerElement.classList.add("timer-critical");
		this.isCritical = true;
		console.log("[TimerDisplay] Critical state activated");
	}

	/**
	 * Hide critical state
	 */
	hideCritical(): void {
		if (!this.timerElement) {
			return;
		}

		this.timerElement.classList.remove("timer-critical");
		this.isCritical = false;
	}

	/**
	 * Clean up the timer display
	 */
	dispose(): void {
		if (this.timerElement && this.container) {
			this.container.removeChild(this.timerElement);
		}

		this.timerElement = null;
		this.container = null;
		this.isWarning = false;
		this.isCritical = false;

		console.log("[TimerDisplay] Disposed");
	}
}
