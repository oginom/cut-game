import type * as THREE from "three";
import type { ScoreData } from "../../types/score";

export class ScoreDisplay {
	private container: HTMLElement | null = null;
	private scoreElement: HTMLElement | null = null;
	private comboElement: HTMLElement | null = null;
	private animationContainer: HTMLElement | null = null;

	/**
	 * 初期化
	 */
	public init(container: HTMLElement): void {
		this.container = container;

		// スコア表示コンテナを作成
		const displayContainer = document.createElement("div");
		displayContainer.id = "score-display";
		displayContainer.style.position = "absolute";
		displayContainer.style.top = "20px";
		displayContainer.style.left = "20px";
		displayContainer.style.color = "white";
		displayContainer.style.fontFamily = "Arial, sans-serif";
		displayContainer.style.fontSize = "24px";
		displayContainer.style.fontWeight = "bold";
		displayContainer.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
		displayContainer.style.zIndex = "100";
		displayContainer.style.pointerEvents = "none";

		// スコア表示
		this.scoreElement = document.createElement("div");
		this.scoreElement.id = "score";
		this.scoreElement.textContent = "Score: 0";
		displayContainer.appendChild(this.scoreElement);

		// コンボ表示
		this.comboElement = document.createElement("div");
		this.comboElement.id = "combo";
		this.comboElement.style.fontSize = "20px";
		this.comboElement.style.marginTop = "10px";
		this.comboElement.style.color = "#ffcc00";
		this.comboElement.textContent = "";
		displayContainer.appendChild(this.comboElement);

		container.appendChild(displayContainer);

		// アニメーション用のコンテナ
		this.animationContainer = document.createElement("div");
		this.animationContainer.id = "score-animations";
		this.animationContainer.style.position = "absolute";
		this.animationContainer.style.top = "0";
		this.animationContainer.style.left = "0";
		this.animationContainer.style.width = "100%";
		this.animationContainer.style.height = "100%";
		this.animationContainer.style.pointerEvents = "none";
		this.animationContainer.style.zIndex = "99";
		container.appendChild(this.animationContainer);

		console.log("[ScoreDisplay] Initialized");
	}

	/**
	 * スコア表示を更新
	 */
	public update(scoreData: ScoreData): void {
		if (!this.scoreElement || !this.comboElement) return;

		// スコアを更新
		this.scoreElement.textContent = `Score: ${scoreData.current}`;

		// コンボを更新
		if (scoreData.combo > 1) {
			this.comboElement.textContent = `Combo: x${scoreData.combo}`;
			this.comboElement.style.display = "block";
		} else {
			this.comboElement.textContent = "";
			this.comboElement.style.display = "none";
		}
	}

	/**
	 * スコア加算アニメーションを表示
	 */
	public showScoreAnimation(points: number, position?: THREE.Vector2): void {
		if (!this.animationContainer) return;

		// アニメーション要素を作成
		const animElement = document.createElement("div");
		animElement.textContent = `+${points}`;
		animElement.style.position = "absolute";
		animElement.style.color = "#ffcc00";
		animElement.style.fontFamily = "Arial, sans-serif";
		animElement.style.fontSize = "32px";
		animElement.style.fontWeight = "bold";
		animElement.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.8)";
		animElement.style.transition = "all 1s ease-out";
		animElement.style.pointerEvents = "none";

		// 位置を設定
		if (position) {
			animElement.style.left = `${position.x}px`;
			animElement.style.top = `${position.y}px`;
		} else {
			// デフォルトの位置（画面中央）
			animElement.style.left = "50%";
			animElement.style.top = "50%";
			animElement.style.transform = "translate(-50%, -50%)";
		}

		this.animationContainer.appendChild(animElement);

		// アニメーション開始
		requestAnimationFrame(() => {
			animElement.style.opacity = "0";
			animElement.style.transform = position
				? "translateY(-50px)"
				: "translate(-50%, calc(-50% - 50px))";
		});

		// アニメーション終了後に要素を削除
		setTimeout(() => {
			if (
				this.animationContainer &&
				animElement.parentNode === this.animationContainer
			) {
				this.animationContainer.removeChild(animElement);
			}
		}, 1000);
	}

	/**
	 * クリーンアップ
	 */
	public dispose(): void {
		if (
			this.container &&
			this.scoreElement &&
			this.scoreElement.parentElement
		) {
			this.container.removeChild(this.scoreElement.parentElement);
		}
		if (this.animationContainer?.parentNode) {
			this.animationContainer.parentNode.removeChild(this.animationContainer);
		}
		console.log("[ScoreDisplay] Disposed");
	}
}
