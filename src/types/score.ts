export interface ScoreData {
	current: number;
	combo: number;
	maxCombo: number;
	totalTreasures: number;
}

export interface ScoreEvent {
	points: number;
	treasureType: string;
	combo: number;
	timestamp: number;
}
