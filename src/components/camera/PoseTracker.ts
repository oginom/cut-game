import {
	FilesetResolver,
	PoseLandmarker,
	type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type {
	PoseData,
	PoseTrackerCallbacks,
	PoseTrackerConfig,
} from "../../types/tracking";

export class PoseTracker {
	private poseLandmarker: PoseLandmarker | null = null;
	private callbacks: PoseTrackerCallbacks | null = null;
	private tracking = false;
	private debugCanvas: HTMLCanvasElement | null = null;
	private debugCtx: CanvasRenderingContext2D | null = null;
	private animationFrameId: number | null = null;
	private videoElement: HTMLVideoElement | null = null;

	/**
	 * PoseTrackerを初期化する
	 */
	async init(
		config: PoseTrackerConfig,
		callbacks: PoseTrackerCallbacks,
	): Promise<void> {
		this.callbacks = callbacks;

		// MediaPipe Vision tasksのファイルセットを読み込み
		const vision = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
		);

		// PoseLandmarkerを作成
		this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath:
					"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
				delegate: "GPU",
			},
			runningMode: "VIDEO",
			minPoseDetectionConfidence: config.minDetectionConfidence,
			minTrackingConfidence: config.minTrackingConfidence,
		});

		console.log("[PoseTracker] Initialized");
	}

	/**
	 * トラッキングを開始する
	 */
	async start(videoElement: HTMLVideoElement): Promise<void> {
		if (!this.poseLandmarker) {
			throw new Error("[PoseTracker] Not initialized. Call init() first.");
		}

		this.videoElement = videoElement;
		this.tracking = true;

		// トラッキングループを開始
		const detectPose = () => {
			if (!this.tracking || !this.poseLandmarker || !this.videoElement) {
				this.animationFrameId = null;
				return;
			}

			try {
				// ビデオが準備できているか確認
				if (
					this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
				) {
					const startTimeMs = performance.now();
					const results = this.poseLandmarker.detectForVideo(
						this.videoElement,
						startTimeMs,
					);
					this.onResults(results);
				}
			} catch (error) {
				// 検出エラー - ログ出力して続行
				console.error("[PoseTracker] Detection error:", error);
				if (this.callbacks?.onError) {
					this.callbacks.onError(
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			}

			// trackingフラグを再確認してから次のフレームをスケジュール
			if (this.tracking) {
				this.animationFrameId = requestAnimationFrame(detectPose);
			} else {
				this.animationFrameId = null;
			}
		};

		detectPose();
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
		if (this.poseLandmarker) {
			this.poseLandmarker.close();
			this.poseLandmarker = null;
		}

		// 参照をクリア
		this.videoElement = null;
		this.callbacks = null;
		this.debugCanvas = null;
		this.debugCtx = null;

		console.log("[PoseTracker] Disposed");
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
	private onResults(results: PoseLandmarkerResult): void {
		// デバッグ描画
		if (this.debugCanvas && this.debugCtx) {
			this.drawDebug(results);
		}

		// 姿勢のデータを変換
		const poses: PoseData[] = [];

		for (let i = 0; i < results.landmarks.length; i++) {
			const landmarks = results.landmarks[i];
			const worldLandmarks = results.worldLandmarks?.[i];

			poses.push({
				landmarks: landmarks.map((lm) => ({
					x: lm.x,
					y: lm.y,
					z: lm.z,
					visibility: lm.visibility,
				})),
				worldLandmarks: worldLandmarks?.map((lm) => ({
					x: lm.x,
					y: lm.y,
					z: lm.z,
					visibility: lm.visibility,
				})),
			});
		}

		// コールバックを呼び出す
		if (this.callbacks?.onResults) {
			this.callbacks.onResults(poses);
		}
	}

	/**
	 * デバッグ描画
	 */
	private drawDebug(results: PoseLandmarkerResult): void {
		if (!this.debugCanvas || !this.debugCtx || !this.videoElement) return;

		const ctx = this.debugCtx;
		const canvas = this.debugCanvas;

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

		// 姿勢のランドマークと骨格を描画
		for (const landmarks of results.landmarks) {
			// 骨格の接続を描画
			this.drawPoseConnections(
				ctx,
				landmarks,
				scaleX,
				scaleY,
				offsetX,
				offsetY,
			);

			// ランドマークを描画
			ctx.fillStyle = "#00FF00";
			for (const landmark of landmarks) {
				const x = landmark.x * scaleX + offsetX;
				const y = landmark.y * scaleY + offsetY;

				ctx.beginPath();
				ctx.arc(x, y, 4, 0, 2 * Math.PI);
				ctx.fill();
			}
		}
	}

	/**
	 * 姿勢の骨格接続を描画
	 */
	private drawPoseConnections(
		ctx: CanvasRenderingContext2D,
		landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
		scaleX: number,
		scaleY: number,
		offsetX: number,
		offsetY: number,
	): void {
		// MediaPipe Poseの骨格接続定義（33個のランドマーク）
		const connections = [
			// 顔
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 7],
			[0, 4],
			[4, 5],
			[5, 6],
			[6, 8],
			// 胴体
			[9, 10],
			[11, 12],
			[11, 13],
			[13, 15],
			[15, 17],
			[15, 19],
			[15, 21],
			[17, 19],
			[12, 14],
			[14, 16],
			[16, 18],
			[16, 20],
			[16, 22],
			[18, 20],
			[11, 23],
			[12, 24],
			[23, 24],
			// 左脚
			[23, 25],
			[25, 27],
			[27, 29],
			[27, 31],
			[29, 31],
			// 右脚
			[24, 26],
			[26, 28],
			[28, 30],
			[28, 32],
			[30, 32],
		];

		ctx.strokeStyle = "#00FF00";
		ctx.lineWidth = 2;

		for (const [startIdx, endIdx] of connections) {
			if (startIdx < landmarks.length && endIdx < landmarks.length) {
				const start = landmarks[startIdx];
				const end = landmarks[endIdx];

				const x1 = start.x * scaleX + offsetX;
				const y1 = start.y * scaleY + offsetY;
				const x2 = end.x * scaleX + offsetX;
				const y2 = end.y * scaleY + offsetY;

				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			}
		}
	}
}
