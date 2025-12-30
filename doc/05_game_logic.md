# Phase 5: ゲームロジックの完成

Phase 5では、ゲームとして完成させるために必要なタイマーシステム、宝物の出現パターン、難易度調整を実装します。

## 目標

- 30秒間のゲームプレイが可能
- 適切なペースで宝物が出現
- プレイヤーが楽しめる難易度バランス
- 時間切れ時の自動リザルト画面遷移

## Step 5.1: タイマーシステムの実装

### 目的

30秒のカウントダウンタイマーを実装し、時間切れ時にゲームを終了してリザルト画面へ遷移する。

### タスク詳細

1. **型定義ファイルの作成**
   - [src/types/timer.ts](../src/types/timer.ts)を作成
   - `TimerConfig`: タイマー設定（制限時間）
   - `TimerCallbacks`: コールバック定義（時間更新、時間切れ）

2. **GameTimerコンポーネントの実装**
   - [src/components/game/GameTimer.ts](../src/components/game/GameTimer.ts)を作成
   - 実装するメソッド:
     - `init(config, callbacks)`: タイマー初期化、コールバック設定
     - `start()`: タイマー開始
     - `stop()`: タイマー停止
     - `pause()`: 一時停止
     - `resume()`: 再開
     - `getRemainingTime()`: 残り時間取得（秒）
     - `getElapsedTime()`: 経過時間取得（秒）
     - `isRunning()`: 動作状態確認
   - 内部実装:
     - `startTime`: 開始時刻（performance.now()）
     - `pausedTime`: 一時停止時の経過時間
     - `isPaused`: 一時停止フラグ
     - `updateLoop()`: requestAnimationFrameでの更新ループ
     - 毎フレーム残り時間をチェック、コールバック呼び出し
     - 時間切れ検出時に`onTimeUp`コールバックを実行

3. **TimerDisplayコンポーネントの実装**
   - [src/components/ui/TimerDisplay.ts](../src/components/ui/TimerDisplay.ts)を作成
   - 実装するメソッド:
     - `init(container)`: UI要素作成
     - `update(remainingTime)`: 表示更新
     - `showWarning()`: 残り時間わずかの警告表示（10秒以下で赤色）
     - `dispose()`: クリーンアップ
   - UI要素:
     - タイマー表示（画面右上、大きく表示）
     - 残り10秒以下で色を赤に変更
     - 残り5秒以下で点滅アニメーション

4. **GameManagerへの統合**
   - [src/components/game/GameManager.ts](../src/components/game/GameManager.ts)を更新
   - `gameTimer`と`timerDisplay`のインスタンス追加
   - `init()`でタイマーとタイマー表示を初期化
   - `start()`でタイマー開始、コールバック設定
     - `onTick`: 毎フレームタイマー表示を更新
     - `onTimeUp`: 時間切れ時に`endGame()`を呼び出す
   - `endGame()`メソッドの実装:
     - タイマー停止
     - ゲーム停止（ロープ生成停止）
     - スコアデータ取得
     - リザルト画面への遷移トリガー
   - `getGameTimer()`メソッドの追加（外部アクセス用）

5. **main.tsの更新**
   - [src/main.ts](../src/main.ts)を更新
   - `startGame()`でタイマーが開始されることを確認
   - `endGame()`の既存実装を`GameManager.endGame()`に置き換え
   - ESCキーによる強制終了は引き続き動作

6. **CSSスタイルの追加**
   - [src/style.css](../src/style.css)にタイマー表示用スタイル追加
   - `.timer-display`: 右上固定配置、大きなフォント
   - `.timer-warning`: 赤色スタイル
   - `.timer-critical`: 点滅アニメーション

### 完了条件

- [x] TimerConfigとTimerCallbacks型が定義されている
- [x] GameTimerが実装され、30秒のカウントダウンが動作する
- [x] TimerDisplayが実装され、画面右上にタイマーが表示される
- [x] 残り10秒以下で表示が赤色になる
- [x] 残り5秒以下で点滅する
- [x] 30秒経過時に自動的にゲームが終了する
- [x] リザルト画面にスコアが正しく表示される
- [x] ESCキーによる強制終了も引き続き動作する

