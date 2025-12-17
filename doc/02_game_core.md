# Phase 2: ゲームコア機能 - 詳細実装計画書

## 概要

Phase 2では、Three.jsを使った3D描画とRapierを使った物理演算を実装し、ロープと宝物の基本的なゲームメカニクスを構築します。

## Step 2.1: Three.jsシーンのセットアップ

### 目的
Three.jsの基本的な3Dシーンを構築し、レンダリングループを確立する。

### タスク詳細

1. **型定義の作成** (`src/types/scene.ts`)
   ```typescript
   export interface SceneConfig {
     backgroundColor: number;
     cameraFov: number;
     cameraNear: number;
     cameraFar: number;
   }

   export interface RenderStats {
     fps: number;
     drawCalls: number;
     triangles: number;
   }
   ```

2. **Sceneコンポーネントの実装** (`src/components/renderer/Scene.ts`)
   - Three.jsのシーン、カメラ、レンダラーの初期化
   - ライティングの設定（AmbientLight + DirectionalLight）
   - ウィンドウリサイズ対応
   - レンダリングループの実装
   - デバッグ用のテストオブジェクト（回転するキューブ）の表示

3. **主要メソッド**
   - `init(container: HTMLElement, config?: SceneConfig): void`
   - `start(): void` - レンダリングループ開始
   - `stop(): void` - レンダリングループ停止
   - `resize(): void` - ウィンドウリサイズ処理
   - `getCamera(): THREE.Camera`
   - `getScene(): THREE.Scene`
   - `addObject(object: THREE.Object3D): void`
   - `removeObject(object: THREE.Object3D): void`

### 完了条件
- [x] Three.jsのシーンが正しく初期化される
- [x] 画面に3Dオブジェクト（テストキューブ）が表示される
- [x] オブジェクトがアニメーション（回転）している
- [x] ウィンドウリサイズ時に正しく追従する
- [x] TypeScriptコンパイルエラーなし

### 検証方法
1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、回転するキューブが表示されることを確認
3. ウィンドウをリサイズして、表示が崩れないことを確認

---

## Step 2.2: Rapier物理エンジンの統合

### 目的
Rapierの物理エンジンを初期化し、基本的な物理演算が動作することを確認する。

### タスク詳細

1. **型定義の作成** (`src/types/physics.ts`)
   ```typescript
   import type RAPIER from '@dimforge/rapier3d-compat';

   export interface PhysicsConfig {
     gravity: { x: number; y: number; z: number };
     timeStep: number;
   }

   export interface RigidBodyHandle {
     handle: number;
     mesh: THREE.Mesh;
   }
   ```

2. **Physicsコンポーネントの実装** (`src/components/game/Physics.ts`)
   - Rapierの動的インポートと初期化
   - 物理ワールドの作成
   - 重力の設定
   - 物理ステップの実行
   - Three.jsメッシュと物理オブジェクトの同期
   - デバッグ用の落下するボールの追加

3. **主要メソッド**
   - `init(config?: PhysicsConfig): Promise<void>`
   - `step(): void` - 物理演算を1ステップ進める
   - `createRigidBody(desc: RAPIER.RigidBodyDesc): RAPIER.RigidBody`
   - `createCollider(desc: RAPIER.ColliderDesc, body: RAPIER.RigidBody): RAPIER.Collider`
   - `getWorld(): RAPIER.World`
   - `syncMeshes(): void` - 物理オブジェクトの位置をThree.jsメッシュに反映

### 完了条件
- [x] Rapierが正しく初期化される
- [x] 物理ワールドが作成される
- [x] デバッグ用のボールが画面上から落下する
- [x] ボールが地面（または画面外）に到達する
- [x] 物理演算とThree.jsの描画が正しく同期している
- [x] TypeScriptコンパイルエラーなし

### 検証方法
1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、ボールが落下することを確認
3. 物理演算が滑らかに動作することを確認

---

## Step 2.3: ロープと宝物の実装

