import {
	FilesetResolver,
	HandLandmarker,
	type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type {
	HandData,
	HandTrackerCallbacks,
	HandTrackerConfig,
} from "../../types/tracking";

export class HandTracker {
	private handLandmarker: HandLandmarker | null = null;
	private callbacks: HandTrackerCallbacks | null = null;
	private tracking = false;
	private debugCanvas: HTMLCanvasElement | null = null;
	private debugCtx: CanvasRenderingContext2D | null = null;
	private animationFrameId: number | null = null;
	private videoElement: HTMLVideoElement | null = null;

	/**
	 * HandTrackerを初期化する
	 */
	async init(
		config: HandTrackerConfig,
		callbacks: HandTrackerCallbacks,
	): Promise<void> {
		this.callbacks = callbacks;

		// MediaPipe Vision tasksのファイルセットを読み込み
		const vision = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
		);

		// HandLandmarkerを作成
		this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath:
					"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
				delegate: "GPU",
			},
			runningMode: "VIDEO",
			numHands: config.maxNumHands,
			minHandDetectionConfidence: config.minDetectionConfidence,
			minHandPresenceConfidence: config.minTrackingConfidence,
			minTrackingConfidence: config.minTrackingConfidence,
		});
	}

	/**
	 * トラッキングを開始する
	 */
	async start(videoElement: HTMLVideoElement): Promise<void> {
		if (!this.handLandmarker) {
			throw new Error("[HandTracker] Not initialized. Call init() first.");
		}

		this.videoElement = videoElement;
		this.tracking = true;

		// トラッキングループを開始
		const detectHands = () => {
			if (!this.tracking || !this.handLandmarker || !this.videoElement) {
				this.animationFrameId = null;
				return;
			}

			try {
				// ビデオが準備できているか確認
				if (
					this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
				) {
					const startTimeMs = performance.now();
					const results = this.handLandmarker.detectForVideo(
						this.videoElement,
						startTimeMs,
					);
					this.onResults(results);
				}
			} catch (error) {
				// 検出エラー - ログ出力して続行
				console.error("[HandTracker] Detection error:", error);
				if (this.callbacks?.onError) {
					this.callbacks.onError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			}

			// trackingフラグを再確認してから次のフレームをスケジュール
			if (this.tracking) {
				this.animationFrameId = requestAnimationFrame(detectHands);
			} else {
				this.animationFrameId = null;
			}
		};

		detectHands();
	}

	/**
	 * トラッキングを停止する
	 */
	stop(): void {
		this.tracking = false;
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
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
		if (this.handLandmarker) {
			this.handLandmarker.close();
			this.handLandmarker = null;
		}

		// 参照をクリア
		this.videoElement = null;
		this.callbacks = null;
		this.debugCanvas = null;
		this.debugCtx = null;

		console.log("[HandTracker] Disposed");
	}

	/**
	 * デバッグ描画を有効化する
	 */
	enableDebugDraw(canvas: HTMLCanvasElement): void {
		this.debugCanvas = canvas;
		this.debugCtx = canvas.getContext("2d");
	}

	/**
	 * デバッグ描画を無効化する
	 */
	disableDebugDraw(): void {
		this.debugCanvas = null;
		this.debugCtx = null;
	}

	/**
	 * MediaPipeからの結果を処理する
	 */
	private onResults(results: HandLandmarkerResult): void {
		// デバッグ描画
		if (this.debugCanvas && this.debugCtx) {
			this.drawDebug(results);
		}

		// 手のデータを変換
		const hands: HandData[] = [];

		if (results.landmarks && results.handedness) {
			for (let i = 0; i < results.landmarks.length; i++) {
				const landmarks = results.landmarks[i];
				const handedness = results.handedness[i];
				const worldLandmarks = results.worldLandmarks?.[i];

				hands.push({
					handedness: handedness[0].categoryName === "Left" ? "Left" : "Right",
					landmarks: landmarks.map((lm) => ({
						x: lm.x,
						y: lm.y,
						z: lm.z || 0,
					})),
					worldLandmarks: worldLandmarks?.map((lm) => ({
						x: lm.x,
						y: lm.y,
						z: lm.z || 0,
					})),
					score: handedness[0].score,
				});
			}
		}

		// コールバックを呼び出す
		if (this.callbacks?.onResults) {
			this.callbacks.onResults(hands);
		}
	}

	/**
	 * デバッグ描画
	 */
	private drawDebug(results: HandLandmarkerResult): void {
		if (!this.debugCanvas || !this.debugCtx || !this.videoElement) return;

		const ctx = this.debugCtx;
		const canvas = this.debugCanvas;

		// キャンバスをクリア
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// video要素のobject-fit: coverを考慮した座標変換を計算
		const videoAspect =
			this.videoElement.videoWidth / this.videoElement.videoHeight;
		const canvasAspect = canvas.width / canvas.height;

		let scaleX: number, scaleY: number, offsetX: number, offsetY: number;

		if (videoAspect > canvasAspect) {
			// ビデオが横長：上下がクロップされる
			scaleY = canvas.height;
			scaleX =
				this.videoElement.videoWidth *
				(canvas.height / this.videoElement.videoHeight);
			offsetX = (canvas.width - scaleX) / 2;
			offsetY = 0;
		} else {
			// ビデオが縦長：左右がクロップされる
			scaleX = canvas.width;
			scaleY =
				this.videoElement.videoHeight *
				(canvas.width / this.videoElement.videoWidth);
			offsetX = 0;
			offsetY = (canvas.height - scaleY) / 2;
		}

		// 手のランドマークを描画
		if (results.landmarks && results.handedness) {
			for (let i = 0; i < results.landmarks.length; i++) {
				const landmarks = results.landmarks[i];
				const handedness = results.handedness[i][0].categoryName;

				// 色を選択（左右で色を変える）
				const color = handedness === "Left" ? "#00FF00" : "#FF0000";

				// ランドマークを描画（座標変換情報を渡す）
				this.drawLandmarks(
					ctx,
					landmarks,
					scaleX,
					scaleY,
					offsetX,
					offsetY,
					color,
				);

				// 接続線を描画（座標変換情報を渡す）
				this.drawConnections(
					ctx,
					landmarks,
					scaleX,
					scaleY,
					offsetX,
					offsetY,
					color,
				);
			}
		}
	}

	/**
	 * ランドマークを描画
	 */
	private drawLandmarks(
		ctx: CanvasRenderingContext2D,
		landmarks: Array<{ x: number; y: number; z?: number }>,
		scaleX: number,
		scaleY: number,
		offsetX: number,
		offsetY: number,
		color: string,
	): void {
		ctx.fillStyle = color;
		for (const landmark of landmarks) {
			const x = landmark.x * scaleX + offsetX;
			const y = landmark.y * scaleY + offsetY;

			ctx.beginPath();
			ctx.arc(x, y, 5, 0, 2 * Math.PI);
			ctx.fill();
		}
	}

	/**
	 * 接続線を描画
	 */
	private drawConnections(
		ctx: CanvasRenderingContext2D,
		landmarks: Array<{ x: number; y: number; z?: number }>,
		scaleX: number,
		scaleY: number,
		offsetX: number,
		offsetY: number,
		color: string,
	): void {
		// 手の骨格の接続関係
		const connections = [
			// 手首から各指の付け根
			[0, 1],
			[0, 5],
			[0, 9],
			[0, 13],
			[0, 17],
			// 親指
			[1, 2],
			[2, 3],
			[3, 4],
			// 人差し指
			[5, 6],
			[6, 7],
			[7, 8],
			// 中指
			[9, 10],
			[10, 11],
			[11, 12],
			// 薬指
			[13, 14],
			[14, 15],
			[15, 16],
			// 小指
			[17, 18],
			[18, 19],
			[19, 20],
			// 手のひら
			[5, 9],
			[9, 13],
			[13, 17],
		];

		ctx.strokeStyle = color;
		ctx.lineWidth = 2;

		for (const [start, end] of connections) {
			const startLandmark = landmarks[start];
			const endLandmark = landmarks[end];

			if (!startLandmark || !endLandmark) continue;

			const x1 = startLandmark.x * scaleX + offsetX;
			const y1 = startLandmark.y * scaleY + offsetY;
			const x2 = endLandmark.x * scaleX + offsetX;
			const y2 = endLandmark.y * scaleY + offsetY;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}
	}
}
