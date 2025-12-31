export interface HandLandmark {
	x: number; // 0-1の正規化座標
	y: number; // 0-1の正規化座標
	z: number; // 深度情報
}

export interface HandData {
	handedness: "Left" | "Right";
	landmarks: HandLandmark[]; // 21個のランドマーク
	worldLandmarks?: HandLandmark[]; // 3D世界座標
	score: number; // 検出の信頼度
}

export interface HandTrackerConfig {
	maxNumHands: number;
	minDetectionConfidence: number;
	minTrackingConfidence: number;
}

export interface HandTrackerCallbacks {
	onResults: (hands: HandData[]) => void;
	onError?: (error: Error) => void;
}

export interface PoseLandmark {
	x: number; // 0-1の正規化座標
	y: number; // 0-1の正規化座標
	z: number; // 深度情報
	visibility?: number; // ランドマークの可視性（0-1）
}

export interface PoseData {
	landmarks: PoseLandmark[]; // 33個のランドマーク
	worldLandmarks?: PoseLandmark[]; // 3D世界座標
}

export interface PoseTrackerConfig {
	minDetectionConfidence: number;
	minTrackingConfidence: number;
}

export interface PoseTrackerCallbacks {
	onResults: (poses: PoseData[]) => void;
	onError?: (error: Error) => void;
}
