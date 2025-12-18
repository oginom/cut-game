import type { CameraConfig, CameraError } from "../../types/camera";

export class CameraView {
	private videoElement: HTMLVideoElement | null = null;
	private stream: MediaStream | null = null;
	private config: CameraConfig | null = null;
	private ready = false;

	/**
	 * カメラを初期化する
	 */
	async init(config: CameraConfig): Promise<void> {
		this.config = config;

		// video要素を作成
		this.videoElement = document.createElement("video");
		this.videoElement.setAttribute("playsinline", ""); // iOS対応
		this.videoElement.setAttribute("autoplay", "");
		this.videoElement.setAttribute("muted", "");
	}

	/**
	 * カメラを開始する
	 */
	async start(): Promise<void> {
		if (!this.config || !this.videoElement) {
			throw new Error("Camera not initialized. Call init() first.");
		}

		try {
			// カメラストリームを取得
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: this.config.width },
					height: { ideal: this.config.height },
					facingMode: this.config.facingMode,
				},
				audio: false,
			});

			// video要素にストリームを接続
			this.videoElement.srcObject = this.stream;

			// ビデオのメタデータが読み込まれるまで待つ
			await new Promise<void>((resolve, reject) => {
				if (!this.videoElement) {
					reject(new Error("Video element not found"));
					return;
				}

				this.videoElement.onloadedmetadata = () => {
					resolve();
				};

				this.videoElement.onerror = () => {
					reject(new Error("Failed to load video metadata"));
				};
			});

			// 再生開始
			await this.videoElement.play();
			this.ready = true;
		} catch (error) {
			// エラーを分類して投げる
			const cameraError = this.classifyError(error);
			throw cameraError;
		}
	}

	/**
	 * カメラを停止する
	 */
	stop(): void {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}

		if (this.videoElement) {
			this.videoElement.srcObject = null;
		}

		this.ready = false;
	}

	/**
	 * video要素を取得する
	 */
	getVideoElement(): HTMLVideoElement {
		if (!this.videoElement) {
			throw new Error("Camera not initialized. Call init() first.");
		}
		return this.videoElement;
	}

	/**
	 * カメラが準備完了しているか確認する
	 */
	isReady(): boolean {
		return this.ready;
	}

	/**
	 * エラーを分類する
	 */
	private classifyError(error: unknown): CameraError {
		if (error instanceof DOMException) {
			switch (error.name) {
				case "NotAllowedError":
					return {
						type: "permission_denied",
						message:
							"カメラへのアクセスが拒否されました。ブラウザの設定でカメラの使用を許可してください。",
					};
				case "NotFoundError":
					return {
						type: "not_found",
						message:
							"カメラが見つかりませんでした。デバイスにカメラが接続されているか確認してください。",
					};
				case "NotReadableError":
					return {
						type: "not_readable",
						message:
							"カメラにアクセスできませんでした。他のアプリケーションがカメラを使用している可能性があります。",
					};
				default:
					return {
						type: "unknown",
						message: `カメラエラー: ${error.message}`,
					};
			}
		}

		return {
			type: "unknown",
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
