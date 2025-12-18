/**
 * リザルト画面
 */

import type { ResultData } from "../../types/ui";

export class ResultScreen {
	private container: HTMLElement | null = null;
	private scoreElement: HTMLElement | null = null;
	private maxComboElement: HTMLElement | null = null;
	private totalTreasuresElement: HTMLElement | null = null;
	private onReplay: (() => void) | null = null;
	private onTitle: (() => void) | null = null;

	/**
	 * 初期化
	 */
	init(
		parentElement: HTMLElement,
		callbacks: {
			onReplay?: () => void;
			onTitle?: () => void;
		},
	): void {
		console.log("[ResultScreen] Initializing...");
		this.onReplay = callbacks.onReplay || null;
		this.onTitle = callbacks.onTitle || null;

		// コンテナ要素を作成
		this.container = document.createElement("div");
		this.container.id = "result-screen";
		this.container.className = "screen";

		// タイトル
		const title = document.createElement("h1");
		title.className = "result-title";
		title.textContent = "結果";

		// スコアコンテナ
		const scoreContainer = document.createElement("div");
		scoreContainer.className = "score-container";

		// 最終スコア
		this.scoreElement = document.createElement("div");
		this.scoreElement.className = "final-score";
		this.scoreElement.textContent = "0";

		const scoreLabel = document.createElement("div");
		scoreLabel.className = "score-label";
		scoreLabel.textContent = "スコア";

		// 統計情報
		const statsContainer = document.createElement("div");
		statsContainer.className = "stats-container";

		// 最大コンボ
		const maxComboStat = this.createStatItem("最大コンボ");
		this.maxComboElement = maxComboStat.querySelector(
			".stat-value",
		) as HTMLElement;

		// 宝物総数
		const totalTreasuresStat = this.createStatItem("切った宝物");
		this.totalTreasuresElement = totalTreasuresStat.querySelector(
			".stat-value",
		) as HTMLElement;

		statsContainer.appendChild(maxComboStat);
		statsContainer.appendChild(totalTreasuresStat);

		scoreContainer.appendChild(this.scoreElement);
		scoreContainer.appendChild(scoreLabel);
		scoreContainer.appendChild(statsContainer);

		// ボタンコンテナ
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "button-container";

		// リプレイボタン
		const replayButton = document.createElement("button");
		replayButton.className = "btn btn-primary";
		replayButton.textContent = "もう一度";
		replayButton.addEventListener("click", () => this.handleReplay());

		// タイトルに戻るボタン
		const titleButton = document.createElement("button");
		titleButton.className = "btn btn-secondary";
		titleButton.textContent = "タイトルに戻る";
		titleButton.addEventListener("click", () => this.handleTitle());

		buttonContainer.appendChild(replayButton);
		buttonContainer.appendChild(titleButton);

		// コンテナに追加
		this.container.appendChild(title);
		this.container.appendChild(scoreContainer);
		this.container.appendChild(buttonContainer);

		// 親要素に追加
		parentElement.appendChild(this.container);

		console.log("[ResultScreen] Initialized");
	}

	/**
	 * 画面を表示
	 */
	show(): void {
		if (this.container) {
			this.container.style.display = "flex";
			console.log("[ResultScreen] Shown");
		}
	}

	/**
	 * 画面を非表示
	 */
	hide(): void {
		if (this.container) {
			this.container.style.display = "none";
			console.log("[ResultScreen] Hidden");
		}
	}

	/**
	 * スコア情報を設定
	 */
	setScore(data: ResultData): void {
		if (this.scoreElement) {
			this.scoreElement.textContent = data.score.toString();
		}
		if (this.maxComboElement) {
			this.maxComboElement.textContent = `${data.maxCombo}回`;
		}
		if (this.totalTreasuresElement) {
			this.totalTreasuresElement.textContent = `${data.totalTreasures}個`;
		}
		console.log("[ResultScreen] Score set:", data);
	}

	/**
	 * クリーンアップ
	 */
	dispose(): void {
		if (this.container?.parentElement) {
			this.container.parentElement.removeChild(this.container);
		}
		this.container = null;
		this.scoreElement = null;
		this.maxComboElement = null;
		this.totalTreasuresElement = null;
		this.onReplay = null;
		this.onTitle = null;
		console.log("[ResultScreen] Disposed");
	}

	/**
	 * 統計項目を作成
	 */
	private createStatItem(label: string): HTMLElement {
		const item = document.createElement("div");
		item.className = "stat-item";

		const labelElement = document.createElement("span");
		labelElement.className = "stat-label";
		labelElement.textContent = label;

		const valueElement = document.createElement("span");
		valueElement.className = "stat-value";
		valueElement.textContent = "0";

		item.appendChild(labelElement);
		item.appendChild(valueElement);

		return item;
	}

	/**
	 * リプレイボタンクリック時の処理
	 */
	private handleReplay(): void {
		console.log("[ResultScreen] Replay button clicked");
		if (this.onReplay) {
			this.onReplay();
		}
	}

	/**
	 * タイトルに戻るボタンクリック時の処理
	 */
	private handleTitle(): void {
		console.log("[ResultScreen] Title button clicked");
		if (this.onTitle) {
			this.onTitle();
		}
	}
}
