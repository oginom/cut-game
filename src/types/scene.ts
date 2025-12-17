export interface SceneConfig {
  backgroundColor: number;
  cameraFov: number;
  cameraNear: number;
  cameraFar: number;
}

export interface RenderStats {
  fps: number;
  drawCalls: number;
  triangles: number;
}
