/**
 * UI関連の型定義
 */

/**
 * ゲームの状態
 */
export type GameState = "title" | "setup" | "settings" | "playing" | "result";

/**
 * ゲーム設定
 */
export interface GameSettings {
	/** カメラを使用するかどうか */
	cameraEnabled: boolean;
	/** 顔を表示するかどうか（カメラON時のみ有効） */
	faceVisible: boolean;
}

/**
 * スコアデータ（リザルト画面用）
 */
export interface ResultData {
	/** 最終スコア */
	score: number;
	/** 最大コンボ */
	maxCombo: number;
	/** 切った宝物の総数 */
	totalTreasures: number;
}

/**
 * 画面のコールバック
 */
export interface ScreenCallbacks {
	/** 画面遷移時のコールバック */
	onStateChange?: (newState: GameState) => void;
	/** 設定変更時のコールバック */
	onSettingsChange?: (settings: GameSettings) => void;
}
