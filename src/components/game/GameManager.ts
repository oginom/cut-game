import * as THREE from "three";
import type { CutResult, RopeConfig, RopeWithTreasure } from "../../types/game";
import type { Handedness } from "../../types/gesture";
import { convertTo3D } from "../../utils/coordinates";
import { CrabHand } from "../renderer/CrabHand";
import type { Scene } from "../renderer/Scene";
import { ScoreDisplay } from "../ui/ScoreDisplay";
import { TimerDisplay } from "../ui/TimerDisplay";
import type { Physics } from "./Physics";
import {
	attachTreasureToRope,
	checkRopeHitRaycast,
	connectRopeSegments,
	createRope,
	cutRopeJoint,
} from "./Rope";
import { GameTimer } from "./GameTimer";
import { ScoreManager } from "./ScoreManager";
import { SpawnManager } from "./SpawnManager";
import { createTreasure, getTreasureConfig } from "./Treasure";

export class GameManager {
	private scene: Scene | null = null;
	private physics: Physics | null = null;
	private ropes: Map<string, RopeWithTreasure> = new Map();
	private ropeIdCounter: number = 0;
	private scoreManager: ScoreManager = new ScoreManager();
	private scoreDisplay: ScoreDisplay = new ScoreDisplay();
	private gameTimer: GameTimer = new GameTimer();
	private timerDisplay: TimerDisplay = new TimerDisplay();
	private spawnManager: SpawnManager = new SpawnManager();
	private onGameEnd: (() => void) | null = null;

	// カニの手（左右）
	private leftHand: CrabHand | null = null;
	private rightHand: CrabHand | null = null;

	// 手の現在位置（V閉じアクション時のロープ切断に使用）
	private leftHandPosition: THREE.Vector3 | null = null;
	private rightHandPosition: THREE.Vector3 | null = null;

	// デバッグ用：当たり判定の可視化
	private debugHitSphere: THREE.Mesh | null = null;
	private readonly HIT_SPHERE_COLOR_NORMAL = 0x00ff00; // 緑（通常時）
	private readonly HIT_SPHERE_COLOR_CUTTING = 0xff0000; // 赤（切る時）

	// デフォルトのロープ設定
	private readonly defaultRopeConfig: RopeConfig = {
		segmentCount: 5,
		segmentLength: 0.3,
		segmentRadius: 0.05,
		mass: 0.5,
	};

	/**
	 * 初期化
	 */
	public init(
		scene: Scene,
		physics: Physics,
		container: HTMLElement,
		onGameEnd?: () => void,
	): void {
		this.scene = scene;
		this.physics = physics;
		this.onGameEnd = onGameEnd || null;

		// スコアマネージャーの初期化
		this.scoreManager.init();

		// スコア表示の初期化
		this.scoreDisplay.init(container);

		// タイマー表示の初期化
		this.timerDisplay.init(container);

		// タイマーの初期化（30秒）
		this.gameTimer.init(
			{ duration: 30 },
			{
				onTick: (remainingTime) => {
					this.timerDisplay.update(remainingTime);
				},
				onTimeUp: () => {
					this.endGame();
				},
			},
		);

		// SpawnManagerの初期化
		this.spawnManager.init(
			{
				initialInterval: 3.0, // 初期3秒ごと
				minInterval: 1.5, // 最小1.5秒ごと
				minSpeed: 1.0, // 初期速度
				maxSpeed: 2.0, // 最大速度
			},
			{
				totalDuration: 30, // 30秒でフル難易度
			},
			(direction, speed) => {
				// 宝物を生成
				const ropeId = this.spawnRopeWithTreasure(direction);
				// 生成されたロープの速度を設定
				const rope = this.ropes.get(ropeId);
				if (rope) {
					rope.speed = speed;
				}
			},
		);

		// カニの手を初期化
		this.leftHand = new CrabHand({ color: 0xff6347 }); // 赤色
		this.rightHand = new CrabHand({ color: 0xff6347 }); // 赤色

		// シーンに追加
		scene.addObject(this.leftHand.getGroup());
		scene.addObject(this.rightHand.getGroup());

		// 初期位置（画面外）
		this.leftHand.setPosition(-100, -100, 0);
		this.rightHand.setPosition(-100, -100, 0);

		// デバッグ用の当たり判定球を作成
		const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16); // 当たり判定の半径と同じ
		const sphereMaterial = new THREE.MeshBasicMaterial({
			color: this.HIT_SPHERE_COLOR_NORMAL,
			transparent: true,
			opacity: 0.3,
			wireframe: true,
		});
		this.debugHitSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		this.debugHitSphere.visible = true; // 常に表示
		this.debugHitSphere.position.set(-100, -100, 0); // 初期位置は画面外
		scene.addObject(this.debugHitSphere);

