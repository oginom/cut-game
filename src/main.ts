import './style.css';
import { Scene } from './components/renderer/Scene';
import { Physics } from './components/game/Physics';
import { GameManager } from './components/game/GameManager';

// Phase 1のトラッキング機能は一時的にコメントアウト
// import { CameraView } from './components/camera/CameraView';
// import { TrackingManager } from './components/camera/TrackingManager';

async function main() {
  // Phase 2: Three.jsシーンのセットアップ
  const scene = new Scene();

  const container = document.getElementById('app');
  if (!container) {
    console.error('Container element not found');
    return;
  }

  scene.init(container, {
    backgroundColor: 0x1a1a2e,
    cameraFov: 75,
    cameraNear: 0.1,
    cameraFar: 1000,
  });

  // Step 2.2: Rapier物理エンジンの統合
  const physics = new Physics();
  await physics.init({
    gravity: { x: 0, y: -9.81, z: 0 },
    timeStep: 1 / 60,
  });

  // Step 2.3: GameManagerの初期化
  const gameManager = new GameManager();
  gameManager.init(scene, physics, container);
  gameManager.start();

  // テスト用にロープ付き宝物を3つ生成
  setTimeout(() => gameManager.spawnRopeWithTreasure('left'), 500);
  setTimeout(() => gameManager.spawnRopeWithTreasure('right'), 1000);
  setTimeout(() => gameManager.spawnRopeWithTreasure('left'), 1500);

  // Step 2.4: クリックイベントリスナーを追加
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
    const stats = scene.getStats();
    console.log(
      `FPS: ${stats.fps}, Draw Calls: ${stats.drawCalls}, Triangles: ${stats.triangles}`
    );
  }, 5000);

  /* Phase 1のコード（後で統合する）
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
  */
}

main();
