import {
  EnemyBacteria,
  WorldEntity,
  Player,
  CyberObstacle,
  Vector2D,
  SplatterDecal,
  FlyingSplatter,
  BoundingBox,
  PlayerCombatMove,
  ProAICombatDirectorState,
  DynamicComboInputType,
  DynamicComboStep,
  DynamicComboState,
  EnemyComboPredictionResult,
} from './types';
import { sound } from './audio';

/**
 * ============================================================================
 * PRO-LEVEL AI COMBAT MEMORY & REACTION DIRECTOR (COMPETITIVE GRADE)
 * ============================================================================
 * Tracks player input patterns in a rolling buffer.
 * Penalizes repetitive single-button mashing (reduced to 20% damage/ineffective).
 * Rewards rotating input combos (Left Click -> Right Click -> Action Key) with 5.0x Critical.
 * Enemy AI tracks & memorizes pattern: 75% tactical chance to predict & counter final finisher.
 */
export class ProAICombatDirector {
  public playerActionHistory: PlayerCombatMove[] = [];
  public repeatedMovePunishRate: number = 0.25;
  public lastActionTimestamp: number = 0;
  public playerIdleCombatTimer: number = 0;
  public executionerModeActive: boolean = false;
  public cognitivePressureIntensity: number = 0.0;

  // Dynamic Combo Input Tracking System
  public comboSequence: DynamicComboStep[] = [];
  public consecutiveSameInputCount: number = 0;
  public lastInputType: DynamicComboInputType | null = null;
  public isFinisherExpected: boolean = false;
  public predictedNextInput: DynamicComboInputType | null = null;
  public lastComboInputTime: number = 0;

  /** Records player combat input into the rolling 5-move memory buffer */
  public recordPlayerMove(move: PlayerCombatMove) {
    this.playerActionHistory.push(move);
    if (this.playerActionHistory.length > 5) {
      this.playerActionHistory.shift();
    }
    this.lastActionTimestamp = performance.now();
    this.playerIdleCombatTimer = 0; // Reset idle timer on active player offense
    this.recalculateRepetitionPenalty(move);
  }

  /**
   * Evaluates dynamic combo input rotation vs single-button spamming.
   * Single-mash repetition: heavily reduces damage (50% on 2nd, 20% on 3rd+).
   * Rotating dynamic pattern (L-Click -> R-Click -> Action Key): builds 5.0x critical finisher.
   */
  public evaluateDynamicComboInput(
    input: DynamicComboInputType,
    label: string,
    icon: string
  ): {
    damageMultiplier: number;
    isMashed: boolean;
    consecutiveMashCount: number;
    comboStep: number;
    isCriticalFinisher: boolean;
    feedbackBanner: string;
    feedbackColor: string;
    isFinisherReady: boolean;
  } {
    const now = performance.now();
    const timeSinceLast = now - this.lastComboInputTime;
    this.lastComboInputTime = now;

    // If more than 2.2 seconds elapsed, reset combo sequence
    if (timeSinceLast > 2200) {
      this.comboSequence = [];
      this.isFinisherExpected = false;
      this.consecutiveSameInputCount = 0;
      this.lastInputType = null;
    }

    const isSameInput = this.lastInputType === input;
    this.lastInputType = input;

    // --- CASE A: SINGLE-BUTTON MASHING DETECTED ---
    if (isSameInput) {
      this.consecutiveSameInputCount++;
      this.isFinisherExpected = false;
      this.comboSequence = [{ input, label, icon, timestamp: now }];

      if (this.consecutiveSameInputCount === 2) {
        return {
          damageMultiplier: 0.50, // 50% damage reduction
          isMashed: true,
          consecutiveMashCount: 2,
          comboStep: 1,
          isCriticalFinisher: false,
          feedbackBanner: '⚠️ MASH DECAY! [50% DMG - ROTATE ATTACKS!]',
          feedbackColor: '#FFAA00',
          isFinisherReady: false,
        };
      } else if (this.consecutiveSameInputCount >= 3) {
        sound.playBluntMashPenalty();
        return {
          damageMultiplier: 0.20, // 80% damage reduction -> INEFFECTIVE BLUNT ATTACK!
          isMashed: true,
          consecutiveMashCount: this.consecutiveSameInputCount,
          comboStep: 1,
          isCriticalFinisher: false,
          feedbackBanner: `⚠️ INEFFECTIVE MASH x${this.consecutiveSameInputCount}! [20% DMG - PENALIZED]`,
          feedbackColor: '#FF0055',
          isFinisherReady: false,
        };
      } else {
        return {
          damageMultiplier: 1.0,
          isMashed: false,
          consecutiveMashCount: 1,
          comboStep: 1,
          isCriticalFinisher: false,
          feedbackBanner: `⚡ SINGLE STRIKE [${label}]`,
          feedbackColor: '#00FFD1',
          isFinisherReady: false,
        };
      }
    }

    // --- CASE B: DYNAMIC ROTATING INPUT EXECUTED ---
    this.consecutiveSameInputCount = 1;
    this.comboSequence.push({ input, label, icon, timestamp: now });

    // Step 1: Initiator
    if (this.comboSequence.length === 1) {
      this.isFinisherExpected = false;
      return {
        damageMultiplier: 1.15,
        isMashed: false,
        consecutiveMashCount: 1,
        comboStep: 1,
        isCriticalFinisher: false,
        feedbackBanner: `⚔️ COMBO STEP 1/3: [${icon} ${label}]`,
        feedbackColor: '#00FFD1',
        isFinisherReady: false,
      };
    }

    // Step 2: Bridge / Mix-up
    if (this.comboSequence.length === 2) {
      sound.playComboBridge();
      this.isFinisherExpected = true;
      // Enemy AI predicts what the completing 3rd input is
      this.predictedNextInput =
        input === 'LEFT_CLICK'
          ? (this.comboSequence[0].input === 'RIGHT_CLICK' ? 'ACTION_KEY' : 'RIGHT_CLICK')
          : input === 'RIGHT_CLICK'
          ? (this.comboSequence[0].input === 'LEFT_CLICK' ? 'ACTION_KEY' : 'LEFT_CLICK')
          : (this.comboSequence[0].input === 'LEFT_CLICK' ? 'RIGHT_CLICK' : 'LEFT_CLICK');

      return {
        damageMultiplier: 1.85,
        isMashed: false,
        consecutiveMashCount: 1,
        comboStep: 2,
        isCriticalFinisher: false,
        feedbackBanner: `🔥 COMBO BRIDGE 2/3! [${icon} ${label}] -> EXECUTE FINISHER!`,
        feedbackColor: '#FF00E5',
        isFinisherReady: true,
      };
    }

    // Step 3+: MAXIMUM CRITICAL DAMAGE FINISHER (Rotating Pattern Complete!)
    sound.playCriticalFinisher();
    const isCritical = true;
    const finalBanner = `💥 MAXIMUM 5.0x CRITICAL COMBO FINISHER! [${icon} ${label}] 💥`;

    // Reset sequence so a fresh dynamic combo can begin
    this.comboSequence = [];
    this.isFinisherExpected = false;
    this.predictedNextInput = null;

    return {
      damageMultiplier: 5.0, // 500% Maximum Critical Damage!
      isMashed: false,
      consecutiveMashCount: 1,
      comboStep: 3,
      isCriticalFinisher: isCritical,
      feedbackBanner: finalBanner,
      feedbackColor: '#FFE600',
      isFinisherReady: false,
    };
  }

  /**
   * Enemy AI Tactical Finisher Prediction:
   * When the AI detects the player starting a high-damage combo sequence (Step 2 bridge active or Finisher strike),
   * alerted enemies within combat range roll a 75% tactical chance to predict and counter.
   */
  public testEnemyComboPrediction(
    bac: EnemyBacteria,
    ent: WorldEntity,
    playerPos: Vector2D
  ): EnemyComboPredictionResult {
    // Enemy cannot react if dead, inactive, in heavy stagger, surrendered, or blinded
    if (
      !ent.active ||
      bac.health <= 0 ||
      bac.hitStaggerTimer > 0 ||
      bac.surrendered ||
      bac.state === 'STAGGER' ||
      bac.isCloneDecoy
    ) {
      return { predicted: false, defenseType: 'NONE', mitigationRatio: 0 };
    }

    // 75% Tactical Chance to predict the player's high-damage combo finisher
    const roll = Math.random();
    if (roll < 0.75) {
      // 50% Tactical Evasion Dash vs 50% Protective Defensive Block
      if (Math.random() < 0.5) {
        // --- DEFENSE OPTION 1: PREDICTIVE EVASION DASH ---
        bac.state = 'ADAPTIVE_EVASION_A';
        bac.evasionTimer = 22;
        bac.evasionDuckFrames = 22; // Invulnerable i-frames
        const dirX = ent.position.x >= playerPos.x ? 1 : -1;
        ent.velocity.x = dirX * 14.5;
        ent.velocity.y = -6.5;
        sound.playEnemyGlitchDash();

        return {
          predicted: true,
          defenseType: 'EVASION_DASH',
          mitigationRatio: 1.0, // 100% damage evaded
        };
      } else {
        // --- DEFENSE OPTION 2: PROTECTIVE DEFENSIVE BLOCK / BARRIER ---
        bac.state = 'ADAPTIVE_EVASION_D';
        bac.parryWindowTimer = 24;
        bac.parryStanceFlash = 24;
        sound.playPredictiveBlock();

        return {
          predicted: true,
          defenseType: 'DEFENSIVE_BLOCK',
          mitigationRatio: 0.85, // 85% damage blocked/deflected
        };
      }
    }

    // 25% Vulnerability window: Prediction failed, takes full critical obliteration!
    return {
      predicted: false,
      defenseType: 'NONE',
      mitigationRatio: 0,
    };
  }

