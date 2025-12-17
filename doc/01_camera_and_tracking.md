# Phase 1: カメラとトラッキング基盤 - 詳細実装計画

## 概要

Phase 1では、ゲームの基盤となるカメラ入力とハンド/フェイストラッキング機能を実装します。この段階では3Dグラフィックスやゲームロジックは含まず、トラッキング機能の動作確認に集中します。

## 目標

- カメラ映像の取得と表示
- MediaPipe Handsによる両手のトラッキング
- MediaPipe Face Detectionによる顔のトラッキング
- トラッキング結果のビジュアルフィードバック（デバッグ用マーカー表示）
- 独立したモジュールとして再利用可能な設計

## Step 1.1: プロジェクトセットアップ

### 目的
開発環境を構築し、必要なライブラリをインストールします。

### タスク詳細

#### 1.1.1 Viteプロジェクトの初期化
```bash
npm create vite@latest . -- --template vanilla-ts
npm install
```

#### 1.1.2 必要なパッケージのインストール
```bash
# 3D描画関連
npm install three @types/three

# 物理エンジン
npm install @dimforge/rapier3d-compat

# トラッキング関連
npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
npm install @mediapipe/face_detection
```

#### 1.1.3 TypeScript設定の調整

`tsconfig.json`に以下を追加:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

#### 1.1.4 基本的なディレクトリ構造の作成
```bash
mkdir -p src/components/camera
mkdir -p src/components/game
mkdir -p src/components/renderer
mkdir -p src/components/ui
mkdir -p src/utils
mkdir -p src/types
```

### 完了条件
- [x] `npm run dev`で開発サーバーが起動する
- [x] ブラウザで`http://localhost:5173`にアクセスできる
- [x] 空白ページまたはデフォルトのViteページが表示される
- [x] TypeScriptのコンパイルエラーがない

### 検証方法
```bash
npm run dev
# ブラウザでlocalhost:5173を開き、エラーがないことを確認
```

---

## Step 1.2: カメラ入力の取得と表示

### 目的
スマートフォンのカメラにアクセスし、映像を画面に表示します。

### タスク詳細

#### 1.2.1 型定義ファイルの作成

`src/types/camera.ts`:
```typescript
export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}

export interface CameraError {
  type: 'permission_denied' | 'not_found' | 'not_readable' | 'unknown';
  message: string;
}
```

#### 1.2.2 CameraViewコンポーネントの実装

`src/components/camera/CameraView.ts`を作成:

**実装する機能:**
1. `getUserMedia()`によるカメラアクセス
2. ビデオ要素の作成と設定
3. カメラストリームの接続
4. エラーハンドリング
5. カメラの開始/停止メソッド

**主要なメソッド:**
- `async init(config: CameraConfig): Promise<void>` - カメラ初期化
- `async start(): Promise<void>` - カメラ開始
- `stop(): void` - カメラ停止
- `getVideoElement(): HTMLVideoElement` - video要素取得
- `isReady(): boolean` - カメラ準備状態の確認

**エラーハンドリング:**
- `NotAllowedError` → `permission_denied`
- `NotFoundError` → `not_found`
- `NotReadableError` → `not_readable`
- その他 → `unknown`

#### 1.2.3 メインファイルでの動作確認

`src/main.ts`を編集:
```typescript
import { CameraView } from './components/camera/CameraView';

async function main() {
  const cameraView = new CameraView();

  try {
    await cameraView.init({
      width: 1280,
      height: 720,
      facingMode: 'user'
    });

    await cameraView.start();

    // video要素をDOMに追加
    const videoElement = cameraView.getVideoElement();
    videoElement.style.width = '100%';
    videoElement.style.height = 'auto';
    document.body.appendChild(videoElement);

  } catch (error) {
    console.error('Camera error:', error);
    // エラーメッセージを画面に表示
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `カメラエラー: ${error}`;
    errorDiv.style.color = 'red';
    document.body.appendChild(errorDiv);
  }
}

main();
```

#### 1.2.4 スタイリング

`src/style.css`を編集:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
  background-color: #000;
  color: #fff;
  overflow: hidden;
}

