# 実装ガイド

このドキュメントには、実装中に発見した重要な情報や注意事項を記載します。

## 実装の基本原則

### 1. Phaseの開始時には詳細な実装プランを作成する

各Phaseの実装を開始する前に、必ず詳細な実装計画書を作成してください。

- 計画書は`doc/XX_phase_name.md`の形式で作成する（例: `doc/01_camera_and_tracking.md`）
- 各Stepごとに以下を明記する:
  - 目的
  - タスク詳細（実装する機能、メソッド、設定など）
  - 完了条件（チェックリスト形式）
  - 検証方法
- コード例やサンプルを含める
- 型定義やクラス設計も事前に計画する

### 2. Stepごとに実装する

実装は必ずStepごとに段階的に進めてください。

- 1つのStepが完了してから次のStepに進む
- 各Step完了時には、完了条件をすべて満たしていることを確認する
- **各Phaseの詳細計画書（例: `doc/02_game_core.md`）のチェックボックスを更新する**
- 動作確認を行い、問題がないことを確認する
- **各Stepの完了後、必ずユーザーの確認を取る**

**一度に複数のStepを実装しない**ことが重要です。段階的な実装により、問題の早期発見と修正が可能になります。

**重要**: 各Step完了後は、以下を実施してください:
1. 詳細計画書（`doc/XX_phase_name.md`）の完了条件チェックボックスを更新
2. implementation-guideに完了内容を記録
3. ユーザーに報告して次のStepへの承認を得る

### 3. ユーザー指示を適宜implementation-guideに追加する

実装中にユーザーから指示や指摘があった場合は、このドキュメント（`doc/implementation-guide.md`）に記録してください。

- 実装時の注意事項
- プロジェクト固有の制約や要件
- 使用するツールやライブラリの選定理由
- 発見したバグや回避方法
- パフォーマンス最適化のヒント

このドキュメントは、今後の実装の参考資料として機能します。

## プロジェクト設定

### パッケージマネージャー

**pnpmを使用する**

このプロジェクトでは`pnpm`をパッケージマネージャーとして使用します。`npm`や`yarn`は使用しないでください。

```bash
# 正しい
pnpm install
pnpm run dev
pnpm add <package-name>

# 間違い
npm install
yarn install
```

### プロジェクト構成

このプロジェクトは既存のViteプロジェクトです。新規にViteプロジェクトを初期化する必要はありません。

- Viteは既に設定済み
- TypeScriptは既に設定済み
- 必要なディレクトリ構造は手動で作成

## Step 1.1: プロジェクトセットアップ - 完了事項

### 完了した作業

1. **Viteプロジェクト確認**
   - 既存のViteプロジェクトを確認
   - 新規初期化は不要

2. **パッケージインストール**
   - pnpmを使用して全パッケージをインストール
   - インストールしたパッケージ:
     - `three` @0.182.0
     - `@types/three` @0.182.0
     - `@dimforge/rapier3d-compat` @0.19.3
     - `@mediapipe/hands` @0.4.1675469240
     - `@mediapipe/camera_utils` @0.3.1675466862
     - `@mediapipe/drawing_utils` @0.3.1675466124
     - `@mediapipe/face_detection` @0.4.1646425229

