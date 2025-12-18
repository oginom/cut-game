/**
 * ゲーム全体の状態を管理するクラス
 */

import type {
	GameSettings,
	GameState,
	ResultData,
	ScreenCallbacks,
} from "../../types/ui";

const SETTINGS_KEY = "crab-game-settings";
const DEFAULT_SETTINGS: GameSettings = {
	cameraEnabled: true,
	faceVisible: true,
};

export class GameStateManager {
	private currentState: GameState = "title";
	private settings: GameSettings = { ...DEFAULT_SETTINGS };
	private resultData: ResultData | null = null;
	private callbacks: ScreenCallbacks = {};

	/**
	 * 初期化
	 */
	init(callbacks?: ScreenCallbacks): void {
		console.log("[GameStateManager] Initializing...");
		this.callbacks = callbacks || {};
		this.loadSettings();
		console.log("[GameStateManager] Initialized with settings:", this.settings);
	}

	/**
	 * 状態を変更
	 */
	setState(newState: GameState): void {
		console.log(
			`[GameStateManager] State transition: ${this.currentState} -> ${newState}`,
		);
		this.currentState = newState;

		if (this.callbacks.onStateChange) {
			this.callbacks.onStateChange(newState);
		}
	}

	/**
	 * 現在の状態を取得
	 */
	getState(): GameState {
		return this.currentState;
	}

	/**
	 * 設定を取得
	 */
	getSettings(): GameSettings {
		return { ...this.settings };
	}

	/**
	 * 設定を更新
	 */
	updateSettings(newSettings: Partial<GameSettings>): void {
		this.settings = { ...this.settings, ...newSettings };
		this.saveSettings();
		console.log("[GameStateManager] Settings updated:", this.settings);

		if (this.callbacks.onSettingsChange) {
			this.callbacks.onSettingsChange(this.settings);
		}
	}

	/**
	 * リザルトデータを設定
	 */
	setResultData(data: ResultData): void {
		this.resultData = data;
		console.log("[GameStateManager] Result data set:", data);
	}

	/**
	 * リザルトデータを取得
	 */
	getResultData(): ResultData | null {
		return this.resultData;
	}

	/**
	 * リザルトデータをクリア
	 */
	clearResultData(): void {
		this.resultData = null;
	}

	/**
	 * 設定をlocalStorageから読み込み
	 */
	private loadSettings(): void {
		try {
			const saved = localStorage.getItem(SETTINGS_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				this.settings = { ...DEFAULT_SETTINGS, ...parsed };
				console.log("[GameStateManager] Settings loaded from localStorage");
			}
		} catch (error) {
			console.warn(
				"[GameStateManager] Failed to load settings from localStorage:",
				error,
			);
			this.settings = { ...DEFAULT_SETTINGS };
		}
	}

	/**
	 * 設定をlocalStorageに保存
	 */
	private saveSettings(): void {
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
			console.log("[GameStateManager] Settings saved to localStorage");
		} catch (error) {
			console.warn(
				"[GameStateManager] Failed to save settings to localStorage:",
				error,
			);
		}
	}
}