  /** Analyzes recent move frequency and dynamically scales counter/parry rates */
  private recalculateRepetitionPenalty(currentMove: PlayerCombatMove) {
    if (this.playerActionHistory.length === 0) {
      this.repeatedMovePunishRate = 0.25;
      return;
    }

    const occurrences = this.playerActionHistory.filter((m) => m === currentMove).length;

    if (occurrences >= 4) {
      this.repeatedMovePunishRate = 0.95; // Extreme anti-spam punishment
    } else if (occurrences === 3) {
      this.repeatedMovePunishRate = 0.80; // High pattern recognition
    } else if (occurrences === 2) {
      this.repeatedMovePunishRate = 0.55; // Moderate adaptation
    } else {
      this.repeatedMovePunishRate = 0.25; // Base competitive baseline (diverse inputs bypass AI)
    }
  }

  /** Returns calculated counter/evasion success rate for a specific player move */
  public getEvasionSuccessRate(move: PlayerCombatMove): number {
    const occurrences = this.playerActionHistory.filter((m) => m === move).length;
    if (occurrences >= 4) return 0.95;
    if (occurrences === 3) return 0.80;
    if (occurrences === 2) return 0.55;
    return 0.28;
  }

  /** Updates player combat inactivity / turtling and triggers Executioner Mode */
  public updatePlayerCombatPacing(
    inCombatRange: boolean,
    hasActiveThreats: boolean,
    isPlayerWhiffing: boolean
  ): { executionerActive: boolean; cognitivePressure: number; isSpamming: boolean } {
    if (inCombatRange && hasActiveThreats) {
      this.playerIdleCombatTimer++;
    } else {
      this.playerIdleCombatTimer = Math.max(0, this.playerIdleCombatTimer - 2);
    }

    // Over 1.5 seconds (90 frames at 60fps) of inactivity/turtling in combat zone -> EXECUTIONER MODE
    const wasExecutioner = this.executionerModeActive;
    this.executionerModeActive = this.playerIdleCombatTimer > 90;

    if (this.executionerModeActive && !wasExecutioner) {
      sound.playExecutionerAlarm();
    }

    // Cognitive pressure climbs based on idle time and proximity of threats
    const targetPressure = this.executionerModeActive
      ? Math.min(1.0, 0.55 + (this.playerIdleCombatTimer - 90) * 0.008)
      : inCombatRange
      ? Math.min(0.4, this.playerIdleCombatTimer / 90 * 0.4)
      : 0.0;

    this.cognitivePressureIntensity += (targetPressure - this.cognitivePressureIntensity) * 0.08;

    return {
      executionerActive: this.executionerModeActive,
      cognitivePressure: this.cognitivePressureIntensity,
      isSpamming: this.repeatedMovePunishRate >= 0.80,
    };
  }

  public getState(): ProAICombatDirectorState {
    return {
      playerActionHistory: [...this.playerActionHistory],
      repeatedMovePunishRate: this.repeatedMovePunishRate,
      lastActionTimestamp: this.lastActionTimestamp,
      playerIdleCombatTimer: this.playerIdleCombatTimer,
      executionerModeActive: this.executionerModeActive,
      cognitivePressureIntensity: this.cognitivePressureIntensity,
    };
  }

  public reset() {
    this.playerActionHistory = [];
    this.comboSequence = [];
    this.consecutiveSameInputCount = 0;
    this.lastInputType = null;
    this.isFinisherExpected = false;
    this.predictedNextInput = null;
    this.repeatedMovePunishRate = 0.25;
    this.playerIdleCombatTimer = 0;
    this.executionerModeActive = false;
    this.cognitivePressureIntensity = 0.0;
  }
}

export const proCombatAI = new ProAICombatDirector();

// ============================================================================
// 1. RAYCAST & PLATFORM DETECTION UTILITIES
// ============================================================================

/**
 * Line-segment intersection test with AABB Cyber Obstacle
 */
function lineIntersectsAABB(
  p1: Vector2D,
  p2: Vector2D,
  box: BoundingBox
): boolean {
  const minX = box.x;
  const maxX = box.x + box.width;
  const minY = box.y;
  const maxY = box.y + box.height;

  // Quick bounding box rejection
  if (
    Math.max(p1.x, p2.x) < minX ||
    Math.min(p1.x, p2.x) > maxX ||
    Math.max(p1.y, p2.y) < minY ||
    Math.min(p1.y, p2.y) > maxY
  ) {
    return false;
  }

  // Ray box intersection using Liang-Barsky / Slab algorithm
  let tmin = 0;
  let tmax = 1;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // X slab
  if (Math.abs(dx) > 1e-6) {
    let t1 = (minX - p1.x) / dx;
    let t2 = (maxX - p1.x) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  } else if (p1.x < minX || p1.x > maxX) {
    return false;
  }

  // Y slab
  if (Math.abs(dy) > 1e-6) {
    let t1 = (minY - p1.y) / dy;
    let t2 = (maxY - p1.y) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  } else if (p1.y < minY || p1.y > maxY) {
    return false;
  }

  return tmin <= tmax && tmax >= 0 && tmin <= 1;
}

/**
 * Checks clear line of sight between two world positions against solid obstacles
 */
