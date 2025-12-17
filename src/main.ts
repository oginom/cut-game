import './style.css';
import { CameraView } from './components/camera/CameraView';
import { HandTracker } from './components/camera/HandTracker';

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

    // ハンドトラッカー初期化
    const handTracker = new HandTracker();
    await handTracker.init(
      {
        maxNumHands: 2,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      },
      {
        onResults: (hands) => {
          console.log(`Detected ${hands.length} hand(s)`);
          hands.forEach((hand) => {
            console.log(`${hand.handedness}: ${hand.score.toFixed(2)}`);
          });
        },
      }
    );

    // デバッグ描画を有効化
    handTracker.enableDebugDraw(canvas);

    // トラッキング開始
    await handTracker.start(videoElement);

    console.log('Hand tracking started successfully');
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