		console.log("[GameManager] Initialized");
	}

	/**
	 * ゲーム開始
	 */
	public start(): void {
		// タイマーを開始
		this.gameTimer.start();

		// 宝物の出現を開始
		this.spawnManager.start();

		console.log("[GameManager] Started");
	}

	/**
	 * ゲーム終了
	 */
	public endGame(): void {
		// タイマーを停止
		this.gameTimer.stop();

		// 宝物の出現を停止
		this.spawnManager.stop();

		console.log("[GameManager] Game ended");

		// ゲーム終了コールバックを呼び出し
		if (this.onGameEnd) {
			this.onGameEnd();
		}
	}

	/**
	 * ロープ付き宝物を生成
	 */
	public spawnRopeWithTreasure(direction: "left" | "right"): string {
		if (!this.scene || !this.physics) {
			throw new Error("[GameManager] Not initialized");
		}

		const id = `rope_${this.ropeIdCounter++}`;

		// 出現位置を決定
		const startX = direction === "left" ? -8 : 8;
		const startY = 3;
		const startZ = 0;
		const startPos = new THREE.Vector3(startX, startY, startZ);

		// ロープを作成
		const { segments, anchorBody } = createRope(
			this.physics,
			startPos,
			this.defaultRopeConfig,
		);

		// セグメントを接続
		const joints = connectRopeSegments(
			this.physics,
			anchorBody,
			segments,
			this.defaultRopeConfig.segmentLength,
		);

		// 宝物を作成（ランダムに種類を選択）
		const treasureTypes: ("gold" | "silver" | "bronze")[] = [
			"gold",
			"silver",
			"bronze",
		];
		const treasureType =
			treasureTypes[Math.floor(Math.random() * treasureTypes.length)];
		const treasureConfig = getTreasureConfig(treasureType);

		const treasureY =
			startY - this.defaultRopeConfig.segmentLength * segments.length - 0.5;
		const treasure = createTreasure(
			this.physics,
			new THREE.Vector3(startX, treasureY, startZ),
			treasureConfig,
		);

		// 宝物をロープに接続
		const treasureJoint = attachTreasureToRope(
			this.physics,
			segments[segments.length - 1],
			treasure,
			this.defaultRopeConfig.segmentLength,
		);
		joints.push(treasureJoint);

		// シーンに追加
		for (const segment of segments) {
			this.scene.addObject(segment.mesh);
		}
		this.scene.addObject(treasure.mesh);

		// ロープのデータを保存
		const ropeWithTreasure: RopeWithTreasure = {
			id,
			segments,
			treasure,
			joints,
			direction,
			speed: 1.0, // 1秒あたり1単位移動
			anchorBody,
			isCut: false, // 初期状態は未切断
		};

		this.ropes.set(id, ropeWithTreasure);

		console.log(
			`[GameManager] Spawned rope with ${treasureType} treasure (${id})`,
		);
		console.log(
			`  ロープ位置: X=${startX}, Y=${startY}, Z=${startZ} (direction: ${direction})`,
		);
		console.log(
			`  ロープのX範囲: ${direction === "left" ? `${startX} → 0 (中央へ移動)` : `${startX} → 0 (中央へ移動)`}`,
		);

		return id;
	}

	/**
	 * 更新処理
	 */
	public update(deltaTime: number): void {
		if (!this.physics) return;

		const RAPIER = this.physics.getRAPIER();

		// 経過時間を取得
		const elapsedTime = this.gameTimer.getElapsedTime();

		// SpawnManagerの更新（宝物の出現）
		this.spawnManager.update(deltaTime, elapsedTime);

		// 各ロープを移動
		this.ropes.forEach((rope) => {
			const translation = rope.anchorBody.translation();
			const moveDistance = rope.speed * deltaTime;
			const newX =
				rope.direction === "left"
					? translation.x + moveDistance
					: translation.x - moveDistance;

			// アンカーの位置を更新（Kinematicボディ）
			rope.anchorBody.setNextKinematicTranslation(
				new RAPIER.Vector3(newX, translation.y, translation.z),
			);

			// 画面外に出たら削除
			if (Math.abs(newX) > 10) {
				this.removeRope(rope.id);
			}
		});

		// スコアマネージャーの更新（コンボタイムアウトチェック）
		this.scoreManager.update();

		// スコア表示の更新
		this.scoreDisplay.update(this.scoreManager.getScore());
	}

	/**
	 * ロープを削除
	 */
	private removeRope(id: string): void {
		const rope = this.ropes.get(id);
		if (!rope || !this.scene || !this.physics) return;

		// ジョイントを削除
		for (const joint of rope.joints) {
			this.physics.getWorld().removeImpulseJoint(joint, true);
		}

		// セグメントを削除
		for (const segment of rope.segments) {
			this.scene.removeObject(segment.mesh);
			this.physics.getWorld().removeRigidBody(segment.body);
		}

		// 宝物を削除
		this.scene.removeObject(rope.treasure.mesh);
		this.physics.getWorld().removeRigidBody(rope.treasure.body);

		// アンカーを削除
		this.physics.getWorld().removeRigidBody(rope.anchorBody);

		this.ropes.delete(id);

		console.log(`[GameManager] Removed rope (${id})`);
	}

	/**
	 * アクティブなロープのリストを取得
	 */
	public getRopes(): Map<string, RopeWithTreasure> {
		return this.ropes;
	}

	/**
	 * ScoreManagerを取得
	 */
	public getScoreManager(): ScoreManager {
		return this.scoreManager;
	}

	/**
	 * クリック位置でロープを切断（Raycast使用）
	 */
	public cutRopeAtPoint(point: THREE.Vector3): CutResult | null {
		if (!this.physics || !this.scene) {
			throw new Error("[GameManager] Not initialized");
		}

		const camera = this.scene.getCamera();

		// 3D座標からスクリーン座標に変換してRaycasterを作成
		const screenPos = this.worldToScreen(point);
		const renderer = this.scene.getRenderer();

		// 正規化デバイス座標に変換
		const mouse = new THREE.Vector2();
		mouse.x = (screenPos.x / renderer.domElement.clientWidth) * 2 - 1;
		mouse.y = -(screenPos.y / renderer.domElement.clientHeight) * 2 + 1;

		// Raycasterを作成
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);

		// すべてのロープをチェック
		for (const [id, rope] of this.ropes.entries()) {
			// 既に切断済みのロープはスキップ
			if (rope.isCut) {
				continue;
			}

			const segmentIndex = checkRopeHitRaycast(rope.segments, raycaster);

			if (segmentIndex !== null) {
				// セグメントとの接続ジョイントを切断
				// セグメントインデックスに対応するジョイントを切断
				// ジョイント0: アンカーとセグメント0の接続
				// ジョイント1: セグメント0とセグメント1の接続
				// ...
				// 最後のジョイント: 最後のセグメントと宝物の接続

				const jointIndex = segmentIndex; // セグメントの上側のジョイントを切断
				if (jointIndex >= 0 && jointIndex < rope.joints.length) {
					cutRopeJoint(this.physics, rope.joints[jointIndex]);

					// ロープを切断済みとしてマーク
					rope.isCut = true;

					console.log(
						`[GameManager] Cut rope ${id} at segment ${segmentIndex}`,
					);

					// 切断後、ロープは画面外に出るまで残るので、削除はしない
					// 物理演算により自然に落下する

					return {
						success: true,
						ropeId: id,
						segmentIndex,
						treasure: rope.treasure.config,
					};
				}
			}
		}

		return null;
	}

	/**
	 * クリックイベントの処理
	 */
	public handleClick(event: MouseEvent): void {
		if (!this.scene) return;

		const camera = this.scene.getCamera();
		const renderer = this.scene.getRenderer();

		// 正規化デバイス座標に変換
		const mouse = new THREE.Vector2();
		mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
		mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

		// Raycasterを作成
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);

		// すべてのロープをチェック
		for (const [id, rope] of this.ropes.entries()) {
			// 既に切断済みのロープはスキップ
			if (rope.isCut) {
				continue;
			}

			const segmentIndex = checkRopeHitRaycast(rope.segments, raycaster);

			if (segmentIndex !== null && this.physics) {
				const jointIndex = segmentIndex;
				if (jointIndex >= 0 && jointIndex < rope.joints.length) {
					cutRopeJoint(this.physics, rope.joints[jointIndex]);

					// ロープを切断済みとしてマーク
					rope.isCut = true;

					console.log(
						`[GameManager] Cut rope ${id} at segment ${segmentIndex} (click)`,
					);

					// スコアを追加
					const scoreEvent = this.scoreManager.addScore(rope.treasure.config);

					// スコアアニメーションを表示
					this.scoreDisplay.showScoreAnimation(
						scoreEvent.points,
						new THREE.Vector2(event.clientX, event.clientY),
					);

					return; // 最初にヒットしたロープのみ切断
				}
			}
		}
	}

	/**
	 * 手の位置を更新
	 */
	public updateHandPosition(
		handedness: Handedness,
		x: number,
		y: number,
	): void {
		if (!this.scene) return;

		const hand = handedness === "Left" ? this.leftHand : this.rightHand;
		if (!hand) return;

		// 2D座標（0-1の範囲）を3D座標に変換
		const camera = this.scene.getCamera();
		const position = convertTo3D(x, y, camera, 5);

		hand.setPosition(position.x, position.y, position.z);
		hand.setVisible(true);

		// 現在位置を保存（V閉じアクション用）
		if (handedness === "Left") {
			this.leftHandPosition = position;
		} else {
			this.rightHandPosition = position;
		}

		// 当たり判定球を手の位置に移動（右手優先）
		if (this.debugHitSphere) {
			// 右手が検出されている場合は右手の位置、そうでなければ左手の位置
			const targetPosition = this.rightHandPosition || this.leftHandPosition;
			if (targetPosition) {
				this.debugHitSphere.position.copy(targetPosition);
			}
		}
	}

	/**
	 * 手のジェスチャー状態を更新
	 */
	public updateHandGesture(handedness: Handedness, isVictory: boolean): void {
		const hand = handedness === "Left" ? this.leftHand : this.rightHand;
		if (!hand) return;

		hand.setState(isVictory ? "open" : "closed");
	}

	/**
	 * 手を非表示にする
	 */
	public hideHand(handedness: Handedness): void {
		const hand = handedness === "Left" ? this.leftHand : this.rightHand;
		if (!hand) return;

		hand.setVisible(false);

		// 位置情報もクリア
		if (handedness === "Left") {
			this.leftHandPosition = null;
		} else {
			this.rightHandPosition = null;
		}

		// 当たり判定球の位置を更新（残っている手の位置に移動、なければ画面外）
		if (this.debugHitSphere) {
			const remainingPosition = this.rightHandPosition || this.leftHandPosition;
			if (remainingPosition) {
				this.debugHitSphere.position.copy(remainingPosition);
			} else {
				// 両手とも非表示の場合は画面外に移動
				this.debugHitSphere.position.set(-100, -100, 0);
			}
		}
	}

	/**
	 * V閉じアクションでロープを切断
	 */
	public handleVCloseAction(handedness: Handedness): void {
		const position =
			handedness === "Left" ? this.leftHandPosition : this.rightHandPosition;

		if (!position) {
			console.warn(`[GameManager] No position data for ${handedness} hand`);
			return;
		}

		console.log(`[GameManager] V-close action at position:`, position);

		// デバッグ用：当たり判定球の色を切る時の色に変更
		if (this.debugHitSphere) {
			const material = this.debugHitSphere.material as THREE.MeshBasicMaterial;
			material.color.setHex(this.HIT_SPHERE_COLOR_CUTTING);

			// 500ms後に通常色に戻す
			setTimeout(() => {
				if (this.debugHitSphere) {
					const mat = this.debugHitSphere.material as THREE.MeshBasicMaterial;
					mat.color.setHex(this.HIT_SPHERE_COLOR_NORMAL);
				}
			}, 500);
		}

		// ロープを切断（クリックより少し大きめの判定範囲）
		const result = this.cutRopeAtPoint(position);

		if (result) {
			console.log(
				`[GameManager] Cut successful via gesture! Treasure: ${result.treasure.type}`,
			);

			// スコアを追加
			const scoreEvent = this.scoreManager.addScore(result.treasure);

			// スコアアニメーションを手の位置に表示
			// 3D座標をスクリーン座標に変換
			if (this.scene) {
				const screenPos = this.worldToScreen(position);
				this.scoreDisplay.showScoreAnimation(scoreEvent.points, screenPos);
			}
		} else {
			console.log(`[GameManager] Cut failed - no rope in range`);
		}
	}

	/**
	 * 3D空間座標からスクリーン座標への変換
	 */
	private worldToScreen(worldPos: THREE.Vector3): THREE.Vector2 {
		if (!this.scene) {
			throw new Error("[GameManager] Scene not initialized");
		}

		const camera = this.scene.getCamera();
		const renderer = this.scene.getRenderer();

		// ワールド座標をスクリーン座標に変換
		const vector = worldPos.clone();
		vector.project(camera);

		const screenX = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
		const screenY = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

		return new THREE.Vector2(screenX, screenY);
	}

	/**
	 * クリーンアップ
	 */
	public dispose(): void {
		// すべてのロープを削除
		const ids = Array.from(this.ropes.keys());
		for (const id of ids) {
			this.removeRope(id);
		}

		// カニの手を削除
		if (this.leftHand) {
			this.leftHand.dispose();
			this.leftHand = null;
		}
		if (this.rightHand) {
			this.rightHand.dispose();
			this.rightHand = null;
		}

		// デバッグ用の当たり判定球を削除
		if (this.debugHitSphere && this.scene) {
			this.scene.removeObject(this.debugHitSphere);
			this.debugHitSphere.geometry.dispose();
			(this.debugHitSphere.material as THREE.Material).dispose();
			this.debugHitSphere = null;
		}

		// スコア表示のクリーンアップ
		this.scoreDisplay.dispose();

		// タイマー表示のクリーンアップ
		this.timerDisplay.dispose();

		// タイマーの停止
		this.gameTimer.stop();

		console.log("[GameManager] Disposed");
	}
}
