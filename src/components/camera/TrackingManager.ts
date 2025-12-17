import { HandTracker } from './HandTracker';
import { FaceTracker } from './FaceTracker';
import type {
  HandData,
  HandTrackerConfig,
  FaceDetection,
  FaceTrackerConfig,
} from '../../types/tracking';

export interface TrackingManagerConfig {
  hand: HandTrackerConfig;
  face: FaceTrackerConfig;
}

export interface TrackingManagerCallbacks {
  onHandResults?: (hands: HandData[]) => void;
  onFaceResults?: (faces: FaceDetection[]) => void;
  onError?: (error: Error) => void;
}

export interface PerformanceStats {
  fps: number;
  averageLatency: number; // ms
  handDetectionRate: number; // 0-1
  faceDetectionRate: number; // 0-1
}

export class TrackingManager {
  private handTracker: HandTracker;
  private faceTracker: FaceTracker;
  private callbacks: TrackingManagerCallbacks | null = null;
  private tracking = false;

  // パフォーマンス測定用
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private currentFps = 0;
  private latencySum = 0;
  private latencyCount = 0;
  private handDetectionCount = 0;
  private faceDetectionCount = 0;
  private totalFrames = 0;

  // トラッキング結果の保持
  private lastHandData: HandData[] = [];
  private lastFaceData: FaceDetection[] = [];

  constructor() {
    this.handTracker = new HandTracker();
    this.faceTracker = new FaceTracker();
  }

  /**
   * TrackingManagerを初期化する
   */
  async init(
    config: TrackingManagerConfig,
    callbacks: TrackingManagerCallbacks
  ): Promise<void> {
    this.callbacks = callbacks;

    try {
      // HandTrackerを初期化
      await this.handTracker.init(config.hand, {
        onResults: (hands) => {
          this.lastHandData = hands;
          if (hands.length > 0) {
            this.handDetectionCount++;
          }
          this.callbacks?.onHandResults?.(hands);
        },
        onError: this.callbacks.onError,
      });

      // FaceTrackerを初期化
      await this.faceTracker.init(config.face, {
        onResults: (faces) => {
          this.lastFaceData = faces;
          if (faces.length > 0) {
            this.faceDetectionCount++;
          }
          this.callbacks?.onFaceResults?.(faces);
        },
        onError: this.callbacks.onError,
      });
    } catch (error) {
      this.callbacks?.onError?.(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * トラッキングを開始する
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    if (this.tracking) {
      console.warn('Tracking is already running');
      return;
    }

    this.tracking = true;
    this.resetPerformanceStats();

    // パフォーマンス測定ループを開始
    this.startPerformanceMonitoring();

    try {
      // 両方のトラッカーを開始
      await Promise.all([
        this.handTracker.start(videoElement),
        this.faceTracker.start(videoElement),
      ]);
    } catch (error) {
      this.tracking = false;
      this.callbacks?.onError?.(
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * トラッキングを停止する
   */
  stop(): void {
    this.tracking = false;
    this.handTracker.stop();
    this.faceTracker.stop();
  }

  /**
   * トラッキング中かどうか
   */
  isTracking(): boolean {
    return this.tracking;
  }

  /**
   * デバッグ描画を有効化する
   */
  enableDebug(canvas: HTMLCanvasElement): void {
    this.handTracker.enableDebugDraw(canvas);
    this.faceTracker.enableDebugDraw(canvas);
  }

  /**
   * デバッグ描画を無効化する
   */
  disableDebug(): void {
    this.handTracker.disableDebugDraw();
    this.faceTracker.disableDebugDraw();
  }

  /**
   * 最新の手のデータを取得
   */
  getHandData(): HandData[] {
    return this.lastHandData;
  }

  /**
   * 最新の顔のデータを取得
   */
  getFaceData(): FaceDetection[] {
    return this.lastFaceData;
  }

  /**
   * パフォーマンス統計を取得
   */
  getPerformanceStats(): PerformanceStats {
    const avgLatency =
      this.latencyCount > 0 ? this.latencySum / this.latencyCount : 0;
    const handRate =
      this.totalFrames > 0 ? this.handDetectionCount / this.totalFrames : 0;
    const faceRate =
      this.totalFrames > 0 ? this.faceDetectionCount / this.totalFrames : 0;

    return {
      fps: this.currentFps,
      averageLatency: avgLatency,
      handDetectionRate: handRate,
      faceDetectionRate: faceRate,
    };
  }

  /**
   * パフォーマンス統計をリセット
   */
  private resetPerformanceStats(): void {
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.currentFps = 0;
    this.latencySum = 0;
    this.latencyCount = 0;
    this.handDetectionCount = 0;
    this.faceDetectionCount = 0;
    this.totalFrames = 0;
  }

  /**
   * パフォーマンスモニタリングを開始
   */
  private startPerformanceMonitoring(): void {
    const measurePerformance = () => {
      if (!this.tracking) return;

      const now = performance.now();
      this.frameCount++;
      this.totalFrames++;

      // 1秒ごとにFPSを更新
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      requestAnimationFrame(measurePerformance);
    };

    measurePerformance();
  }

  /**
   * レイテンシを記録
   */
  recordLatency(latency: number): void {
    this.latencySum += latency;
    this.latencyCount++;
  }
}
