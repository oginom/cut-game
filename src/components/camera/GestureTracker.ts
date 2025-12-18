import type { GestureRecognizerResult } from "@mediapipe/tasks-vision";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import type {
	GestureData,
	GestureEvent,
	GestureTrackerCallbacks,
	GestureTrackerConfig,
	GestureType,
	Handedness,
} from "../../types/gesture";

/**
 * MediaPipe GestureRecognizerを使用してジェスチャーを認識するクラス
 */
export class GestureTracker {
	private gestureRecognizer: GestureRecognizer | null = null;
	private videoElement: HTMLVideoElement | null = null;
	private callbacks: GestureTrackerCallbacks = {};
	private tracking = false;
	private animationId: number | null = null;

	// 各手の前回のジェスチャー状態を保持
	private previousGestures: Map<Handedness, GestureType> = new Map();

	// 最新のジェスチャーデータ
	private latestGestures: Map<Handedness, GestureData> = new Map();

	private config: GestureTrackerConfig;

	constructor(config: GestureTrackerConfig = {}) {
		this.config = config;
		console.log("[GestureTracker] Created");
	}

	/**
	 * GestureRecognizerの初期化
	 */
	async init(): Promise<void> {
		console.log("[GestureTracker] Initializing...");

		try {
			// FilesetResolverでWASMファイルのパスを設定
			const vision = await FilesetResolver.forVisionTasks(
				"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
			);

			// GestureRecognizerの作成
			this.gestureRecognizer = await GestureRecognizer.createFromOptions(
				vision,
				{
					baseOptions: {
						modelAssetPath:
							"https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
						delegate: "GPU",
					},
					runningMode: "VIDEO",
					numHands: this.config.numHands || 2,
					minHandDetectionConfidence: this.config.minDetectionConfidence || 0.5,
					minHandPresenceConfidence: this.config.minDetectionConfidence || 0.5,
					minTrackingConfidence: this.config.minTrackingConfidence || 0.5,
				},
			);

			console.log("[GestureTracker] Initialized successfully");
		} catch (error) {
			console.error("[GestureTracker] Failed to initialize:", error);
			throw error;
		}
	}

	/**
	 * トラッキング開始
	 */
	async start(
		videoElement: HTMLVideoElement,
		callbacks: GestureTrackerCallbacks = {},
	): Promise<void> {
		if (!this.gestureRecognizer) {
			throw new Error("GestureRecognizer not initialized");
		}

		this.videoElement = videoElement;
		this.callbacks = callbacks;
		this.tracking = true;

		console.log("[GestureTracker] Starting tracking");

		// トラッキングループを開始
		this.trackGestures();
	}

	/**
	 * トラッキング停止
	 */
	stop(): void {
		this.tracking = false;
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}

		this.previousGestures.clear();
		this.latestGestures.clear();

		console.log("[GestureTracker] Stopped tracking");
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

		// MediaPipeモデルを解放
		if (this.gestureRecognizer) {
			this.gestureRecognizer.close();
			this.gestureRecognizer = null;
		}

		// 参照をクリア
		this.videoElement = null;
		this.callbacks = {};
		this.previousGestures.clear();
		this.latestGestures.clear();

		console.log("[GestureTracker] Disposed");
	}

	/**
	 * 最新のジェスチャーデータを取得
	 */
	getGestures(): Map<Handedness, GestureData> {
		return new Map(this.latestGestures);
	}

	/**
	 * トラッキングループ
	 */
	private trackGestures = (): void => {
		if (!this.tracking || !this.videoElement || !this.gestureRecognizer) {
			return;
		}

		// ビデオが再生中でない場合はスキップ
		if (this.videoElement.readyState < 2) {
			this.animationId = requestAnimationFrame(this.trackGestures);
			return;
		}

		try {
			// ジェスチャー認識を実行
			const results = this.gestureRecognizer.recognizeForVideo(
				this.videoElement,
				performance.now(),
			);

			// 結果を処理
			this.onResults(results);
		} catch (error) {
			console.error("[GestureTracker] Error during tracking:", error);
		}

		// 次のフレームをスケジュール
		this.animationId = requestAnimationFrame(this.trackGestures);
	};

	/**
	 * MediaPipeの結果を処理
	 */
	private onResults(results: GestureRecognizerResult): void {
		// 現在のフレームで検出された手
		const detectedHands = new Set<Handedness>();

		// 各手のジェスチャーを処理
		if (results.gestures && results.gestures.length > 0) {
			for (let i = 0; i < results.gestures.length; i++) {
				const gestureList = results.gestures[i];
				const handedness = results.handednesses[i];

				if (gestureList.length > 0 && handedness.length > 0) {
					// 最も信頼度の高いジェスチャーを取得
					const topGesture = gestureList[0];
					const hand = handedness[0];

					// Handednessを取得（MediaPipeは'Left'/'Right'を返す）
					const handType = hand.categoryName as Handedness;
					detectedHands.add(handType);

					// GestureTypeに変換
					const gestureType = topGesture.categoryName as GestureType;
					const score = topGesture.score;

					// 前回のジェスチャーを取得
					const previousGesture = this.previousGestures.get(handType) || "None";

					// ジェスチャーデータを更新
					const gestureData: GestureData = {
						gesture: gestureType,
						handedness: handType,
						score,
					};
					this.latestGestures.set(handType, gestureData);

					// ジェスチャーが変化した場合
					if (gestureType !== previousGesture) {
						this.handleGestureChange(handType, gestureType, previousGesture);
					}

					// 前回のジェスチャーを更新
					this.previousGestures.set(handType, gestureType);
				}
			}
		}

		// 検出されなかった手の状態をクリア
		for (const handType of ["Left", "Right"] as Handedness[]) {
			if (!detectedHands.has(handType)) {
				const previousGesture = this.previousGestures.get(handType);
				if (previousGesture && previousGesture !== "None") {
					// 手が検出されなくなった = 'None'に遷移
					this.handleGestureChange(handType, "None", previousGesture);
					this.previousGestures.set(handType, "None");
				}
				this.latestGestures.delete(handType);
			}
		}
	}

	/**
	 * ジェスチャーの変化を処理
	 */
	private handleGestureChange(
		handedness: Handedness,
		newGesture: GestureType,
		previousGesture: GestureType,
	): void {
		console.log(
			`[GestureTracker] Gesture changed (${handedness}): ${previousGesture} -> ${newGesture}`,
		);

		// ジェスチャー変化イベント
		const event: GestureEvent = {
			type: "gesture_change",
			handedness,
			gesture: newGesture,
			previousGesture,
			timestamp: Date.now(),
		};

		if (this.callbacks.onGestureChange) {
			this.callbacks.onGestureChange(event);
		}

		// Victoryジェスチャーが検出された
		if (newGesture === "Victory") {
			console.log(`[GestureTracker] Victory detected (${handedness})`);
			if (this.callbacks.onVictoryDetected) {
				this.callbacks.onVictoryDetected(handedness);
			}
		}

		// V閉じ動作（Victory -> それ以外）
		if (previousGesture === "Victory" && newGesture !== "Victory") {
			console.log(`[GestureTracker] V-close action detected (${handedness})`);

			const closeEvent: GestureEvent = {
				type: "v_close_action",
				handedness,
				gesture: newGesture,
				previousGesture,
				timestamp: Date.now(),
			};

			if (this.callbacks.onVCloseAction) {
				this.callbacks.onVCloseAction(handedness);
			}

			if (this.callbacks.onGestureChange) {
				this.callbacks.onGestureChange(closeEvent);
			}
		}
	}
}
