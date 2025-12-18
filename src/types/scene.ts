export interface SceneConfig {
	backgroundColor: number;
	cameraFov: number;
	cameraNear: number;
	cameraFar: number;
}

export interface RenderStats {
	fps: number;
	drawCalls: number;
	triangles: number;
}

/**
 * 手の状態
 */
export type HandState = "open" | "closed";

/**
 * 手モデルの設定
 */
export interface HandModelConfig {
	palmRadius?: number; // 手のひらの半径
	clawLength?: number; // ハサミの長さ
	clawWidth?: number; // ハサミの幅
	openAngle?: number; // 開いた状態の角度
	closedAngle?: number; // 閉じた状態の角度
	color?: number; // カラー
}
