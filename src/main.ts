import "./style.css";
import { CameraView } from "./components/camera/CameraView";
import { TrackingManager } from "./components/camera/TrackingManager";
import { GameManager } from "./components/game/GameManager";
import { Physics } from "./components/game/Physics";
import { Scene } from "./components/renderer/Scene";
import { GameStateManager } from "./components/ui/GameStateManager";
import { SettingsScreen } from "./components/ui/SettingsScreen";
import { SetupScreen } from "./components/ui/SetupScreen";
import { TitleScreen } from "./components/ui/TitleScreen";
import type { Handedness } from "./types/gesture";
import type { GameState } from "./types/ui";

// グローバル変数
let container: HTMLElement;
let gameStateManager: GameStateManager;
let titleScreen: TitleScreen;
let setupScreen: SetupScreen;
let settingsScreen: SettingsScreen;

// ゲーム関連の変数（setupで初期化）
let cameraView: CameraView | null = null;
let trackingManager: TrackingManager | null = null;
let scene: Scene | null = null;
let physics: Physics | null = null;
let gameManager: GameManager | null = null;
let animationFrameId: number | null = null;

async function main() {
	container = document.getElementById("app") as HTMLElement;
	if (!container) {
		console.error("Container element not found");
		return;
	}

	try {
		// GameStateManagerを初期化
		gameStateManager = new GameStateManager();
		gameStateManager.init({
			onStateChange: handleStateChange,
		});

		// TitleScreenを初期化
		titleScreen = new TitleScreen();
		titleScreen.init(container, {
			onStart: () => {
				// セットアップ画面へ遷移
				console.log("[Main] Start button clicked - transition to setup");
				gameStateManager.setState("setup");
			},
			onSettings: () => {
				// 設定画面へ遷移（Step 4.3で実装予定）
				console.log("[Main] Settings button clicked - transition to settings");
				gameStateManager.setState("settings");
			},
		});

		// SetupScreenを初期化
		setupScreen = new SetupScreen();
		setupScreen.init(container, {
			onBack: () => {
				// タイトル画面に戻る
				console.log("[Main] Back button clicked - transition to title");
				gameStateManager.setState("title");
			},
		});

		// SettingsScreenを初期化
		settingsScreen = new SettingsScreen();
		settingsScreen.init(container, {
			onSave: (settings) => {
				// 設定を保存してタイトル画面に戻る
				console.log("[Main] Settings saved:", settings);
				gameStateManager.updateSettings(settings);
				gameStateManager.setState("title");
			},
			onCancel: () => {
				// タイトル画面に戻る
				console.log("[Main] Settings cancelled - transition to title");
				gameStateManager.setState("title");
			},
		});

		// 初期状態をtitleに設定
		gameStateManager.setState("title");

		console.log("Application initialized successfully");
	} catch (error) {
		console.error("Error:", error);
		showError(`エラー: ${error}`);
	}
}

/**
 * 状態変化時の処理
 */
async function handleStateChange(newState: GameState) {
	console.log(`[Main] Handling state change to: ${newState}`);

	// 全画面を非表示
	titleScreen.hide();
	setupScreen.hide();
	settingsScreen.hide();
	// TODO: Step 4.4で他の画面も非表示にする

	switch (newState) {
		case "title":
			titleScreen.show();
			// ゲームを停止
			stopGame();
			break;

		case "setup":
			setupScreen.show();
			// セットアップ処理を実行
			await runSetup();
			break;

		case "settings":
			settingsScreen.show();
			// 現在の設定を画面に反映
			const currentSettings = gameStateManager.getSettings();
			settingsScreen.loadSettings(currentSettings);
			break;

		case "playing":
			// ゲームを開始
			await startGame();
			break;

		case "result":
			// TODO: Step 4.4で実装
			console.log("[Main] Result state - TODO: implement in Step 4.4");
			break;
	}
}

/**
 * セットアップ処理（カメラとトラッキングの初期化）
 */