### 検証方法

1. `pnpm run dev`でアプリを起動
2. タイトル画面からゲームを開始
3. 画面右上にタイマーが「30」から始まることを確認
4. タイマーが1秒ずつ減少することを確認
5. 残り10秒で赤色に変わることを確認
6. 残り5秒で点滅することを確認
7. 0秒になったら自動的にリザルト画面へ遷移することを確認
8. スコアが正しく表示されることを確認

---

## Step 5.2: 宝物の出現パターンの実装

### 目的

ゲームプレイ中、定期的に宝物が出現し、時間経過と共に難易度が上昇する仕組みを実装する。

### タスク詳細

1. **型定義の追加**
   - [src/types/game.ts](../src/types/game.ts)に追加
   - `SpawnConfig`: 出現設定（初期間隔、最小間隔、速度範囲）
   - `DifficultyConfig`: 難易度設定（速度カーブ、出現頻度カーブ）

2. **SpawnManagerコンポーネントの実装**
   - [src/components/game/SpawnManager.ts](../src/components/game/SpawnManager.ts)を作成
   - 実装するメソッド:
     - `init(config)`: 出現設定の初期化
     - `start()`: 出現開始
     - `stop()`: 出現停止
     - `update(deltaTime, elapsedTime)`: 出現処理
     - `getDifficultyMultiplier(elapsedTime)`: 経過時間に応じた難易度倍率（0-1）
     - `getSpawnInterval(elapsedTime)`: 現在の出現間隔
     - `getSpeed(elapsedTime)`: 現在の移動速度
   - 出現パターン:
     - 初期: 3秒ごとに出現、速度1.0
     - 中盤（15秒）: 2秒ごとに出現、速度1.5
     - 終盤（30秒）: 1.5秒ごとに出現、速度2.0
     - 左右からランダムに出現
     - 宝物の種類もランダム（金、銀、銅）
   - 難易度カーブ:
     - 線形補間で滑らかに難易度上昇
     - `difficulty = elapsedTime / totalTime`
     - `spawnInterval = initialInterval - (initialInterval - minInterval) * difficulty`
     - `speed = minSpeed + (maxSpeed - minSpeed) * difficulty`

3. **GameManagerへの統合**
   - [src/components/game/GameManager.ts](../src/components/game/GameManager.ts)を更新
   - `spawnManager`インスタンス追加
   - `init()`でSpawnManagerを初期化
   - `start()`でSpawnManagerを開始
   - `update()`でSpawnManagerを更新:
     - 経過時間を`gameTimer.getElapsedTime()`から取得
     - `spawnManager.update(deltaTime, elapsedTime)`を呼び出し
     - 出現タイミングでロープ付き宝物を生成
   - `stop()`でSpawnManagerを停止
   - テスト用の手動生成コードを削除

4. **難易度パラメータの調整**
   - 初期設定:
     ```typescript
     const spawnConfig: SpawnConfig = {
       initialInterval: 3.0,  // 初期出現間隔（秒）
       minInterval: 1.5,      // 最小出現間隔（秒）
       minSpeed: 1.0,         // 初期速度
       maxSpeed: 2.0,         // 最大速度
     };
     ```
   - 必要に応じて調整可能にする

5. **画面外削除の最適化**
   - 現在の画面外判定（|x| > 10）を確認
   - 速度に応じて判定範囲を調整する必要があるか検討
   - メモリリーク防止の確認

### 完了条件

- [x] SpawnConfigとDifficultyConfig型が定義されている
- [x] SpawnManagerが実装され、定期的に宝物が出現する
- [x] 時間経過と共に出現間隔が短くなる
- [x] 時間経過と共に移動速度が上がる
- [x] 左右からランダムに出現する
- [x] 宝物の種類がランダムに選ばれる
- [x] 30秒間、適切なペースで宝物が出現し続ける
- [x] 画面外に出たロープが自動削除される
- [x] テスト用の手動生成コードが削除されている

