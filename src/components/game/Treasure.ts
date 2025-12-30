import * as THREE from "three";
import type { Treasure, TreasureConfig } from "../../types/game";
import type { Physics } from "./Physics";
import { TREASURE_CONFIG } from "../../config/gameConfig";

/**
 * 宝物の設定を取得
 */
export function getTreasureConfig(
	type: "gold" | "silver" | "bronze",
): TreasureConfig {
	const config = TREASURE_CONFIG[type];
	return {
		type,
		score: config.score,
		mass: config.mass,
		size: config.size,
	};
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
	const color = TREASURE_CONFIG[config.type].color;
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
