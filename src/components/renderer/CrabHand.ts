import * as THREE from 'three';
import type { HandState, HandModelConfig } from '../../types/scene';

/**
 * カニの手の3Dモデル
 */
export class CrabHand {
  private group: THREE.Group;
  private palm: THREE.Mesh;
  private leftClaw: THREE.Mesh;
  private rightClaw: THREE.Mesh;
  private state: HandState = 'open';
  private config: Required<HandModelConfig>;

  constructor(config: HandModelConfig = {}) {
    // デフォルト設定
    this.config = {
      palmRadius: 0.3,
      clawLength: 0.5,
      clawWidth: 0.15,
      openAngle: Math.PI / 3, // 60度
      closedAngle: 0,
      color: 0xff6347, // トマト色（カニっぽい）
      ...config,
    };

    // グループを作成（手全体を管理）
    this.group = new THREE.Group();

    // 手のひら部分（球体）
    const palmGeometry = new THREE.SphereGeometry(this.config.palmRadius, 16, 16);
    const palmMaterial = new THREE.MeshPhongMaterial({ color: this.config.color });
    this.palm = new THREE.Mesh(palmGeometry, palmMaterial);
    this.group.add(this.palm);

    // 左のハサミ（円柱）
    const clawGeometry = new THREE.CylinderGeometry(
      this.config.clawWidth,
      this.config.clawWidth / 2,
      this.config.clawLength,
      8
    );
    const clawMaterial = new THREE.MeshPhongMaterial({ color: this.config.color });

    this.leftClaw = new THREE.Mesh(clawGeometry, clawMaterial);
    this.leftClaw.position.set(0, this.config.clawLength / 2, 0);
    this.group.add(this.leftClaw);

    // 右のハサミ（円柱）
    this.rightClaw = new THREE.Mesh(clawGeometry.clone(), clawMaterial.clone());
    this.rightClaw.position.set(0, this.config.clawLength / 2, 0);
    this.group.add(this.rightClaw);

    // 初期状態を設定
    this.updateClawPositions();

    console.log('[CrabHand] Created');
  }

  /**
   * Three.jsのグループを取得
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * 手の位置を設定
   */
  setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  /**
   * 手の状態を設定
   */
  setState(state: HandState): void {
    if (this.state === state) return;

    this.state = state;
    this.updateClawPositions();
  }

  /**
   * 現在の手の状態を取得
   */
  getState(): HandState {
    return this.state;
  }

  /**
   * ハサミの位置を更新
   */
  private updateClawPositions(): void {
    const angle = this.state === 'open' ? this.config.openAngle : this.config.closedAngle;

    // 左のハサミを回転
    this.leftClaw.rotation.z = angle;
    this.leftClaw.position.x = -Math.sin(angle) * this.config.clawLength / 2;

    // 右のハサミを回転
    this.rightClaw.rotation.z = -angle;
    this.rightClaw.position.x = Math.sin(angle) * this.config.clawLength / 2;
  }

  /**
   * 表示/非表示を設定
   */
  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  /**
   * 手モデルを削除
   */
  dispose(): void {
    // ジオメトリとマテリアルを解放
    this.palm.geometry.dispose();
    (this.palm.material as THREE.Material).dispose();

    this.leftClaw.geometry.dispose();
    (this.leftClaw.material as THREE.Material).dispose();

    this.rightClaw.geometry.dispose();
    (this.rightClaw.material as THREE.Material).dispose();

    // グループから削除
    this.group.clear();

    console.log('[CrabHand] Disposed');
  }
}
