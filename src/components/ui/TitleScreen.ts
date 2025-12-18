/**
 * タイトル画面
 */

export class TitleScreen {
	private container: HTMLElement | null = null;
	private onStart: (() => void) | null = null;
	private onSettings: (() => void) | null = null;

	/**
	 * 初期化
	 */
	init(
		parentElement: HTMLElement,
		callbacks: {
			onStart?: () => void;
			onSettings?: () => void;
		},
	): void {
		console.log("[TitleScreen] Initializing...");
		this.onStart = callbacks.onStart || null;
		this.onSettings = callbacks.onSettings || null;

		// コンテナ要素を作成
		this.container = document.createElement("div");
		this.container.id = "title-screen";
		this.container.className = "screen";

		// タイトル
		const title = document.createElement("h1");
		title.className = "title";
		title.textContent = "新春カニカニパニック!";

		// 注意事項
		const notice = document.createElement("div");
		notice.className = "notice";
		notice.innerHTML = `
			<p>このゲームはスマートフォンのカメラを使用します。</p>
			<p>カメラへのアクセスを許可してください。</p>
		`;

		// スタートボタン
		const startButton = document.createElement("button");
		startButton.className = "btn btn-primary";
		startButton.textContent = "ゲームスタート";
		startButton.addEventListener("click", () => this.handleStart());

		// 設定ボタン
		const settingsButton = document.createElement("button");
		settingsButton.className = "btn btn-secondary";
		settingsButton.textContent = "設定";
		settingsButton.addEventListener("click", () => this.handleSettings());

		// ボタンコンテナ
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "button-container";
		buttonContainer.appendChild(startButton);
		buttonContainer.appendChild(settingsButton);

		// コンテナに追加
		this.container.appendChild(title);
		this.container.appendChild(notice);
		this.container.appendChild(buttonContainer);

		// 親要素に追加
		parentElement.appendChild(this.container);

		console.log("[TitleScreen] Initialized");
	}

	/**
	 * 画面を表示
	 */
	show(): void {
		if (this.container) {
			this.container.style.display = "flex";
			console.log("[TitleScreen] Shown");
		}
	}

	/**
	 * 画面を非表示
	 */
	hide(): void {
		if (this.container) {
			this.container.style.display = "none";
			console.log("[TitleScreen] Hidden");
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
		this.onStart = null;
		this.onSettings = null;
		console.log("[TitleScreen] Disposed");
	}

	/**
	 * スタートボタンクリック時の処理
	 */
	private handleStart(): void {
		console.log("[TitleScreen] Start button clicked");
		if (this.onStart) {
			this.onStart();
		}
	}

	/**
	 * 設定ボタンクリック時の処理
	 */
	private handleSettings(): void {
		console.log("[TitleScreen] Settings button clicked");
		if (this.onSettings) {
			this.onSettings();
		}
	}
}
