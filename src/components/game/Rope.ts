import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { Physics } from './Physics';
import type { RopeSegment, RopeConfig, Treasure } from '../../types/game';

export class RopeFactory {
  /**
   * ロープを作成
   */
  public static create(
    physics: Physics,
    startPos: THREE.Vector3,
    config: RopeConfig
  ): { segments: RopeSegment[]; anchorBody: RAPIER.RigidBody } {
    const RAPIER = physics.getRAPIER();
    const segments: RopeSegment[] = [];

    // アンカー（固定点）を作成
    const anchorBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      startPos.x,
      startPos.y,
      startPos.z
    );
    const anchorBody = physics.createRigidBody(anchorBodyDesc);

    // アンカー用の小さなコライダー（デバッグ用）
    const anchorColliderDesc = RAPIER.ColliderDesc.ball(0.05);
    physics.createCollider(anchorColliderDesc, anchorBody);

    // ロープのセグメントを作成
    let currentY = startPos.y;

    for (let i = 0; i < config.segmentCount; i++) {
      currentY -= config.segmentLength;

      // Three.jsのメッシュを作成（円柱）
      const geometry = new THREE.CylinderGeometry(
        config.segmentRadius,
        config.segmentRadius,
        config.segmentLength,
        8
      );
      const material = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // 茶色
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(startPos.x, currentY + config.segmentLength / 2, startPos.z);

      // RigidBodyを作成（動的オブジェクト）
      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
        startPos.x,
        currentY + config.segmentLength / 2,
        startPos.z
      );
      const rigidBody = physics.createRigidBody(rigidBodyDesc);

      // Colliderを作成（カプセル形）
      const colliderDesc = RAPIER.ColliderDesc.capsule(
        config.segmentLength / 2 - config.segmentRadius,
        config.segmentRadius
      )
        .setDensity(config.mass)
        .setFriction(0.5);
      physics.createCollider(colliderDesc, rigidBody);

      // 登録
      physics.registerBody(rigidBody, mesh);

      segments.push({
        body: rigidBody,
        mesh,
      });
    }

    return { segments, anchorBody };
  }

  /**
   * ロープのセグメントをジョイントで接続
   */
  public static connectSegments(
    physics: Physics,
    anchorBody: RAPIER.RigidBody,
    segments: RopeSegment[],
    segmentLength: number
  ): RAPIER.ImpulseJoint[] {
    const RAPIER = physics.getRAPIER();
    const world = physics.getWorld();
    const joints: RAPIER.ImpulseJoint[] = [];

    // アンカーと最初のセグメントを接続
    if (segments.length > 0) {
      const params = RAPIER.JointData.revolute(
        new RAPIER.Vector3(0, 0, 0), // アンカー側の接続点
        new RAPIER.Vector3(0, segmentLength / 2, 0), // セグメント側の接続点
        new RAPIER.Vector3(1, 0, 0) // 回転軸（X軸周り）
      );
      const joint = world.createImpulseJoint(params, anchorBody, segments[0].body, true);
      joints.push(joint);
    }

    // セグメント同士を接続
    for (let i = 0; i < segments.length - 1; i++) {
      const params = RAPIER.JointData.revolute(
        new RAPIER.Vector3(0, -segmentLength / 2, 0), // 上のセグメントの下端
        new RAPIER.Vector3(0, segmentLength / 2, 0), // 下のセグメントの上端
        new RAPIER.Vector3(1, 0, 0) // 回転軸（X軸周り）
      );
      const joint = world.createImpulseJoint(params, segments[i].body, segments[i + 1].body, true);
      joints.push(joint);
    }

    return joints;
  }

  /**
   * 宝物をロープに接続
   */
  public static attachTreasure(
    physics: Physics,
    lastSegment: RopeSegment,
    treasure: Treasure,
    segmentLength: number
  ): RAPIER.ImpulseJoint {
    const RAPIER = physics.getRAPIER();
    const world = physics.getWorld();

    // 最後のセグメントと宝物を接続
    const params = RAPIER.JointData.revolute(
      new RAPIER.Vector3(0, -segmentLength / 2, 0), // セグメントの下端
      new RAPIER.Vector3(0, treasure.config.size / 2, 0), // 宝物の上端
      new RAPIER.Vector3(1, 0, 0) // 回転軸（X軸周り）
    );
    const joint = world.createImpulseJoint(params, lastSegment.body, treasure.body, true);

    return joint;
  }

  /**
   * ジョイントを切断
   */
  public static cutJoint(physics: Physics, joint: RAPIER.ImpulseJoint): void {
    const world = physics.getWorld();
    world.removeImpulseJoint(joint, true);
  }
}