async function runSetup() {
	console.log("[Main] Running setup...");

	try {
		// Step 1: カメラ初期化
		setupScreen.setStatus("カメラを起動中...");
		setupScreen.setProgress(0);

		cameraView = new CameraView();
		await cameraView.init({
			width: 1280,
			height: 720,
			facingMode: "user",
		});

		setupScreen.setProgress(25);
		setupScreen.setStatus("カメラへのアクセスを待っています...");

		await cameraView.start();

		setupScreen.setProgress(50);
		console.log("[Main] Camera started successfully");

		// Step 2: トラッキング初期化
		setupScreen.setStatus("トラッキングを初期化中...");

		trackingManager = new TrackingManager();
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
				onHandResults: () => {},
				onFaceResults: () => {},
				onGestureResults: () => {},
				onVCloseAction: () => {},
				onError: (error) => {
					console.error("[Tracking Error]", error);
				},
			},
		);

		setupScreen.setProgress(75);
		console.log("[Main] Tracking initialized successfully");

		// Step 3: 完了
		setupScreen.setStatus("準備完了！");
		setupScreen.setProgress(100);

		// 1秒待ってからゲーム画面へ遷移
		await new Promise((resolve) => setTimeout(resolve, 1000));
		gameStateManager.setState("playing");
	} catch (error) {
		console.error("[Main] Setup error:", error);
		setupScreen.showError(
			error instanceof Error ? error.message : String(error),
		);

		// カメラやトラッキングをクリーンアップ
		if (trackingManager) {
			trackingManager.stop();
			trackingManager = null;
		}
		if (cameraView) {
			cameraView.stop();
			cameraView = null;
		}
	}
}

/**
 * ゲームを開始
 */
async function startGame() {
	console.log("[Main] Starting game...");

	try {
		// カメラとトラッキングは既にrunSetupで初期化済み
		if (!cameraView || !trackingManager) {
			throw new Error("Camera and tracking must be initialized first");
		}

		// video要素をDOMに追加
		const videoElement = cameraView.getVideoElement();
		videoElement.style.width = "100vw";
		videoElement.style.height = "100vh";
		videoElement.style.objectFit = "cover";
		videoElement.style.position = "absolute";
		videoElement.style.top = "0";
		videoElement.style.left = "0";
		videoElement.style.zIndex = "-1"; // 背景にする
		videoElement.style.transform = "scaleX(-1)"; // 左右反転（鏡像）
		container.appendChild(videoElement);
		console.log("Camera started successfully");

		// デバッグ用canvas作成
		const debugCanvas = document.createElement("canvas");
		debugCanvas.width = window.innerWidth;
		debugCanvas.height = window.innerHeight;
		debugCanvas.style.position = "absolute";
		debugCanvas.style.top = "0";
		debugCanvas.style.left = "0";
		debugCanvas.style.pointerEvents = "none";
		debugCanvas.style.zIndex = "10"; // 最前面
		debugCanvas.style.transform = "scaleX(-1)"; // 左右反転（カメラに合わせる）
		container.appendChild(debugCanvas);

		// Phase 2: Three.jsシーンとゲームのセットアップ
		console.log("Step 2: Setting up 3D scene...");
		scene = new Scene();
		scene.init(container, {
			backgroundColor: 0x000000,
			cameraFov: 75,
			cameraNear: 0.1,
			cameraFar: 1000,
		});

		// Three.jsのcanvasを中層に配置
		const threeCanvas = scene.getRenderer().domElement;
		threeCanvas.style.position = "absolute";
		threeCanvas.style.top = "0";
		threeCanvas.style.left = "0";
		threeCanvas.style.zIndex = "1"; // カメラ映像(-1)の上、デバッグcanvas(10)の下

		console.log("Step 3: Initializing physics...");
		physics = new Physics();
		await physics.init({
			gravity: { x: 0, y: -9.81, z: 0 },
			timeStep: 1 / 60,
		});

		console.log("Step 4: Initializing game manager...");
		gameManager = new GameManager();
		gameManager.init(scene, physics, container);
		gameManager.start();

		// TrackingManagerのコールバックを再設定
		console.log("Step 5: Setting up tracking callbacks...");
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
					if (!gameManager) return;
					// 手の位置をGameManagerに通知
					hands.forEach((hand) => {
						// ランドマーク8（人差し指の先端）の座標を使用
						const indexFingerTip = hand.landmarks[8];
						if (indexFingerTip && gameManager) {
							gameManager.updateHandPosition(
								hand.handedness,
								indexFingerTip.x,
								indexFingerTip.y,
							);
						}
					});

					// 検出されなかった手を非表示にする
					if (gameManager) {
						const detectedHands = new Set(hands.map((h) => h.handedness));
						if (!detectedHands.has("Left")) {
							gameManager.hideHand("Left");
						}
						if (!detectedHands.has("Right")) {
							gameManager.hideHand("Right");
						}
					}
				},
				onFaceResults: () => {
					// 顔のトラッキングは現在使用しない
				},
				onGestureResults: (gestures) => {
					if (!gameManager) return;
					// ジェスチャーに応じて手の状態を更新
					gestures.forEach((gesture, handedness) => {
						if (gameManager) {
							const isVictory = gesture.gesture === "Victory";
							gameManager.updateHandGesture(handedness, isVictory);
						}
					});
				},
				onVCloseAction: (handedness: Handedness) => {
					console.log(`[V-Close Action] Detected on ${handedness} hand!`);
					if (!gameManager) return;
					// ジェスチャーでロープを切断
					gameManager.handleVCloseAction(handedness);
				},
				onError: (error) => {
					console.error("[Tracking Error]", error);
				},
			},
		);

		// デバッグ描画を有効化
		trackingManager.enableDebug(debugCanvas);

		// トラッキング開始
		console.log("Step 6: Starting tracking...");
		await trackingManager.start(videoElement);
		console.log("Tracking started successfully");

		// テスト用にロープ付き宝物を3つ生成
		setTimeout(() => gameManager?.spawnRopeWithTreasure("left"), 500);
		setTimeout(() => gameManager?.spawnRopeWithTreasure("right"), 1000);
		setTimeout(() => gameManager?.spawnRopeWithTreasure("left"), 1500);

		// クリックイベントリスナーを追加（デバッグ用）
		window.addEventListener("click", handleClick);

		console.log("Game initialized successfully");

		// レンダリングループを開始
		startRenderLoop();

		// パフォーマンス統計を定期的に表示
		setInterval(() => {
			if (!scene || !trackingManager) return;
			const sceneStats = scene.getStats();
			const trackingStats = trackingManager.getPerformanceStats();
			console.log(
				`[Scene] FPS: ${sceneStats.fps}, Draw Calls: ${sceneStats.drawCalls}, Triangles: ${sceneStats.triangles}`,
			);
			console.log(
				`[Tracking] FPS: ${trackingStats.fps}, Hand: ${(trackingStats.handDetectionRate * 100).toFixed(1)}%, Face: ${(trackingStats.faceDetectionRate * 100).toFixed(1)}%`,
			);
		}, 5000);
	} catch (error) {
		console.error("Error starting game:", error);
		showError(`ゲーム開始エラー: ${error}`);
		gameStateManager.setState("title");
	}
}