video {
  display: block;
  max-width: 100%;
  height: auto;
}
```

### 完了条件
- [x] スマートフォンでページを開くとカメラ許可ダイアログが表示される
- [x] 許可するとカメラ映像が画面に表示される
- [x] 許可しない場合、適切なエラーメッセージが表示される
- [x] カメラ映像が画面全体に適切に表示される
- [x] コンソールにエラーが出ていない

### 検証方法
1. スマートフォンでページにアクセス
2. カメラ許可ダイアログで「許可」を選択
3. 自分の顔が映ることを確認
4. 一度ページをリロードし、再度許可ダイアログが出ないことを確認（許可が保存されている）

---

## Step 1.3: ハンドトラッキングの実装

### 目的
MediaPipe Handsを使用して両手を検出し、ランドマーク情報を取得します。

### タスク詳細

#### 1.3.1 型定義ファイルの作成

`src/types/tracking.ts`:
```typescript
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
```

#### 1.3.2 HandTrackerコンポーネントの実装

`src/components/camera/HandTracker.ts`を作成:

**実装する機能:**
1. MediaPipe Handsの初期化
2. カメラ映像からの手検出
3. ランドマーク情報の抽出と変換
4. 検出結果のコールバック通知
5. デバッグ用の描画機能

**主要なメソッド:**
- `async init(config: HandTrackerConfig, callbacks: HandTrackerCallbacks): Promise<void>`
- `async start(videoElement: HTMLVideoElement): Promise<void>`
- `stop(): void`
- `isTracking(): boolean`
- `enableDebugDraw(canvas: HTMLCanvasElement): void` - デバッグ描画有効化
- `disableDebugDraw(): void` - デバッグ描画無効化

**MediaPipe Hands設定:**
```typescript
{
  maxNumHands: 2,                    // 両手検出
  modelComplexity: 1,                 // 0(軽量), 1(標準)
  minDetectionConfidence: 0.7,        // 検出の最低信頼度
  minTrackingConfidence: 0.5          // トラッキングの最低信頼度
}
```

**ランドマーク定義:**
MediaPipe Handsは21個のランドマークを返します:
- 0: 手首(WRIST)
- 1-4: 親指(THUMB_CMC, MCP, IP, TIP)
- 5-8: 人差し指(INDEX_FINGER_MCP, PIP, DIP, TIP)
- 9-12: 中指(MIDDLE_FINGER_MCP, PIP, DIP, TIP)
- 13-16: 薬指(RING_FINGER_MCP, PIP, DIP, TIP)
- 17-20: 小指(PINKY_MCP, PIP, DIP, TIP)

#### 1.3.3 デバッグ描画の実装

`src/utils/drawingUtils.ts`:
```typescript
export class HandDrawingUtils {
  // ランドマークを描画
  static drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    canvasWidth: number,
    canvasHeight: number
  ): void

  // 手の骨格を描画
  static drawConnections(
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    canvasWidth: number,
    canvasHeight: number
  ): void

  // 左右の手で色を変える
  static getHandColor(handedness: 'Left' | 'Right'): string
}
```

**接続関係（骨格）:**
手首から各指先までの接続線を描画します。

#### 1.3.4 メインファイルでの統合

`src/main.ts`を更新:
```typescript
import { CameraView } from './components/camera/CameraView';
import { HandTracker } from './components/camera/HandTracker';

async function main() {
  // カメラセットアップ
  const cameraView = new CameraView();
  await cameraView.init({ /* ... */ });
  await cameraView.start();

  // video要素をDOMに追加
  const videoElement = cameraView.getVideoElement();
  document.body.appendChild(videoElement);

  // デバッグ用canvas作成
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  document.body.appendChild(canvas);

  // ハンドトラッカー初期化
  const handTracker = new HandTracker();
  await handTracker.init(
    {
      maxNumHands: 2,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    },
    {
      onResults: (hands) => {
        console.log(`Detected ${hands.length} hand(s)`);
        hands.forEach(hand => {
          console.log(`${hand.handedness}: ${hand.score.toFixed(2)}`);
        });
      }
    }
  );

  // デバッグ描画を有効化
  handTracker.enableDebugDraw(canvas);

  // トラッキング開始
  await handTracker.start(videoElement);
}

