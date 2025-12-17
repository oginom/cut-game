import * as THREE from 'three';
import type { Scene } from '../renderer/Scene';
import type { Physics } from './Physics';
import { TreasureFactory } from './Treasure';
import { RopeFactory } from './Rope';
import type { RopeWithTreasure, RopeConfig } from '../../types/game';

export class GameManager {
  private scene: Scene | null = null;
  private physics: Physics | null = null;
  private ropes: Map<string, RopeWithTreasure> = new Map();
  private ropeIdCounter: number = 0;

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
  public init(scene: Scene, physics: Physics): void {
    this.scene = scene;
    this.physics = physics;
    console.log('[GameManager] Initialized');
  }

  /**
   * ゲーム開始
   */
  public start(): void {
    console.log('[GameManager] Started');
  }

  /**
   * ロープ付き宝物を生成
   */
  public spawnRopeWithTreasure(direction: 'left' | 'right'): string {
    if (!this.scene || !this.physics) {
      throw new Error('[GameManager] Not initialized');
    }

    const id = `rope_${this.ropeIdCounter++}`;

    // 出現位置を決定
    const startX = direction === 'left' ? -8 : 8;
    const startY = 3;
    const startZ = 0;
    const startPos = new THREE.Vector3(startX, startY, startZ);

    // ロープを作成
    const { segments, anchorBody } = RopeFactory.create(
      this.physics,
      startPos,
      this.defaultRopeConfig
    );

    // セグメントを接続
    const joints = RopeFactory.connectSegments(
      this.physics,
      anchorBody,
      segments,
      this.defaultRopeConfig.segmentLength
    );

    // 宝物を作成（ランダムに種類を選択）
    const treasureTypes: ('gold' | 'silver' | 'bronze')[] = ['gold', 'silver', 'bronze'];
    const treasureType = treasureTypes[Math.floor(Math.random() * treasureTypes.length)];
    const treasureConfig = TreasureFactory.getConfig(treasureType);

    const treasureY = startY - this.defaultRopeConfig.segmentLength * segments.length - 0.5;
    const treasure = TreasureFactory.create(
      this.physics,
      new THREE.Vector3(startX, treasureY, startZ),
      treasureConfig
    );

    // 宝物をロープに接続
    const treasureJoint = RopeFactory.attachTreasure(
      this.physics,
      segments[segments.length - 1],
      treasure,
      this.defaultRopeConfig.segmentLength
    );
    joints.push(treasureJoint);

    // シーンに追加
    segments.forEach((segment) => {
      this.scene!.addObject(segment.mesh);
    });
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
    };

    this.ropes.set(id, ropeWithTreasure);

    console.log(`[GameManager] Spawned rope with ${treasureType} treasure (${id})`);

    return id;
  }

  /**
   * 更新処理
   */
  public update(deltaTime: number): void {
    if (!this.physics) return;

    const RAPIER = this.physics.getRAPIER();

    // 各ロープを移動
    this.ropes.forEach((rope) => {
      const translation = rope.anchorBody.translation();
      const moveDistance = rope.speed * deltaTime;
      const newX = rope.direction === 'left' ? translation.x + moveDistance : translation.x - moveDistance;

      // アンカーの位置を更新（Kinematicボディ）
      rope.anchorBody.setNextKinematicTranslation(
        new RAPIER.Vector3(newX, translation.y, translation.z)
      );

      // 画面外に出たら削除
      if (Math.abs(newX) > 10) {
        this.removeRope(rope.id);
      }
    });
  }

  /**
   * ロープを削除
   */
  private removeRope(id: string): void {
    const rope = this.ropes.get(id);
    if (!rope || !this.scene || !this.physics) return;

    // ジョイントを削除
    rope.joints.forEach((joint: any) => {
      this.physics!.getWorld().removeImpulseJoint(joint, true);
    });

    // セグメントを削除
    rope.segments.forEach((segment: any) => {
      this.scene!.removeObject(segment.mesh);
      this.physics!.getWorld().removeRigidBody(segment.body);
    });

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
   * クリーンアップ
   */
  public dispose(): void {
    // すべてのロープを削除
    const ids = Array.from(this.ropes.keys());
    ids.forEach((id) => this.removeRope(id));

    console.log('[GameManager] Disposed');
  }
}
