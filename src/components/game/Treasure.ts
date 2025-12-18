import * as THREE from "three";
import type { Treasure, TreasureConfig } from "../../types/game";
import type { Physics } from "./Physics";

/**
 * 宝物の設定を取得
 */
export function getTreasureConfig(
	type: "gold" | "silver" | "bronze",
): TreasureConfig {
	switch (type) {
		case "gold":
			return {
				type: "gold",
				score: 100,
				mass: 2.0,
				size: 0.4,
			};
		case "silver":
			return {
				type: "silver",
				score: 50,
				mass: 1.5,
				size: 0.35,
			};
		case "bronze":
			return {
				type: "bronze",
				score: 30,
				mass: 1.0,
				size: 0.3,
			};
	}
}

/**
 * 宝物を作成
 */
export function createTreasure(
	physics: Physics,
	position: THREE.Vector3,
	config: TreasureConfig,
): Treasure {
	const RAPIER = physics.getRAPIER();

	// Three.jsのメッシュを作成（仮で箱形）
	const geometry = new THREE.BoxGeometry(config.size, config.size, config.size);
	let color: number;
	switch (config.type) {
		case "gold":
			color = 0xffd700; // 金色
			break;
		case "silver":
			color = 0xc0c0c0; // 銀色
			break;
		case "bronze":
			color = 0xcd7f32; // 銅色
			break;
	}
	const material = new THREE.MeshPhongMaterial({ color });
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.copy(position);

	// RigidBodyを作成（動的オブジェクト）
	const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
		position.x,
		position.y,
		position.z,
	);
	const rigidBody = physics.createRigidBody(rigidBodyDesc);

	// Colliderを作成（箱形）
	const halfSize = config.size / 2;
	const colliderDesc = RAPIER.ColliderDesc.cuboid(
		halfSize,
		halfSize,
		halfSize,
	).setDensity(config.mass);
	physics.createCollider(colliderDesc, rigidBody);

	// 登録
	physics.registerBody(rigidBody, mesh);

	return {
		body: rigidBody,
		mesh,
		config,
	};
}
