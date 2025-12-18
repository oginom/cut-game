/**
 * セットアップ画面
 */

export class SetupScreen {
	private container: HTMLElement | null = null;
	private statusMessageElement: HTMLElement | null = null;
	private progressBar: HTMLElement | null = null;
	private backButton: HTMLButtonElement | null = null;
	private onBack: (() => void) | null = null;

	/**
	 * 初期化
	 */
	init(
		parentElement: HTMLElement,
		callbacks: {
			onBack?: () => void;
		},
	): void {
		console.log("[SetupScreen] Initializing...");
		this.onBack = callbacks.onBack || null;

		// コンテナ要素を作成
		this.container = document.createElement("div");
		this.container.id = "setup-screen";
		this.container.className = "screen";

		// タイトル
		const title = document.createElement("h1");
		title.className = "setup-title";
		title.textContent = "準備中...";

		// ステータスメッセージ
		this.statusMessageElement = document.createElement("div");
		this.statusMessageElement.className = "status-message";
		this.statusMessageElement.textContent = "初期化しています...";

		// プログレスバーコンテナ
		const progressContainer = document.createElement("div");
		progressContainer.className = "progress-container";

		// プログレスバー
		this.progressBar = document.createElement("div");
		this.progressBar.className = "progress-bar";
		this.progressBar.style.width = "0%";

		progressContainer.appendChild(this.progressBar);

		// 注意事項
		const notice = document.createElement("div");
		notice.className = "setup-notice";
		notice.innerHTML = `
			<p>カメラに手を映してください</p>
			<p>明るい場所で使用してください</p>
		`;

		// タイトルに戻るボタン
		this.backButton = document.createElement("button");
		this.backButton.className = "btn btn-secondary";
		this.backButton.textContent = "タイトルに戻る";
		this.backButton.addEventListener("click", () => this.handleBack());

		// コンテナに追加
		this.container.appendChild(title);
		this.container.appendChild(this.statusMessageElement);
		this.container.appendChild(progressContainer);
		this.container.appendChild(notice);
		this.container.appendChild(this.backButton);

		// 親要素に追加
		parentElement.appendChild(this.container);

		console.log("[SetupScreen] Initialized");
	}

	/**
	 * 画面を表示
	 */
	show(): void {
		if (this.container) {
			this.container.style.display = "flex";
			console.log("[SetupScreen] Shown");
		}
	}

	/**
	 * 画面を非表示
	 */
	hide(): void {
		if (this.container) {
			this.container.style.display = "none";
			console.log("[SetupScreen] Hidden");
		}
	}

	/**
	 * ステータスメッセージを設定
	 */
	setStatus(message: string): void {
		if (this.statusMessageElement) {
			this.statusMessageElement.textContent = message;
			console.log(`[SetupScreen] Status: ${message}`);
		}
	}

	/**
	 * 進捗状況を設定（0-100%）
	 */
	setProgress(progress: number): void {
		if (this.progressBar) {
			const clampedProgress = Math.max(0, Math.min(100, progress));
			this.progressBar.style.width = `${clampedProgress}%`;
			console.log(`[SetupScreen] Progress: ${clampedProgress}%`);
		}
	}

	/**
	 * エラーメッセージを表示
	 */
	showError(message: string): void {
		if (this.statusMessageElement) {
			this.statusMessageElement.textContent = `エラー: ${message}`;
			this.statusMessageElement.style.color = "#ff6b6b";
			console.error(`[SetupScreen] Error: ${message}`);
		}
	}

	/**
	 * クリーンアップ
	 */
	dispose(): void {
		if (this.container?.parentElement) {
			this.container.parentElement.removeChild(this.container);
		}
		this.container = null;
		this.statusMessageElement = null;
		this.progressBar = null;
		this.backButton = null;
		this.onBack = null;
		console.log("[SetupScreen] Disposed");
	}

	/**
	 * タイトルに戻るボタンクリック時の処理
	 */
	private handleBack(): void {
		console.log("[SetupScreen] Back button clicked");
		if (this.onBack) {
			this.onBack();
		}
	}
}