### 目的
ロープの物理演算を実装し、ロープに吊られた宝物が画面を横切るようにする。

### タスク詳細

1. **型定義の作成** (`src/types/game.ts`)
   ```typescript
   export interface RopeSegment {
     body: RAPIER.RigidBody;
     mesh: THREE.Mesh;
   }

   export interface RopeConfig {
     segmentCount: number;
     segmentLength: number;
     segmentRadius: number;
     mass: number;
   }

   export interface TreasureConfig {
     type: 'gold' | 'silver' | 'bronze';
     score: number;
     mass: number;
     size: number;
   }

   export interface RopeWithTreasure {
     id: string;
     segments: RopeSegment[];
     treasure: {
       body: RAPIER.RigidBody;
       mesh: THREE.Mesh;
       config: TreasureConfig;
     };
     joints: RAPIER.ImpulseJoint[];
     direction: 'left' | 'right';
     speed: number;
   }
   ```

2. **Ropeコンポーネントの実装** (`src/components/game/Rope.ts`)
   - ロープのセグメントを物理演算で連結
   - ジョイント（関節）による接続
   - ロープの描画（円柱メッシュの連結）
   - ロープの更新処理（位置同期）

3. **Treasureコンポーネントの実装** (`src/components/game/Treasure.ts`)
   - 宝物の種類ごとの設定
   - 宝物の3Dモデル（仮で基本形状）
   - 宝物の物理ボディ作成

4. **GameManagerコンポーネントの実装** (`src/components/game/GameManager.ts`)
   - ロープ付き宝物の生成
   - 画面左右からの出現ロジック
   - 横移動の制御（固定速度）
   - 画面外に出た際の削除処理
   - アクティブなロープのリスト管理

5. **主要メソッド**

   **Rope.ts:**
   - `create(physics: Physics, startPos: Vector3, config: RopeConfig): RopeSegment[]`
   - `attachTreasure(segments: RopeSegment[], treasure: Treasure): void`
   - `update(): void`
   - `cut(segmentIndex: number): void` - 後のステップで実装

   **Treasure.ts:**
   - `create(physics: Physics, position: Vector3, config: TreasureConfig): Treasure`
   - `update(): void`

   **GameManager.ts:**
   - `init(scene: Scene, physics: Physics): void`
   - `start(): void`
   - `spawnRopeWithTreasure(direction: 'left' | 'right'): void`
   - `update(deltaTime: number): void`
   - `getRopes(): RopeWithTreasure[]`

### 完了条件
- [x] ロープが物理演算で正しく動作する
- [x] ロープのセグメントがジョイントで接続されている
- [x] ロープの最下部に宝物が吊られている
- [x] ロープ付き宝物が画面左から右（または右から左）へ移動する
- [x] ロープが物理的に揺れる
- [x] 画面外に出たロープが自動的に削除される
- [x] TypeScriptコンパイルエラーなし

### 検証方法
1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、ロープ付き宝物が出現することを確認
3. ロープが物理的に揺れていることを確認
4. 宝物が画面を横切ることを確認
5. 画面外に出た後、オブジェクトが削除されることを確認（メモリリーク防止）

---

## Step 2.4: クリックによるロープ切断

### 目的
マウスクリックでロープを切断し、宝物を落下させる。

### タスク詳細

1. **型定義の追加** (`src/types/game.ts`)
   ```typescript
   export interface CutResult {
     success: boolean;
     ropeId: string;
     segmentIndex: number;
     treasure: TreasureConfig;
   }
   ```

2. **Ropeコンポーネントの更新**
   - `cut(segmentIndex: number): void` - ジョイントの削除
   - `checkHit(point: Vector3, radius: number): number | null` - 当たり判定

3. **GameManagerコンポーネントの更新**
   - クリックイベントの処理
   - スクリーン座標から3D空間座標への変換（Raycaster使用）
   - ロープとの当たり判定
   - 切断処理の実行
   - 切断後の宝物の管理（落下中のトラッキング）