main();
```

### 完了条件
- [ ] カメラ映像の上に手のランドマークが表示される
- [ ] 両手を同時に認識できる
- [ ] 左手と右手が区別されて表示される（色違いなど）
- [ ] 手の骨格（接続線）が表示される
- [ ] コンソールに検出された手の情報が出力される
- [ ] 手を動かすとランドマークが追従する

### 検証方法
1. 片手を画面に向ける → ランドマークが21個表示される
2. 両手を画面に向ける → 両手のランドマークが表示される
3. 手を素早く動かす → ランドマークが追従する
4. 手を画面外に出す → ランドマークが消える
5. コンソールで左右の判定が正しいか確認

---

## Step 1.4: フェイストラッキングの実装

### 目的
MediaPipe Face Detectionを使用して顔を検出し、位置情報を取得します。

### タスク詳細

#### 1.4.1 型定義の追加

`src/types/tracking.ts`に追加:
```typescript
export interface FaceDetection {
  boundingBox: {
    xCenter: number;  // 0-1の正規化座標
    yCenter: number;  // 0-1の正規化座標
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
  model: 'short' | 'full'; // short: 2m以内, full: 5m以内
}

export interface FaceTrackerCallbacks {
  onResults: (faces: FaceDetection[]) => void;
  onError?: (error: Error) => void;
}
```

#### 1.4.2 FaceTrackerコンポーネントの実装

`src/components/camera/FaceTracker.ts`を作成:

**実装する機能:**
1. MediaPipe Face Detectionの初期化
2. カメラ映像からの顔検出
3. バウンディングボックスとキーポイントの取得
4. 検出結果のコールバック通知
5. デバッグ用の描画機能

**主要なメソッド:**
- `async init(config: FaceTrackerConfig, callbacks: FaceTrackerCallbacks): Promise<void>`
- `async start(videoElement: HTMLVideoElement): Promise<void>`
- `stop(): void`
- `isTracking(): boolean`
- `enableDebugDraw(canvas: HTMLCanvasElement): void`
- `disableDebugDraw(): void`

**MediaPipe Face Detection設定:**
```typescript
{
  model: 'short',                     // 近距離モデル（スマホ自撮り用）
  minDetectionConfidence: 0.7         // 検出の最低信頼度
}
```

**キーポイント定義:**
MediaPipe Face Detectionは6個のキーポイントを返します:
- 0: 右目
- 1: 左目
- 2: 鼻先
- 3: 口の中心
- 4: 右耳の付け根
- 5: 左耳の付け根

#### 1.4.3 デバッグ描画の追加

`src/utils/drawingUtils.ts`に追加:
```typescript
export class FaceDrawingUtils {
  // バウンディングボックスを描画
  static drawBoundingBox(
    ctx: CanvasRenderingContext2D,
    box: FaceDetection['boundingBox'],
    canvasWidth: number,
    canvasHeight: number
  ): void

  // キーポイントを描画
  static drawKeypoints(
    ctx: CanvasRenderingContext2D,
    keypoints: FaceDetection['keypoints'],
    canvasWidth: number,
    canvasHeight: number
  ): void

