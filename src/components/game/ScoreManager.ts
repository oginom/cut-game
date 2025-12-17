import type { ScoreData, ScoreEvent } from '../../types/score';
import type { TreasureConfig } from '../../types/game';

export class ScoreManager {
  private scoreData: ScoreData = {
    current: 0,
    combo: 0,
    maxCombo: 0,
    totalTreasures: 0,
  };

  private events: ScoreEvent[] = [];
  private lastCutTime: number = 0;
  private comboTimeout: number = 3000; // コンボの有効時間（ミリ秒）

  /**
   * 初期化
   */
  public init(): void {
    this.reset();
    console.log('[ScoreManager] Initialized');
  }

  /**
   * スコアを追加
   */
  public addScore(treasure: TreasureConfig): ScoreEvent {
    const currentTime = Date.now();

    // コンボ判定
    if (currentTime - this.lastCutTime <= this.comboTimeout && this.lastCutTime > 0) {
      this.scoreData.combo++;
    } else {
      this.scoreData.combo = 1;
    }

    this.lastCutTime = currentTime;

    // 最大コンボを更新
    if (this.scoreData.combo > this.scoreData.maxCombo) {
      this.scoreData.maxCombo = this.scoreData.combo;
    }

    // スコア計算（コンボボーナス付き）
    const baseScore = treasure.score;
    const comboMultiplier = 1 + (this.scoreData.combo - 1) * 0.1; // コンボごとに10%増加
    const points = Math.floor(baseScore * comboMultiplier);

    // スコアを加算
    this.scoreData.current += points;
    this.scoreData.totalTreasures++;

    // イベントを記録
    const event: ScoreEvent = {
      points,
      treasureType: treasure.type,
      combo: this.scoreData.combo,
      timestamp: currentTime,
    };
    this.events.push(event);

    console.log(
      `[ScoreManager] Score added: +${points} (${treasure.type}, x${this.scoreData.combo} combo)`
    );

    return event;
  }

  /**
   * 現在のスコアデータを取得
   */
  public getScore(): ScoreData {
    return { ...this.scoreData };
  }

  /**
   * コンボをリセット
   */
  public resetCombo(): void {
    this.scoreData.combo = 0;
    console.log('[ScoreManager] Combo reset');
  }

  /**
   * スコアデータをリセット
   */
  public reset(): void {
    this.scoreData = {
      current: 0,
      combo: 0,
      maxCombo: 0,
      totalTreasures: 0,
    };
    this.events = [];
    this.lastCutTime = 0;
    console.log('[ScoreManager] Score reset');
  }

  /**
   * 更新処理（コンボタイムアウトチェック）
   */
  public update(): void {
    const currentTime = Date.now();

    // コンボタイムアウトチェック
    if (
      this.scoreData.combo > 0 &&
      currentTime - this.lastCutTime > this.comboTimeout
    ) {
      this.resetCombo();
    }
  }

  /**
   * スコアイベント履歴を取得
   */
  public getEvents(): ScoreEvent[] {
    return [...this.events];
  }
}
