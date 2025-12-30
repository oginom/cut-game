import type { DifficultyConfig, SpawnConfig } from "../../types/game";

/**
 * Spawn manager component
 * Manages periodic treasure spawning with difficulty progression
 */
export class SpawnManager {
	private config: SpawnConfig | null = null;
	private difficultyConfig: DifficultyConfig | null = null;
	private isActive = false;
	private timeSinceLastSpawn = 0;
	private onSpawn:
		| ((direction: "left" | "right", speed: number) => void)
		| null = null;

	/**
	 * Initialize the spawn manager
	 */
	init(
		config: SpawnConfig,
		difficultyConfig: DifficultyConfig,
		onSpawn: (direction: "left" | "right", speed: number) => void,
	): void {
		this.config = config;
		this.difficultyConfig = difficultyConfig;
		this.onSpawn = onSpawn;

		console.log("[SpawnManager] Initialized");
		console.log(`  Initial interval: ${config.initialInterval}s`);
		console.log(`  Min interval: ${config.minInterval}s`);
		console.log(`  Speed range: ${config.minSpeed} - ${config.maxSpeed}`);
	}

	/**
	 * Start spawning
	 */
	start(): void {
		this.isActive = true;
		this.timeSinceLastSpawn = 0;
		console.log("[SpawnManager] Started");
	}

	/**
	 * Stop spawning
	 */
	stop(): void {
		this.isActive = false;
		console.log("[SpawnManager] Stopped");
	}

	/**
	 * Update spawn logic
	 */
	update(deltaTime: number, elapsedTime: number): void {
		if (!this.isActive || !this.config || !this.onSpawn) {
			return;
		}

		this.timeSinceLastSpawn += deltaTime;

		// Calculate current spawn interval based on difficulty
		const currentInterval = this.getSpawnInterval(elapsedTime);

		// Check if it's time to spawn
		if (this.timeSinceLastSpawn >= currentInterval) {
			this.timeSinceLastSpawn = 0;

			// Random direction
			const direction = Math.random() < 0.5 ? "left" : "right";

			// Get current speed
			const speed = this.getSpeed(elapsedTime);

			// Spawn treasure
			this.onSpawn(direction, speed);

			console.log(
				`[SpawnManager] Spawned treasure (${direction}, speed: ${speed.toFixed(2)}, interval: ${currentInterval.toFixed(2)}s)`,
			);
		}
	}

	/**
	 * Get difficulty multiplier based on elapsed time (0-1)
	 */
	getDifficultyMultiplier(elapsedTime: number): number {
		if (!this.difficultyConfig) {
			return 0;
		}

		// Linear progression from 0 to 1
		const multiplier = Math.min(
			1,
			elapsedTime / this.difficultyConfig.totalDuration,
		);
		return multiplier;
	}

	/**
	 * Get current spawn interval based on elapsed time
	 */
	getSpawnInterval(elapsedTime: number): number {
		if (!this.config) {
			return 3.0;
		}

		const difficulty = this.getDifficultyMultiplier(elapsedTime);

		// Interpolate between initial and min interval
		const interval =
			this.config.initialInterval -
			(this.config.initialInterval - this.config.minInterval) * difficulty;

		return interval;
	}

	/**
	 * Get current speed based on elapsed time
	 */
	getSpeed(elapsedTime: number): number {
		if (!this.config) {
			return 1.0;
		}

		const difficulty = this.getDifficultyMultiplier(elapsedTime);

		// Interpolate between min and max speed
		const speed =
			this.config.minSpeed +
			(this.config.maxSpeed - this.config.minSpeed) * difficulty;

		return speed;
	}

	/**
	 * Check if spawning is active
	 */
	isSpawning(): boolean {
		return this.isActive;
	}
}
