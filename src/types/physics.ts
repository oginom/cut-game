import type RAPIER from '@dimforge/rapier3d-compat';
import type * as THREE from 'three';

export interface PhysicsConfig {
  gravity: { x: number; y: number; z: number };
  timeStep: number;
}

export interface RigidBodyHandle {
  handle: number;
  body: RAPIER.RigidBody;
  mesh: THREE.Mesh;
}
