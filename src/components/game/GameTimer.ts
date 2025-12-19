import type { TimerCallbacks, TimerConfig } from "../../types/timer";

/**
 * Game timer component
 * Manages countdown timer and notifies when time runs out
 */
export class GameTimer {
	private config: TimerConfig | null = null;
	private callbacks: TimerCallbacks = {};
	private startTime = 0;
	private pausedTime = 0;
	private isPaused = false;
	private isActive = false;
	private animationFrameId: number | null = null;
	private hasTimeUpFired = false;

	/**
	 * Initialize the timer with configuration and callbacks
	 */
	init(config: TimerConfig, callbacks: TimerCallbacks): void {
		this.config = config;
		this.callbacks = callbacks;
		console.log(`[GameTimer] Initialized with duration: ${config.duration}s`);
	}

	/**
	 * Start the timer
	 */
	start(): void {
		if (!this.config) {
			console.error("[GameTimer] Cannot start: not initialized");
			return;
		}

		this.startTime = performance.now();
		this.pausedTime = 0;
		this.isPaused = false;
		this.isActive = true;
		this.hasTimeUpFired = false;

		this.updateLoop();
		console.log("[GameTimer] Started");
	}

	/**
	 * Stop the timer
	 */
	stop(): void {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		this.isActive = false;
		this.isPaused = false;
		console.log("[GameTimer] Stopped");
	}

	/**
	 * Pause the timer
	 */
	pause(): void {
		if (!this.isActive || this.isPaused) {
			return;
		}

		this.pausedTime = this.getElapsedTime();
		this.isPaused = true;
		console.log("[GameTimer] Paused");
	}

	/**
	 * Resume the timer
	 */
	resume(): void {
		if (!this.isActive || !this.isPaused) {
			return;
		}

		this.startTime = performance.now() - this.pausedTime * 1000;
		this.isPaused = false;
		console.log("[GameTimer] Resumed");
	}

	/**
	 * Get remaining time in seconds
	 */
	getRemainingTime(): number {
		if (!this.config) {
			return 0;
		}

		const elapsed = this.getElapsedTime();
		const remaining = Math.max(0, this.config.duration - elapsed);
		return remaining;
	}

	/**
	 * Get elapsed time in seconds
	 */
	getElapsedTime(): number {
		if (!this.isActive) {
			return 0;
		}

		if (this.isPaused) {
			return this.pausedTime;
		}

		const elapsed = (performance.now() - this.startTime) / 1000;
		return elapsed;
	}

	/**
	 * Check if timer is running
	 */
	isRunning(): boolean {
		return this.isActive && !this.isPaused;
	}

	/**
	 * Update loop - called every frame
	 */
	private updateLoop = (): void => {
		if (!this.isActive || this.isPaused) {
			return;
		}

		const remainingTime = this.getRemainingTime();

		// Call onTick callback
		if (this.callbacks.onTick) {
			this.callbacks.onTick(remainingTime);
		}

		// Check if time is up
		if (remainingTime <= 0 && !this.hasTimeUpFired) {
			this.hasTimeUpFired = true;
			console.log("[GameTimer] Time up!");

			if (this.callbacks.onTimeUp) {
				this.callbacks.onTimeUp();
			}

			this.stop();
			return;
		}

		// Continue loop
		this.animationFrameId = requestAnimationFrame(this.updateLoop);
	};
}
