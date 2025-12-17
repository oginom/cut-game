import type RAPIER from '@dimforge/rapier3d-compat';
import type * as THREE from 'three';

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

export interface Treasure {
  body: RAPIER.RigidBody;
  mesh: THREE.Mesh;
  config: TreasureConfig;
}

export interface RopeWithTreasure {
  id: string;
  segments: RopeSegment[];
  treasure: Treasure;
  joints: RAPIER.ImpulseJoint[];
  direction: 'left' | 'right';
  speed: number;
  anchorBody: RAPIER.RigidBody; // ロープの固定点
}

export interface CutResult {
  success: boolean;
  ropeId: string;
  segmentIndex: number;
  treasure: TreasureConfig;
}
