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

export interface FaceDetection {
	boundingBox: {
		xCenter: number; // 0-1の正規化座標
		yCenter: number; // 0-1の正規化座標
		width: number;
		height: number;
	};
	keypoints: Array<{
		x: number;
		y: number;
	}>; // 6個のキーポイント（右目、左目、鼻先、口、右耳、左耳）
	score: number; // 検出の信頼度
}

export interface FaceTrackerConfig {
	minDetectionConfidence: number;
}

export interface FaceTrackerCallbacks {
	onResults: (faces: FaceDetection[]) => void;
	onError?: (error: Error) => void;
}