/**
 * ゲームを停止
 */
function stopGame() {
	console.log("[Main] Stopping game...");

	// レンダリングループを停止
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	// クリックイベントリスナーを削除
	window.removeEventListener("click", handleClick);

	// トラッキングを停止
	if (trackingManager) {
		trackingManager.stop();
		trackingManager = null;
	}

	// カメラを停止
	if (cameraView) {
		cameraView.stop();
		// video要素を削除
		const videoElement = cameraView.getVideoElement();
		if (videoElement.parentElement) {
			videoElement.parentElement.removeChild(videoElement);
		}
		cameraView = null;
	}

	// シーンを停止
	if (scene) {
		scene.stop();
		// canvasを削除
		const canvas = scene.getRenderer().domElement;
		if (canvas.parentElement) {
			canvas.parentElement.removeChild(canvas);
		}
		scene = null;
	}

	// 物理エンジンをクリア
	physics = null;

	// ゲームマネージャーをクリア
	gameManager = null;

	// デバッグcanvasを削除
	const debugCanvas = document.querySelector("canvas");
	if (debugCanvas?.parentElement) {
		debugCanvas.parentElement.removeChild(debugCanvas);
	}

	console.log("[Main] Game stopped");
}

/**
 * レンダリングループを開始
 */
function startRenderLoop() {
	let lastTime = performance.now();

	const animate = () => {
		animationFrameId = requestAnimationFrame(animate);

		if (!scene || !physics || !gameManager) return;

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
}

/**
 * クリックイベントハンドラ
 */
function handleClick(event: MouseEvent) {
	if (gameManager) {
		gameManager.handleClick(event);
	}
}

/**
 * エラーメッセージを表示
 */
function showError(message: string) {
	const errorDiv = document.createElement("div");
	errorDiv.textContent = message;
	errorDiv.style.color = "red";
	errorDiv.style.padding = "20px";
	errorDiv.style.fontSize = "16px";
	errorDiv.style.position = "absolute";
	errorDiv.style.top = "50%";
	errorDiv.style.left = "50%";
	errorDiv.style.transform = "translate(-50%, -50%)";
	errorDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
	errorDiv.style.borderRadius = "8px";
	errorDiv.style.zIndex = "1000";
	container?.appendChild(errorDiv);
}

main();
