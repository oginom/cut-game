export interface CameraConfig {
	width: number;
	height: number;
	facingMode: "user" | "environment";
}

export interface CameraError {
	type: "permission_denied" | "not_found" | "not_readable" | "unknown";
	message: string;
}