4. **主要メソッド**
   - `handleClick(event: MouseEvent): void`
   - `screenToWorld(screenX: number, screenY: number): Vector3`
   - `cutRopeAtPoint(point: Vector3): CutResult | null`

### 完了条件
- [x] マウスクリックが正しく検出される
- [x] クリック位置が3D空間の座標に変換される
- [x] ロープとの当たり判定が正しく動作する
- [x] クリックでロープが切断される
- [x] 切断後、宝物が物理的に落下する
- [x] TypeScriptコンパイルエラーなし

### 検証方法
1. `pnpm run dev`でアプリを起動
2. ブラウザで画面を開き、移動中のロープをクリック
3. ロープが切れて宝物が落下することを確認
4. 複数のロープで動作することを確認

---

## Step 2.5: スコアシステムの実装

### 目的
ロープを切って宝物を落下させた際にスコアを加算し、画面に表示する。

### タスク詳細

1. **型定義の作成** (`src/types/score.ts`)
   ```typescript
   export interface ScoreData {
     current: number;
     combo: number;
     maxCombo: number;
     totalTreasures: number;
   }

   export interface ScoreEvent {
     points: number;
     treasureType: string;
     combo: number;
     timestamp: number;
   }
   ```

2. **ScoreManagerコンポーネントの実装** (`src/components/game/ScoreManager.ts`)
   - スコアの管理
   - コンボカウンターの実装
   - スコア加算処理
   - コンボのリセット処理（時間経過）
   - スコアイベントの記録

3. **UI表示の実装** (`src/components/ui/ScoreDisplay.ts`)
   - スコア表示のDOM要素作成
   - リアルタイム更新
   - コンボ表示
   - アニメーション効果（スコア加算時）

4. **GameManagerの更新**
   - ScoreManagerとの連携
   - 宝物落下時のスコア加算
   - コンボ判定のタイミング管理

5. **主要メソッド**

   **ScoreManager.ts:**
   - `init(): void`
   - `addScore(treasure: TreasureConfig): ScoreEvent`
   - `getScore(): ScoreData`
   - `resetCombo(): void`
   - `reset(): void`

   **ScoreDisplay.ts:**
   - `init(container: HTMLElement): void`
   - `update(scoreData: ScoreData): void`
   - `showScoreAnimation(points: number, position?: Vector2): void`

### 完了条件
- [x] ロープを切ると宝物の種類に応じたスコアが加算される
- [x] スコアが画面上に表示される
- [x] コンボシステムが動作する（短時間に複数切るとボーナス）
- [x] コンボカウンターが表示される
- [x] スコア加算時にアニメーションが表示される
- [x] TypeScriptコンパイルエラーなし

### 検証方法
1. `pnpm run dev`でアプリを起動
2. ロープを切って宝物を落下させる
3. スコアが加算されて表示されることを確認
4. 連続してロープを切り、コンボが発生することを確認
5. 時間を空けるとコンボがリセットされることを確認

---

## 実装の進め方

1. **各Stepを順番に実装する**
   - Step 2.1が完了してからStep 2.2に進む
   - 各Step完了時に動作確認を行う

2. **main.tsの段階的更新**
   - 各Stepで必要な初期化処理を追加
   - Phase 1のトラッキング機能は一時的にコメントアウトしても可
   - Phase 2の機能が動作確認できればOK

3. **デバッグ機能の維持**
   - 物理演算のデバッグ表示
   - ロープの当たり判定の可視化
   - コンソールへのログ出力

4. **注意事項**
   - Three.jsとRapierの座標系の違いに注意
   - メモリリークに注意（不要なオブジェクトの削除）
   - パフォーマンスを考慮（物理演算の負荷）

---

## 次のステップ

Phase 2完了後は、Phase 3でジェスチャー操作を統合します。
Phase 1のトラッキング機能とPhase 2のゲーム機能を組み合わせて、手のジェスチャーでロープを切断できるようにします。
