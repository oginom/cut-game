/**
 * ジェスチャーの種類
 */
export type GestureType =
	| "None"
	| "Victory"
	| "Closed_Fist"
	| "Open_Palm"
	| "Pointing_Up"
	| "Thumb_Up"
	| "Thumb_Down"
	| "ILoveYou";

/**
 * 手の種類（左右）
 */
export type Handedness = "Left" | "Right";

/**
 * ジェスチャーデータ
 */
export interface GestureData {
	gesture: GestureType;
	handedness: Handedness;
	score: number; // 信頼度スコア (0-1)
}

/**
 * ジェスチャーイベントの種類
 */
export type GestureEventType =
	| "gesture_change"
	| "victory_detected"
	| "v_close_action";

/**
 * ジェスチャーイベント
 */
export interface GestureEvent {
	type: GestureEventType;
	handedness: Handedness;
	gesture: GestureType;
	previousGesture?: GestureType;
	timestamp: number;
}

/**
 * GestureTrackerの設定
 */
export interface GestureTrackerConfig {
	minDetectionConfidence?: number; // 検出信頼度の閾値 (0-1)
	minTrackingConfidence?: number; // トラッキング信頼度の閾値 (0-1)
	numHands?: number; // 検出する手の数（最大2）
}

/**
 * GestureTrackerのコールバック
 */
export interface GestureTrackerCallbacks {
	onGestureChange?: (event: GestureEvent) => void;
	onVictoryDetected?: (handedness: Handedness) => void;
	onVCloseAction?: (handedness: Handedness) => void;
}
