import './style.css';
import { CameraView } from './components/camera/CameraView';
import { TrackingManager } from './components/camera/TrackingManager';

async function main() {
  // カメラセットアップ
  const cameraView = new CameraView();

  try {
    await cameraView.init({
      width: 1280,
      height: 720,
      facingMode: 'user',
    });

    await cameraView.start();

    // video要素をDOMに追加
    const videoElement = cameraView.getVideoElement();
    videoElement.style.width = '100vw';
    videoElement.style.height = '100vh';
    videoElement.style.objectFit = 'cover';
    videoElement.style.position = 'absolute';
    videoElement.style.top = '0';
    videoElement.style.left = '0';
    document.body.appendChild(videoElement);

    console.log('Camera started successfully');

    // デバッグ用canvas作成
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    // TrackingManager初期化
    const trackingManager = new TrackingManager();
    await trackingManager.init(
      {
        hand: {
          maxNumHands: 2,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        },
        face: {
          minDetectionConfidence: 0.7,
        },
      },
      {
        onHandResults: (hands) => {
          console.log(`Detected ${hands.length} hand(s)`);
          hands.forEach((hand) => {
            console.log(`${hand.handedness}: ${hand.score.toFixed(2)}`);
          });
        },
        onFaceResults: (faces) => {
          console.log(`Detected ${faces.length} face(s)`);
          faces.forEach((face) => {
            console.log(`Face score: ${face.score.toFixed(2)}`);
          });
        },
      }
    );

    // デバッグ描画を有効化
    trackingManager.enableDebug(canvas);

    // トラッキング開始
    await trackingManager.start(videoElement);

    console.log('Tracking started successfully');

    // パフォーマンス統計を定期的に表示
    setInterval(() => {
      const stats = trackingManager.getPerformanceStats();
      console.log(
        `FPS: ${stats.fps}, Latency: ${stats.averageLatency.toFixed(2)}ms, Hand: ${(stats.handDetectionRate * 100).toFixed(1)}%, Face: ${(stats.faceDetectionRate * 100).toFixed(1)}%`
      );
    }, 5000);
  } catch (error) {
    console.error('Error:', error);
    // エラーメッセージを画面に表示
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `エラー: ${error}`;
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    errorDiv.style.fontSize = '16px';
    document.body.appendChild(errorDiv);
  }
}

main();
