import type {
	GestureData,
	GestureTrackerCallbacks,
	GestureTrackerConfig,
	Handedness,
} from "../../types/gesture";
import type {
	HandData,
	HandTrackerConfig,
	PoseData,
	PoseTrackerConfig,
} from "../../types/tracking";
import { GestureTracker } from "./GestureTracker";
import { HandTracker } from "./HandTracker";
import { PoseTracker } from "./PoseTracker";

export interface TrackingManagerConfig {
	hand: HandTrackerConfig;
	pose: PoseTrackerConfig;
	gesture?: GestureTrackerConfig;
}

export interface TrackingManagerCallbacks {
	onHandResults?: (hands: HandData[]) => void;
	onPoseResults?: (poses: PoseData[]) => void;
	onGestureResults?: (gestures: Map<Handedness, GestureData>) => void;
	onVCloseAction?: (handedness: Handedness) => void;
	onError?: (error: Error) => void;
}

export interface PerformanceStats {
	fps: number;
	averageLatency: number; // ms
	handDetectionRate: number; // 0-1
	poseDetectionRate: number; // 0-1
}

export class TrackingManager {
	private handTracker: HandTracker;
	private poseTracker: PoseTracker;
	private gestureTracker: GestureTracker;
	private callbacks: TrackingManagerCallbacks | null = null;
	private tracking = false;

	// パフォーマンス測定用
	private frameCount = 0;
	private lastFpsUpdate = 0;
	private currentFps = 0;
	private latencySum = 0;
	private latencyCount = 0;
	private handDetectionCount = 0;
	private poseDetectionCount = 0;
	private totalFrames = 0;

	// トラッキング結果の保持
	private lastHandData: HandData[] = [];
	private lastPoseData: PoseData[] = [];
	private lastGestureData: Map<Handedness, GestureData> = new Map();

	constructor() {
		this.handTracker = new HandTracker();
		this.poseTracker = new PoseTracker();
		this.gestureTracker = new GestureTracker();
	}

	/**
	 * TrackingManagerを初期化する
	 */
	async init(
		config: TrackingManagerConfig,
		callbacks: TrackingManagerCallbacks,
	): Promise<void> {
		this.callbacks = callbacks;

		try {
			// HandTrackerを初期化
			await this.handTracker.init(config.hand, {
				onResults: (hands) => {
					this.lastHandData = hands;
					if (hands.length > 0) {
						this.handDetectionCount++;
					}
					this.callbacks?.onHandResults?.(hands);
				},
				onError: this.callbacks.onError,
			});

			// PoseTrackerを初期化
			await this.poseTracker.init(config.pose, {
				onResults: (poses) => {
					this.lastPoseData = poses;
					if (poses.length > 0) {
						this.poseDetectionCount++;
					}
					this.callbacks?.onPoseResults?.(poses);
				},
				onError: this.callbacks.onError,
			});

			// GestureTrackerを初期化（configは空でもOK）
			await this.gestureTracker.init();

			console.log("[TrackingManager] All trackers initialized");
		} catch (error) {
			this.callbacks?.onError?.(
				error instanceof Error ? error : new Error(String(error)),
			);
			throw error;
		}
	}

	/**
	 * トラッキングを開始する
	 */
	async start(videoElement: HTMLVideoElement): Promise<void> {
		if (this.tracking) {
			console.warn("[TrackingManager] Tracking is already running");
			return;
		}

		this.tracking = true;
		this.resetPerformanceStats();

		// パフォーマンス測定ループを開始
		this.startPerformanceMonitoring();

		// GestureTrackerのコールバック設定
		const gestureCallbacks: GestureTrackerCallbacks = {
			onGestureChange: () => {
				// ジェスチャーデータを更新
				const gestures = this.gestureTracker.getGestures();
				this.lastGestureData = gestures;
				this.callbacks?.onGestureResults?.(gestures);
			},
			onVCloseAction: (handedness) => {
				console.log(`[TrackingManager] V-close action: ${handedness}`);
				this.callbacks?.onVCloseAction?.(handedness);
			},
		};

		try {
			// 全トラッカーを開始（Promise.allSettledで部分的な失敗に対応）
			const results = await Promise.allSettled([
				this.handTracker.start(videoElement),
				this.poseTracker.start(videoElement),
				this.gestureTracker.start(videoElement, gestureCallbacks),
			]);

			// 失敗したトラッカーをチェック
			const failures: { name: string; reason: unknown }[] = [];
			const trackerNames = ["HandTracker", "PoseTracker", "GestureTracker"];

			results.forEach((result, index) => {
				if (result.status === "rejected") {
					failures.push({
						name: trackerNames[index],
						reason: result.reason,
					});
					console.error(
						`[TrackingManager] ${trackerNames[index]} failed to start:`,
						result.reason,
					);
				}
			});

			// すべてのトラッカーが失敗した場合はエラー
			if (failures.length === results.length) {
				// すべて失敗 - クリーンアップして例外をスロー
				this.tracking = false;
				this.handTracker.stop();
				this.poseTracker.stop();
				this.gestureTracker.stop();

				const error = new Error(
					`[TrackingManager] All trackers failed to start. Failures: ${failures.map((f) => f.name).join(", ")}`,
				);
				this.callbacks?.onError?.(error);
				throw error;
			}

			// 一部が失敗した場合は警告を出すが続行
			if (failures.length > 0) {
				const failedNames = failures.map((f) => f.name).join(", ");
				console.warn(
					`[TrackingManager] Some trackers failed to start: ${failedNames}. Continuing with available trackers.`,
				);

				// 失敗したトラッカーは停止状態にする
				failures.forEach((failure) => {
					if (failure.name === "HandTracker") this.handTracker.stop();
					if (failure.name === "PoseTracker") this.poseTracker.stop();
					if (failure.name === "GestureTracker") this.gestureTracker.stop();
				});

				// エラーコールバックを呼び出すが、例外はスローしない
				const partialError = new Error(
					`[TrackingManager] Partial failure: ${failedNames} failed to start`,
				);
				this.callbacks?.onError?.(partialError);
			}

			// 成功したトラッカーの数を報告
			const successCount = results.length - failures.length;
			console.log(
				`[TrackingManager] ${successCount}/${results.length} trackers started successfully`,
			);
		} catch (error) {
			// 予期しないエラー - 完全にクリーンアップ
			this.tracking = false;
			this.handTracker.stop();
			this.poseTracker.stop();
			this.gestureTracker.stop();

			const wrappedError =
				error instanceof Error ? error : new Error(String(error));
			this.callbacks?.onError?.(wrappedError);
			throw wrappedError;
		}
	}

