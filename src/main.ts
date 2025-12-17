import './style.css';
import { Scene } from './components/renderer/Scene';
import { Physics } from './components/game/Physics';
import { GameManager } from './components/game/GameManager';
import { CameraView } from './components/camera/CameraView';
import { TrackingManager } from './components/camera/TrackingManager';

async function main() {
  const container = document.getElementById('app');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  try {
    // Phase 1: カメラとトラッキングのセットアップ
    console.log('Step 1: Setting up camera...');
    const cameraView = new CameraView();
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
    videoElement.style.zIndex = '-1'; // 背景にする
    videoElement.style.transform = 'scaleX(-1)'; // 左右反転（鏡像）
    container.appendChild(videoElement);
    console.log('Camera started successfully');

    // デバッグ用canvas作成
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = window.innerWidth;
    debugCanvas.height = window.innerHeight;
    debugCanvas.style.position = 'absolute';
    debugCanvas.style.top = '0';
    debugCanvas.style.left = '0';
    debugCanvas.style.pointerEvents = 'none';
    debugCanvas.style.zIndex = '10'; // 最前面
    debugCanvas.style.transform = 'scaleX(-1)'; // 左右反転（カメラに合わせる）
    container.appendChild(debugCanvas);

    // TrackingManager初期化
    console.log('Step 2: Initializing tracking...');
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
        gesture: {
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
          numHands: 2,
        },
      },
      {
        onHandResults: (hands) => {
          if (hands.length > 0) {
            console.log(`[Hand] Detected ${hands.length} hand(s)`);
          }
        },
        onFaceResults: (faces) => {
          if (faces.length > 0) {
            console.log(`[Face] Detected ${faces.length} face(s)`);
          }
        },
        onGestureResults: (gestures) => {
          gestures.forEach((gesture, handedness) => {
            console.log(`[Gesture] ${handedness}: ${gesture.gesture} (${gesture.score.toFixed(2)})`);
          });
        },
        onVCloseAction: (handedness) => {
          console.log(`[V-Close Action] Detected on ${handedness} hand!`);
        },
        onError: (error) => {
          console.error('[Tracking Error]', error);
        },
      }
    );

    // デバッグ描画を有効化
    trackingManager.enableDebug(debugCanvas);

    // トラッキング開始
    await trackingManager.start(videoElement);
    console.log('Tracking started successfully');

    // Phase 2: Three.jsシーンとゲームのセットアップ
    console.log('Step 3: Setting up 3D scene...');
    const scene = new Scene();
    scene.init(container, {
      backgroundColor: 0x000000,
      cameraFov: 75,
      cameraNear: 0.1,
      cameraFar: 1000,
    });

    // Three.jsのcanvasを中層に配置
    const threeCanvas = scene.getRenderer().domElement;
    threeCanvas.style.position = 'absolute';
    threeCanvas.style.top = '0';
    threeCanvas.style.left = '0';
    threeCanvas.style.zIndex = '1'; // カメラ映像(-1)の上、デバッグcanvas(10)の下

    console.log('Step 4: Initializing physics...');
    const physics = new Physics();
    await physics.init({
      gravity: { x: 0, y: -9.81, z: 0 },
      timeStep: 1 / 60,
    });

    console.log('Step 5: Initializing game manager...');
    const gameManager = new GameManager();
    gameManager.init(scene, physics, container);
    gameManager.start();

    // テスト用にロープ付き宝物を3つ生成
    setTimeout(() => gameManager.spawnRopeWithTreasure('left'), 500);
    setTimeout(() => gameManager.spawnRopeWithTreasure('right'), 1000);
    setTimeout(() => gameManager.spawnRopeWithTreasure('left'), 1500);

    // クリックイベントリスナーを追加（デバッグ用）
    window.addEventListener('click', (event) => {
      gameManager.handleClick(event);
    });

      console.log('Game initialized successfully');

    // レンダリングループを停止して、物理演算を含む新しいループを開始
    scene.stop();

    let lastTime = performance.now();
    const animate = () => {
      requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // ゲーム更新
      gameManager.update(deltaTime);

      // 物理演算を実行
      physics.step();

      // メッシュの位置を物理ボディと同期
      physics.syncMeshes();

      // レンダリング
      scene.getRenderer().render(scene.getScene(), scene.getCamera());
    };

    animate();

    console.log('Scene started successfully');

    // パフォーマンス統計を定期的に表示
    setInterval(() => {
      const sceneStats = scene.getStats();
      const trackingStats = trackingManager.getPerformanceStats();
      console.log(
        `[Scene] FPS: ${sceneStats.fps}, Draw Calls: ${sceneStats.drawCalls}, Triangles: ${sceneStats.triangles}`
      );
      console.log(
        `[Tracking] FPS: ${trackingStats.fps}, Hand: ${(trackingStats.handDetectionRate * 100).toFixed(1)}%, Face: ${(trackingStats.faceDetectionRate * 100).toFixed(1)}%`
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
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    errorDiv.style.borderRadius = '8px';
    container?.appendChild(errorDiv);
  }
}

main();
