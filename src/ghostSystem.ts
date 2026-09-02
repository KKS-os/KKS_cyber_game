import { GhostFrame, GhostRunData, SpeedrunDeltaInfo } from './types';

/**
 * High-Precision Speedrun Personal Ghost System
 * Records player positions & combat states to create a real-time shadow competitor.
 */
export class GhostSpeedrunManager {
  private recordingFrames: GhostFrame[] = [];
  private pbGhost: GhostRunData | null = null;
  private currentStage: number = 1;
  private lastSampleTime: number = 0;
  private sampleIntervalMs: number = 40; // 25 Hz high fidelity recording

  constructor(stage: number = 1) {
    this.currentStage = stage;
    this.loadPBGhost(stage);
  }

  public setStage(stage: number) {
    this.currentStage = stage;
    this.recordingFrames = [];
    this.lastSampleTime = 0;
    this.loadPBGhost(stage);
  }

  public resetRecording() {
    this.recordingFrames = [];
    this.lastSampleTime = 0;
  }

  public loadPBGhost(stage: number): GhostRunData | null {
    try {
      const key = `NEON_GHOST_RUN_DATA_STAGE_${stage}`;
      const data = localStorage.getItem(key);
      if (data) {
        this.pbGhost = JSON.parse(data);
        return this.pbGhost;
      }
    } catch (e) {
      console.warn('Could not load PB Ghost:', e);
    }
    this.pbGhost = null;
    return null;
  }

  public getPBGhost(): GhostRunData | null {
    return this.pbGhost;
  }

  /**
   * Sample current player state for the active run
   */
  public recordFrame(
    timeMs: number,
    x: number,
    y: number,
    facing: 'LEFT' | 'RIGHT',
    actionState: string,
    isDashing: boolean,
    isSlashing: boolean,
    slashCombo: number,
    integrity: number,
    distance: number
  ) {
    if (timeMs - this.lastSampleTime < this.sampleIntervalMs) return;
    this.lastSampleTime = timeMs;

    this.recordingFrames.push({
      t: Math.round(timeMs),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      facing,
      actionState,
      isDashing,
      isSlashing,
      slashCombo,
      integrity: Math.round(integrity),
      distance: Math.round(distance),
    });
  }

  /**
   * Save current run as new Personal Best if it's the first run or faster/higher score
   */
  public finalizeAndSaveIfPB(
    stage: number,
    stageName: string,
    totalTimeMs: number,
    finalScore: number,
    finalDistance: number
  ): { isNewPB: boolean; previousTimeMs?: number } {
    const isFirstPB = !this.pbGhost;
    const isFaster = this.pbGhost ? totalTimeMs < this.pbGhost.totalTimeMs : true;

    if (isFirstPB || isFaster) {
      const prevTime = this.pbGhost?.totalTimeMs;
      const newGhost: GhostRunData = {
        stage,
        stageName,
        recordedAt: Date.now(),
        totalTimeMs,
        finalScore,
        finalDistance,
        frames: this.recordingFrames,
      };
      this.pbGhost = newGhost;
      try {
        localStorage.setItem(`NEON_GHOST_RUN_DATA_STAGE_${stage}`, JSON.stringify(newGhost));
      } catch (e) {
        console.warn('Failed to save PB ghost:', e);
      }
      return { isNewPB: true, previousTimeMs: prevTime };
    }

    return { isNewPB: false, previousTimeMs: this.pbGhost?.totalTimeMs };
  }