	/**
	 * トラッキングを停止する
	 */
	stop(): void {
		this.tracking = false;
		this.handTracker.stop();
		this.poseTracker.stop();
		this.gestureTracker.stop();
	}

	/**
	 * トラッキング中かどうか
	 */
	isTracking(): boolean {
		return this.tracking;
	}

	/**
	 * リソースを解放する（メモリリーク防止）
	 */
	dispose(): void {
		// トラッキングを停止
		this.stop();

		// 各トラッカーのリソースを解放
		this.handTracker.dispose();
		this.poseTracker.dispose();
		this.gestureTracker.dispose();

		// データをクリア
		this.lastHandData = [];
		this.lastPoseData = [];
		this.lastGestureData.clear();

		// コールバックをクリア
		this.callbacks = null;

		console.log("[TrackingManager] Disposed");
	}

	/**
	 * デバッグ描画を有効化する
	 */
	enableDebug(canvas: HTMLCanvasElement): void {
		this.handTracker.enableDebugDraw(canvas);
		this.poseTracker.enableDebugDraw(canvas);
	}

	/**
	 * デバッグ描画を無効化する
	 */
	disableDebug(): void {
		this.handTracker.disableDebugDraw();
		this.poseTracker.disableDebugDraw();
	}

	/**
	 * 最新の手のデータを取得
	 */
	getHandData(): HandData[] {
		return this.lastHandData;
	}

	/**
	 * 最新の姿勢データを取得
	 */
	getPoseData(): PoseData[] {
		return this.lastPoseData;
	}

	/**
	 * 最新のジェスチャーデータを取得
	 */
	getGestureData(): Map<Handedness, GestureData> {
		return new Map(this.lastGestureData);
	}

	/**
	 * パフォーマンス統計を取得
	 */
	getPerformanceStats(): PerformanceStats {
		const avgLatency =
			this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;
		const handRate =
			this.totalFrames > 0 ? this.handDetectionCount / this.totalFrames : 0;
		const poseRate =
			this.totalFrames > 0 ? this.poseDetectionCount / this.totalFrames : 0;

		return {
			fps: this.currentFps,
			averageLatency: avgLatency,
			handDetectionRate: handRate,
			poseDetectionRate: poseRate,
		};
	}

	/**
	 * パフォーマンス統計をリセット
	 */
	private resetPerformanceStats(): void {
		this.frameCount = 0;
		this.lastFpsUpdate = performance.now();
		this.currentFps = 0;
		this.latencySum = 0;
		this.latencyCount = 0;
		this.handDetectionCount = 0;
		this.poseDetectionCount = 0;
		this.totalFrames = 0;
	}

	/**
	 * パフォーマンスモニタリングを開始
	 */
	private startPerformanceMonitoring(): void {
		const measurePerformance = () => {
			if (!this.tracking) return;

			const now = performance.now();
			this.frameCount++;
			this.totalFrames++;

			// 1秒ごとにFPSを更新
			if (now - this.lastFpsUpdate >= 1000) {
				this.currentFps = this.frameCount;
				this.frameCount = 0;
				this.lastFpsUpdate = now;
			}

			requestAnimationFrame(measurePerformance);
		};

		measurePerformance();
	}

	/**
	 * レイテンシを記録
	 */
	recordLatency(latency: number): void {
		this.latencySum += latency;
		this.latencyCount++;
	}
}
