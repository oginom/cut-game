import * as THREE from "three";

/**
 * 2D座標（0-1の範囲）から3D空間座標への変換
 *
 * @param x - X座標（0-1、左が0、右が1）
 * @param y - Y座標（0-1、上が0、下が1）
 * @param camera - Three.jsカメラ
 * @param depth - カメラからの距離（デフォルト: 5）
 * @returns 3D空間座標
 */
export function convertTo3D(
	x: number,
	y: number,
	camera: THREE.Camera,
	depth: number = 5,
): THREE.Vector3 {
	// カメラのFOVとアスペクト比から3D空間のサイズを計算
	const perspectiveCamera = camera as THREE.PerspectiveCamera;

	// ブラウザウィンドウのアスペクト比
	const windowAspect = window.innerWidth / window.innerHeight;

	// カメラ映像のアスペクト比（1280x720 = 16:9 ≈ 1.778）
	const videoAspect = 1280 / 720;

	// object-fit: coverによる座標変換
	// ウィンドウが縦長の場合、カメラ映像は横方向がクロップされる
	let adjustedX = x;
	let adjustedY = y;

	if (windowAspect < videoAspect) {
		// 縦長ウィンドウ: 横がクロップされる
		// MediaPipeの座標は元のカメラ映像（横長）基準なので、
		// 実際に表示されている範囲にマップする必要がある
		const visibleWidth = windowAspect / videoAspect; // 表示されている幅の割合
		const cropLeft = (1 - visibleWidth) / 2; // 左側のクロップ量

		// MediaPipeのx座標を、表示されている範囲（0-1）に正規化
		adjustedX = (x - cropLeft) / visibleWidth;
	} else {
		// 横長ウィンドウ: 縦がクロップされる
		const visibleHeight = videoAspect / windowAspect; // 表示されている高さの割合
		const cropTop = (1 - visibleHeight) / 2; // 上側のクロップ量

		adjustedY = (y - cropTop) / visibleHeight;
	}

	const fov = perspectiveCamera.fov * (Math.PI / 180); // ラジアンに変換
	const height = 2 * Math.tan(fov / 2) * depth;
	const width = height * windowAspect;

	// MediaPipeの座標系: x=[0,1] (左→右), y=[0,1] (上→下)
	// Three.jsの座標系: x=[-width/2, width/2] (左→右), y=[-height/2, height/2] (下→上)

	// 正規化デバイス座標に変換: [0,1] -> [-1,1]
	const ndcX = adjustedX * 2 - 1; // 0->-1, 0.5->0, 1->1
	const ndcY = adjustedY * 2 - 1; // 0->-1, 0.5->0, 1->1

	// NDCから3D空間座標へ変換
	// カメラ映像が左右反転されているため、X座標を反転
	const worldX = -ndcX * width; // 左右反転
	const worldY = -ndcY * height; // Y軸反転
	const worldZ = -depth; // カメラ前方（負の方向）

	return new THREE.Vector3(worldX, worldY, worldZ);
}

/**
 * スクリーン座標（ピクセル）から3D空間座標への変換
 *
 * @param screenX - スクリーンX座標（ピクセル）
 * @param screenY - スクリーンY座標（ピクセル）
 * @param camera - Three.jsカメラ
 * @param depth - カメラからの距離（デフォルト: 5）
 * @returns 3D空間座標
 */
export function screenTo3D(
	screenX: number,
	screenY: number,
	camera: THREE.Camera,
	depth: number = 5,
): THREE.Vector3 {
	// スクリーン座標を0-1の範囲に正規化
	const x = screenX / window.innerWidth;
	const y = screenY / window.innerHeight;

	return convertTo3D(x, y, camera, depth);
}