  // 顔の中心にマーカーを描画
  static drawCenterMarker(
    ctx: CanvasRenderingContext2D,
    box: FaceDetection['boundingBox'],
    canvasWidth: number,
    canvasHeight: number
  ): void
}
```

#### 1.4.4 統合トラッキングシステムの構築

`src/components/camera/TrackingManager.ts`を作成:

両方のトラッカーを統合管理するマネージャークラス:

**実装する機能:**
1. HandTrackerとFaceTrackerの一元管理
2. 両方の検出結果の統合
3. デバッグ描画の一元管理
4. パフォーマンス測定

**主要なメソッド:**
- `async init(videoElement: HTMLVideoElement): Promise<void>`
- `start(): void`
- `stop(): void`
- `getHandData(): HandData[]`
- `getFaceData(): FaceDetection[]`
- `enableDebug(canvas: HTMLCanvasElement): void`
- `disableDebug(): void`
- `getPerformanceStats(): { fps: number, latency: number }`

#### 1.4.5 メインファイルでの統合

`src/main.ts`を更新:
```typescript
import { CameraView } from './components/camera/CameraView';
import { TrackingManager } from './components/camera/TrackingManager';

async function main() {
  // UI要素の作成
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '100vw';
  container.style.height = '100vh';
  document.body.appendChild(container);

  // カメラセットアップ
  const cameraView = new CameraView();
  await cameraView.init({
    width: 1280,
    height: 720,
    facingMode: 'user'
  });
  await cameraView.start();

  const videoElement = cameraView.getVideoElement();
  videoElement.style.width = '100%';
  videoElement.style.height = '100%';
  videoElement.style.objectFit = 'cover';
  container.appendChild(videoElement);

  // デバッグ用canvas
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  // 統合トラッキングマネージャー
  const trackingManager = new TrackingManager();
  await trackingManager.init(videoElement);
  trackingManager.enableDebug(canvas);
  trackingManager.start();

  // パフォーマンス表示
  const statsDiv = document.createElement('div');
  statsDiv.style.position = 'absolute';
  statsDiv.style.top = '10px';
  statsDiv.style.left = '10px';
  statsDiv.style.color = '#0f0';
  statsDiv.style.fontFamily = 'monospace';
  statsDiv.style.fontSize = '14px';
  container.appendChild(statsDiv);

  // 検出情報の表示更新
  setInterval(() => {
    const hands = trackingManager.getHandData();
    const faces = trackingManager.getFaceData();
    const stats = trackingManager.getPerformanceStats();

    statsDiv.innerHTML = `
      FPS: ${stats.fps.toFixed(1)}<br>
      Hands: ${hands.length}<br>
      Faces: ${faces.length}
    `;
  }, 100);
}

main();
```

### 完了条件
- [ ] カメラ映像の上に顔のバウンディングボックスが表示される
- [ ] 顔の6つのキーポイントが表示される
- [ ] 顔の中心にマーカーが表示される
- [ ] 手と顔が同時に検出・表示される
- [ ] FPS情報が画面に表示される
- [ ] 両手と顔が同時に認識される状態で30fps以上維持できる

### 検証方法
1. 正面を向く → 顔のバウンディングボックスとキーポイントが表示される
2. 両手を上げる → 手と顔が同時に表示される
3. 顔を左右に動かす → バウンディングボックスが追従する
4. 画面端のFPS表示を確認 → 30fps以上であることを確認
5. 手を素早く動かす → トラッキングが遅延なく追従することを確認

---

## Phase 1完了時の状態

### 達成される機能
1. ✅ カメラ映像のリアルタイム表示
2. ✅ 両手のトラッキングとランドマーク取得
3. ✅ 顔のトラッキングと位置情報取得
4. ✅ デバッグ用のビジュアルフィードバック
5. ✅ パフォーマンス測定機能

### ファイル構成
```
src/
├── main.ts                          # エントリーポイント
├── style.css                        # 基本スタイル
├── components/
│   └── camera/
│       ├── CameraView.ts            # カメラ映像管理
│       ├── HandTracker.ts           # ハンドトラッキング
│       ├── FaceTracker.ts           # フェイストラッキング
│       └── TrackingManager.ts       # トラッキング統合管理
├── utils/
│   └── drawingUtils.ts              # デバッグ描画ユーティリティ
└── types/
    ├── camera.ts                    # カメラ関連の型定義
    └── tracking.ts                  # トラッキング関連の型定義
```

### 次のPhaseへの準備
Phase 1完了時点で、以下の情報が利用可能になります:

1. **手の情報**
   - 両手それぞれの21個のランドマーク座標
   - 左右の判定
   - 検出信頼度

2. **顔の情報**
   - バウンディングボックス（中心座標、幅、高さ）
   - 6つのキーポイント
   - 検出信頼度

これらの情報は、Phase 2以降で以下のように活用されます:
- **Phase 2**: 3D空間での手の位置計算
- **Phase 3**: ジェスチャー認識（Vサイン検出）
- **Phase 6**: 顔の位置への3Dモデル配置

---

## トラブルシューティング

### カメラが起動しない
- HTTPSでアクセスしているか確認（localhostは例外）
- ブラウザのカメラ許可設定を確認
- 他のアプリでカメラが使用中でないか確認

### トラッキングが不安定
- 照明環境を改善（明るい場所で使用）
- カメラとの距離を調整（30-50cm程度）
- `minDetectionConfidence`を下げる（0.5程度）

### パフォーマンスが低い
- `modelComplexity`を0に下げる
- カメラ解像度を下げる（640x480）
- ブラウザのハードウェアアクセラレーションを有効化

### 手の左右判定が逆
- フロントカメラ使用時は鏡像になるため正常
- 必要に応じて座標を反転させる処理を追加

---

## 参考資料

### MediaPipe公式ドキュメント
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- [MediaPipe Face Detection](https://google.github.io/mediapipe/solutions/face_detection.html)

### getUserMedia API
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

### パフォーマンス最適化
- requestAnimationFrameの活用
- 不要な再描画の削減
- オフスクリーンキャンバスの活用