export function checkLineOfSight(
  from: Vector2D,
  to: Vector2D,
  obstacles: CyberObstacle[]
): boolean {
  for (const obs of obstacles) {
    if (!obs.active) continue;
    if (lineIntersectsAABB(from, to, obs.bounds)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a specific point is resting directly on or inside a solid platform
 */
export function isPointInsideObstacle(point: Vector2D, obstacles: CyberObstacle[]): boolean {
  for (const obs of obstacles) {
    if (!obs.active) continue;
    if (
      point.x >= obs.bounds.x &&
      point.x <= obs.bounds.x + obs.bounds.width &&
      point.y >= obs.bounds.y &&
      point.y <= obs.bounds.y + obs.bounds.height
    ) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// 2. ADVANCED ENEMY AI DIRECTOR FUNCTION
// ============================================================================

/**
 * Checks if a direct raycast segment between two points is blocked/intersected by a 3D explosion crater / pit hazard
 */
export function checkPitBlockingSegment(
  from: Vector2D,
  to: Vector2D,
  isPitHazardAt?: (x: number, y: number) => boolean
): boolean {
  if (!isPitHazardAt) return false;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 8) return false;
  const steps = Math.min(25, Math.max(4, Math.floor(dist / 24)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sx = from.x + dx * t;
    const sy = from.y + dy * t;
    if (isPitHazardAt(sx, sy)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates a safe navigational detour vector around the jagged perimeter rim of an explosion crater
 */
export function findClearNavAngleAroundPit(
  pos: Vector2D,
  desiredAngle: number,
  isPitHazardAt?: (x: number, y: number) => boolean,
  obstacles?: CyberObstacle[]
): number {
  if (!isPitHazardAt) return desiredAngle;
  const checkDists = [28, 48];
  const testOffsets = [0, 0.5, -0.5, 1.0, -1.0, 1.57, -1.57, 2.1, -2.1, 2.7, -2.7, Math.PI];
  for (const offset of testOffsets) {
    const testAngle = desiredAngle + offset;
    let isClear = true;
    for (const cd of checkDists) {
      const tx = pos.x + Math.cos(testAngle) * cd;
      const ty = pos.y + Math.sin(testAngle) * cd;
      if (isPitHazardAt(tx, ty)) {
        isClear = false;
        break;
      }
      if (obstacles && isPointInsideObstacle({ x: tx, y: ty }, obstacles)) {
        isClear = false;
        break;
      }
    }
    if (isClear) {
      return testAngle;
    }
  }
  return desiredAngle + Math.PI / 2;
}

/**
 * Initializes director parameters for an EnemyBacteria organism if missing
 */
export function initBacteriaAIData(bac: EnemyBacteria, ent: WorldEntity) {
  bac.variant = bac.variant || 'MUTATED_ORGANIC';
  bac.detectionRadius = bac.detectionRadius || (bac.isBoss ? 800 : bac.variant === 'STEALTH_STALKER' ? 520 : 450);
  bac.jumpCooldown = bac.jumpCooldown || 0;
  bac.leapTimer = bac.leapTimer || 0;
  bac.patrolTimer = bac.patrolTimer || 80 + Math.floor(Math.random() * 80);
  bac.patrolDir = bac.patrolDir || (Math.random() < 0.5 ? -1 : 1);
  bac.alertTimer = bac.alertTimer || 0;
  bac.pounceTimer = bac.pounceTimer || 0;
  bac.onGround = bac.onGround !== undefined ? bac.onGround : true;
  bac.losDetected = false;
  bac.stealthAlpha = bac.stealthAlpha !== undefined ? bac.stealthAlpha : (bac.variant === 'STEALTH_STALKER' || bac.variant === 'MISSION_TARGET_ELITE' ? 0.2 : 1.0);
  bac.projectileCooldown = bac.projectileCooldown || 0;
  bac.pitAttackCooldown = bac.pitAttackCooldown || 0;
  bac.pitNavAngle = bac.pitNavAngle || 0;
  bac.pitBlockedPlayer = !!bac.pitBlockedPlayer;
  bac.surrenderChance = bac.surrenderChance !== undefined ? bac.surrenderChance : (bac.isBoss ? 0 : 0.35); // 35% chance for regular minions
  bac.surrendered = !!bac.surrendered;
  bac.surrenderTimer = bac.surrenderTimer || 0;

  // Tactical Stealth AI parameters
  if (bac.facingAngle === undefined) {
    bac.facingAngle = bac.patrolDir > 0 ? 0 : Math.PI;
  }
  bac.visionFov = bac.visionFov || (bac.isBoss ? 2.2 : bac.variant === 'STEALTH_STALKER' ? 1.6 : 1.3); // ~75 degrees
  bac.visionRange = bac.visionRange || (bac.isBoss ? 420 : bac.variant === 'STEALTH_STALKER' ? 350 : 290);
  bac.alertness = bac.alertness || 0;
  bac.canStealthKill = false;
  bac.patrolWaitTimer = bac.patrolWaitTimer || 0;
  bac.scanSweepAngle = bac.scanSweepAngle || 0;

  // Ghost Teleport & Ambush Parameters
  bac.ghostPhase = bac.ghostPhase || 'IDLE';
  bac.ghostGlitchTimer = bac.ghostGlitchTimer || 0;
  bac.ghostCooldown = bac.ghostCooldown !== undefined ? bac.ghostCooldown : Math.floor(180 + Math.random() * 240);
  bac.ghostGlitchIntensity = bac.ghostGlitchIntensity || 0;

  // Panic & Flee Parameters
  bac.panicTimer = bac.panicTimer || 0;
  bac.panicSpeed = bac.panicSpeed || 5.2;

  // Tactical Retreat & Flank Parameters
  bac.retreatTimer = bac.retreatTimer || 0;
  bac.coverTargetPos = bac.coverTargetPos || null;
  bac.flankTimer = bac.flankTimer || 0;

  // Glitch Dash & Direct Counter
  bac.counterCooldown = bac.counterCooldown !== undefined ? bac.counterCooldown : Math.floor(60 + Math.random() * 120);
  bac.glitchDashTimer = bac.glitchDashTimer || 0;
  bac.chargeTimer = bac.chargeTimer || 0;

  // Neon Clone System
  bac.hasCloned = !!bac.hasCloned;
  bac.isCloneDecoy = !!bac.isCloneDecoy;
  bac.cloneFlashTimer = bac.cloneFlashTimer || 0;

  // Flashlight Jamming EMP Blast
  bac.flashlightExposureTimer = bac.flashlightExposureTimer || 0;
  bac.empChargeTimer = bac.empChargeTimer || 0;
  bac.empCooldown = bac.empCooldown !== undefined ? bac.empCooldown : Math.floor(120 + Math.random() * 180);

  if (bac.isBoss) {
    bac.bossPhase = bac.bossPhase || 1;
    bac.maxBossPhases = 3;
    bac.shield = bac.shield !== undefined ? bac.shield : 150;
    bac.maxShield = bac.maxShield || 150;
    bac.enrageTimer = bac.enrageTimer || 0;
    bac.summonMinionTimer = bac.summonMinionTimer || 180;
    bac.laserSweepAngle = bac.laserSweepAngle || 0;
  }
}

/**
 * Checks and triggers randomized surrender for an enemy when wounded or combo'd
 */
export function checkEnemySurrender(bac: EnemyBacteria): boolean {
  if (bac.isBoss || bac.surrendered) return false;
  
  // Chance to surrender if health is below 35%
  if (bac.health <= bac.maxHealth * 0.35) {
    const roll = Math.random();
    if (roll < (bac.surrenderChance || 0.35)) {
      bac.surrendered = true;
      bac.state = 'SURRENDER';
      bac.surrenderTimer = 600; // Persists surrendered
      return true;
    }
  }
  return false;
}

/**
 * Advanced Enemy AI Director:
 * Controls pathfinding, sight cones, tactical stealth detection, cover occlusion,
 * suspicious investigations, combat lunges, toxic projectiles, and stealth takedown vulnerability.
 */
export function updateBacteriaAIDirector(
  bac: EnemyBacteria,
  ent: WorldEntity,
  player: Player,
  obstacles: CyberObstacle[],
  onHitPlayer: (damage: number, color: string) => void,
  onSpawnProjectile?: (proj: { x: number; y: number; vx: number; vy: number; damage: number; color: string; isHostile: boolean }) => void,
  onSpawnMinion?: (x: number, y: number, variant: EnemyBacteria['variant']) => void,
  onSpawnClones?: (bac: EnemyBacteria, ent: WorldEntity) => void,
  onFlashlightJam?: () => void,
  onKnockbackPlayer?: (forceX: number, forceY: number) => void,
  isPitHazardAt?: (worldX: number, worldY: number) => boolean
) {
  initBacteriaAIData(bac, ent);

  // Time decay for timers
  bac.pulsePhase += 0.04;
  bac.canStealthKill = false;
  if (bac.counterCooldown && bac.counterCooldown > 0) bac.counterCooldown--;
  if (bac.empCooldown && bac.empCooldown > 0) bac.empCooldown--;
  if (bac.cloneFlashTimer && bac.cloneFlashTimer > 0) bac.cloneFlashTimer--;
  if (bac.pitAttackCooldown && bac.pitAttackCooldown > 0) bac.pitAttackCooldown--;

  // --- 1. SURRENDER STATE HANDLING ---
  if (bac.surrendered || bac.state === 'SURRENDER') {
    bac.state = 'SURRENDER';
    ent.velocity.x *= 0.82;
    ent.velocity.y *= 0.82;
    ent.position.x += ent.velocity.x;
    ent.position.y += ent.velocity.y;
    bac.wobbleAmount = 0.08;
    bac.membraneAlpha = 0.85;
    bac.alertness = 0;
    return;
  }

  // --- 2. HIT STAGGER ---
  if (bac.hitStaggerTimer > 0) {
    bac.hitStaggerTimer--;
    bac.state = 'STAGGER';
    ent.velocity.x *= 0.88;
    ent.velocity.y *= 0.88;
    ent.position.x += ent.velocity.x;
    ent.position.y += ent.velocity.y;
    return;
  }

  if (bac.jumpCooldown > 0) bac.jumpCooldown--;
  if (bac.projectileCooldown && bac.projectileCooldown > 0) bac.projectileCooldown--;

  const pos = ent.position;
  const playerPos = player.position;
  const dx = playerPos.x - pos.x;
  const dy = playerPos.y - pos.y;
  const distToPlayer = Math.hypot(dx, dy);
  const dirX = dx >= 0 ? 1 : -1;

  // --- 2.5 NEON CLONE SPLIT ABILITY TRIGGER (When Health < 70%) ---
  if (
    bac.health <= bac.maxHealth * 0.70 &&
    !bac.hasCloned &&
    !bac.isCloneDecoy &&
    !bac.surrendered &&
    !bac.isBoss
  ) {
    bac.hasCloned = true;
    bac.cloneFlashTimer = 28;
    sound.playCloneSplit();
    if (onSpawnClones) {
      onSpawnClones(bac, ent);
    }
  }

  // --- TACTICAL SIGHT-CONE & RAYCAST DETECTION ---
  const angleToPlayer = Math.atan2(dy, dx);
  let angleDiff = Math.abs(Math.atan2(Math.sin(angleToPlayer - bac.facingAngle), Math.cos(angleToPlayer - bac.facingAngle)));

  // Effective vision parameters based on player stealth stance
  let effectiveVisionRange = bac.visionRange;
  if (player.isCrouching) {
    effectiveVisionRange *= 0.62; // Crouching cuts enemy sight range by ~38%
  }
  if (player.isCovered) {
    effectiveVisionRange *= 0.35; // Cover drastically shields player from sight
  }

  const inVisionCone = angleDiff <= (bac.visionFov / 2) && distToPlayer <= effectiveVisionRange;
  const hasLOS = inVisionCone && checkLineOfSight(pos, playerPos, obstacles) && (!player.isCovered || distToPlayer < 45);
  bac.losDetected = hasLOS;

  // --- 2.6 FLASHLIGHT JAMMING (EMP BLAST) DETECTION ---
  // Elite enemies build up EMP when caught in the player's direct flashlight beam
  const isEliteOrBoss = bac.variant === 'MISSION_TARGET_ELITE' || bac.variant === 'APEX_BOSS' || bac.variant === 'CYBER_BRUTE' || bac.isBoss;
  if (isEliteOrBoss && !bac.surrendered) {
    const anglePlayerToEnemy = Math.atan2(pos.y - playerPos.y, pos.x - playerPos.x);
    const beamAngleDiff = Math.abs(Math.atan2(Math.sin(anglePlayerToEnemy - player.angle), Math.cos(anglePlayerToEnemy - player.angle)));
    const inBeam = distToPlayer < 360 && beamAngleDiff < 0.42 && checkLineOfSight(playerPos, pos, obstacles) && (player.flashlightJammedTimer <= 0);

    if (inBeam) {
      bac.flashlightExposureTimer = (bac.flashlightExposureTimer || 0) + 1;
      if (bac.flashlightExposureTimer > 42 && (bac.empCooldown || 0) <= 0 && bac.state !== 'EMP_CHARGE') {
        bac.state = 'EMP_CHARGE';
        bac.empChargeTimer = 34;
        sound.playFlashlightGlitch();
      }
    } else {
      bac.flashlightExposureTimer = Math.max(0, (bac.flashlightExposureTimer || 0) - 0.5);
    }
  }

  // --- 2.7 FLAWLESS FRAME-CANCEL & PRO ADAPTIVE EVASION TRIGGER ---
  // If the player initiates an attack (slash, dash-strike, projectile burst)
  // or approaches aggressively, enemies can execute a Flawless Frame-Cancel:
  // instantly aborting their active animation to trigger one of the 4 Adaptive Evasions.
  const isPlayerAttackingNear = distToPlayer < 175 && (
    player.slashTimer > 0 ||
    player.dashTimer > 0 ||
    player.whiffRecoveryTimer > 0 ||
    Math.hypot(player.velocity.x, player.velocity.y) > 3.2
  );

  const canEvade = (bac.counterCooldown || 0) <= 0 &&
    (bac.frameCancelCooldown || 0) <= 0 &&
    bac.state !== 'STAGGER' &&
    bac.state !== 'ADAPTIVE_EVASION_A' &&
    bac.state !== 'ADAPTIVE_EVASION_B' &&
    bac.state !== 'ADAPTIVE_EVASION_C' &&
    bac.state !== 'ADAPTIVE_EVASION_D' &&
    bac.state !== 'VAULT_PLUNGE_SLAM' &&
    bac.state !== 'EMP_CHARGE' &&
    !bac.surrendered &&
    !bac.isCloneDecoy;

  if (isPlayerAttackingNear && canEvade) {
    // Determine evasion success rate based on AI Memory Buffer anti-spam analysis
    const currentAction = player.slashTimer > 0
      ? (player.slashCombo === 1 ? 'SLASH_1' : player.slashCombo === 2 ? 'SLASH_2' : 'SLASH_3')
      : player.dashTimer > 0
      ? 'DASH_EVADE'
      : 'SLASH_1';

    const evasionChance = proCombatAI.getEvasionSuccessRate(currentAction as any);
    const roll = Math.random();

    if (roll < evasionChance) {
      // Execute Flawless Frame-Cancel
      bac.frameCancelCooldown = 180 + Math.floor(Math.random() * 80);
      bac.counterCooldown = 160 + Math.floor(Math.random() * 60);

      // Select one of the 4 Adaptive Evasion Types:
      // Type A: Side Strafe Dash Mix-up (Agile Stalkers & Cyber Brutes)
      // Type B: Duck & Under-Roll Flank (Stealth Stalkers & Minions)
      // Type C: Tactical Smoke & Decoy Split (Elites & Bosses & Spawners)
      // Type D: Frame-Perfect Parry Stance (Elites, Bosses & Cyber Brutes)
      let evasionType: 'A' | 'B' | 'C' | 'D' = 'A';
      if (bac.isBoss || bac.variant === 'MISSION_TARGET_ELITE') {
        evasionType = Math.random() < 0.45 ? 'D' : Math.random() < 0.75 ? 'C' : 'A';
      } else if (bac.variant === 'STEALTH_STALKER') {
        evasionType = Math.random() < 0.5 ? 'B' : 'C';
      } else if (bac.variant === 'CYBER_BRUTE') {
        evasionType = Math.random() < 0.55 ? 'D' : 'A';
      } else {
        const types: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
        evasionType = types[Math.floor(Math.random() * types.length)];
      }

      bac.evasionType = evasionType;

      if (evasionType === 'A') {
        // --- TYPE A: SIDE STRAFE DASH WITH MIX-UP ---
        bac.state = 'ADAPTIVE_EVASION_A';
        bac.evasionTimer = 16;
        bac.evasionMixupChained = false;
        const sideSign = Math.random() < 0.5 ? 1 : -1;
        const perpAngle = angleToPlayer + sideSign * (Math.PI / 2);
        ent.velocity.x = Math.cos(perpAngle) * 11.5;
        ent.velocity.y = Math.sin(perpAngle) * 11.5;
        sound.playEnemyGlitchDash();
      } else if (evasionType === 'B') {
        // --- TYPE B: DUCK & UNDER-ROLL FLANK ---
        bac.state = 'ADAPTIVE_EVASION_B';
        bac.evasionTimer = 18;
        bac.evasionDuckFrames = 18; // Invulnerable to high sword slashes
        // Slide swiftly directly underneath the player to their blind spot
        const underAngle = angleToPlayer;
        ent.velocity.x = Math.cos(underAngle) * 13.0;
        ent.velocity.y = Math.sin(underAngle) * 4.0;
        sound.playSlide();
      } else if (evasionType === 'C') {
        // --- TYPE C: TACTICAL SMOKE & DECOY SPLIT ---
        bac.state = 'ADAPTIVE_EVASION_C';
        bac.evasionTimer = 22;
        sound.playSmokeBomb();
        // Spawn fragile explosive decoy at original spot
        if (onSpawnClones) {
          bac.isExplosiveDecoy = false;
          onSpawnClones(bac, ent);
        }
        // Real enemy gains 1.5x speed buff and retreats
        const retreatAngle = Math.atan2(-dy, -dx);
        ent.velocity.x = Math.cos(retreatAngle) * 9.5;
        ent.velocity.y = -5.5; // Jumps upward to high ground
      } else if (evasionType === 'D') {
        // --- TYPE D: FRAME-PERFECT PARRY & COUNTER VAULT ---
        bac.state = 'ADAPTIVE_EVASION_D';
        bac.parryWindowTimer = 12; // 0.2-second (12 frames) Parry Stance
        bac.parryStanceFlash = 12;
        ent.velocity.x *= 0.2;
        ent.velocity.y *= 0.2;
        bac.wobbleAmount = 0.9;
      }
    }
  }

  // --- 2.8 PIT HAZARD RAYCAST & SEPARATED RANGED BIO-ATTACK DIRECTIVE ---
  // Check if an explosion crater or pit hazard blocks the direct raycast line of sight to the player
  const isPitBlockingPathToPlayer = isPitHazardAt ? checkPitBlockingSegment(pos, playerPos, isPitHazardAt) : false;
  bac.pitBlockedPlayer = isPitBlockingPathToPlayer;

  // If the player is within range (<= 480px) but separated by a pit hazard/crater:
  // The enemy must STOP MOVING and fire a projectile attack (ranged bacterial splash/acid fluid)
  // directly at the player with a 2-second (120-frame) cooldown.
  const isPitHazardBlocking = isPitBlockingPathToPlayer && distToPlayer <= 480 && !bac.surrendered && bac.state !== 'STAGGER' && !bac.isCloneDecoy;
  if (isPitHazardBlocking) {
    // 1. Stop moving immediately (do not walk forward blindly into the pit)
    ent.velocity.x *= 0.12;
    ent.velocity.y *= 0.12;
    bac.facingAngle = angleToPlayer;
    bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
    bac.state = 'PIT_RANGED_ATTACK';
    bac.wobbleAmount = 0.55;

    // 2. Fire Ranged Bacterial Splash / Acid Fluid projectile on 2-second cooldown
    if ((bac.pitAttackCooldown || 0) <= 0 && onSpawnProjectile) {
      bac.pitAttackCooldown = 120; // 2 seconds (120 frames at 60 FPS)
      bac.projectileCooldown = 120;

      const projSpeed = 7.5;
      onSpawnProjectile({
        x: pos.x + Math.cos(angleToPlayer) * (bac.radius + 8),
        y: pos.y + Math.sin(angleToPlayer) * (bac.radius + 8),
        vx: Math.cos(angleToPlayer) * projSpeed,
        vy: Math.sin(angleToPlayer) * projSpeed,
        damage: 16,
        color: '#39FF14',
        isHostile: true,
      });

      sound.playToxicAcidSpit();
    }
  }

  // --- 2.9 PIT HAZARD PERIMETER & CRATER RIM NAVIGATIONAL AVOIDANCE ---
  // If moving forward would cause the enemy to step into a pit/crater hazard:
  // The enemy must NOT blindly walk forward. Instead, navigate/patrol around the crater edge!
  const moveHeading = Math.hypot(ent.velocity.x, ent.velocity.y) > 0.3
    ? Math.atan2(ent.velocity.y, ent.velocity.x)
    : bac.facingAngle;
  const pitLookAheadDist = 36;
  const isPitDirectlyAhead = isPitHazardAt
    ? isPitHazardAt(pos.x + Math.cos(moveHeading) * pitLookAheadDist, pos.y + Math.sin(moveHeading) * pitLookAheadDist)
    : false;

  if (isPitDirectlyAhead && bac.state !== 'PIT_RANGED_ATTACK' && bac.state !== 'STAGGER' && !bac.surrendered) {
    const clearDetourAngle = findClearNavAngleAroundPit(pos, moveHeading, isPitHazardAt, obstacles);
    bac.pitNavAngle = clearDetourAngle;
    bac.state = 'PIT_AVOID_NAV';
    ent.velocity.x = Math.cos(clearDetourAngle) * 2.8;
    ent.velocity.y = Math.sin(clearDetourAngle) * 2.8;
    bac.facingAngle = clearDetourAngle;
    bac.facing = Math.cos(clearDetourAngle) >= 0 ? 'RIGHT' : 'LEFT';
  }

  // --- 2.10 PLAYER WHIFF / RECOVERY PUNISH AUTO-COUNTER ---
  // If the player whiffs an attack and is in recovery frames near an alerted enemy:
  if (
    player.whiffRecoveryTimer > 0 &&
    distToPlayer < 140 &&
    (bac.state === 'CHASE' || bac.state === 'ALERT') &&
    (bac.counterCooldown || 0) <= 0 &&
    !bac.surrendered &&
    !bac.isCloneDecoy
  ) {
    // Enemy instantly punishes player's recovery frames with a swift thrust
    bac.state = 'POUNCE';
    bac.pounceTimer = 16;
    bac.counterCooldown = 90;
    ent.velocity.x = dirX * 9.5;
    ent.velocity.y = (dy / distToPlayer) * 4.2;
  }

  // Hearing Noise Detection: Player running or shooting creates noise
  const noiseDist = player.noiseLevel > 10 ? player.noiseLevel * 4.2 : 0;
  const heardPlayerNoise = distToPlayer < noiseDist && !player.isCrouching && checkLineOfSight(pos, playerPos, obstacles);

  // Update Alertness Gauge (0 to 100)
  if (hasLOS) {
    const proximityMultiplier = 1 + (1 - Math.min(1, distToPlayer / effectiveVisionRange)) * 1.5;
    const crouchSlowdown = player.isCrouching ? 0.7 : 1.6;
    bac.alertness = Math.min(100, bac.alertness + 1.8 * proximityMultiplier * crouchSlowdown);
  } else if (heardPlayerNoise) {
    bac.alertness = Math.min(100, bac.alertness + 1.2);
    bac.suspicionPos = { x: playerPos.x, y: playerPos.y };
  } else {
    // Alertness naturally cools down when player is hidden
    bac.alertness = Math.max(0, bac.alertness - 0.45);
  }

  // --- STEALTH TAKEDOWN (ASSASSINATION) CHECK ---
  // Player is within stealth kill range (<72px) and sneaking up behind or enemy is unaware
  if (distToPlayer < 72 && !bac.surrendered && !bac.isBoss) {
    // Behind enemy (angle difference > 100 degrees / 1.75 rad) OR enemy is in PATROL/SUSPICIOUS with low alertness
    const isBehindEnemy = angleDiff > 1.65;
    const isEnemyUnaware = bac.state === 'PATROL' || (bac.state === 'SUSPICIOUS' && bac.alertness < 75);
    
    if (isBehindEnemy || (isEnemyUnaware && !hasLOS)) {
      bac.canStealthKill = true;
    }
  }

  // --- DYNAMIC STEALTH & PANIC PURSUIT TRIGGER (NO DISAPPEARING / VANISHING) ---
  // When the player approaches closely without sneaking (crouching) or creates high noise/dash,
  // the virus does NOT vanish into thin air. Instead, it triggers PANIC_FLEE, physically running away.
  const isLoudApproach = !player.isCrouching && (
    Math.hypot(player.velocity.x, player.velocity.y) > 2.2 || 
    player.dashTimer > 0 || 
    player.noiseLevel > 12 || 
    distToPlayer < 240
  );

  if (isLoudApproach && distToPlayer < 280 && !bac.isBoss && !bac.surrendered) {
    if (bac.state === 'PATROL' || bac.state === 'SUSPICIOUS' || bac.state === 'ALERT') {
      bac.state = 'PANIC_FLEE';
      bac.panicTimer = 140 + Math.floor(Math.random() * 80);
      bac.panicSpeed = 6.2 + Math.random() * 1.8;
      bac.alertness = 100;
      bac.losDetected = true;
      bac.wobbleAmount = 0.55;
    }
  }

  // --- TACTICAL HEAD-ON COUNTER-COMBAT TRIGGER ---
  // If spotted head-on (direct face-to-face confrontation), enemy retreats and looks for cover
  if (hasLOS && angleDiff < 0.7 && distToPlayer < 240 && !player.isCrouching && !bac.isBoss && !bac.surrendered) {
    if (bac.state === 'CHASE' || bac.state === 'ALERT') {
      // Find nearest cover obstacle
      let bestCover: CyberObstacle | null = null;
      let minCovDist = Infinity;
      for (const obs of obstacles) {
        if (!obs.active) continue;
        const cX = obs.bounds.x + obs.bounds.width / 2;
        const cY = obs.bounds.y + obs.bounds.height / 2;
        const cDist = Math.hypot(cX - pos.x, cY - pos.y);
        if (cDist < 450 && cDist < minCovDist) {
          minCovDist = cDist;
          bestCover = obs;
        }
      }

      if (bestCover) {
        bac.coverTargetPos = {
          x: bestCover.bounds.x + bestCover.bounds.width / 2,
          y: bestCover.bounds.y + bestCover.bounds.height / 2,
        };
      }

      bac.state = 'TACTICAL_RETREAT';
      bac.retreatTimer = 120 + Math.floor(Math.random() * 60);
    }
  }

  // --- Ensure full visibility and glowing clarity (Never vanish into thin air) ---
  bac.stealthAlpha = 1.0;

  // --- Platform & Ground Scanning ---
  const lookAheadDist = 36 * (Math.cos(bac.facingAngle) >= 0 ? 1 : -1);
  const groundCheckAhead: Vector2D = { x: pos.x + lookAheadDist, y: pos.y + bac.radius + 18 };
  const wallCheckAhead: Vector2D = { x: pos.x + lookAheadDist * 0.8, y: pos.y };
  
  const hasGroundAhead = isPointInsideObstacle(groundCheckAhead, obstacles);
  const hasWallAhead = isPointInsideObstacle(wallCheckAhead, obstacles);

  const isPlayerAbove = dy < -45;
  const isPlayerBelow = dy > 65;

  // --- 3. APEX BOSS SPECIAL LOGIC ---
  if (bac.isBoss) {
    bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
    bac.facingAngle = dirX > 0 ? 0 : Math.PI;
    bac.pulseSpeed = 0.06 + (bac.bossPhase || 1) * 0.02;

    // Phase transition based on health ratio
    const healthRatio = bac.health / bac.maxHealth;
    if (healthRatio <= 0.35) {
      bac.bossPhase = 3; // Enraged Apex Phase
    } else if (healthRatio <= 0.7) {
      bac.bossPhase = 2; // Assault & Summon Phase
    } else {
      bac.bossPhase = 1; // Heavy Laser Phase
    }

    // Boss Phase Actions
    const bossSpeed = bac.bossPhase === 3 ? 0.28 : bac.bossPhase === 2 ? 0.22 : 0.16;
    ent.velocity.x += dirX * bossSpeed;

    // Boss Projectile Barrage
    if (bac.projectileCooldown !== undefined && bac.projectileCooldown <= 0 && onSpawnProjectile) {
      if (bac.bossPhase === 1) {
        // Heavy Plasma Mortar
        const angle = Math.atan2(dy, dx);
        onSpawnProjectile({
          x: pos.x + Math.cos(angle) * (bac.radius + 10),
          y: pos.y + Math.sin(angle) * (bac.radius + 10),
          vx: Math.cos(angle) * 7.5,
          vy: Math.sin(angle) * 7.5,
          damage: 18,
          color: '#FF0055',
          isHostile: true,
        });
        bac.projectileCooldown = 45;
      } else if (bac.bossPhase === 2) {
        // Triple Spread Blast
        const baseAngle = Math.atan2(dy, dx);
        [-0.25, 0, 0.25].forEach((spread) => {
          onSpawnProjectile({
            x: pos.x,
            y: pos.y,
            vx: Math.cos(baseAngle + spread) * 8.5,
            vy: Math.sin(baseAngle + spread) * 8.5,
            damage: 15,
            color: '#FFE600',
            isHostile: true,
          });
        });
        bac.projectileCooldown = 55;
      } else if (bac.bossPhase === 3) {
        // Radial 8-Way Hyper Shockwave
        for (let a = 0; a < 8; a++) {
          const rAngle = (a / 8) * Math.PI * 2 + (bac.pulsePhase || 0);
          onSpawnProjectile({
            x: pos.x,
            y: pos.y,
            vx: Math.cos(rAngle) * 6.5,
            vy: Math.sin(rAngle) * 6.5,
            damage: 22,
            color: '#00FFD1',
            isHostile: true,
          });
        }
        bac.projectileCooldown = 65;
      }
    }

    // Boss Minion Summoning (Phase 2 & 3)
    if (bac.summonMinionTimer !== undefined) {
      bac.summonMinionTimer--;
      if (bac.summonMinionTimer <= 0 && onSpawnMinion && (bac.bossPhase || 1) >= 2) {
        onSpawnMinion(pos.x - 90, pos.y - 40, 'STEALTH_STALKER');
        onSpawnMinion(pos.x + 90, pos.y - 40, 'TOXIC_SPITTER');
        bac.summonMinionTimer = 320; // 5-second cooldown
      }
    }

    // Boss Jump Leap
    if ((hasWallAhead || !hasGroundAhead || isPlayerAbove) && bac.jumpCooldown <= 0) {
      bac.jumpCooldown = 90;
      ent.velocity.y = -9.0;
      ent.velocity.x = dirX * 5.0;
    }
  } 
  // --- 4. TOXIC SPITTER & RANGED SQUAD VARIANT ---
  else if (bac.variant === 'TOXIC_SPITTER') {
    bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
    bac.facingAngle = Math.atan2(dy, dx);

    // Smart Squad Positioning: Maintain optimal firing standoff (220px - 320px) or seek cover
    if (distToPlayer < 190) {
      // Seek nearest cover obstacle if player rushes
      let bestCoverPos: Vector2D | null = null;
      let minCoverDist = Infinity;
      for (const obs of obstacles) {
        if (!obs.active) continue;
        const obsCenterX = obs.bounds.x + obs.bounds.width / 2;
        const obsCenterY = obs.bounds.y + obs.bounds.height / 2;
        // Cover position is on the far side of obstacle relative to player
        const coverX = obsCenterX + (obsCenterX > playerPos.x ? 25 : -25);
        const d = Math.hypot(coverX - pos.x, obsCenterY - pos.y);
        if (d < minCoverDist && d < 280) {
          minCoverDist = d;
          bestCoverPos = { x: coverX, y: obsCenterY };
        }
      }

      if (bestCoverPos) {
        const toCoverX = bestCoverPos.x - pos.x;
        ent.velocity.x += (toCoverX > 0 ? 1 : -1) * 0.22;
      } else {
        ent.velocity.x -= dirX * 0.24; // Fast tactical backpedal
      }
    } else if (distToPlayer > 310) {
      ent.velocity.x += dirX * 0.14; // Advance to firing range
    }

    // High-angle toxic spit / predictive mortar barrage when line of sight is clear
    if (hasLOS && bac.projectileCooldown !== undefined && bac.projectileCooldown <= 0 && onSpawnProjectile) {
      const isExecutioner = proCombatAI.executionerModeActive;
      const projSpeed = isExecutioner ? 11.0 : 6.5;

      // In Executioner Mode: Calculate predictive interception lead trajectory
      let targetX = playerPos.x;
      let targetY = playerPos.y;
      if (isExecutioner) {
        const tLead = distToPlayer / projSpeed;
        targetX += player.velocity.x * tLead * 1.2;
        targetY += player.velocity.y * tLead * 1.2;
      }

      const pDx = targetX - pos.x;
      const pDy = targetY - pos.y;
      const angle = Math.atan2(pDy, pDx);

      onSpawnProjectile({
        x: pos.x + Math.cos(angle) * (bac.radius + 6),
        y: pos.y + Math.sin(angle) * (bac.radius + 6),
        vx: Math.cos(angle) * projSpeed,
        vy: Math.sin(angle) * projSpeed,
        damage: isExecutioner ? 22 : 14,
        color: isExecutioner ? '#FF0055' : '#39FF14',
        isHostile: true,
      });

      bac.projectileCooldown = isExecutioner ? 42 : 75; // Faster firing in executioner mode
    }
  }
  // --- 5. TACTICAL STEALTH & MELEE SQUAD FINITE STATE MACHINE ---
  else {
    // State transitions based on alertness
    if (bac.alertness >= 100 && bac.state !== 'CHASE' && bac.state !== 'ALERT' && bac.state !== 'POUNCE' && bac.state !== 'LEAP') {
      bac.state = 'ALERT';
      bac.alertTimer = 20;
    } else if (bac.alertness >= 35 && bac.state === 'PATROL') {
      bac.state = 'SUSPICIOUS';
      bac.suspicionPos = { x: playerPos.x, y: playerPos.y };
    }

    switch (bac.state) {
      case 'PATROL': {
        // If currently waiting / scanning at patrol turnaround
        if (bac.patrolWaitTimer && bac.patrolWaitTimer > 0) {
          bac.patrolWaitTimer--;
          ent.velocity.x *= 0.6;
          // Sweep vision cone back and forth slowly
          bac.scanSweepAngle = (bac.scanSweepAngle || 0) + 0.04;
          const baseAng = bac.patrolDir > 0 ? 0 : Math.PI;
          bac.facingAngle = baseAng + Math.sin(bac.scanSweepAngle) * 0.45;
          bac.facing = Math.cos(bac.facingAngle) >= 0 ? 'RIGHT' : 'LEFT';
          break;
        }

        bac.patrolTimer--;
        ent.velocity.x += bac.patrolDir * (bac.variant === 'CYBER_BRUTE' ? 0.05 : 0.08);
        bac.facing = bac.patrolDir > 0 ? 'RIGHT' : 'LEFT';
        bac.facingAngle = bac.patrolDir > 0 ? 0 : Math.PI;

        const groundCheck: Vector2D = { x: pos.x + 24 * bac.patrolDir, y: pos.y + bac.radius + 16 };
        const wallCheck: Vector2D = { x: pos.x + 20 * bac.patrolDir, y: pos.y };
        if (!isPointInsideObstacle(groundCheck, obstacles) || isPointInsideObstacle(wallCheck, obstacles)) {
          bac.patrolDir *= -1;
          bac.patrolWaitTimer = 45; // Pause and scan room
        }

        if (bac.patrolTimer <= 0) {
          bac.patrolTimer = 100 + Math.floor(Math.random() * 90);
          bac.patrolDir *= -1;
          bac.patrolWaitTimer = 40;
        }
        break;
      }

      case 'SUSPICIOUS': {
        // Turn toward suspicious position and cautiously investigate
        const sPos = bac.suspicionPos || playerPos;
        const sDx = sPos.x - pos.x;
        const sDy = sPos.y - pos.y;
        const sDist = Math.hypot(sDx, sDy);
        const sAngle = Math.atan2(sDy, sDx);
        
        // Smoothly turn facing angle to suspicious noise/sight
        bac.facingAngle = sAngle;
        bac.facing = Math.cos(bac.facingAngle) >= 0 ? 'RIGHT' : 'LEFT';

        if (sDist > 30) {
          ent.velocity.x += (sDx > 0 ? 1 : -1) * 0.06; // Slow cautious creep
        } else {
          // Reached investigation point, look around
          bac.scanSweepAngle = (bac.scanSweepAngle || 0) + 0.05;
          bac.facingAngle = sAngle + Math.sin(bac.scanSweepAngle) * 0.6;
        }

        if (bac.alertness <= 0) {
          bac.state = 'PATROL';
          bac.suspicionPos = null;
        }
        break;
      }

      case 'ALERT': {
        bac.alertTimer--;
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.facingAngle = Math.atan2(dy, dx);
        bac.wobbleAmount = 0.25;

        if (bac.alertTimer <= 0) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'CHASE': {
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.facingAngle = Math.atan2(dy, dx);

        // Squad-Based Flanking for Melee enemies:
        // Calculate player rear coordinate to flank from behind rather than running into sword slashes head-on
        const isMeleeFlanker = bac.variant === 'STEALTH_STALKER' || bac.variant === 'MUTATED_ORGANIC' || bac.isCloneDecoy;
        let targetX = playerPos.x;
        if (isMeleeFlanker && distToPlayer < 240) {
          const playerFacingRight = player.facingDirection === 'RIGHT' || Math.cos(player.angle) > 0;
          // Target 70px behind the player
          targetX = playerPos.x + (playerFacingRight ? -70 : 70);
        }
        const flankDirX = targetX > pos.x ? 1 : -1;

        const chaseSpeed = bac.variant === 'STEALTH_STALKER' ? 0.26 : bac.variant === 'CYBER_BRUTE' ? 0.12 : 0.19;
        ent.velocity.x += flankDirX * chaseSpeed;

        if ((hasWallAhead || !hasGroundAhead || isPlayerAbove) && bac.jumpCooldown <= 0 && distToPlayer > 40) {
          bac.state = 'LEAP';
          bac.leapTimer = 22;
          bac.jumpCooldown = 60;
          ent.velocity.y = isPlayerAbove ? -8.5 : -6.8;
          ent.velocity.x = flankDirX * 4.8;
          bac.wobbleAmount = 0.4;
        } else if (isPlayerBelow && Math.abs(dx) < 180) {
          bac.state = 'DROP_DOWN';
          ent.velocity.y += 0.35;
        } else if (distToPlayer < 90 && Math.abs(dy) < 50) {
          bac.state = 'POUNCE';
          bac.pounceTimer = 24;
          ent.velocity.x = dirX * (bac.variant === 'STEALTH_STALKER' ? 8.2 : 6.8);
          ent.velocity.y = (dy / distToPlayer) * 3.5;
        }

        // Return to search/patrol if lost player and alertness drops
        if (!hasLOS && distToPlayer > effectiveVisionRange * 1.3 && bac.alertness < 20) {
          bac.state = 'PATROL';
        }
        break;
      }

      case 'LEAP': {
        bac.leapTimer--;
        ent.velocity.x += dirX * 0.05;
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.facingAngle = Math.atan2(ent.velocity.y, ent.velocity.x);

        if (bac.leapTimer <= 0) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'DROP_DOWN': {
        ent.velocity.y += 0.28;
        ent.velocity.x += dirX * 0.1;
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.facingAngle = dirX > 0 ? 0 : Math.PI;

        if (Math.abs(dy) < 35 || !isPlayerBelow) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'POUNCE': {
        bac.pounceTimer--;
        bac.wobbleAmount = 0.35;
        bac.facingAngle = Math.atan2(dy, dx);

        if (bac.pounceTimer <= 0) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'PANIC_FLEE': {
        bac.panicTimer = (bac.panicTimer || 0) - 1;
        bac.wobbleAmount = 0.55;
        
        // Turns away from player and flees rapidly along 2D corridor vectors
        const fleeAngle = Math.atan2(-dy, -dx);
        bac.facingAngle = fleeAngle;
        bac.facing = Math.cos(fleeAngle) >= 0 ? 'RIGHT' : 'LEFT';

        const fleeSpeed = bac.panicSpeed || 6.5;
        ent.velocity.x += Math.cos(fleeAngle) * 0.48;
        ent.velocity.y += Math.sin(fleeAngle) * 0.48;

        // Add slight erratic panic jitter to evade straight slashes unless player uses Hyper Dash
        const jitter = (Math.random() - 0.5) * 1.6;
        ent.velocity.x += -Math.sin(fleeAngle) * jitter;
        ent.velocity.y += Math.cos(fleeAngle) * jitter;

        // Clamp top flee speed
        const currentSpeed = Math.hypot(ent.velocity.x, ent.velocity.y);
        if (currentSpeed > fleeSpeed) {
          ent.velocity.x = (ent.velocity.x / currentSpeed) * fleeSpeed;
          ent.velocity.y = (ent.velocity.y / currentSpeed) * fleeSpeed;
        }

        if (bac.panicTimer <= 0 || distToPlayer > 440) {
          bac.state = 'PATROL';
          bac.alertness = 25;
        }
        break;
      }

      case 'TACTICAL_RETREAT': {
        bac.retreatTimer = (bac.retreatTimer || 0) - 1;
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT'; // Keep eyes locked on player while backpedaling
        bac.facingAngle = Math.atan2(dy, dx);

        if (bac.coverTargetPos) {
          const cDx = bac.coverTargetPos.x - pos.x;
          const cDy = bac.coverTargetPos.y - pos.y;
          const cDist = Math.hypot(cDx, cDy);
          if (cDist > 25) {
            ent.velocity.x += (cDx > 0 ? 1 : -1) * 0.22;
          } else {
            // Reached cover position, switch to ambush flank
            bac.state = 'AMBUSH_FLANK';
            bac.flankTimer = 90;
            bac.coverTargetPos = null;
          }
        } else {
          // Backpedal away from player
          ent.velocity.x -= dirX * 0.24;
        }

        if (bac.retreatTimer <= 0 || !hasLOS) {
          bac.state = 'AMBUSH_FLANK';
          bac.flankTimer = 80;
        }
        break;
      }

      case 'AMBUSH_FLANK': {
        bac.flankTimer = (bac.flankTimer || 0) - 1;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';

        // Stalk along flank
        if (distToPlayer < 110) {
          // Strike with sudden pounce
          bac.state = 'POUNCE';
          bac.pounceTimer = 26;
          ent.velocity.x = dirX * 8.0;
          ent.velocity.y = -3.2;
        } else if (distToPlayer > 320 || bac.flankTimer <= 0) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'GHOST_AMBUSH': {
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        if (bac.ghostPhase === 'IDLE') {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'GLITCH_DASH': {
        bac.glitchDashTimer = (bac.glitchDashTimer || 0) - 1;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.wobbleAmount = 0.65;

        // When glitch evasion concludes, immediately unleash direct counter charge
        if (bac.glitchDashTimer <= 0) {
          bac.state = 'CHARGE_ATTACK';
          bac.chargeTimer = 26;
          const cAngle = Math.atan2(playerPos.y - pos.y, playerPos.x - pos.x);
          bac.chargeVector = { x: Math.cos(cAngle), y: Math.sin(cAngle) };
          ent.velocity.x = Math.cos(cAngle) * 14.0;
          ent.velocity.y = Math.sin(cAngle) * 14.0;
          sound.playEnemyChargeAttack();
        }
        break;
      }

      case 'CHARGE_ATTACK': {
        bac.chargeTimer = (bac.chargeTimer || 0) - 1;
        bac.wobbleAmount = 0.55;
        if (bac.chargeVector) {
          ent.velocity.x = bac.chargeVector.x * 13.5;
          ent.velocity.y = bac.chargeVector.y * 13.5;
          bac.facingAngle = Math.atan2(bac.chargeVector.y, bac.chargeVector.x);
          bac.facing = bac.chargeVector.x >= 0 ? 'RIGHT' : 'LEFT';
        }

        // Direct Counter charge collision with player (Knocks player back)
        if (distToPlayer < player.radius + bac.radius + 12 && !bac.surrendered) {
          const counterDmg = bac.isBoss ? 36 : bac.variant === 'CYBER_BRUTE' ? 30 : 22;
          onHitPlayer(counterDmg, '#FF0055');
          if (onKnockbackPlayer && bac.chargeVector) {
            onKnockbackPlayer(bac.chargeVector.x * 20.0, bac.chargeVector.y * 20.0);
          }
          ent.velocity.x = -dirX * 3.5;
          ent.velocity.y = -2.0;
          bac.hitStaggerTimer = 12;
          bac.state = 'STAGGER';
        } else if (bac.chargeTimer <= 0) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'EMP_CHARGE': {
        bac.empChargeTimer = (bac.empChargeTimer || 0) - 1;
        ent.velocity.x *= 0.65;
        ent.velocity.y *= 0.65;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.wobbleAmount = 0.85; // Violent EMP oscillation

        if (bac.empChargeTimer <= 0) {
          // Fire EMP Blast!
          bac.empCooldown = 380; // ~6 seconds cooldown
          bac.flashlightExposureTimer = 0;
          bac.state = 'CHASE';
          sound.playEmpBlast();
          if (onFlashlightJam) {
            onFlashlightJam();
          }
        }
        break;
      }

      case 'ADAPTIVE_EVASION_A': {
        // --- TYPE A: SIDE STRAFE DASH WITH MIX-UP ---
        bac.evasionTimer = (bac.evasionTimer || 0) - 1;
        bac.wobbleAmount = 0.75;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';

        // At midpoint of dash, 50% chance to execute an unpredictable mix-up pivot!
        if (bac.evasionTimer === 8 && !bac.evasionMixupChained) {
          bac.evasionMixupChained = true;
          if (Math.random() < 0.55) {
            // Abrupt lateral reversal to break player tracking
            ent.velocity.x *= -1.2;
            ent.velocity.y *= -1.2;
            sound.playEnemyGlitchDash();
          }
        }

        if (bac.evasionTimer <= 0) {
          // Immediately chain into a punishing charge attack
          bac.state = 'CHARGE_ATTACK';
          bac.chargeTimer = 24;
          const cAngle = Math.atan2(playerPos.y - pos.y, playerPos.x - pos.x);
          bac.chargeVector = { x: Math.cos(cAngle), y: Math.sin(cAngle) };
          ent.velocity.x = Math.cos(cAngle) * 14.5;
          ent.velocity.y = Math.sin(cAngle) * 14.5;
          sound.playEnemyChargeAttack();
        }
        break;
      }

      case 'ADAPTIVE_EVASION_B': {
        // --- TYPE B: DUCK & UNDER-ROLL FLANK ---
        bac.evasionTimer = (bac.evasionTimer || 0) - 1;
        if (bac.evasionDuckFrames && bac.evasionDuckFrames > 0) bac.evasionDuckFrames--;
        bac.wobbleAmount = 0.35;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';

        // Under-roll sliding translation
        if (bac.evasionTimer <= 0) {
          bac.evasionDuckFrames = 0;
          // Reached blind spot behind player -> unleash immediate point-blank counter
          if (onSpawnProjectile && (bac.variant === 'MUTATED_ORGANIC' || (bac.variant as string) === 'TOXIC_SPITTER' || Math.random() < 0.5)) {
            const angle = Math.atan2(dy, dx);
            onSpawnProjectile({
              x: pos.x + Math.cos(angle) * (bac.radius + 6),
              y: pos.y + Math.sin(angle) * (bac.radius + 6),
              vx: Math.cos(angle) * 10.5,
              vy: Math.sin(angle) * 10.5,
              damage: 18,
              color: '#39FF14',
              isHostile: true,
            });
            sound.playEnemyChargeAttack();
          }
          bac.state = 'CHASE';
        }
        break;
      }

      case 'ADAPTIVE_EVASION_C': {
        // --- TYPE C: TACTICAL SMOKE & DECOY SPLIT ---
        bac.evasionTimer = (bac.evasionTimer || 0) - 1;
        bac.wobbleAmount = 0.45;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';

        if (bac.evasionTimer <= 0) {
          bac.state = 'TACTICAL_RETREAT';
          bac.retreatTimer = 80;
        }
        break;
      }

      case 'ADAPTIVE_EVASION_D': {
        // --- TYPE D: FRAME-PERFECT PARRY STANCE ---
        if (bac.parryWindowTimer && bac.parryWindowTimer > 0) {
          bac.parryWindowTimer--;
        }
        if (bac.parryStanceFlash && bac.parryStanceFlash > 0) {
          bac.parryStanceFlash--;
        }
        bac.wobbleAmount = 0.85;

        // If parry window expires without player hitting it, transition back to chase
        if ((bac.parryWindowTimer || 0) <= 0) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'VAULT_PLUNGE_SLAM': {
        // --- VAULT OVERHEAD & PLUNGING SLAM ATTACK ---
        bac.vaultTimer = (bac.vaultTimer || 0) - 1;
        bac.wobbleAmount = 0.9;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';

        if (bac.vaultTimer && bac.vaultTimer > 10) {
          // Aerial Vault Arc
          ent.velocity.y = -6.5;
          ent.velocity.x = dirX * 7.5;
        } else {
          // Plunge slam down towards player
          ent.velocity.y += 1.8;
          ent.velocity.x += dirX * 0.4;
        }

        // Heavy Slam Ground Impact
        if (distToPlayer < player.radius + bac.radius + 18 || (bac.vaultTimer || 0) <= 0) {
          sound.playVaultSlam();
          const slamDamage = bac.isBoss ? 42 : 28;
          onHitPlayer(slamDamage, '#FFE600');
          if (onKnockbackPlayer) {
            onKnockbackPlayer(dirX * 18.0, 12.0);
          }
          bac.state = 'STAGGER';
          bac.hitStaggerTimer = 18;
          ent.velocity.x = -dirX * 4.0;
          ent.velocity.y = -3.0;
        }
        break;
      }

      case 'PIT_RANGED_ATTACK': {
        // --- PIT / CHASM SEPARATION RANGED BIO-ATTACK STANCE ---
        // Enemy stops moving to avoid walking into chasm and stays locked on player
        ent.velocity.x *= 0.15;
        ent.velocity.y *= 0.15;
        bac.facingAngle = Math.atan2(dy, dx);
        bac.facing = dirX > 0 ? 'RIGHT' : 'LEFT';
        bac.wobbleAmount = 0.45;

        // If player has moved out of range or path is no longer obstructed by pit, transition back to chase
        if (!isPitBlockingPathToPlayer || distToPlayer > 520) {
          bac.state = 'CHASE';
        }
        break;
      }

      case 'PIT_AVOID_NAV': {
        // --- PATROL & NAVIGATE AROUND CRATER RIM ---
        bac.wobbleAmount = 0.35;
        const navAngle = findClearNavAngleAroundPit(pos, bac.pitNavAngle || bac.facingAngle, isPitHazardAt, obstacles);
        ent.velocity.x = Math.cos(navAngle) * 2.6;
        ent.velocity.y = Math.sin(navAngle) * 2.6;
        bac.facingAngle = navAngle;
        bac.facing = Math.cos(navAngle) >= 0 ? 'RIGHT' : 'LEFT';

        const stepAheadX = pos.x + Math.cos(bac.facingAngle) * 38;
        const stepAheadY = pos.y + Math.sin(bac.facingAngle) * 38;
        if (!isPitHazardAt || !isPitHazardAt(stepAheadX, stepAheadY)) {
          if (bac.alertness >= 80 || hasLOS) {
            bac.state = 'CHASE';
          } else {
            bac.state = 'PATROL';
          }
        }
        break;
      }
    }
  }

  // --- Physics Drag & Velocity Integration ---
  ent.velocity.x *= 0.93;
  ent.velocity.y *= 0.93;

  if (bac.state !== 'LEAP' && bac.state !== 'CHARGE_ATTACK' && bac.state !== 'GLITCH_DASH') {
    ent.velocity.y += 0.12;
  }

  // Pit Hazard Edge Clamping to prevent inertial falls into holes
  if (isPitHazardAt) {
    if (isPitHazardAt(ent.position.x + ent.velocity.x, ent.position.y)) {
      ent.velocity.x = 0;
    }
    if (isPitHazardAt(ent.position.x, ent.position.y + ent.velocity.y)) {
      ent.velocity.y = 0;
    }
  }

  ent.position.x += ent.velocity.x;
  ent.position.y += ent.velocity.y;

  // Collision with player (melee strike damage)
  if (distToPlayer < player.radius + bac.radius && !bac.surrendered && bac.state !== 'CHARGE_ATTACK') {
    const baseDamage = bac.isBoss ? 28 : bac.variant === 'CYBER_BRUTE' ? 24 : bac.variant === 'STEALTH_STALKER' ? 18 : 14;
    const damage = bac.state === 'POUNCE' ? baseDamage * 1.4 : baseDamage;
    onHitPlayer(damage, bac.membraneColor);
    
    // Recoil
    ent.velocity.x = -dirX * 4.0;
    ent.velocity.y = -2.0;
    bac.hitStaggerTimer = 15;
    bac.state = 'STAGGER';
  }
}

// ============================================================================
// 3. ORGANIC FLUID BURST & PERMANENT WALL DECAL ENGINE
// ============================================================================

let decalIdCounter = 0;

/**
 * Spawns organic fluid burst particles (blood/plasma droplets) when enemy is hit/destroyed
 */
export function spawnSplatterBurst(
  x: number,
  y: number,
  color: string,
  coreColor: string = '#ffffff',
  count: number = 24,
  impactAngle?: number,
  spreadSpeed: number = 7.5
): FlyingSplatter[] {
  const splatters: FlyingSplatter[] = [];

  for (let i = 0; i < count; i++) {
    let angle = Math.random() * Math.PI * 2;
    if (impactAngle !== undefined) {
      // Biased directional spray in direction of impact
      angle = impactAngle + (Math.random() - 0.5) * 1.6;
    }

    const speed = (2.0 + Math.random() * spreadSpeed) * (0.6 + Math.random() * 0.8);
    const life = 25 + Math.floor(Math.random() * 35);

    splatters.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2.5 + Math.random() * 4.5,
      color,
      coreColor,
      life,
      maxLife: life,
      gravity: 0.22 + Math.random() * 0.12,
      drag: 0.94 + Math.random() * 0.04,
    });
  }

  return splatters;
}

/**
 * Updates in-flight fluid droplets, checks collision with solid obstacles/platforms,
 * and adheres them PERMANENTLY onto surfaces as coordinate-saved static SplatterDecals.
 */
export function updateFlyingSplatters(
  flyingSplatters: FlyingSplatter[],
  obstacles: CyberObstacle[],
  permanentDecals: SplatterDecal[],
  maxDecals: number = 400
) {
  for (let i = flyingSplatters.length - 1; i >= 0; i--) {
    const s = flyingSplatters[i];
    s.life--;

    s.vx *= s.drag;
    s.vy = s.vy * s.drag + s.gravity;
    s.x += s.vx;
    s.y += s.vy;

    // Check collision against world obstacles
    let adhered = false;
    let surface: SplatterDecal['attachedSurface'] = 'FREE';

    for (const obs of obstacles) {
      if (!obs.active) continue;
      const b = obs.bounds;

      if (s.x >= b.x && s.x <= b.x + b.width && s.y >= b.y && s.y <= b.y + b.height) {
        adhered = true;
        // Determine surface orientation
        const distToTop = Math.abs(s.y - b.y);
        const distToBottom = Math.abs(s.y - (b.y + b.height));
        const distToLeft = Math.abs(s.x - b.x);
        const distToRight = Math.abs(s.x - (b.x + b.width));

        const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
        if (minDist === distToTop) surface = 'FLOOR';
        else if (minDist === distToBottom) surface = 'CEILING';
        else surface = 'WALL';

        break;
      }
    }

    // If adhered or at end of life with low velocity, bake into permanent decal
    if (adhered || (s.life <= 0 && Math.hypot(s.vx, s.vy) < 2.0)) {
      // Generate randomized organic dripping & splatter blobs
      const dripCount = 2 + Math.floor(Math.random() * 4);
      const drips: Array<{ angle: number; length: number; width: number }> = [];
      for (let d = 0; d < dripCount; d++) {
        // Floor drips point downwards; wall drips follow gravity
        const dripAngle = surface === 'FLOOR' || surface === 'WALL' ? Math.PI / 2 + (Math.random() - 0.5) * 0.6 : Math.random() * Math.PI * 2;
        drips.push({
          angle: dripAngle,
          length: (s.radius * 1.5) + Math.random() * (s.radius * 3.2),
          width: Math.max(1, s.radius * 0.45 * (Math.random() * 0.8 + 0.4)),
        });
      }

      // Micro satellite droplets
      const blobCount = 3 + Math.floor(Math.random() * 5);
      const splatBlobs: Array<{ dx: number; dy: number; r: number }> = [];
      for (let b = 0; b < blobCount; b++) {
        const bAngle = Math.random() * Math.PI * 2;
        const bDist = (s.radius * 0.8) + Math.random() * (s.radius * 1.8);
        splatBlobs.push({
          dx: Math.cos(bAngle) * bDist,
          dy: Math.sin(bAngle) * bDist,
          r: s.radius * (0.25 + Math.random() * 0.45),
        });
      }

      permanentDecals.push({
        id: ++decalIdCounter,
        x: s.x,
        y: s.y,
        radius: s.radius * 1.4,
        color: s.color,
        coreColor: s.coreColor,
        drips,
        splatBlobs,
        alpha: 0.82 + Math.random() * 0.18,
        rotation: Math.random() * Math.PI * 2,
        attachedSurface: surface,
      });

      // Cap decal pool size to avoid unbounded memory
      if (permanentDecals.length > maxDecals) {
        permanentDecals.shift();
      }

      flyingSplatters.splice(i, 1);
    }
  }
}

/**
 * Renders permanent blood and plasma decals adhered onto walls/platforms
 */
export function renderPermanentSplatterDecals(
  ctx: CanvasRenderingContext2D,
  decals: SplatterDecal[],
  cameraX: number,
  cameraY: number,
  viewW: number,
  viewH: number
) {
  const margin = 100;
  const minX = cameraX - viewW / 2 - margin;
  const maxX = cameraX + viewW / 2 + margin;
  const minY = cameraY - viewH / 2 - margin;
  const maxY = cameraY + viewH / 2 + margin;

  for (const dec of decals) {
    // Frustum culling for high performance
    if (dec.x < minX || dec.x > maxX || dec.y < minY || dec.y > maxY) continue;

    ctx.save();
    ctx.translate(dec.x, dec.y);
    ctx.rotate(dec.rotation);

    // Main splat stain gradient
    const splatGrad = ctx.createRadialGradient(0, 0, dec.radius * 0.2, 0, 0, dec.radius);
    splatGrad.addColorStop(0, dec.color);
    splatGrad.addColorStop(0.7, dec.color);
    splatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = splatGrad;
    ctx.globalAlpha = dec.alpha;
    ctx.shadowColor = dec.color;
    ctx.shadowBlur = 4;

    // Center organic amoeba blob
    ctx.beginPath();
    const pts = 8;
    for (let p = 0; p < pts; p++) {
      const a = (p / pts) * Math.PI * 2;
      const r = dec.radius * (0.75 + Math.sin(p * 3.1) * 0.25);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Satellite droplets
    for (const b of dec.splatBlobs) {
      ctx.beginPath();
      ctx.arc(b.dx, b.dy, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drips dripping down walls / platforms
    ctx.strokeStyle = dec.color;
    ctx.lineCap = 'round';
    for (const d of dec.drips) {
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const endX = Math.cos(d.angle) * d.length;
      const endY = Math.sin(d.angle) * d.length;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Droplet pool at end of drip
      ctx.beginPath();
      ctx.arc(endX, endY, d.width * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Visceral wet core sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(-dec.radius * 0.2, -dec.radius * 0.2, dec.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Renders in-flight flying organic fluid burst particles
 */
export function renderFlyingSplatters(
  ctx: CanvasRenderingContext2D,
  splatters: FlyingSplatter[]
) {
  for (const s of splatters) {
    ctx.save();
    ctx.translate(s.x, s.y);

    const speed = Math.hypot(s.vx, s.vy);
    const angle = Math.atan2(s.vy, s.vx);
    ctx.rotate(angle);

    const stretch = Math.min(3.2, 1 + speed * 0.25);
    const alpha = Math.max(0, s.life / s.maxLife);

    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = alpha;

    // Stretched droplet teardrop in motion direction
    ctx.beginPath();
    ctx.ellipse(0, 0, s.radius * stretch, s.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hot glowing droplet nucleus
    ctx.fillStyle = s.coreColor;
    ctx.beginPath();
    ctx.arc(-s.radius * 0.3, 0, s.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
