import './style.css';
import { CameraView } from './components/camera/CameraView';

async function main() {
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
    videoElement.style.width = '100%';
    videoElement.style.height = 'auto';
    document.body.appendChild(videoElement);

    console.log('Camera started successfully');
  } catch (error) {
    console.error('Camera error:', error);
    // エラーメッセージを画面に表示
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `カメラエラー: ${error}`;
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    errorDiv.style.fontSize = '16px';
    document.body.appendChild(errorDiv);
  }
}

main();