### 検証方法

1. `pnpm run dev`でアプリを起動
2. ゲームを開始
3. 開始直後は3秒ごとに宝物が出現することを確認
4. 時間が経つと出現間隔が短くなることを確認
5. 時間が経つと移動速度が上がることを確認
6. 左右からランダムに出現することを確認
7. 金・銀・銅の宝物がランダムに出現することを確認
8. 30秒間プレイして、適度な難易度であることを確認

---

## Step 5.3: 難易度調整とバランス調整

### 目的

実際にプレイして、ゲームバランスを調整し、適度な難易度に仕上げる。

### タスク詳細

1. **パラメータの外部化**
   - [src/config/gameConfig.ts](../src/config/gameConfig.ts)を作成
   - すべてのゲームパラメータを一箇所にまとめる:
     - タイマー設定（制限時間）
     - 出現設定（間隔、速度）
     - ロープ設定（セグメント数、長さ、剛性）
     - 宝物設定（種類、スコア、サイズ）
     - 当たり判定設定（判定半径）
     - コンボ設定（タイムアウト時間、ボーナス倍率）
   - 各コンポーネントでこの設定ファイルをインポート

2. **当たり判定の調整**
   - 現在の判定半径（0.5）が適切か確認
   - ロープの太さと判定サイズのバランス確認
   - 必要に応じて半径を調整（0.3〜0.8の範囲で試す）

3. **ロープ物理パラメータの調整**
   - ロープの揺れ具合を確認
   - セグメント数、長さ、質量が適切か確認
   - ジョイントの剛性（stiffness）を調整
   - 必要に応じて減衰（damping）を追加

4. **移動速度カーブの調整**
   - 初期速度と最終速度が適切か確認
   - 速度カーブが滑らかか確認
   - プレイヤーが追いつける難易度か確認

5. **出現間隔カーブの調整**
   - 初期間隔と最小間隔が適切か確認
   - 30秒間で適切な数の宝物が出現するか確認
   - 目安: 15〜25個程度が適切

6. **スコアバランスの調整**
   - 宝物の種類ごとのスコアが適切か確認
   - コンボボーナスが適切か確認
   - 30秒間で平均スコア500〜1500点程度を目標

7. **テストプレイとフィードバック**
   - 複数回プレイして以下を確認:
     - 簡単すぎないか
     - 難しすぎないか
     - 面白いか
     - バグがないか
   - 必要に応じてパラメータを再調整

8. **パフォーマンスチェック**
   - FPSが安定しているか確認
   - 30秒間プレイしてメモリリークがないか確認
   - コンソールエラーがないか確認

### 完了条件

- [x] gameConfig.tsにすべてのパラメータがまとまっている
- [x] 当たり判定が適切に動作する
- [x] ロープの物理挙動が自然
- [x] 移動速度が適切
- [x] 出現間隔が適切
- [x] スコアバランスが適切
- [x] 30秒間、安定して動作する
- [x] パフォーマンスが良好（30fps以上）
- [x] バグがない
- [x] ゲームが楽しい

### 検証方法

1. `pnpm run dev`でアプリを起動
2. 5回以上フルプレイする
3. 以下の点を確認:
   - ロープを切りやすいか
   - 難易度が適切か
   - スコアが適切に加算されるか
   - ゲームが楽しいか
4. FPS表示を確認し、パフォーマンスをチェック
5. コンソールでエラーがないことを確認
6. 必要に応じてgameConfig.tsのパラメータを調整
7. 調整後、再度テストプレイ

---

## Phase 5完了後の状態

Phase 5が完了すると、以下の状態になります:

- ✅ 30秒間のゲームプレイが可能
- ✅ タイマーが表示され、時間切れで自動終了
- ✅ 宝物が定期的に出現し、難易度が上昇
- ✅ 適切な難易度バランス
- ✅ 安定したパフォーマンス
- ✅ **ゲームとして完成**

次のPhase 6では、ビジュアルと演出を実装し、ゲームをより魅力的にします。
