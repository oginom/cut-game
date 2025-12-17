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
- 計画書のチェックボックスを更新する
- 動作確認を行い、問題がないことを確認する
- **各Stepの完了後、必ずユーザーの確認を取る**

**一度に複数のStepを実装しない**ことが重要です。段階的な実装により、問題の早期発見と修正が可能になります。

**重要**: 各Step完了後は、implementation-guideに完了内容を記録し、ユーザーに報告して次のStepへの承認を得てから進めてください。

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
