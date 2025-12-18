import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { PhysicsConfig, RigidBodyHandle } from "../../types/physics";

export class Physics {
	private RAPIER: typeof RAPIER | null = null;
	private world: RAPIER.World | null = null;
	private config: PhysicsConfig;
	private rigidBodies: Map<number, RigidBodyHandle> = new Map();
	private bodyIdCounter: number = 0;

	constructor() {
		// デフォルト設定
		this.config = {
			gravity: { x: 0, y: -9.81, z: 0 },
			timeStep: 1 / 60,
		};
	}

	/**
	 * 物理エンジンの初期化
	 */
	public async init(config?: Partial<PhysicsConfig>): Promise<void> {
		// 設定のマージ
		if (config) {
			this.config = { ...this.config, ...config };
		}

		// Rapierの初期化
		await RAPIER.init();
		this.RAPIER = RAPIER;

		// 物理ワールドの作成
		const gravity = new RAPIER.Vector3(
			this.config.gravity.x,
			this.config.gravity.y,
			this.config.gravity.z,
		);
		this.world = new RAPIER.World(gravity);

		console.log("[Physics] Initialized with gravity:", this.config.gravity);
	}

	/**
	 * 物理演算を1ステップ進める
	 */
	public step(): void {
		if (!this.world) {
			console.warn("[Physics] World not initialized");
			return;
		}

		this.world.step();
	}

	/**
	 * Three.jsメッシュの位置を物理ボディと同期
	 */
	public syncMeshes(): void {
		this.rigidBodies.forEach((handle) => {
			const translation = handle.body.translation();
			const rotation = handle.body.rotation();

			handle.mesh.position.set(translation.x, translation.y, translation.z);
			handle.mesh.quaternion.set(
				rotation.x,
				rotation.y,
				rotation.z,
				rotation.w,
			);
		});
	}

	/**
	 * RigidBodyを作成
	 */
	public createRigidBody(desc: RAPIER.RigidBodyDesc): RAPIER.RigidBody {
		if (!this.world) {
			throw new Error("[Physics] World not initialized");
		}

		return this.world.createRigidBody(desc);
	}

	/**
	 * Colliderを作成
	 */
	public createCollider(
		desc: RAPIER.ColliderDesc,
		body: RAPIER.RigidBody,
	): RAPIER.Collider {
		if (!this.world) {
			throw new Error("[Physics] World not initialized");
		}

		return this.world.createCollider(desc, body);
	}

	/**
	 * RigidBodyとメッシュを登録
	 */
	public registerBody(body: RAPIER.RigidBody, mesh: THREE.Mesh): number {
		const id = this.bodyIdCounter++;
		this.rigidBodies.set(id, {
			handle: body.handle,
			body,
			mesh,
		});
		return id;
	}

	/**
	 * RigidBodyとメッシュの登録を解除
	 */
	public unregisterBody(id: number): void {
		const handle = this.rigidBodies.get(id);
		if (handle && this.world) {
			this.world.removeRigidBody(handle.body);
			this.rigidBodies.delete(id);
		}
	}

	/**
	 * ワールドを取得
	 */
	public getWorld(): RAPIER.World {
		if (!this.world) {
			throw new Error("[Physics] World not initialized");
		}
		return this.world;
	}

	/**
	 * RAPIERライブラリを取得
	 */
	public getRAPIER(): typeof RAPIER {
		if (!this.RAPIER) {
			throw new Error("[Physics] RAPIER not initialized");
		}
		return this.RAPIER;
	}

	/**
	 * デバッグ用のボールを作成
	 */
	public createDebugBall(scene: THREE.Scene): THREE.Mesh {
		if (!this.world || !this.RAPIER) {
			throw new Error("[Physics] Not initialized");
		}

		// Three.jsのメッシュを作成
		const geometry = new THREE.SphereGeometry(0.5, 32, 32);
		const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 5, 0);
		scene.add(mesh);

		// RigidBodyを作成（動的オブジェクト）
		const rigidBodyDesc = this.RAPIER.RigidBodyDesc.dynamic().setTranslation(
			0,
			5,
			0,
		);
		const rigidBody = this.world.createRigidBody(rigidBodyDesc);

		// Colliderを作成（球形）
		const colliderDesc = this.RAPIER.ColliderDesc.ball(0.5);
		this.world.createCollider(colliderDesc, rigidBody);

		// 登録
		this.registerBody(rigidBody, mesh);

		console.log("[Physics] Debug ball created");

		return mesh;
	}

	/**
	 * デバッグ用の地面を作成
	 */
	public createDebugGround(scene: THREE.Scene): THREE.Mesh {
		if (!this.world || !this.RAPIER) {
			throw new Error("[Physics] Not initialized");
		}

		// Three.jsのメッシュを作成
		const geometry = new THREE.BoxGeometry(20, 0.5, 20);
		const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, -5, 0);
		scene.add(mesh);

		// RigidBodyを作成（固定オブジェクト）
		const rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed().setTranslation(
			0,
			-5,
			0,
		);
		const rigidBody = this.world.createRigidBody(rigidBodyDesc);

		// Colliderを作成（箱形）
		const colliderDesc = this.RAPIER.ColliderDesc.cuboid(10, 0.25, 10);
		this.world.createCollider(colliderDesc, rigidBody);

		// 登録
		this.registerBody(rigidBody, mesh);

		console.log("[Physics] Debug ground created");

		return mesh;
	}

	/**
	 * クリーンアップ
	 */
	public dispose(): void {
		this.rigidBodies.clear();
		if (this.world) {
			this.world.free();
			this.world = null;
		}
		console.log("[Physics] Disposed");
	}
}
