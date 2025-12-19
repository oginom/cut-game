/**
 * Timer type definitions
 */

/**
 * Timer configuration
 */
export interface TimerConfig {
	/**
	 * Game duration in seconds
	 */
	duration: number;
}

/**
 * Timer callbacks
 */
export interface TimerCallbacks {
	/**
	 * Called every frame with remaining time
	 */
	onTick?: (remainingTime: number) => void;

	/**
	 * Called when time runs out
	 */
	onTimeUp?: () => void;
}
