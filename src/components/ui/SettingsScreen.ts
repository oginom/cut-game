/**
 * 設定画面
 */

import type { GameSettings } from "../../types/ui";

export class SettingsScreen {
	private container: HTMLElement | null = null;
	private cameraToggle: HTMLInputElement | null = null;
	private faceToggle: HTMLInputElement | null = null;
	private onSave: ((settings: GameSettings) => void) | null = null;
	private onCancel: (() => void) | null = null;

	/**
	 * 初期化
	 */
	init(
		parentElement: HTMLElement,
		callbacks: {
			onSave?: (settings: GameSettings) => void;
			onCancel?: () => void;
		},
	): void {
		console.log("[SettingsScreen] Initializing...");
		this.onSave = callbacks.onSave || null;
		this.onCancel = callbacks.onCancel || null;

		// コンテナ要素を作成
		this.container = document.createElement("div");
		this.container.id = "settings-screen";
		this.container.className = "screen";

		// タイトル
		const title = document.createElement("h1");
		title.className = "settings-title";
		title.textContent = "設定";

		// カメラON/OFF設定
		const cameraItem = this.createSettingItem(
			"カメラ使用",
			"カメラをOFFにすると、クリック操作のみでゲームをプレイできます。",
			"camera-toggle",
		);
		this.cameraToggle = cameraItem.querySelector("input") as HTMLInputElement;

		// カメラトグル変更時の処理
		this.cameraToggle.addEventListener("change", () => {
			this.updateFaceToggleState();
		});

		// 顔表示ON/OFF設定
		const faceItem = this.createSettingItem(
			"顔を表示",
			"カメラON時のみ有効。OFFにすると、カメラ映像の代わりにキャラクターの顔が表示されます。",
			"face-toggle",
		);
		this.faceToggle = faceItem.querySelector("input") as HTMLInputElement;

		// ボタンコンテナ
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "button-container";

		// 保存して戻るボタン
		const saveButton = document.createElement("button");
		saveButton.className = "btn btn-primary";
		saveButton.textContent = "保存して戻る";
		saveButton.addEventListener("click", () => this.handleSave());

		// キャンセルボタン
		const cancelButton = document.createElement("button");
		cancelButton.className = "btn btn-secondary";
		cancelButton.textContent = "キャンセル";
		cancelButton.addEventListener("click", () => this.handleCancel());

		buttonContainer.appendChild(saveButton);
		buttonContainer.appendChild(cancelButton);

		// コンテナに追加
		this.container.appendChild(title);
		this.container.appendChild(cameraItem);
		this.container.appendChild(faceItem);
		this.container.appendChild(buttonContainer);

		// 親要素に追加
		parentElement.appendChild(this.container);

		console.log("[SettingsScreen] Initialized");
	}

	/**
	 * 画面を表示
	 */
	show(): void {
		if (this.container) {
			this.container.style.display = "flex";
			console.log("[SettingsScreen] Shown");
		}
	}

	/**
	 * 画面を非表示
	 */
	hide(): void {
		if (this.container) {
			this.container.style.display = "none";
			console.log("[SettingsScreen] Hidden");
		}
	}

	/**
	 * 現在の設定を画面に反映
	 */
	loadSettings(settings: GameSettings): void {
		if (this.cameraToggle) {
			this.cameraToggle.checked = settings.cameraEnabled;
		}
		if (this.faceToggle) {
			this.faceToggle.checked = settings.faceVisible;
		}
		this.updateFaceToggleState();
		console.log("[SettingsScreen] Settings loaded:", settings);
	}

	/**
	 * クリーンアップ
	 */
	dispose(): void {
		if (this.container?.parentElement) {
			this.container.parentElement.removeChild(this.container);
		}
		this.container = null;
		this.cameraToggle = null;
		this.faceToggle = null;
		this.onSave = null;
		this.onCancel = null;
		console.log("[SettingsScreen] Disposed");
	}

	/**
	 * 設定項目を作成
	 */
	private createSettingItem(
		label: string,
		description: string,
		toggleId: string,
	): HTMLElement {
		const item = document.createElement("div");
		item.className = "setting-item";

		// ラベル
		const labelElement = document.createElement("div");
		labelElement.className = "setting-label";
		labelElement.textContent = label;

		// 説明
		const descriptionElement = document.createElement("div");
		descriptionElement.className = "setting-description";
		descriptionElement.textContent = description;

		// トグルスイッチ
		const toggleSwitch = document.createElement("label");
		toggleSwitch.className = "toggle-switch";

		const input = document.createElement("input");
		input.type = "checkbox";
		input.id = toggleId;

		const slider = document.createElement("span");
		slider.className = "toggle-slider";

		toggleSwitch.appendChild(input);
		toggleSwitch.appendChild(slider);

		// 項目に追加
		item.appendChild(labelElement);
		item.appendChild(descriptionElement);
		item.appendChild(toggleSwitch);

		return item;
	}

	/**
	 * 顔表示トグルの有効/無効を更新
	 */
	private updateFaceToggleState(): void {
		if (this.cameraToggle && this.faceToggle) {
			const cameraEnabled = this.cameraToggle.checked;
			this.faceToggle.disabled = !cameraEnabled;

			// カメラOFF時は顔表示もOFFにする
			if (!cameraEnabled) {
				this.faceToggle.checked = false;
			}
		}
	}

	/**
	 * 保存ボタンクリック時の処理
	 */
	private handleSave(): void {
		console.log("[SettingsScreen] Save button clicked");
		if (this.onSave && this.cameraToggle && this.faceToggle) {
			const settings: GameSettings = {
				cameraEnabled: this.cameraToggle.checked,
				faceVisible: this.faceToggle.checked,
			};
			this.onSave(settings);
		}
	}

	/**
	 * キャンセルボタンクリック時の処理
	 */
	private handleCancel(): void {
		console.log("[SettingsScreen] Cancel button clicked");
		if (this.onCancel) {
			this.onCancel();
		}
	}
}
