/**
 * ゲーム全体の設定パラメータ
 * すべての調整可能なパラメータを一箇所にまとめる
 */

// タイマー設定
export const TIMER_CONFIG = {
	timeLimit: 30, // 制限時間（秒）
	warningThreshold: 10, // 警告表示開始時間（秒）
	criticalThreshold: 5, // 危機表示開始時間（秒）
};

// 出現設定
export const SPAWN_CONFIG = {
	initialInterval: 3.0, // 初期出現間隔（秒）
	minInterval: 1.5, // 最小出現間隔（秒）
	minSpeed: 1.0, // 初期移動速度
	maxSpeed: 2.0, // 最大移動速度
};

// 難易度設定
export const DIFFICULTY_CONFIG = {
	totalDuration: 30, // 難易度が最大になるまでの時間（秒）
};

// ロープ設定
export const ROPE_CONFIG = {
	segmentCount: 5, // セグメント数
	segmentLength: 0.3, // セグメント長さ
	segmentRadius: 0.05, // セグメント半径
	segmentMass: 0.5, // セグメント質量
	hitRadius: 0.5, // 当たり判定半径
};

// 宝物設定
export const TREASURE_CONFIG = {
	gold: {
		score: 100,
		mass: 2.0,
		size: 0.4,
		color: 0xffd700, // 金色
	},
	silver: {
		score: 50,
		mass: 1.5,
		size: 0.35,
		color: 0xc0c0c0, // 銀色
	},
	bronze: {
		score: 30,
		mass: 1.0,
		size: 0.3,
		color: 0xcd7f32, // 銅色
	},
};

// コンボ設定
export const COMBO_CONFIG = {
	timeout: 3.0, // コンボタイムアウト（秒）
	bonusMultiplier: 0.1, // コンボボーナス倍率（1コンボごとに10%）
};

// 物理エンジン設定
export const PHYSICS_CONFIG = {
	gravity: { x: 0, y: -9.81, z: 0 }, // 重力
	timeStep: 1 / 60, // タイムステップ（60 FPS）
};

// カメラ設定
export const CAMERA_CONFIG = {
	fov: 75, // 視野角
	near: 0.1, // ニアクリップ
	far: 1000, // ファークリップ
	position: { x: 0, y: 0, z: 5 }, // カメラ位置
};

// シーン設定
export const SCENE_CONFIG = {
	backgroundColor: 0x000000, // 背景色（透明の場合はnull）
	ambientLightIntensity: 0.6, // 環境光の強度
	directionalLightIntensity: 0.8, // 平行光源の強度
};

// ゲーム画面設定
export const GAME_BOUNDS = {
	screenEdgeX: 10, // 画面端のX座標（絶対値）
};