  /**
   * Sample the interpolated Ghost position and state at timestamp `timeMs`
   */
  public getGhostSample(timeMs: number): GhostFrame | null {
    if (!this.pbGhost || this.pbGhost.frames.length === 0) return null;
    const frames = this.pbGhost.frames;

    if (timeMs <= frames[0].t) {
      return frames[0];
    }
    if (timeMs >= frames[frames.length - 1].t) {
      return frames[frames.length - 1];
    }

    // Binary search for closest frame pair
    let low = 0;
    let high = frames.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (frames[mid].t < timeMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx0 = Math.max(0, high);
    const idx1 = Math.min(frames.length - 1, low);
    const f0 = frames[idx0];
    const f1 = frames[idx1];

    if (idx0 === idx1 || f1.t === f0.t) return f0;

    const alpha = (timeMs - f0.t) / (f1.t - f0.t);
    return {
      t: timeMs,
      x: f0.x + (f1.x - f0.x) * alpha,
      y: f0.y + (f1.y - f0.y) * alpha,
      facing: alpha > 0.5 ? f1.facing : f0.facing,
      actionState: alpha > 0.5 ? f1.actionState : f0.actionState,
      isDashing: f0.isDashing || f1.isDashing,
      isSlashing: f0.isSlashing || f1.isSlashing,
      slashCombo: f0.slashCombo || 1,
      integrity: Math.round(f0.integrity + (f1.integrity - f0.integrity) * alpha),
      distance: f0.distance + (f1.distance - f0.distance) * alpha,
    };
  }

  /**
   * Calculate live Speedrun Delta between current Player and Ghost PB
   */
  public calculateSpeedrunDelta(timeMs: number, playerDistance: number): SpeedrunDeltaInfo {
    if (!this.pbGhost || this.pbGhost.frames.length === 0) {
      return {
        hasGhost: false,
        deltaSeconds: 0,
        ghostDistance: 0,
        playerDistance,
        status: 'TIED',
        formattedDelta: 'PB: NO RECORD',
      };
    }

    const ghostFrame = this.getGhostSample(timeMs);
    if (!ghostFrame) {
      return {
        hasGhost: true,
        deltaSeconds: 0,
        ghostDistance: 0,
        playerDistance,
        status: 'TIED',
        formattedDelta: 'PB: SYNCING',
      };
    }

    // Estimate delta in seconds based on distance gap and average speed (~12m/s)
    const distDiff = playerDistance - ghostFrame.distance;
    const estSpeed = 14; // pixels per delta unit
    const deltaSeconds = -(distDiff / estSpeed) * 0.05;

    const isAhead = distDiff >= 15;
    const isBehind = distDiff <= -15;
    const status: 'AHEAD' | 'BEHIND' | 'TIED' = isAhead ? 'AHEAD' : isBehind ? 'BEHIND' : 'TIED';

    const sign = isAhead ? '-' : isBehind ? '+' : '±';
    const formattedDelta = `${sign}${Math.abs(deltaSeconds).toFixed(2)}s ${status}`;

    return {
      hasGhost: true,
      deltaSeconds,
      ghostDistance: ghostFrame.distance,
      playerDistance,
      status,
      formattedDelta,
      ghostPos: { x: ghostFrame.x, y: ghostFrame.y },
    };
  }

  /**
   * Render the translucent holographic Cyber Shadow Ghost on Canvas
   */
  public renderGhost(ctx: CanvasRenderingContext2D, timeMs: number) {
    const ghost = this.getGhostSample(timeMs);
    if (!ghost) return;

    ctx.save();
    ctx.translate(ghost.x, ghost.y);

    // Ethereal Hologram Pulsing Alpha
    const pulseAlpha = 0.55 + Math.sin(timeMs * 0.008) * 0.15;
    ctx.globalAlpha = pulseAlpha;

    // Ghost Hologram Outer Glow
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 18;

    // Flip sprite if facing left
    if (ghost.facing === 'LEFT') {
      ctx.scale(-1, 1);
    }

    // 1. Ghost Trailing Motion Ripple Particles
    ctx.fillStyle = 'rgba(0, 255, 209, 0.2)';
    ctx.beginPath();
    ctx.ellipse(-10, 8, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Holographic Ghost Torso & Chassis
    const ghostGrad = ctx.createLinearGradient(-14, -16, 14, 16);
    ghostGrad.addColorStop(0, 'rgba(0, 255, 209, 0.4)');
    ghostGrad.addColorStop(0.5, 'rgba(157, 0, 255, 0.5)');
    ghostGrad.addColorStop(1, 'rgba(0, 255, 209, 0.2)');

    ctx.fillStyle = ghostGrad;
    ctx.strokeStyle = '#00FFD1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 24, [4, 4, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // 3. Hologram Scanlines across ghost torso
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let sl = -10; sl <= 10; sl += 4) {
      ctx.beginPath();
      ctx.moveTo(-12, sl);
      ctx.lineTo(12, sl);
      ctx.stroke();
    }

    // 4. Ghost Cyber Visor
    ctx.fillStyle = '#FF00E5';
    ctx.shadowColor = '#FF00E5';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(4, -22, 10, 5, 2);
    ctx.fill();

    // 5. Ghost Slashing / Dashing FX
    if (ghost.isSlashing) {
      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(10, 0, 40, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }

    if (ghost.isDashing) {
      // Jet trails behind ghost
      ctx.fillStyle = 'rgba(0, 255, 209, 0.6)';
      ctx.beginPath();
      ctx.moveTo(-16, -6);
      ctx.lineTo(-35, 0);
      ctx.lineTo(-16, 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore(); // Restore transform

    // 6. Floating PB Ghost Telemetry Label Above Ghost (in Screen space orientation)
    ctx.save();
    ctx.translate(ghost.x, ghost.y - 36);
    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.fillStyle = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText('⚡ PB SHADOW GHOST', 0, 0);
    ctx.restore();
  }
}
