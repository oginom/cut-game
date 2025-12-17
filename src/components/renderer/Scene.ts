import * as THREE from 'three';
import type { SceneConfig, RenderStats } from '../../types/scene';

export class Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;
  private container: HTMLElement | null = null;
  private config: SceneConfig;

  // デバッグ用のテストオブジェクト
  private testCube: THREE.Mesh | null = null;

  // パフォーマンス測定
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  constructor() {
    // デフォルト設定
    this.config = {
      backgroundColor: 0x000000,
      cameraFov: 75,
      cameraNear: 0.1,
      cameraFar: 1000,
    };

    // シーンの作成
    this.scene = new THREE.Scene();
    // カメラ映像を背景として使用するため、背景色は設定しない
    this.scene.background = null;

    // カメラの作成
    this.camera = new THREE.PerspectiveCamera(
      this.config.cameraFov,
      window.innerWidth / window.innerHeight,
      this.config.cameraNear,
      this.config.cameraFar
    );
    this.camera.position.z = 5;

    // レンダラーの作成（透明背景を有効化）
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true // 透明背景を有効化
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0); // 完全に透明にする

    // ライティングの設定
    this.setupLights();
  }

  /**
   * シーンの初期化
   */
  public init(container: HTMLElement, config?: Partial<SceneConfig>): void {
    this.container = container;

    // 設定のマージ
    if (config) {
      this.config = { ...this.config, ...config };
      // カメラ映像を背景として使用するため、背景色は設定しない
      // this.scene.background = new THREE.Color(this.config.backgroundColor);
    }

    // コンテナにレンダラーを追加
    container.appendChild(this.renderer.domElement);

    // ウィンドウリサイズイベント
    window.addEventListener('resize', this.handleResize);

    // デバッグ用のテストキューブを追加
    this.addTestCube();

    console.log('[Scene] Initialized');
  }

  /**
   * ライティングのセットアップ
   */
  private setupLights(): void {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // 平行光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  /**
   * デバッグ用のテストキューブを追加
   */
  private addTestCube(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.testCube = new THREE.Mesh(geometry, material);
    this.scene.add(this.testCube);
  }

  /**
   * レンダリングループの開始
   */
  public start(): void {
    if (this.animationId !== null) {
      console.warn('[Scene] Already running');
      return;
    }

    this.lastFrameTime = performance.now();
    this.animate();
    console.log('[Scene] Started');
  }

  /**
   * レンダリングループの停止
   */
  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('[Scene] Stopped');
    }
  }

  /**
   * アニメーションループ
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // FPS計測
    this.frameCount++;
    if (this.frameCount >= 60) {
      this.fps = Math.round(1 / deltaTime);
      this.frameCount = 0;
    }

    // テストキューブの回転
    if (this.testCube) {
      this.testCube.rotation.x += deltaTime;
      this.testCube.rotation.y += deltaTime * 0.5;
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * ウィンドウリサイズ処理
   */
  private handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * オブジェクトをシーンに追加
   */
  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * オブジェクトをシーンから削除
   */
  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * カメラを取得
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * シーンを取得
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * レンダラーを取得
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * パフォーマンス統計を取得
   */
  public getStats(): RenderStats {
    return {
      fps: this.fps,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }

  /**
   * クリーンアップ
   */
  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);

    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
    console.log('[Scene] Disposed');
  }
}
