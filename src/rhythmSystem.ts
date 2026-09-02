import { sound } from './audio';
import { RhythmTimingGrade, RhythmBeatState } from './types';

export interface RhythmHitResult {
  grade: RhythmTimingGrade;
  deltaMs: number;
  multiplierBoost: number;
  damageMultiplier: number;
  instantBurstKills: boolean;
  scoreBonus: number;
  overdriveCharge: number;
  bannerText: string;
  bannerColor: string;
  screenGlitchIntensity: number; // 0.0 to 1.0
}

/**
 * Rhythm Combat Director
 * Synchronizes player combat actions with procedural Synthwave BGM beats.
 */
export class RhythmCombatDirector {
  private streakCount: number = 0;
  private maxStreak: number = 0;
  private lastGrade: RhythmTimingGrade = 'NORMAL';
  private glitchDuration: number = 0;
  private glitchAlpha: number = 0;

  public evaluateAction(): RhythmHitResult {
    const accuracy = sound.getRhythmAccuracy();
    const grade = accuracy.grade;
    this.lastGrade = grade;

    if (grade === 'PERFECT') {
      this.streakCount++;
      if (this.streakCount > this.maxStreak) this.maxStreak = this.streakCount;
      this.glitchDuration = 12;
      this.glitchAlpha = 0.85;

      sound.playRhythmStrike('PERFECT');

      return {
        grade: 'PERFECT',
        deltaMs: accuracy.deltaMs,
        multiplierBoost: 3, // 3x combo boost
        damageMultiplier: 3.5, // 3.5x damage
        instantBurstKills: true, // One-hit lethal burst on beat
        scoreBonus: 850,
        overdriveCharge: 35,
        bannerText: '⚡ PERFECT RHYTHM STRIKE! [3x COMBO] ⚡',
        bannerColor: '#00FFD1',
        screenGlitchIntensity: 1.0,
      };
    } else if (grade === 'CRITICAL') {
      this.streakCount++;
      if (this.streakCount > this.maxStreak) this.maxStreak = this.streakCount;
      this.glitchDuration = 8;
      this.glitchAlpha = 0.55;

      sound.playRhythmStrike('CRITICAL');

      return {
        grade: 'CRITICAL',
        deltaMs: accuracy.deltaMs,
        multiplierBoost: 2,
        damageMultiplier: 2.2,
        instantBurstKills: true,
        scoreBonus: 450,
        overdriveCharge: 20,
        bannerText: 'CRITICAL BEAT SYNC! [2x COMBO]',
        bannerColor: '#FF00E5',
        screenGlitchIntensity: 0.6,
      };
    } else if (grade === 'GOOD') {
      this.streakCount++;
      this.glitchDuration = 4;
      this.glitchAlpha = 0.3;

      sound.playRhythmStrike('GOOD');

      return {
        grade: 'GOOD',
        deltaMs: accuracy.deltaMs,
        multiplierBoost: 1,
        damageMultiplier: 1.4,
        instantBurstKills: false,
        scoreBonus: 200,
        overdriveCharge: 10,
        bannerText: 'RHYTHM HIT!',
        bannerColor: '#FFE600',
        screenGlitchIntensity: 0.3,
      };
    }

    // Miss / off-beat
    this.streakCount = 0;
    return {
      grade: 'NORMAL',
      deltaMs: accuracy.deltaMs,
      multiplierBoost: 0,
      damageMultiplier: 1.0,
      instantBurstKills: false,
      scoreBonus: 0,
      overdriveCharge: 0,
      bannerText: '',
      bannerColor: '#ffffff',
      screenGlitchIntensity: 0,
    };
  }

  public getBeatState(): RhythmBeatState {
    const acc = sound.getRhythmAccuracy();
    const bpm = sound.getBpm();
    const beatIntervalMs = (60 / bpm) * 1000;

    return {
      bpm,
      beatIntervalMs,
      currentBeat: Math.floor(performance.now() / beatIntervalMs),
      beatPhase: acc.beatPhase,
      pulseScale: acc.pulseScale,
      isNearBeat: acc.isNearBeat,
      accuracyMs: acc.deltaMs,
      streak: this.streakCount,
      multiplier: Math.min(6, 1 + Math.floor(this.streakCount / 2)),
    };
  }

  public updateGlitch() {
    if (this.glitchDuration > 0) {
      this.glitchDuration--;
      this.glitchAlpha = Math.max(0, this.glitchAlpha - 0.08);
    }
  }

  public getGlitchAlpha(): number {
    return this.glitchAlpha;
  }

  public resetStreak() {
    this.streakCount = 0;
    this.glitchDuration = 0;
    this.glitchAlpha = 0;
  }

  /**
   * Render Neon Glitch Screen FX / Chromatic Aberration burst during PERFECT rhythm hits
   */
  public renderScreenGlitch(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.glitchAlpha <= 0.02) return;

    ctx.save();
    ctx.globalAlpha = this.glitchAlpha;

    // 1. Fullscreen Neon Flash Tint (Cyan + Magenta Split)
    const splitX = (Math.random() - 0.5) * 18 * this.glitchAlpha;
    const splitY = (Math.random() - 0.5) * 12 * this.glitchAlpha;

    ctx.fillStyle = 'rgba(0, 255, 209, 0.18)';
    ctx.fillRect(splitX, splitY, width, height);

    ctx.fillStyle = 'rgba(255, 0, 229, 0.15)';
    ctx.fillRect(-splitX, -splitY, width, height);

    // 2. Horizontal Glitch Slice Scanlines
    ctx.fillStyle = '#ffffff';
    const numSlices = 4;
    for (let i = 0; i < numSlices; i++) {
      const sliceY = Math.random() * height;
      const sliceH = 4 + Math.random() * 12;
      const shift = (Math.random() - 0.5) * 30;
      ctx.globalAlpha = this.glitchAlpha * 0.45;
      ctx.fillStyle = i % 2 === 0 ? '#00FFD1' : '#FF00E5';
      ctx.fillRect(shift, sliceY, width, sliceH);
    }

    // 3. Vignette Border Pulse
    ctx.strokeStyle = '#00FFD1';
    ctx.lineWidth = 6 * this.glitchAlpha;
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 25;
    ctx.strokeRect(0, 0, width, height);

    ctx.restore();
  }
}