3. **TypeScript設定の調整**
   - [tsconfig.json:16-17](tsconfig.json#L16-L17)に以下を追加:
     - `esModuleInterop: true`
     - `allowSyntheticDefaultImports: true`
   - これらの設定はMediaPipeライブラリとの互換性のために必要

4. **ディレクトリ構造の作成**
   - 以下のディレクトリを作成:
     ```
     src/
     ├── components/
     │   ├── camera/
     │   ├── game/
     │   ├── renderer/
     │   └── ui/
     ├── types/
     └── utils/
     ```

5. **ビルド確認**
   - `pnpm run build`でビルドが成功することを確認
   - TypeScriptコンパイルエラーなし

## 注意事項

### パッケージ管理

- **常にpnpmを使用する**: このプロジェクトではpnpmがパッケージマネージャーとして採用されています
- package.jsonを直接編集せず、`pnpm add`コマンドを使用してパッケージを追加してください

### TypeScript設定

- `tsconfig.json`の既存設定は維持する
- 新しい設定を追加する場合は、既存の設定と競合しないか確認する

### ディレクトリ構造

- 計画書通りのディレクトリ構造を維持する
- 新しいコンポーネントは適切なディレクトリに配置する

## Step 1.2: カメラ入力の取得と表示 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/camera.ts](src/types/camera.ts)を作成
   - `CameraConfig`: カメラ設定（解像度、向き）
   - `CameraError`: エラー情報（タイプ、メッセージ）

2. **CameraViewコンポーネントの実装**
   - [src/components/camera/CameraView.ts](src/components/camera/CameraView.ts)を作成
   - 実装した機能:
     - `init()`: カメラ初期化とvideo要素作成
     - `start()`: getUserMediaでカメラアクセス、ストリーム接続
     - `stop()`: カメラストリーム停止
     - `getVideoElement()`: video要素取得
     - `isReady()`: 準備状態確認
     - `classifyError()`: エラー分類（permission_denied, not_found, not_readable, unknown）
   - iOS対応のため`playsinline`属性を追加

3. **メインファイルの更新**
   - [src/main.ts](src/main.ts)を全面的に書き換え
   - CameraViewを使用したカメラ起動処理
   - エラーハンドリングとエラー表示

4. **スタイリングの適用**
   - [src/style.css](src/style.css)をゲーム用にシンプル化
   - 黒背景、余白なし、オーバーフロー非表示
   - ビデオ要素のレスポンシブ対応

5. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **iOS対応**: video要素に`playsinline`属性を設定することで、iOSでインライン再生が可能
- **エラー分類**: DOMExceptionの名前でエラータイプを判定し、適切な日本語メッセージを表示
- **非同期処理**: video要素のメタデータ読み込み完了を`Promise`で待機

## Step 1.3: ハンドトラッキングの実装 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/tracking.ts](src/types/tracking.ts)を作成
   - `HandLandmark`: ランドマーク座標（x, y, z）
   - `HandData`: 手のデータ（左右判定、ランドマーク配列、信頼度）
   - `HandTrackerConfig`: トラッキング設定
   - `HandTrackerCallbacks`: コールバック定義

2. **HandTrackerコンポーネントの実装**
   - [src/components/camera/HandTracker.ts](src/components/camera/HandTracker.ts)を作成
   - 実装した機能:
     - `init()`: MediaPipe Handsの初期化（動的インポート使用）
     - `start()`: トラッキング開始（MediaPipe Camera使用）
     - `stop()`: トラッキング停止
     - `isTracking()`: 状態確認
     - `enableDebugDraw()` / `disableDebugDraw()`: デバッグ描画制御
     - `onResults()`: MediaPipe結果の処理とコールバック呼び出し
   - デバッグ描画機能を内蔵:
     - ランドマーク描画（21個の点）
     - 骨格線描画（手の接続関係）
     - 左右の手で色分け（左: 緑、右: 赤）

3. **メインファイルの統合**
   - [src/main.ts](src/main.ts)を更新
   - カメラ映像の上にcanvasを重ねてデバッグ描画
   - HandTrackerの初期化とトラッキング開始
   - コンソールへの検出情報出力

4. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **動的インポート**: MediaPipeライブラリはデフォルトエクスポートを使用しているため、`import()`で動的にインポートし、`(module as any).Hands`でアクセス
- **CDN使用**: MediaPipeのモデルファイルはCDN（`https://cdn.jsdelivr.net/npm/@mediapipe/hands/`）から読み込み
- **デバッグ描画**: Canvas APIを使用してランドマークと骨格を直接描画
- **左右判定**: MediaPipeが自動で判定し、`multiHandedness`で提供される
- **21個のランドマーク**: 手首1点、各指4点×5本 = 計21点

### 技術的課題と解決方法

**課題1**: MediaPipeライブラリのインポートエラー
- 旧MediaPipe API（`@mediapipe/hands`, `@mediapipe/camera_utils`等）は動的インポート時にコンストラクタとして正しく機能しない
- `verbatimModuleSyntax`有効時に通常のimportが失敗

**解決**: `@mediapipe/tasks-vision`への移行
旧APIから新しいMediaPipe Tasks Vision APIに切り替えました。

**パッケージ変更:**
```bash
# 削除
@mediapipe/hands
@mediapipe/camera_utils
@mediapipe/drawing_utils
@mediapipe/face_detection

# 追加
@mediapipe/tasks-vision
```

**新APIの特徴:**
- モダンなESモジュールサポート
- 通常のimport文が正常に動作
- `HandLandmarker`クラスを使用（旧`Hands`の代替）
- `requestAnimationFrame`で自前のトラッキングループを実装
- MediaPipe Cameraは不要（直接video要素を処理）

**実装例:**
```typescript
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// 初期化
const vision = await FilesetResolver.forVisionTasks('CDN_URL');
const handLandmarker = await HandLandmarker.createFromOptions(vision, options);

// トラッキングループ
const detectHands = () => {
  const results = handLandmarker.detectForVideo(videoElement, performance.now());
  // 結果を処理...
  requestAnimationFrame(detectHands);
};
```

**課題2**: カメラ映像とランドマーク表示の位置ずれ
- ブラウザの縦横比とカメラ映像の縦横比が異なる場合、位置がずれる
- `object-fit: cover`を使用すると、映像の一部がクロップされる

**解決**: object-fit: coverを考慮した座標変換
カメラ映像を画面全体に表示し、ランドマークの座標も適切に変換します。

**video要素のスタイル:**
```typescript
videoElement.style.width = '100vw';
videoElement.style.height = '100vh';
videoElement.style.objectFit = 'cover';
videoElement.style.position = 'absolute';
```

**座標変換の計算:**
```typescript
const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
const canvasAspect = canvas.width / canvas.height;

let scaleX, scaleY, offsetX, offsetY;

if (videoAspect > canvasAspect) {
  // ビデオが横長：上下がクロップされる
  scaleY = canvas.height;
  scaleX = videoElement.videoWidth * (canvas.height / videoElement.videoHeight);
  offsetX = (canvas.width - scaleX) / 2;
  offsetY = 0;
} else {
  // ビデオが縦長：左右がクロップされる
  scaleX = canvas.width;
  scaleY = videoElement.videoHeight * (canvas.width / videoElement.videoWidth);
  offsetX = 0;
  offsetY = (canvas.height - scaleY) / 2;
}

// ランドマークを描画
const x = landmark.x * scaleX + offsetX;
const y = landmark.y * scaleY + offsetY;
```

## Step 1.4: フェイストラッキングの実装 - 完了事項

### 完了した作業

1. **型定義ファイルの更新**
   - [src/types/tracking.ts](src/types/tracking.ts)に顔検出用の型を追加
   - `FaceDetection`: 顔のデータ（バウンディングボックス、キーポイント、信頼度）
   - `FaceTrackerConfig`: 顔検出設定
   - `FaceTrackerCallbacks`: コールバック定義

2. **FaceTrackerコンポーネントの実装**
   - [src/components/camera/FaceTracker.ts](src/components/camera/FaceTracker.ts)を作成
   - 実装した機能:
     - `init()`: MediaPipe FaceDetectorの初期化
     - `start()`: 顔検出開始（requestAnimationFrameループ）
     - `stop()`: 顔検出停止
     - `isTracking()`: 状態確認
     - `enableDebugDraw()` / `disableDebugDraw()`: デバッグ描画制御
     - `onResults()`: MediaPipe結果の処理とコールバック呼び出し
   - デバッグ描画機能:
     - バウンディングボックス描画（シアン色）
     - キーポイント描画（6個: 右目、左目、鼻先、口、右耳、左耳）
     - HandTrackerと同様のobject-fit: cover対応座標変換

3. **TrackingManagerの実装**
   - [src/components/camera/TrackingManager.ts](src/components/camera/TrackingManager.ts)を作成
   - HandTrackerとFaceTrackerを統合管理
   - 実装した機能:
     - `init()`: 両トラッカーの初期化
     - `start()`: 両トラッカーの同時開始（Promise.all使用）
     - `stop()`: 両トラッカーの停止
     - `enableDebug()` / `disableDebug()`: 両トラッカーのデバッグ描画制御
     - `getHandData()` / `getFaceData()`: 最新のトラッキング結果取得
     - `getPerformanceStats()`: パフォーマンス統計取得
   - パフォーマンス測定:
     - FPS（フレームレート）
     - 平均レイテンシ
     - 手検出率（0-1）
     - 顔検出率（0-1）

4. **メインファイルの更新**
   - [src/main.ts](src/main.ts)をTrackingManagerを使用するよう更新
   - HandTrackerの代わりにTrackingManagerを初期化
   - 手と顔の両方のコールバックを設定
   - 5秒ごとにパフォーマンス統計をコンソールに出力

5. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **統合管理**: TrackingManagerが両トラッカーを一元管理することで、外部からの操作をシンプル化
- **並列初期化**: `Promise.all`を使用して両トラッカーを同時に起動し、起動時間を短縮
- **パフォーマンス測定**: requestAnimationFrameを使用してFPSを計測し、検出率も追跡
- **同一canvas共有**: HandTrackerとFaceTrackerが同じcanvasに描画することで、両方の結果を同時に可視化

### 次のステップ

Phase 1のすべてのStepが完了しました。次はPhase 2の詳細計画を作成します。

---

## Phase 2: ゲームコア機能

Phase 2では、Three.jsを使った3D描画とRapierを使った物理演算を実装し、ロープと宝物の基本的なゲームメカニクスを構築します。

詳細な実装計画は[doc/02_game_core.md](02_game_core.md)を参照してください。

## Step 2.1: Three.jsシーンのセットアップ - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/scene.ts](src/types/scene.ts)を作成
   - `SceneConfig`: シーン設定（背景色、カメラFOV、ニア/ファー）
   - `RenderStats`: パフォーマンス統計（FPS、描画コール数、三角形数）

2. **Sceneコンポーネントの実装**
   - [src/components/renderer/Scene.ts](src/components/renderer/Scene.ts)を作成
   - 実装した機能:
     - `init()`: Three.jsシーン、カメラ、レンダラーの初期化
     - `start()`: レンダリングループ開始
     - `stop()`: レンダリングループ停止
     - `resize()`: ウィンドウリサイズ処理
     - `addObject()` / `removeObject()`: オブジェクトの追加・削除
     - `getCamera()` / `getScene()` / `getRenderer()`: 各オブジェクトの取得
     - `getStats()`: パフォーマンス統計取得
   - ライティング設定:
     - AmbientLight（環境光、強度0.6）
     - DirectionalLight（平行光源、強度0.8）
   - デバッグ機能:
     - 回転するテストキューブ（緑色）
     - FPS計測

3. **メインファイルの更新**
   - [src/main.ts](src/main.ts)を更新
   - Phase 1のトラッキング機能を一時的にコメントアウト
   - Sceneの初期化とレンダリング開始
   - パフォーマンス統計の定期出力（5秒ごと）

4. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **Three.js基本構成**: Scene、Camera、Rendererの3要素を適切に初期化
- **レンダリングループ**: requestAnimationFrameを使用した滑らかなアニメーション
- **ウィンドウリサイズ対応**: アスペクト比とレンダラーサイズの自動調整
- **パフォーマンス測定**: FPSと描画統計をリアルタイムで取得可能

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、回転するキューブが表示されることを確認
3. ウィンドウをリサイズして、表示が崩れないことを確認
4. コンソールで5秒ごとにパフォーマンス統計が出力されることを確認

### 次のステップ

Step 2.2でRapier物理エンジンを統合し、物理演算を有効化します。

## Step 2.2: Rapier物理エンジンの統合 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/physics.ts](src/types/physics.ts)を作成（既に作成済み）
   - `PhysicsConfig`: 物理エンジン設定（重力、タイムステップ）
   - `RigidBodyHandle`: 剛体ハンドル（ID、剛体、メッシュ）

2. **Physicsコンポーネントの実装**
   - [src/components/game/Physics.ts](src/components/game/Physics.ts)を作成
   - 実装した機能:
     - `init()`: Rapierの初期化と物理ワールドの作成
     - `step()`: 物理演算を1ステップ進める
     - `syncMeshes()`: Three.jsメッシュの位置を物理ボディと同期
     - `createRigidBody()`: RigidBodyの作成
     - `createCollider()`: Colliderの作成
     - `registerBody()` / `unregisterBody()`: 剛体とメッシュの登録・解除
     - `getWorld()` / `getRAPIER()`: ワールドとライブラリの取得
   - デバッグ機能:
     - `createDebugBall()`: 落下するボール（赤色、半径0.5）
     - `createDebugGround()`: 地面（灰色、20x0.5x20）

3. **メインファイルの更新**
   - [src/main.ts](src/main.ts)を更新
   - Physicsの初期化（重力: y=-9.81）
   - デバッグ用の地面とボールを作成
   - レンダリングループを物理演算と統合:
     - `physics.step()`: 物理演算を実行
     - `physics.syncMeshes()`: メッシュ位置を同期
     - Three.jsでレンダリング

4. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **Rapierの初期化**: `await RAPIER.init()`で初期化し、モジュールを保持
- **物理ワールド**: 重力ベクトルを設定して`World`を作成
- **剛体とメッシュの同期**: 物理演算後、剛体の位置・回転をメッシュに反映
- **動的オブジェクト**: `RigidBodyDesc.dynamic()`で動的（重力影響を受ける）オブジェクトを作成
- **固定オブジェクト**: `RigidBodyDesc.fixed()`で固定（動かない）オブジェクトを作成
- **Collider**: 剛体に衝突判定形状を追加（球形、箱形など）

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、以下を確認:
   - 赤いボールが画面上方に表示される
   - ボールが重力で落下する
   - ボールが灰色の地面に到達して止まる
   - 物理演算が滑らかに動作する
3. コンソールで以下のメッセージを確認:
   - `[Physics] Initialized with gravity: { x: 0, y: -9.81, z: 0 }`
   - `[Physics] Debug ground created`
   - `[Physics] Debug ball created`
   - `Physics initialized successfully`

### 次のステップ

Step 2.3でロープと宝物を実装し、ロープの物理演算と画面横移動を実装します。

## Step 2.3: ロープと宝物の実装 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/game.ts](src/types/game.ts)を作成
   - `RopeSegment`: ロープのセグメント（剛体、メッシュ）
   - `RopeConfig`: ロープ設定（セグメント数、長さ、半径、質量）
   - `TreasureConfig`: 宝物設定（種類、スコア、質量、サイズ）
   - `Treasure`: 宝物データ（剛体、メッシュ、設定）
   - `RopeWithTreasure`: ロープと宝物のセット（ID、セグメント、宝物、ジョイント、方向、速度、アンカー）

2. **Treasureコンポーネントの実装**
   - [src/components/game/Treasure.ts](src/components/game/Treasure.ts)を作成
   - `TreasureFactory`クラス:
     - `getConfig()`: 宝物の種類ごとの設定（金: 100点、銀: 50点、銅: 30点）
     - `create()`: 宝物の作成（箱形メッシュ、動的剛体、コライダー）
   - 宝物の色分け: 金色、銀色、銅色

3. **Ropeコンポーネントの実装**
   - [src/components/game/Rope.ts](src/components/game/Rope.ts)を作成
   - `RopeFactory`クラス:
     - `create()`: ロープのセグメント作成（円柱メッシュ、カプセルコライダー）
     - `connectSegments()`: Revolute Jointでセグメントを接続
     - `attachTreasure()`: 宝物をロープの最後のセグメントに接続
     - `cutJoint()`: ジョイントの切断
   - アンカーポイント: Kinematic Position Based（固定点として動かせる）
   - ジョイント: Revolute Joint（回転ジョイント、X軸周り）

4. **GameManagerコンポーネントの実装**
   - [src/components/game/GameManager.ts](src/components/game/GameManager.ts)を作成
   - 実装した機能:
     - `init()`: シーンと物理エンジンの参照を保持
     - `start()`: ゲーム開始
     - `spawnRopeWithTreasure()`: ロープ付き宝物の生成（左右指定可能）
     - `update()`: 各ロープの横移動処理、画面外判定
     - `removeRope()`: ロープの削除（ジョイント、セグメント、宝物、アンカー）
     - `getRopes()`: アクティブなロープのリスト取得
   - ロープの横移動: アンカーをKinematicで移動
   - 画面外判定: |x| > 10 で削除

5. **メインファイルの更新**
   - [src/main.ts](src/main.ts)を更新
   - GameManagerの初期化
   - テスト用にロープ付き宝物を3つ生成（左、右、左）
   - レンダリングループに`gameManager.update(deltaTime)`を追加

6. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **ロープの物理演算**: 複数のセグメントをRevolute Jointで連結し、柔軟な揺れを実現
- **Kinematic Body**: アンカーをKinematicにすることで、物理演算の影響を受けずに制御可能
- **ジョイントの接続**: 各セグメントの端点を正確に指定して連結
- **宝物の種類**: ランダムに金・銀・銅を選択し、スコアと質量が異なる
- **メモリ管理**: 画面外に出たロープを自動削除してメモリリークを防止

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、以下を確認:
   - 3本のロープ付き宝物が出現する
   - ロープが物理的に揺れている
   - ロープが画面を横切る（左から右、または右から左）
   - 宝物の色が異なる（金色、銀色、銅色）
   - 画面外に出たロープが消える
3. コンソールで以下のメッセージを確認:
   - `[GameManager] Initialized`
   - `[GameManager] Started`
   - `[GameManager] Spawned rope with XXX treasure (rope_0)`
   - `Game initialized successfully`
   - ロープが画面外に出た後: `[GameManager] Removed rope (rope_0)`

### 次のステップ

Step 2.4でクリックによるロープ切断を実装します。

## Step 2.4: クリックによるロープ切断 - 完了事項

### 完了した作業

1. **型定義の追加**
   - [src/types/game.ts](src/types/game.ts)に`CutResult`を追加
   - `CutResult`: 切断結果（成功フラグ、ロープID、セグメントインデックス、宝物設定）

2. **Ropeコンポーネントの更新**
   - [src/components/game/Rope.ts](src/components/game/Rope.ts)に`checkHit()`メソッドを追加
   - `checkHit()`: ロープセグメントとの当たり判定
     - 指定した点から各セグメントまでの距離を計算
     - 指定した半径内にあればヒットと判定
     - ヒットしたセグメントのインデックスを返す

3. **GameManagerコンポーネントの更新**
   - [src/components/game/GameManager.ts](src/components/game/GameManager.ts)にクリック処理を追加
   - 実装したメソッド:
     - `screenToWorld()`: スクリーン座標から3D空間座標への変換
       - Three.jsの`Raycaster`を使用
       - 正規化デバイス座標に変換
       - カメラから一定距離の3D座標を取得
     - `cutRopeAtPoint()`: 指定した3D座標でロープを切断
       - すべてのロープに対して当たり判定を実行
       - ヒットしたロープのジョイントを切断
       - 切断結果を返す
     - `handleClick()`: クリックイベントの処理
       - スクリーン座標を3D座標に変換
       - ロープ切断を試行
       - 結果をコンソールに出力

4. **メインファイルの更新**
   - [src/main.ts](src/main.ts)にクリックイベントリスナーを追加
   - `window.addEventListener('click', ...)` で`gameManager.handleClick()`を呼び出し

5. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **Raycaster**: Three.jsのRaycasterを使用してスクリーン座標を3D空間座標に変換
- **当たり判定**: セグメントの中心位置と指定点の距離で判定（半径0.5）
- **ジョイント切断**: セグメントインデックスに対応するジョイントを削除
- **物理演算**: 切断後は物理演算により自然に落下
- **メモリ管理**: 切断されたロープも画面外に出るまで保持し、自動削除

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、以下を確認:
   - 移動中のロープをクリックする
   - ロープが切断される
   - 切断された部分（宝物側）が物理的に落下する
   - 複数のロープで動作することを確認
3. コンソールで以下のメッセージを確認:
   - クリック時: `[GameManager] Cut rope rope_X at segment Y`
   - 切断成功時: `[GameManager] Cut successful! Treasure: XXX`

### 次のステップ

Step 2.5でスコアシステムを実装します。

## Step 2.5: スコアシステムの実装 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/score.ts](src/types/score.ts)を作成
   - `ScoreData`: スコアデータ（現在のスコア、コンボ、最大コンボ、宝物総数）
   - `ScoreEvent`: スコアイベント（得点、宝物の種類、コンボ、タイムスタンプ）

2. **ScoreManagerコンポーネントの実装**
   - [src/components/game/ScoreManager.ts](src/components/game/ScoreManager.ts)を作成
   - 実装した機能:
     - `init()`: スコアシステムの初期化
     - `addScore()`: スコアの加算とコンボ判定
       - 基本スコア: 宝物の種類に応じて（金: 100点、銀: 50点、銅: 30点）
       - コンボボーナス: コンボごとに10%増加（例: 3コンボなら1.2倍）
       - コンボタイムアウト: 3秒以内に次を切らないとリセット
     - `getScore()`: 現在のスコアデータ取得
     - `update()`: コンボタイムアウトチェック
     - `resetCombo()`: コンボのリセット
     - `reset()`: スコアデータの全リセット
     - `getEvents()`: スコアイベント履歴の取得

3. **ScoreDisplayコンポーネントの実装**
   - [src/components/ui/ScoreDisplay.ts](src/components/ui/ScoreDisplay.ts)を作成
   - 実装した機能:
     - `init()`: UI要素の作成と配置
       - スコア表示（左上、白色）
       - コンボ表示（スコアの下、黄色）
       - アニメーションコンテナ
     - `update()`: スコアとコンボの表示更新
       - コンボが2以上の場合のみ表示
     - `showScoreAnimation()`: スコア加算アニメーション
       - クリック位置に"+XXX"を表示
       - 上にフェードアウトしながら移動
       - 1秒後に自動削除
     - `dispose()`: UI要素のクリーンアップ

4. **GameManagerコンポーネントの更新**
   - [src/components/game/GameManager.ts](src/components/game/GameManager.ts)を更新
   - ScoreManagerとScoreDisplayを統合:
     - `init()`: ScoreManagerとScoreDisplayの初期化（containerを引数に追加）
     - `update()`: スコアマネージャーの更新とスコア表示の更新
     - `handleClick()`: ロープ切断時にスコア加算とアニメーション表示
     - `dispose()`: スコア表示のクリーンアップ

5. **メインファイルの更新**
   - [src/main.ts](src/main.ts)を更新
   - `gameManager.init()`にcontainer引数を追加

6. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **コンボシステム**: 3秒以内に連続してロープを切るとコンボが継続し、ボーナス得点
- **スコア計算**: 基本スコア × (1 + (コンボ - 1) × 0.1)
- **UI配置**: position: absolute で画面左上に固定配置
- **アニメーション**: CSS transitionを使用した滑らかなフェードアウト
- **メモリ管理**: アニメーション終了後にDOM要素を削除

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、以下を確認:
   - 画面左上にスコアが表示される
   - ロープを切ると宝物の種類に応じたスコアが加算される
   - 連続してロープを切るとコンボが表示される
   - コンボ中は得点にボーナスが付く
   - スコア加算時にクリック位置にアニメーションが表示される
   - 3秒以上間隔を空けるとコンボがリセットされる
3. コンソールで以下のメッセージを確認:
   - `[ScoreManager] Initialized`
   - `[ScoreDisplay] Initialized`
   - スコア加算時: `[ScoreManager] Score added: +XXX (treasure_type, xN combo)`
   - コンボリセット時: `[ScoreManager] Combo reset`

### Phase 2 完了

Phase 2のすべてのステップが完了しました。Three.jsによる3D描画、Rapierによる物理演算、ロープと宝物のゲームメカニクス、クリック操作、スコアシステムが実装されました。

次はPhase 3で、Phase 1のトラッキング機能とPhase 2のゲーム機能を統合し、手のジェスチャーでロープを切断できるようにします。

---

## Phase 3: ジェスチャー操作の統合

Phase 3では、Phase 1で実装したハンドトラッキング機能とPhase 2で実装したゲームコア機能を統合し、手のジェスチャーでロープを切断できるようにします。

詳細な実装計画は[doc/03_gesture_integration.md](03_gesture_integration.md)を参照してください。

## Step 3.1: ジェスチャー認識の実装 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/gesture.ts](src/types/gesture.ts)を作成
   - `GestureType`: ジェスチャーの種類（None, Victory, Closed_Fist, Open_Palm等）
   - `Handedness`: 手の種類（Left, Right）
   - `GestureData`: ジェスチャーデータ（ジェスチャー、手の種類、信頼度スコア）
   - `GestureEvent`: ジェスチャーイベント（イベントタイプ、前回のジェスチャー等）
   - `GestureTrackerConfig`: 設定
   - `GestureTrackerCallbacks`: コールバック定義

2. **GestureTrackerコンポーネントの実装**
   - [src/components/camera/GestureTracker.ts](src/components/camera/GestureTracker.ts)を作成
   - MediaPipe GestureRecognizerを使用してジェスチャー認識を実装
   - 実装した機能:
     - `init()`: GestureRecognizerの初期化（CDNからモデル読み込み）
     - `start()`: トラッキング開始（requestAnimationFrameループ）
     - `stop()`: トラッキング停止
     - `isTracking()`: 状態確認
     - `getGestures()`: 最新のジェスチャーデータ取得
     - `trackGestures()`: トラッキングループ（VIDEO modeで実行）
     - `onResults()`: MediaPipe結果の処理
     - `handleGestureChange()`: ジェスチャー変化の処理
   - ジェスチャー判定ロジック:
     - `Victory`ジェスチャーをピースサインとして検出
     - `Victory` → `Victory以外`への遷移でV閉じ動作を検出
     - 左右の手を独立して認識（各手の前回のジェスチャー状態を保持）
   - コールバック機能:
     - `onGestureChange`: ジェスチャー変化時
     - `onVictoryDetected`: Victoryジェスチャー検出時
     - `onVCloseAction`: V閉じ動作検出時

3. **TrackingManagerへの統合**
   - [src/components/camera/TrackingManager.ts](src/components/camera/TrackingManager.ts)を更新
   - GestureTrackerをHandTracker、FaceTrackerと並行して実行
   - 追加した機能:
     - `gestureTracker`インスタンスの追加
     - `lastGestureData`でジェスチャーデータを保持
     - `init()`でGestureTrackerを初期化
     - `start()`でGestureTrackerを開始（GestureTrackerCallbacks設定）
     - `stop()`でGestureTrackerを停止
     - `getGestureData()`でジェスチャーデータ取得
   - TrackingManagerCallbacksに追加:
     - `onGestureResults`: ジェスチャー結果のコールバック
     - `onVCloseAction`: V閉じ動作のコールバック

4. **main.tsの統合更新**
   - [src/main.ts](src/main.ts)を更新
   - Phase 1のトラッキング機能（カメラ、ハンドトラッキング、ジェスチャー認識）を有効化
   - Phase 2のゲーム機能と統合:
     - カメラ映像を背景に配置（z-index: -1）
     - デバッグcanvasを最前面に配置（z-index: 10）
     - TrackingManagerの初期化時にジェスチャー設定を追加
     - ジェスチャーコールバックを実装（コンソールログ出力）
     - Three.jsレンダラーの背景を透明に設定
     - パフォーマンス統計にトラッキング情報を追加

5. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **MediaPipe GestureRecognizer**: Hand Landmarkerの上位版で、ランドマーク検出とジェスチャー認識を同時実行
- **7種類の事前定義ジェスチャー**: Victory, Closed_Fist, Open_Palm, Pointing_Up, Thumb_Up, Thumb_Down, ILoveYou
- **V閉じ動作の判定**: Victoryから別のジェスチャー（またはNone）への遷移を検出
- **並行実行**: HandTracker（手の位置）とGestureTracker（ジェスチャー）を並行して実行
- **CDN使用**: MediaPipeのモデルファイルはCDN（`https://storage.googleapis.com/mediapipe-models/`）から読み込み

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、カメラを許可
3. 手でピースサインを作る
4. コンソールに「Victory」が検出されたことが表示される
5. ピースから手を閉じる（または他の形にする）動作をする
6. コンソールに「V-close action detected」が表示される
7. 左右の手で別々に認識されることを確認

### 次のステップ

Step 3.2で手の3Dモデル（カニの手）を実装し、トラッキングした手の位置に表示します。

---

## Phase 4: UI画面の実装

Phase 4では、ゲームの全体的なフローを完成させるためのUI画面を実装します。タイトル画面、セットアップ画面、設定画面、リザルト画面を作成し、画面遷移を管理します。

詳細な実装計画は[doc/04_ui_screens.md](04_ui_screens.md)を参照してください。

## Step 4.1: GameStateManagerとタイトル画面の実装 - 完了事項

### 完了した作業

1. **型定義ファイルの作成**
   - [src/types/ui.ts](src/types/ui.ts)を作成
   - `GameState`: ゲームの状態（title, setup, settings, playing, result）
   - `GameSettings`: ゲーム設定（カメラON/OFF、顔表示ON/OFF）
   - `ResultData`: リザルトデータ（スコア、最大コンボ、宝物総数）
   - `ScreenCallbacks`: 画面のコールバック定義

2. **GameStateManagerの実装**
   - [src/components/ui/GameStateManager.ts](src/components/ui/GameStateManager.ts)を作成
   - 実装した機能:
     - `init()`: 状態管理の初期化、コールバック設定
     - `setState()`: 状態の変更、画面遷移のトリガー
     - `getState()`: 現在の状態取得
     - `getSettings()`: 設定の取得
     - `updateSettings()`: 設定の更新と保存
     - `setResultData()` / `getResultData()`: リザルトデータの管理
     - `loadSettings()` / `saveSettings()`: localStorageとの連携
   - デフォルト設定: カメラON、顔表示ON
   - localStorageキー: "crab-game-settings"

3. **TitleScreenの実装**
   - [src/components/ui/TitleScreen.ts](src/components/ui/TitleScreen.ts)を作成
   - 実装した機能:
     - `init()`: タイトル画面の作成とコールバック設定
     - `show()` / `hide()`: 画面の表示/非表示
     - `dispose()`: クリーンアップ
   - UI要素:
     - ゲームタイトル「新春カニカニパニック!」
     - カメラ許可に関する注意事項
     - ゲームスタートボタン（playingへ遷移、Step 4.2でsetupへ変更予定）
     - 設定ボタン（settingsへ遷移予定）

4. **main.tsの全面リファクタリング**
   - [src/main.ts](src/main.ts)を更新
   - GameStateManagerとTitleScreenの導入:
     - アプリ起動時にGameStateManagerとTitleScreenを初期化
     - 初期状態をtitleに設定
   - 状態管理の実装:
     - `handleStateChange()`: 状態変化時の処理を一元管理
     - `startGame()`: playing状態でゲームを開始
     - `stopGame()`: title状態でゲームを停止・クリーンアップ
   - レンダリングループの分離:
     - `startRenderLoop()`: 独立した関数として実装
     - `animationFrameId`で管理し、停止可能に
   - メモリ管理の強化:
     - ゲーム停止時にすべてのリソースを適切にクリーンアップ
     - トラッキング、カメラ、シーン、物理エンジンの停止と削除
     - DOM要素（video, canvas）の削除

5. **CSSスタイルの追加**
   - [src/style.css](src/style.css)を大幅に拡張
   - 共通スタイル:
     - `.screen`: 画面全体のコンテナ（グラデーション背景）
     - `.btn`, `.btn-primary`, `.btn-secondary`: ボタンスタイル
     - `.button-container`: ボタン配置用コンテナ
   - タイトル画面専用スタイル:
     - グラデーションテキストのタイトル
     - 半透明背景の注意事項ボックス
   - セットアップ、設定、リザルト画面のスタイル（Step 4.2-4.4で使用予定）
   - レスポンシブ対応: スマートフォン向けの調整

6. **ビルド確認**
   - TypeScriptコンパイルエラーなし
   - ビルド成功

### 実装のポイント

- **状態駆動アーキテクチャ**: GameStateManagerが全体の状態を管理し、状態変化に応じて画面を切り替え
- **コールバックパターン**: 各画面からGameStateManagerへのコールバックで状態遷移を要求
- **メモリ管理**: ゲーム停止時にすべてのリソースを適切に解放し、メモリリークを防止
- **設定の永続化**: localStorageでゲーム設定を保存し、次回起動時に復元
- **段階的実装**: Step 4.2-4.4で追加する画面のスタイルも先行して実装

### 技術的課題と解決方法

**課題**: TypeScriptの型エラー（Handedness型のインポート）
- `Handedness`型は`types/tracking.ts`ではなく`types/gesture.ts`に定義されている
- インポート文を修正: `import type { Handedness } from "./types/gesture"`

**課題**: null安全性の警告
- コールバック内で`gameManager`がnullの可能性があるとの警告
- 適切なnullチェックを追加してTypeScriptの厳格な型チェックに対応

### 次のステップ

Step 4.2でセットアップ画面を実装し、カメラとトラッキングの初期化を段階的に表示します。
