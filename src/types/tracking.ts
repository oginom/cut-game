export interface HandLandmark {
  x: number; // 0-1の正規化座標
  y: number; // 0-1の正規化座標
  z: number; // 深度情報
}

export interface HandData {
  handedness: 'Left' | 'Right';
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
