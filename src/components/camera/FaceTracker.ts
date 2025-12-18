import {
	type Detection,
	FaceDetector,
	FilesetResolver,
} from "@mediapipe/tasks-vision";
import type {
	FaceDetection,
	FaceTrackerCallbacks,
	FaceTrackerConfig,
} from "../../types/tracking";

export class FaceTracker {
	private faceDetector: FaceDetector | null = null;
	private callbacks: FaceTrackerCallbacks | null = null;
	private tracking = false;
	private debugCanvas: HTMLCanvasElement | null = null;
	private debugCtx: CanvasRenderingContext2D | null = null;
	private animationFrameId: number | null = null;
	private videoElement: HTMLVideoElement | null = null;

	/**
	 * FaceTrackerを初期化する
	 */
	async init(
		config: FaceTrackerConfig,
		callbacks: FaceTrackerCallbacks,
	): Promise<void> {
		this.callbacks = callbacks;

		// MediaPipe Vision tasksのファイルセットを読み込み
		const vision = await FilesetResolver.forVisionTasks(
			"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
		);

		// FaceDetectorを作成
		this.faceDetector = await FaceDetector.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath:
					"https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
				delegate: "GPU",
			},
			runningMode: "VIDEO",
			minDetectionConfidence: config.minDetectionConfidence,
		});
	}

	/**
	 * トラッキングを開始する
	 */
	async start(videoElement: HTMLVideoElement): Promise<void> {
		if (!this.faceDetector) {
			throw new Error("FaceTracker not initialized. Call init() first.");
		}

		this.videoElement = videoElement;
		this.tracking = true;

		// トラッキングループを開始
		const detectFaces = () => {
			if (!this.tracking || !this.faceDetector || !this.videoElement) {
				return;
			}

			// ビデオが準備できているか確認
			if (this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
				const startTimeMs = performance.now();
				const results = this.faceDetector.detectForVideo(
					this.videoElement,
					startTimeMs,
				);
				this.onResults(results);
			}

			// 次のフレームをリクエスト
			this.animationFrameId = requestAnimationFrame(detectFaces);
		};

		detectFaces();
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
	private onResults(results: { detections: Detection[] }): void {
		// デバッグ描画
		if (this.debugCanvas && this.debugCtx) {
			this.drawDebug(results.detections);
		}

		// 顔のデータを変換
		const faces: FaceDetection[] = [];

		for (const detection of results.detections) {
			if (detection.boundingBox && detection.keypoints) {
				faces.push({
					boundingBox: {
						xCenter:
							detection.boundingBox.originX + detection.boundingBox.width / 2,
						yCenter:
							detection.boundingBox.originY + detection.boundingBox.height / 2,
						width: detection.boundingBox.width,
						height: detection.boundingBox.height,
					},
					keypoints: detection.keypoints.map((kp) => ({
						x: kp.x,
						y: kp.y,
					})),
					score: detection.categories[0]?.score || 0,
				});
			}
		}

		// コールバックを呼び出す
		if (this.callbacks?.onResults) {
			this.callbacks.onResults(faces);
		}
	}

	/**
	 * デバッグ描画
	 */
	private drawDebug(detections: Detection[]): void {
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

		// 顔のバウンディングボックスとキーポイントを描画
		for (const detection of detections) {
			if (detection.boundingBox) {
				const box = detection.boundingBox;
				const x = box.originX * scaleX + offsetX;
				const y = box.originY * scaleY + offsetY;
				const w = box.width * scaleX;
				const h = box.height * scaleY;

				// バウンディングボックスを描画
				ctx.strokeStyle = "#00FFFF";
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, w, h);
			}

			// キーポイントを描画
			if (detection.keypoints) {
				ctx.fillStyle = "#00FFFF";
				for (const kp of detection.keypoints) {
					const x = kp.x * scaleX + offsetX;
					const y = kp.y * scaleY + offsetY;

					ctx.beginPath();
					ctx.arc(x, y, 4, 0, 2 * Math.PI);
					ctx.fill();
				}
			}
		}
	}
}
