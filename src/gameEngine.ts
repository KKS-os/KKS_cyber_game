import {
  Camera2D,
  Collectible,
  CollectibleType,
  WeaponDropModel,
  DirectionState,
  FloatingText,
  GameSettings,
  GameState,
  GameStats,
  GridMapChunk,
  Particle,
  Player,
  Tile,
  TileType,
  Vector2D,
  WorldEntity,
  BoundingBox,
  LaserHazard,
  AlleywayDecor,
  CyberObstacle,
  EnemyBacteria,
  BacteriaTentacle,
  SplatterDecal,
  FlyingSplatter,
  StageDefinition,
  StageObjectiveState,
  PersistentPlayerProgression,
  StageClearSummary,
  RhythmBeatState,
  SpeedrunDeltaInfo,
  WeaponType,
  WeaponInfo,
  RadarTelemetryData,
  PlayerCombatMove,
} from './types';
import { sound } from './audio';
import { ProceduralMapManager, getStageConfig } from './proceduralMap';
import { RhythmCombatDirector } from './rhythmSystem';
import { GhostSpeedrunManager } from './ghostSystem';
import {
  renderMetallicGoldCoin,
  renderPhysicalCashStack,
  renderBloodPlasmaCell,
  renderEncryptedBioCore,
  renderCyberExitPortal,
} from './itemRenderers';
import {
  updateBacteriaAIDirector,
  spawnSplatterBurst,
  updateFlyingSplatters,
  renderPermanentSplatterDecals,
  renderFlyingSplatters,
  checkEnemySurrender,
  proCombatAI,
} from './enemyAIDirector';
import {
  renderParallaxCyberBackground,
  renderCyberEnvironmentProps,
} from './cyberCityRenderer';
import { gameAssets } from './assetLoader';
import { ThreeSceneManager } from './threeSceneManager';
import { dailyMissionManager } from './dailyMissionSystem';
import * as THREE from 'three';

/**
 * 1. CANVAS TEXTURE GENERATION CODE:
 * Helper function createBillboardTexture(text) that instantiates a document.createElement('canvas'),
 * sets a solid pitch black background (#000000), draws sharp glowing gold (#FFD700) text
 * ("KKS", "Cyber Game", or "Burma Batik") and clean neon borders, returning a new THREE.CanvasTexture.
 */
export function createBillboardTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // A. Solid Pitch Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // B. Sharp Gold Neon Border Frame
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Subtle Inner Accent Line
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // C. Brand Tagline Header
    ctx.font = 'bold 15px "Orbitron", monospace, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';

    if (text === 'Burma Batik') {
      ctx.fillText('★ ROYAL HERITAGE 2099 ★', canvas.width / 2, 48);
    } else if (text === 'KKS') {
      ctx.fillText('◆ QUANTUM CORP // S-TIER ◆', canvas.width / 2, 48);
    } else {
      ctx.fillText('► CYBER ARCADE 2099 ◄', canvas.width / 2, 48);
    }

    // D. Sharp Glowing Gold Brand Text
    const fontSize = text === 'KKS' ? 96 : text === 'Burma Batik' ? 54 : 58;
    const fontFamily = text === 'Burma Batik' ? '"Cinzel", "Georgia", serif' : '"Orbitron", sans-serif';
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(text, canvas.width / 2, 142);

    // High-Contrast White Core
    ctx.fillStyle = '#FFF8DC';
    ctx.fillText(text, canvas.width / 2, 142);

    // E. Sub-Caption Status
    ctx.font = 'bold 12px "Orbitron", monospace, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('NEO-KYOTO // [ACTIVE]', canvas.width / 2, 215);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 2. MESH STANDARD MATERIAL APPLY & 3D BOX GEOMETRY:
 * Creates a solid 3D box geometry for the billboard (THREE.BoxGeometry).
 * Assigns the generated canvas texture to THREE.MeshStandardMaterial map & emissiveMap property,
 * sets emissive to #FFD700 and emissiveIntensity to 1.5 with metallic PBR (roughness: 0.2, metalness: 0.8).
 */
export function create3DBillboardMesh(
  text: 'KKS' | 'Cyber Game' | 'Burma Batik',
  width: number = 80,
  height: number = 42
): THREE.Group {
  const group = new THREE.Group();
  const texture = createBillboardTexture(text);

  // Sharp Emissive Golden Material with PBR Metallic properties
  const billboardMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: new THREE.Color(0xffd700),
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Solid 3D Box Geometry Screen
  const screenGeo = new THREE.BoxGeometry(width, height, 2.5);
  const screenMesh = new THREE.Mesh(screenGeo, billboardMaterial);
  screenMesh.position.set(0, 0, 1.5);
  group.add(screenMesh);

  // Dark High-Tech Alloy Chassis Backing (Roughness: 0.2, Metalness: 0.8)
  const chassisGeo = new THREE.BoxGeometry(width + 4, height + 4, 4);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x121522,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0x030208,
    emissiveIntensity: 0.1,
  });
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
  chassisMesh.castShadow = true;
  group.add(chassisMesh);

  // Vivid Neon Pink / Cyan Perimeter Accent Trim
  const trimColor = text === 'Burma Batik' ? 0xffd700 : text === 'KKS' ? 0x00ffd1 : 0xff007f;
  const trimGeo = new THREE.BoxGeometry(width + 5, height + 5, 1.8);
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    emissive: new THREE.Color(trimColor),
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.8,
  });
  const trimMesh = new THREE.Mesh(trimGeo, trimMat);
  trimMesh.position.set(0, 0, 0.5);
  group.add(trimMesh);

  return group;
}

/**
 * 3. ATTACH TO BUILDINGS:
 * Programmatically attaches glowing 3D advertisement meshes directly onto
 * the external front-facing walls (+Z facing camera) and rooftops (+Y) of 3D city buildings.
 */
export function attachBillboardsToBuilding(
  buildingMesh: THREE.Mesh | THREE.Group,
  width: number,
  height: number,
  depth: number,
  primaryBrand: 'KKS' | 'Cyber Game' | 'Burma Batik' = 'KKS',
  secondaryBrand: 'KKS' | 'Cyber Game' | 'Burma Batik' = 'Burma Batik'
) {
  // 1. Front-Facing Wall Sign (+Z facing camera so player immediately sees it)
  const wallSignW = Math.max(30, Math.min(width * 0.85, 120));
  const wallSignH = Math.max(20, Math.min(height * 0.38, 48));
  const wallSign = create3DBillboardMesh(primaryBrand, wallSignW, wallSignH);
  wallSign.position.set(0, height * 0.52, depth / 2 + 2.5);
  buildingMesh.add(wallSign);

  // 2. Rooftop Golden Billboard
  const roofSignW = Math.max(34, Math.min(width * 0.9, 140));
  const roofSignH = 44;
  const roofSign = create3DBillboardMesh(secondaryBrand, roofSignW, roofSignH);
  roofSign.position.set(0, height + 24, 0);
  buildingMesh.add(roofSign);
}

export interface Projectile {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  damage: number;
  life: number;
  maxLife: number;
  trail: Vector2D[];
  weaponType?: WeaponType;
  isEnemy?: boolean;
  isHoming?: boolean;
  targetId?: number;
  isVortex?: boolean;
  vortexRadius?: number;
  knockback?: number;
  isCriticalFinisher?: boolean;
  isMashed?: boolean;
}

export interface SlashArc {
  position: Vector2D;
  angle: number;
  facing: 'LEFT' | 'RIGHT';
  radius: number;
  alpha: number;
  combo: number;
  color: string;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public threeManager: ThreeSceneManager;

  // High-DPI Retina Calibration factor
  public dpr: number = 1;

  // Virtual base viewport dimensions
  public readonly V_WIDTH = 1200;
  public readonly V_HEIGHT = 600;

  // Chunk grid configuration
  public readonly TILE_SIZE = 50;
  public readonly CHUNK_SIZE = 20;

  // Exotic Cyber Weapon Arsenal
  public activeWeapon: WeaponType = 'PLASMA_BLASTER';
  public unlockedWeapons: WeaponType[] = ['PLASMA_BLASTER', 'SPREAD_CANNON'];
  public weaponArsenal: Record<WeaponType, WeaponInfo> = {
    PLASMA_BLASTER: {
      type: 'PLASMA_BLASTER',
      name: 'Cyber Plasma Blaster',
      shortName: 'PLZ-1',
      icon: '🔫',
      damage: 35,
      energyCost: 8,
      cooldownFrames: 10,
      color: '#00FFD1',
      accentColor: '#FFFFFF',
      description: 'Rapid-fire concentrated cyan plasma beam bolts with pinpoint accuracy.',
      unlocked: true,
      level: 1,
      partsCollected: 0,
      partsRequired: 0,
    },
    SPREAD_CANNON: {
      type: 'SPREAD_CANNON',
      name: 'Tri-Spread Scatter Cannon',
      shortName: 'SPRD-3',
      icon: '💥',
      damage: 24,
      energyCost: 16,
      cooldownFrames: 18,
      color: '#FF0055',
      accentColor: '#FFAA00',
      description: 'Fires a 5-pellet broad spread blast that tears through enemy swarms and knocks back brutes.',
      unlocked: true,
      level: 1,
      partsCollected: 0,
      partsRequired: 2,
    },
    LIGHTNING_CHAIN: {
      type: 'LIGHTNING_CHAIN',
      name: 'Tesla Arc Chain Disruptor',
      shortName: 'TSL-9',
      icon: '⚡',
      damage: 48,
      energyCost: 22,
      cooldownFrames: 22,
      color: '#00FF66',
      accentColor: '#00FFFF',
      description: 'Discharges an electric chain lightning arc that leaps between up to 4 nearby mutated organisms.',
      unlocked: false,
      level: 1,
      partsCollected: 0,
      partsRequired: 3,
    },
    HOMING_MISSILES: {
      type: 'HOMING_MISSILES',
      name: 'Smart Micron Homing Missiles',
      shortName: 'MISS-X',
      icon: '🚀',
      damage: 55,
      energyCost: 24,
      cooldownFrames: 25,
      color: '#FF00E5',
      accentColor: '#FF6600',
      description: 'Launches twin auto-seeking smart micro-missiles that track down cloaked stealth and elite targets.',
      unlocked: false,
      level: 1,
      partsCollected: 0,
      partsRequired: 4,
    },
    QUANTUM_VORTEX: {
      type: 'QUANTUM_VORTEX',
      name: 'Singularity Vortex Cannon',
      shortName: 'VTX-0',
      icon: '🌀',
      damage: 85,
      energyCost: 35,
      cooldownFrames: 35,
      color: '#9D00FF',
      accentColor: '#00FFD1',
      description: 'Generates a swirling gravitational black-hole vortex that draws in enemies while inflicting crushing damage.',
      unlocked: false,
      level: 1,
      partsCollected: 0,
      partsRequired: 5,
    },
  };
  public onWeaponChange?: (weapon: WeaponInfo, arsenal: Record<WeaponType, WeaponInfo>) => void;

  // Game States
  public state: GameState = 'PLAYING';
  public score: number = 0;
  public distance: number = 0;
  public highScore: number = 0;
  public comboCount: number = 0;
  public comboMultiplier: number = 1;
  public comboTimer: number = 0;
  public maxComboInRun: number = 0;
  public chipsCollectedInRun: number = 0;
  public terminalsHackedInRun: number = 0;
  public chunksDiscoveredCount: number = 0;

  // Objective-Driven Stage System & Multi-Stage Progression
  public currentStage: number = 1;
  public stageDefinition: StageDefinition = getStageConfig(1);
  public objectiveState: StageObjectiveState = {
    currentStage: 1,
    stageName: 'NEO-KYOTO CORRIDORS',
    subtitle: 'Extract 3 Encrypted Bio-Cores to Unlock the Cyber Exit Portal',
    biomeTheme: 'DOWNTOWN',
    totalBioCores: 3,
    collectedBioCores: 0,
    portalUnlocked: false,
    portalActive: true,
    stageTimeSeconds: 0,
    stageEnemiesKilled: 0,
    stageGoldEarned: 0,
    missionTargetsTotal: 2,
    missionTargetsKilled: 0,
    surrenderedCount: 0,
    activeWeaponType: 'PLASMA_BLASTER',
    unlockedWeapons: ['PLASMA_BLASTER'],
  };
  public persistentProgression: PersistentPlayerProgression = {
    totalGold: 0,
    currentStage: 1,
    highestStageReached: 1,
    katanaLevel: 1,
    blasterLevel: 1,
    hullIntegrityLevel: 1,
    shieldGenLevel: 1,
    totalEnemiesKilled: 0,
    totalCoresExtracted: 0,
    totalStagesCleared: 0,
  };
  public stageClearSummary: StageClearSummary | null = null;
  public stageStartTime: number = Date.now();
  public onStageClear?: (summary: StageClearSummary) => void;
  public onObjectiveUpdate?: (objective: StageObjectiveState) => void;
  public onProgressionUpdate?: (progression: PersistentPlayerProgression) => void;
  public onWeaponUpdate?: (activeWeapon: WeaponType, weaponArsenal: Record<WeaponType, WeaponInfo>) => void;

  // Cyber Warrior Player Entity with Full Action Mechanics
  public player: Player = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    facingDirection: 'RIGHT',
    isCrouching: false,
    isCovered: false,
    noiseLevel: 0.05,
    stealthTargetEnemyId: null,
    stealthKillsCount: 0,
    maxSpeed: 8.5,
    baseSpeed: 8.5,
    dashSpeed: 19.0,
    diagonalFactor: Math.SQRT1_2,
    friction: 0.88,
    rotationSpeed: 0.22,
    directionalStates: { up: false, down: false, left: false, right: false },
    actionState: 'IDLE',
    slashTimer: 0,
    slashCombo: 1,
    shootTimer: 0,
    animTimer: 0,
    animFrame: 0,
    radius: 24,
    width: 48,
    height: 48,
    integrity: 100,
    maxIntegrity: 100,
    energy: 100,
    maxEnergy: 100,
    hasShield: false,
    shieldHitAnim: 0,
    overdriveTimer: 0,
    chronoTimer: 0,
    dashTimer: 0,
    invulnerableTimer: 0,
    flashlightJammedTimer: 0,
    hitStunTimer: 0,
    whiffRecoveryTimer: 0,
    blindedTimer: 0,
    afterimages: [],
  };

  // Cinematic Lerp Camera with 2-Axis Tracking & Dynamic Look-up/Look-down
  public camera: Camera2D = {
    position: { x: 0, y: 0 },
    viewportWidth: 1200,
    viewportHeight: 600,
    zoom: 1.0,
    shake: 0,
    targetOffset: { x: 0, y: 0 },
    lookVerticalOffset: 0,
    lookHoldTimer: 0,
    lookaheadX: 0,
    lookaheadY: 0,
  };

  // Infinite 2D Procedural Map Manager & Object Pooling Engine
  public proceduralMap: ProceduralMapManager = new ProceduralMapManager();
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public projectiles: Projectile[] = [];
  public slashArcs: SlashArc[] = [];

  // Organic Splatters & Permanent Platform/Wall Decals
  public permanentDecals: SplatterDecal[] = [];
  public flyingSplatters: FlyingSplatter[] = [];

  // Weather: Cyber Rain & Ambient Smog Particles
  public rainParticles: Array<{ x: number; y: number; length: number; speed: number; alpha: number; angle: number }> = [];

  // Screen Effects & Combat Feedback
  public screenShake: number = 0;
  public screenShakeAngle: number = 0;
  public hitstopTimer: number = 0;
  public flashAlpha: number = 0;
  public flashColor: string = '#ffffff';

  // Settings & Callbacks
  public settings: GameSettings;
  public stats: GameStats;
  public rhythmDirector: RhythmCombatDirector = new RhythmCombatDirector();
  public ghostManager: GhostSpeedrunManager = new GhostSpeedrunManager(1);
  public speedrunDelta: SpeedrunDeltaInfo = {
    hasGhost: false,
    deltaSeconds: 0,
    ghostDistance: 0,
    playerDistance: 0,
    status: 'TIED',
    formattedDelta: 'PB: NO RECORD',
  };
  public rhythmBeatState: RhythmBeatState = this.rhythmDirector.getBeatState();

  public onStateChange?: (state: GameState) => void;
  public onScoreUpdate?: (
    score: number,
    distance: number,
    combo: number,
    multiplier: number,
    integrity: number,
    energy: number
  ) => void;
  public onRhythmBeatUpdate?: (beatState: RhythmBeatState, delta: SpeedrunDeltaInfo) => void;

  // Animation Loop Handle
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private entityIdCounter: number = 0;
  private mouseAimWorldPos: Vector2D | null = null;

  constructor(canvas: HTMLCanvasElement, settings: GameSettings, stats: GameStats) {
    this.canvas = canvas;
    this.threeManager = new ThreeSceneManager(canvas);
    this.ctx = this.threeManager.overlayCtx;
    this.settings = settings;
    this.stats = stats;
    this.highScore = stats.highScore || 0;

    // Load persistent progression from localStorage
    this.persistentProgression = this.loadPersistentProgression();
    this.currentStage = this.persistentProgression.currentStage || 1;
    this.stageDefinition = getStageConfig(this.currentStage);
    this.proceduralMap.setStage(this.currentStage);

    this.calibrateRetinaDPI();
    this.initRain();
    this.resetWorld();
    this.start();
  }

  public loadPersistentProgression(): PersistentPlayerProgression {
    try {
      const saved = localStorage.getItem('CYBER_RUNNER_PROGRESSION');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          totalGold: parsed.totalGold || 0,
          currentStage: parsed.currentStage || 1,
          highestStageReached: parsed.highestStageReached || 1,
          katanaLevel: parsed.katanaLevel || 1,
          blasterLevel: parsed.blasterLevel || 1,
          hullIntegrityLevel: parsed.hullIntegrityLevel || 1,
          shieldGenLevel: parsed.shieldGenLevel || 1,
          totalEnemiesKilled: parsed.totalEnemiesKilled || 0,
          totalCoresExtracted: parsed.totalCoresExtracted || 0,
          totalStagesCleared: parsed.totalStagesCleared || 0,
        };
      }
    } catch (e) {
      console.warn('Could not read persistent progression:', e);
    }
    return {
      totalGold: 0,
      currentStage: 1,
      highestStageReached: 1,
      katanaLevel: 1,
      blasterLevel: 1,
      hullIntegrityLevel: 1,
      shieldGenLevel: 1,
      totalEnemiesKilled: 0,
      totalCoresExtracted: 0,
      totalStagesCleared: 0,
    };
  }

  public savePersistentProgression() {
    try {
      localStorage.setItem('CYBER_RUNNER_PROGRESSION', JSON.stringify(this.persistentProgression));
      this.onProgressionUpdate?.(this.persistentProgression);
    } catch (e) {
      console.warn('Could not save persistent progression:', e);
    }
  }

  /** Trigger Stage Clear Sequence when player reaches the activated Cyber Exit Portal */
  public triggerStageClear() {
    if (this.state === 'STAGE_CLEAR') return;
    this.state = 'STAGE_CLEAR';

    const elapsedMs = performance.now() - this.stageStartTime;
    const timeTakenSeconds = Math.max(1, Math.round(elapsedMs / 1000));
    const mins = Math.floor(timeTakenSeconds / 60);
    const secs = timeTakenSeconds % 60;
    const timeTakenFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Finalize Ghost Speedrun & Save New Personal Best (PB)
    const pbResult = this.ghostManager.finalizeAndSaveIfPB(
      this.currentStage,
      this.stageDefinition.name,
      elapsedMs,
      this.score,
      this.distance
    );

    if (pbResult.isNewPB) {
      sound.playPowerup();
      this.addFloatingText(this.player.position.x, this.player.position.y - 65, '🏆 NEW SPEEDRUN RECORD (PB)!', '#00FF66');
    }

    const bonusReward = this.stageDefinition.stageBonusGold || 1000;
    const goldEarned = this.objectiveState.stageGoldEarned;
    const totalGoldAdded = goldEarned + bonusReward;

    this.persistentProgression.totalGold += totalGoldAdded;
    this.persistentProgression.totalStagesCleared += 1;
    if (this.currentStage >= this.persistentProgression.highestStageReached) {
      this.persistentProgression.highestStageReached = this.currentStage + 1;
    }
    this.savePersistentProgression();

    // Calculate performance grade
    const hpRatio = this.player.integrity / this.player.maxIntegrity;
    if (hpRatio >= 0.75) {
      dailyMissionManager.reportProgress('CYBER_SURVIVOR', 1);
    }
    let grade: 'S' | 'A' | 'B' | 'C' = 'B';
    if (timeTakenSeconds < 90 && hpRatio > 0.75 && this.objectiveState.stageEnemiesKilled >= 4) {
      grade = 'S';
    } else if (timeTakenSeconds < 160 && hpRatio > 0.4) {
      grade = 'A';
    } else if (hpRatio > 0.2) {
      grade = 'B';
    } else {
      grade = 'C';
    }

    const summary: StageClearSummary = {
      stage: this.currentStage,
      stageName: this.stageDefinition.name,
      subtitle: this.stageDefinition.subtitle,
      timeTakenFormatted,
      timeTakenSeconds,
      bioCoresCollected: this.objectiveState.collectedBioCores,
      totalBioCores: this.objectiveState.totalBioCores,
      enemiesKilled: this.objectiveState.stageEnemiesKilled,
      goldEarned,
      bonusReward,
      totalGold: this.persistentProgression.totalGold,
      grade,
      healthRemainingPercent: Math.round(hpRatio * 100),
    };

    this.stageClearSummary = summary;
    sound.playPortalEnter();
    sound.playStageClear();

    this.onStageClear?.(summary);
    this.onStateChange?.('STAGE_CLEAR');
  }

  /** Final Game Victory: Defeat the Stage 5 Apex Cyber Boss! */
  public triggerGameVictory() {
    this.state = 'GAME_VICTORY';
    sound.playVictoryFanfare();
    this.screenShake = 45;
    this.flashAlpha = 1.0;
    this.flashColor = '#00FFD1';
    this.createExplosion(this.player.position.x, this.player.position.y, '#FFD700', 80);
    this.createPulseWave(this.player.position.x, this.player.position.y, '#FFD700');

    // Save victory stats
    this.persistentProgression.totalStagesCleared += 1;
    this.persistentProgression.totalGold += 10000; // Grand Champion Bounty
    this.savePersistentProgression();

    const elapsedMs = performance.now() - this.stageStartTime;
    const timeTakenSeconds = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(timeTakenSeconds / 60);
    const secs = timeTakenSeconds % 60;
    const timeTakenFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

    const summary: StageClearSummary = {
      stage: 5,
      stageName: 'APEX SECTOR - FINAL VICTORY',
      subtitle: 'The Apex Cyber-Lord has been destroyed! Cyber-City is Liberated!',
      timeTakenFormatted,
      timeTakenSeconds,
      bioCoresCollected: this.objectiveState.collectedBioCores,
      totalBioCores: this.objectiveState.totalBioCores,
      enemiesKilled: this.objectiveState.stageEnemiesKilled,
      goldEarned: this.objectiveState.stageGoldEarned,
      bonusReward: 10000,
      totalGold: this.persistentProgression.totalGold,
      grade: 'S',
      healthRemainingPercent: Math.round((this.player.integrity / this.player.maxIntegrity) * 100),
    };
    this.stageClearSummary = summary;
    this.onStageClear?.(summary);
    this.onStateChange?.('GAME_VICTORY');
  }

  /** Switch active exotic weapon */
  public switchWeapon(type: WeaponType) {
    if (!this.weaponArsenal[type]?.unlocked) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 35, '🔒 WEAPON LOCKED!', '#FF0055');
      return;
    }
    this.activeWeapon = type;
    sound.playWeaponSwitch();
    const info = this.weaponArsenal[type];
    const comboEval = proCombatAI.evaluateDynamicComboInput('ACTION_KEY', `WEAPON: ${info.name.toUpperCase()}`, '🔄');
    this.addFloatingText(this.player.position.x, this.player.position.y - 40, `EQUIPPED: ${info.name.toUpperCase()}`, info.color);
    if (comboEval.feedbackBanner) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 65, comboEval.feedbackBanner, comboEval.feedbackColor);
    }
    this.onWeaponChange?.(info, this.weaponArsenal);
  }

  /** Cycle next / previous unlocked weapon */
  public cycleWeapon(direction: number = 1) {
    const allTypes: WeaponType[] = ['PLASMA_BLASTER', 'SPREAD_CANNON', 'LIGHTNING_CHAIN', 'HOMING_MISSILES', 'QUANTUM_VORTEX'];
    const unlocked = allTypes.filter(t => this.weaponArsenal[t]?.unlocked);
    if (unlocked.length <= 1) return;

    const currentIdx = unlocked.indexOf(this.activeWeapon);
    let nextIdx = (currentIdx + direction) % unlocked.length;
    if (nextIdx < 0) nextIdx += unlocked.length;
    this.switchWeapon(unlocked[nextIdx]);
  }

  /** Unlock exotic weapon */
  public unlockWeapon(type: WeaponType) {
    if (this.weaponArsenal[type]) {
      this.weaponArsenal[type].unlocked = true;
      if (!this.unlockedWeapons.includes(type)) {
        this.unlockedWeapons.push(type);
      }
      sound.playBioCoreCollect();
      this.triggerHitstop(20);
      this.addFloatingText(
        this.player.position.x,
        this.player.position.y - 50,
        `⚡ UNLOCKED: ${this.weaponArsenal[type].name.toUpperCase()}!`,
        this.weaponArsenal[type].color
      );
      this.onWeaponChange?.(this.weaponArsenal[this.activeWeapon], this.weaponArsenal);
    }
  }

  /** Advance to next stage: increment difficulty, reconfigure map algorithms, change asset themes */
  public nextStage() {
    this.currentStage += 1;
    this.persistentProgression.currentStage = this.currentStage;
    this.savePersistentProgression();

    this.stageDefinition = getStageConfig(this.currentStage);
    this.proceduralMap.setStage(this.currentStage);
    this.ghostManager.setStage(this.currentStage);
    this.rhythmDirector.resetStreak();

    this.objectiveState = {
      currentStage: this.currentStage,
      stageName: this.stageDefinition.name,
      subtitle: this.stageDefinition.subtitle,
      biomeTheme: this.stageDefinition.biome,
      totalBioCores: 3,
      collectedBioCores: 0,
      portalUnlocked: false,
      portalActive: true,
      stageTimeSeconds: 0,
      stageEnemiesKilled: 0,
      stageGoldEarned: 0,
      missionTargetsTotal: this.stageDefinition.requiredMissionTargets || 2,
      missionTargetsKilled: 0,
      surrenderedCount: 0,
      activeWeaponType: this.activeWeapon,
      unlockedWeapons: Object.keys(this.weaponArsenal).filter((k) => this.weaponArsenal[k as WeaponType].unlocked) as WeaponType[],
    };

    this.stageStartTime = performance.now();
    this.stageClearSummary = null;

    // Reset player position and replenish stats
    this.player.position = { x: 0, y: 0 };
    this.player.velocity = { x: 0, y: 0 };
    this.player.acceleration = { x: 0, y: 0 };
    this.player.integrity = this.player.maxIntegrity;
    this.player.energy = this.player.maxEnergy;
    this.player.invulnerableTimer = 60;
    this.player.afterimages = [];

    this.camera.position = { x: 0, y: 0 };
    this.proceduralMap.updateWorld(this.player.position);

    this.particles = [];
    this.floatingTexts = [];
    this.projectiles = [];
    this.slashArcs = [];
    this.flyingSplatters = [];

    this.state = 'PLAYING';
    sound.playGameStart();
    sound.startCyberpunkMusic();

    this.onStateChange?.('PLAYING');
    this.onObjectiveUpdate?.(this.objectiveState);
    this.onProgressionUpdate?.(this.persistentProgression);
  }

  // --- 1. HIGH-DPI RETINA CALIBRATION ---

  /** Calibrate Canvas Resolution for 4K, Apple Retina, and AMOLED mobile screens */
  public calibrateRetinaDPI() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width > 0 ? rect.width : window.innerWidth || 1200;
    const cssHeight = rect.height > 0 ? rect.height : window.innerHeight || 600;

    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);

    this.threeManager?.resize(cssWidth, cssHeight, this.dpr);

    this.camera.viewportWidth = cssWidth;
    this.camera.viewportHeight = cssHeight;
  }

  // --- INITIALIZATION & RESTART ---

  private initRain() {
    this.rainParticles = [];
    for (let i = 0; i < 90; i++) {
      this.rainParticles.push({
        x: Math.random() * this.V_WIDTH,
        y: Math.random() * this.V_HEIGHT,
        length: 12 + Math.random() * 20,
        speed: 16 + Math.random() * 12,
        alpha: 0.15 + Math.random() * 0.35,
        angle: 0.18,
      });
    }
  }

  public resetWorld() {
    this.player.position = { x: 0, y: 0 };
    this.player.velocity = { x: 0, y: 0 };
    this.player.acceleration = { x: 0, y: 0 };
    this.player.angle = -Math.PI / 2;
    this.player.facingDirection = 'RIGHT';
    this.player.integrity = this.player.maxIntegrity;
    this.player.energy = this.player.maxEnergy;
    this.player.hasShield = false;
    this.player.overdriveTimer = 0;
    this.player.chronoTimer = 0;
    this.player.dashTimer = 0;
    this.player.invulnerableTimer = 0;
    this.player.slashTimer = 0;
    this.player.slashCombo = 1;
    this.player.shootTimer = 0;
    this.player.animTimer = 0;
    this.player.afterimages = [];
    this.player.isFallingIntoAbyss = false;
    this.player.fallingTimer = 0;

    this.camera.position = { x: 0, y: 0 };
    this.camera.lookVerticalOffset = 0;
    this.camera.lookHoldTimer = 0;
    this.camera.lookaheadX = 0;
    this.camera.lookaheadY = 0;

    this.score = 0;
    this.distance = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.chipsCollectedInRun = 0;
    this.terminalsHackedInRun = 0;

    this.particles = [];
    this.floatingTexts = [];
    this.projectiles = [];
    this.slashArcs = [];
    this.flyingSplatters = [];
    this.permanentDecals = [];
    this.hitstopTimer = 0;
    this.stageStartTime = performance.now();
    this.ghostManager.setStage(this.currentStage);
    this.ghostManager.resetRecording();
    this.rhythmDirector.resetStreak();

    // Initialize Procedural Map around (0,0)
    this.proceduralMap.reset();
    this.proceduralMap.updateWorld(this.player.position);
    this.chunksDiscoveredCount = this.proceduralMap.getDiscoveredCount();
  }

  public startGame() {
    this.resetWorld();
    this.state = 'PLAYING';
    sound.playGameStart();
    sound.startCyberpunkMusic();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public triggerGameOver() {
    this.state = 'GAMEOVER';
    sound.playGameOver();
    this.screenShake = 35;
    this.flashAlpha = 1.0;
    this.flashColor = '#ff0055';
    this.createExplosion(this.player.position.x, this.player.position.y, '#00f0ff', 40);

    // Save statistics
    this.stats.totalRuns = (this.stats.totalRuns || 0) + 1;
    this.stats.totalDistance = (this.stats.totalDistance || 0) + Math.floor(this.distance);
    this.stats.totalChips = (this.stats.totalChips || 0) + this.chipsCollectedInRun;
    if (this.maxComboInRun > (this.stats.bestCombo || 0)) {
      this.stats.bestCombo = this.maxComboInRun;
    }
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      this.stats.highScore = this.highScore;
    }

    try {
      localStorage.setItem('cyberrunner_stats', JSON.stringify(this.stats));
    } catch {}

    if (this.onStateChange) this.onStateChange(this.state);
  }

  // --- INPUT CONTROLS ---

  public joystickVector: { x: number; y: number } | null = null;
  public joystickAngle: number = 0;
  public joystickForce: number = 0;

  /** Update virtual touch joystick velocity vector and orientation */
  public handleJoystickInput(
    velocity: { x: number; y: number } | [number, number] | null,
    angle?: number,
    force?: number
  ) {
    if (!velocity) {
      this.joystickVector = null;
      this.joystickForce = 0;
      return;
    }

    if (Array.isArray(velocity)) {
      this.joystickVector = { x: velocity[0], y: velocity[1] };
    } else {
      this.joystickVector = { x: velocity.x, y: velocity.y };
    }

    if (typeof angle === 'number') this.joystickAngle = angle;
    if (typeof force === 'number') this.joystickForce = force;
  }

  public handleDirection(dir: 'up' | 'down' | 'left' | 'right', active: boolean) {
    this.player.directionalStates[dir] = active;
  }

  public handleMoveUp(active: boolean) {
    this.player.directionalStates.up = active;
  }

  public handleMoveDown(active: boolean) {
    this.player.directionalStates.down = active;
  }

  public handleMoveLeft(active: boolean) {
    this.player.directionalStates.left = active;
    if (active) this.player.facingDirection = 'LEFT';
  }

  public handleMoveRight(active: boolean) {
    this.player.directionalStates.right = active;
    if (active) this.player.facingDirection = 'RIGHT';
  }

  /** Hypersonic Dash Trigger with Rhythm Beat Synchronization */
  public handleDash() {
    if (this.player.dashTimer > 0) return;

    // Dynamic Combo Input evaluation for Action/Movement key
    const comboEval = proCombatAI.evaluateDynamicComboInput('ACTION_KEY', 'HYPER DASH', '⚡');
    if (comboEval.feedbackBanner) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 55, comboEval.feedbackBanner, comboEval.feedbackColor);
    }
    if (comboEval.isMashed) {
      sound.playBluntMashPenalty();
    } else if (comboEval.isCriticalFinisher) {
      sound.playCriticalFinisher();
      this.createPulseWave(this.player.position.x, this.player.position.y, '#FFD700');
    } else if (comboEval.isFinisherReady) {
      sound.playComboBridge();
    }

    // Evaluate Rhythm timing with Synthwave beat
    const rhythm = this.rhythmDirector.evaluateAction();
    const isRhythmHit = rhythm.grade === 'PERFECT' || rhythm.grade === 'CRITICAL';

    if (!isRhythmHit && this.player.energy < 15 && this.player.overdriveTimer <= 0) return;

    if (!isRhythmHit && this.player.overdriveTimer <= 0) {
      this.player.energy = Math.max(0, this.player.energy - 15);
    } else if (isRhythmHit) {
      // Free energy on rhythm beat dash + charge overdrive!
      this.player.overdriveTimer = Math.min(360, this.player.overdriveTimer + rhythm.overdriveCharge);
      this.score += rhythm.scoreBonus * this.comboMultiplier * 3;
      this.comboCount += rhythm.multiplierBoost * 2;
      this.comboMultiplier = Math.min(10, this.comboMultiplier + rhythm.multiplierBoost);
      this.comboTimer = 300;
    }

    this.player.dashTimer = 16;
    this.player.invulnerableTimer = 20;
    this.player.actionState = 'DASHING';

    // Record Dash action into AI combat memory
    proCombatAI.recordPlayerMove('DASH_EVADE');
    dailyMissionManager.reportProgress('CHASM_ACROBAT', 1);

    const dashSpeed = this.player.dashSpeed * (this.player.overdriveTimer > 0 ? 1.45 : isRhythmHit ? 1.3 : 1.0);
    const angle = this.player.angle;

    this.player.velocity.x = Math.cos(angle) * dashSpeed;
    this.player.velocity.y = Math.sin(angle) * dashSpeed;

    sound.playDash();
    this.screenShake = isRhythmHit ? 16 : 8;
    this.createDashSparks(this.player.position.x, this.player.position.y, angle);
    this.createPulseWave(this.player.position.x, this.player.position.y, isRhythmHit ? '#00FFD1' : '#FF00E5');

    if (isRhythmHit) {
      this.triggerHitstop(rhythm.grade === 'PERFECT' ? 24 : 14);
      this.applyDirectionalScreenShake(rhythm.grade === 'PERFECT' ? 18 : 12, angle);
      this.addFloatingText(
        this.player.position.x,
        this.player.position.y - 32,
        rhythm.grade === 'PERFECT' ? '⚡ PERFECT HYPER DASH! [3x] ⚡' : 'CRITICAL BEAT DASH!',
        rhythm.bannerColor
      );
      this.flashAlpha = Math.max(this.flashAlpha, rhythm.screenGlitchIntensity * 0.4);
      this.flashColor = rhythm.bannerColor;
    }
  }

  /** Cyber Katana Slash Action (Melee Attack with Combo Arcs & Rhythm Beat Combat) */
  public handleSlash() {
    // If player is frame-locked by enemy parry stun, abort action
    if (this.player.hitStunTimer > 0) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 30, '⚡ STUNNED BY ENEMY PARRY!', '#FF0055');
      return;
    }
    if (this.player.slashTimer > 0) return;

    // Evaluate Dynamic Combo Input System (Anti-Mash Penalty & Rotating Input Bonuses)
    const comboEval = proCombatAI.evaluateDynamicComboInput('LEFT_CLICK', 'KATANA SLASH', '⚔️');
    if (comboEval.feedbackBanner) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 58, comboEval.feedbackBanner, comboEval.feedbackColor);
    }

    if (comboEval.isMashed) {
      sound.playBluntMashPenalty();
    } else if (comboEval.isCriticalFinisher) {
      sound.playCriticalFinisher();
      this.createPulseWave(this.player.position.x, this.player.position.y, '#FFD700');
      this.flashAlpha = 0.55;
      this.flashColor = '#FFD700';
    } else if (comboEval.isFinisherReady) {
      sound.playComboBridge();
    }

    // Evaluate Rhythm timing with Synthwave beat
    const rhythm = this.rhythmDirector.evaluateAction();
    const isRhythmHit = rhythm.grade === 'PERFECT' || rhythm.grade === 'CRITICAL' || rhythm.grade === 'GOOD';
    const isPerfect = rhythm.grade === 'PERFECT';
    const isCritical = rhythm.grade === 'CRITICAL';

    this.player.slashTimer = 18;
    this.player.actionState = 'SLASHING';
    const combo = this.player.slashCombo;
    this.player.slashCombo = combo >= 3 ? 1 : combo + 1;

    // Record combat move into AI Memory Buffer (Anti-Spam Tracker)
    const moveTag: PlayerCombatMove = combo === 1 ? 'SLASH_1' : combo === 2 ? 'SLASH_2' : 'SLASH_3';
    proCombatAI.recordPlayerMove(moveTag);

    // If AI detects pattern spamming (>=80% counter rate), warn the player
    if (proCombatAI.repeatedMovePunishRate >= 0.80) {
      this.addFloatingText(
        this.player.position.x,
        this.player.position.y - 55,
        '⚡ WARNING: AI PREDICTING PATTERN - VARIATE ATTACKS!',
        '#FF9900'
      );
    }

    sound.playJump(); // energetic whoosh sound
    this.screenShake = 6 + combo * 2 + (isRhythmHit ? 10 : 0) + (comboEval.isCriticalFinisher ? 12 : 0);

    const facing = this.player.facingDirection;
    const baseAngle = facing === 'RIGHT' ? 0 : Math.PI;
    const slashColor = comboEval.isCriticalFinisher
      ? '#FFD700'
      : isPerfect
      ? '#00FFD1'
      : isCritical
      ? '#FF00E5'
      : combo === 1
      ? '#00FFD1'
      : combo === 2
      ? '#FF00E5'
      : '#FFE600';

    // Register slash arc visual effect (larger radius on rhythm hit or finisher)
    const arcRadius = 65 + combo * 10 + (isRhythmHit ? 25 : 0) + (comboEval.isCriticalFinisher ? 35 : 0);
    this.slashArcs.push({
      position: { x: this.player.position.x, y: this.player.position.y },
      angle: baseAngle,
      facing,
      radius: arcRadius,
      alpha: 1.0,
      combo,
      color: slashColor,
    });

    if (isRhythmHit) {
      // 3x Combo Score & Overdrive Surge
      this.score += rhythm.scoreBonus * this.comboMultiplier * (isPerfect ? 3 : 2);
      this.comboCount += rhythm.multiplierBoost * 3;
      this.comboMultiplier = Math.min(12, this.comboMultiplier + rhythm.multiplierBoost * 2);
      this.comboTimer = 320;
      this.player.overdriveTimer = Math.min(420, this.player.overdriveTimer + rhythm.overdriveCharge);

      // On-screen Rhythm Feedback Text
      this.addFloatingText(
        this.player.position.x,
        this.player.position.y - 42,
        rhythm.bannerText,
        rhythm.bannerColor
      );

      // Trigger Screen Flash & Radial Shockwave
      this.createPulseWave(this.player.position.x, this.player.position.y, slashColor);
      this.flashAlpha = Math.max(this.flashAlpha, rhythm.screenGlitchIntensity * 0.5);
      this.flashColor = rhythm.bannerColor;
    }

    // Particle blade sparks
    const sparkCount = isRhythmHit ? 24 : 14;
    for (let i = 0; i < sparkCount; i++) {
      const spread = (Math.random() - 0.5) * 1.8;
      const speed = (isRhythmHit ? 8 : 5) + Math.random() * 10;
      this.particles.push({
        position: {
          x: this.player.position.x + (facing === 'RIGHT' ? 25 : -25),
          y: this.player.position.y + (Math.random() - 0.5) * 20,
        },
        velocity: {
          x: Math.cos(baseAngle + spread) * speed,
          y: Math.sin(baseAngle + spread) * speed,
        },
        size: 3 + Math.random() * 5,
        color: slashColor,
        alpha: 1.0,
        decay: 0.05,
        shape: 'spark',
      });
    }

    // Check melee hit against Mutated Bacteria & Terminals
    const hitRadius = (isRhythmHit ? 105 : 75) + (comboEval.isCriticalFinisher ? 30 : 0);
    const hitCenter = {
      x: this.player.position.x + (facing === 'RIGHT' ? 45 : -45),
      y: this.player.position.y,
    };

    // Calculate final damage incorporating mash reduction / dynamic combo bonus
    let baseDamage = 45 * rhythm.damageMultiplier * comboEval.damageMultiplier;
    let hitAnyTarget = false;

    for (const ent of this.proceduralMap.activeTerminals) {
      if (!ent.active) continue;
      const d = Math.hypot(ent.position.x - hitCenter.x, ent.position.y - hitCenter.y);
      if (d < hitRadius + ent.radius) {
        // Strike Mutated Bacteria
        if (ent.type === 'MUTATED_BACTERIA' && ent.bacteriaData) {
          const bac = ent.bacteriaData;

          // --- COUNTER MECHANIC 1: TYPE D FRAME-PERFECT PARRY ---
          if (bac.state === 'ADAPTIVE_EVASION_D' || (bac.parryWindowTimer && bac.parryWindowTimer > 0)) {
            sound.playParryClash();
            this.player.hitStunTimer = 15; // 15-frame hit-stun on player!
            this.applyDirectionalScreenShake(26, baseAngle);
            this.triggerHitstop(60);
            this.createPulseWave(ent.position.x, ent.position.y, '#FFD700');
            this.addFloatingText(ent.position.x, ent.position.y - 35, '⚡ FRAME-PERFECT PARRY CLASH! [15F STUN]', '#FFD700');
            this.flashAlpha = 0.5;
            this.flashColor = '#FFD700';

            // Enemy vaults over player into a plunging slam!
            bac.state = 'VAULT_PLUNGE_SLAM';
            bac.vaultTimer = 22;
            ent.velocity.y = -8.0;
            ent.velocity.x = (this.player.position.x > ent.position.x ? 1 : -1) * 7.5;
            hitAnyTarget = true;
            continue;
          }

          // --- COUNTER MECHANIC 2: TYPE B DUCK & UNDER-ROLL ---
          if (bac.evasionDuckFrames && bac.evasionDuckFrames > 0) {
            this.addFloatingText(ent.position.x, ent.position.y - 25, '💨 DUCKED UNDER HIGH SLASH!', '#00FFD1');
            sound.playSlide();
            hitAnyTarget = true;
            continue;
          }

          // --- COUNTER MECHANIC 3: EXPLOSIVE TRAP DECOY ---
          if (bac.isExplosiveDecoy || (bac.isCloneDecoy && bac.health <= 1)) {
            ent.active = false;
            sound.playDecoyExplode();
            this.player.blindedTimer = 60; // Vision disoriented
            this.handlePlayerDamage(12, '#FF0055');
            this.createExplosion(ent.position.x, ent.position.y, '#FF0055', 30);
            this.createPulseWave(ent.position.x, ent.position.y, '#FF0055');
            this.addFloatingText(ent.position.x, ent.position.y - 35, '💥 TRAP DECOY DETONATED! [BLINDED]', '#FF0055');
            this.flashAlpha = 0.8;
            this.flashColor = '#FFFFFF';
            hitAnyTarget = true;
            continue;
          }

          // --- COUNTER MECHANIC 4: ADVANCED 75% TACTICAL AI COMBO PREDICTION ---
          if (comboEval.isCriticalFinisher || comboEval.isFinisherReady) {
            const prediction = proCombatAI.testEnemyComboPrediction(bac, ent, this.player.position);
            if (prediction.predicted) {
              if (prediction.defenseType === 'EVASION_DASH') {
                sound.playDash();
                this.createDashSparks(ent.position.x, ent.position.y, Math.atan2(ent.velocity.y, ent.velocity.x));
                this.addFloatingText(
                  ent.position.x,
                  ent.position.y - 38,
                  '💨 75% AI PREDICTED FINISHER! [EVASION DASH]',
                  '#00FFD1'
                );
                hitAnyTarget = true;
                continue; // 100% avoided
              } else if (prediction.defenseType === 'DEFENSIVE_BLOCK') {
                sound.playPredictiveBlock();
                this.createPulseWave(ent.position.x, ent.position.y, '#FFD700');
                this.addFloatingText(
                  ent.position.x,
                  ent.position.y - 38,
                  '🛡️ 75% AI PREDICTED COMBO! [BLOCK -85% DMG]',
                  '#FFD700'
                );
                // 85% damage deflected by defensive barrier
                const deflectedDmg = Math.max(1, baseDamage * 0.15);
                bac.health = Math.max(0, bac.health - deflectedDmg);
                bac.hitStaggerTimer = 12;
                hitAnyTarget = true;
                if (bac.health <= 0) {
                  this.handleEnemyDefeat(ent, bac, baseAngle);
                }
                continue;
              }
            }
          }

          hitAnyTarget = true;

          // If Rhythm strike is PERFECT or CRITICAL -> Instant Burst Destruction!
          if (rhythm.instantBurstKills) {
            bac.health = 0;
          } else {
            bac.health = Math.max(0, bac.health - baseDamage);
          }

          bac.hitStaggerTimer = 18;
          bac.state = 'STAGGER';
          sound.playHit();

          // Screen-impact freezing (30-50ms) + Directional Screenshake
          this.triggerHitstop(isRhythmHit || comboEval.isCriticalFinisher ? 55 : 35 + combo * 6);
          this.applyDirectionalScreenShake((isRhythmHit ? 26 : 14) + combo * 4 + (comboEval.isCriticalFinisher ? 15 : 0), baseAngle);

          // Spawn visceral fluid splatter burst adhering to nearby platforms
          this.flyingSplatters.push(
            ...spawnSplatterBurst(ent.position.x, ent.position.y, '#39ff14', '#ffffff', isRhythmHit ? 22 : 14, baseAngle, 9.5)
          );

          this.createExplosion(ent.position.x, ent.position.y, comboEval.isCriticalFinisher ? '#FFD700' : '#39ff14', isRhythmHit ? 24 : 16);
          
          let hitBanner = `-${Math.round(baseDamage)} HP [SLASH x${combo}]`;
          if (comboEval.isCriticalFinisher) {
            hitBanner = `💥 CRITICAL FINISHER! [${Math.round(baseDamage)} DMG]`;
          } else if (comboEval.isMashed) {
            hitBanner = `⚠️ MASH REDUCED! [${Math.round(baseDamage)} DMG]`;
          } else if (isRhythmHit) {
            hitBanner = `CRITICAL OBLITERATION! [${Math.round(baseDamage)} DMG]`;
          }

          this.addFloatingText(
            ent.position.x,
            ent.position.y - 25,
            hitBanner,
            slashColor
          );

          if (bac.health <= 0) {
            ent.active = false;
            // 3x Combo Score for Rhythm Kills
            const killScoreMultiplier = isRhythmHit ? this.comboMultiplier * 3 : this.comboMultiplier;
            this.score += 450 * killScoreMultiplier * (comboEval.isCriticalFinisher ? 2 : 1);
            this.comboCount += isRhythmHit ? 6 : 2;
            this.comboMultiplier = Math.min(12, 1 + Math.floor(this.comboCount / 3));
            this.comboTimer = 300;

            // Track stage kills & persistent total
            this.objectiveState.stageEnemiesKilled += 1;
            this.persistentProgression.totalEnemiesKilled += 1;

            // Heavy screen impact freeze + massive destruction screenshake
            this.triggerHitstop(isRhythmHit ? 65 : 50);
            this.applyDirectionalScreenShake(isRhythmHit ? 36 : 28, baseAngle);

            // Massive randomized organic fluid bursts (blood/plasma splatters) adhering permanently
            this.flyingSplatters.push(
              ...spawnSplatterBurst(ent.position.x, ent.position.y, '#ff0055', '#39ff14', 44, undefined, 14),
              ...spawnSplatterBurst(ent.position.x, ent.position.y, '#9d00ff', '#ffffff', 28, undefined, 11),
              ...spawnSplatterBurst(ent.position.x, ent.position.y, '#39ff14', '#ffe600', 22, undefined, 12)
            );

            this.createExplosion(ent.position.x, ent.position.y, '#39ff14', isRhythmHit ? 45 : 35);
            this.createExplosion(ent.position.x, ent.position.y, '#9d00ff', isRhythmHit ? 35 : 25);
            this.createExplosion(ent.position.x, ent.position.y, '#00FFD1', 30);
            this.addFloatingText(
              ent.position.x,
              ent.position.y - 35,
              comboEval.isCriticalFinisher ? '+2500 DYNAMIC COMBO KILL!' : isRhythmHit ? '+1350 BIO-CORE INSTA-BURST!' : '+350 BIO-CORE DESTROYED',
              comboEval.isCriticalFinisher ? '#FFD700' : '#39ff14'
            );

            // Drop visceral blood plasma cell or shiny metallic gold
            const dropType: CollectibleType = Math.random() < 0.65 ? 'BLOOD_PLASMA_CELL' : 'METALLIC_GOLD';
            this.spawnDrop(ent.position.x, ent.position.y, dropType);
          }
        }
      }
    }

    // If the slash completely whiffed (hit nothing), activate Whiff Recovery Frames
    if (!hitAnyTarget) {
      this.player.whiffRecoveryTimer = 16;
    }
  }

  /** Exotic Weapon Arsenal Shoot Action (Supports all 5 weapon classes) */
  public handleShoot() {
    // If player is frame-locked by enemy parry stun, abort action
    if (this.player.hitStunTimer > 0) return;
    if (this.player.shootTimer > 0) return;
    const currentWeapon = this.weaponArsenal[this.activeWeapon] || this.weaponArsenal.PLASMA_BLASTER;
    const energyCost = currentWeapon.energyCost;

    if (this.player.energy < energyCost && this.player.overdriveTimer <= 0) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 25, '⚡ LOW ENERGY!', '#FF0055');
      return;
    }

    // Evaluate Dynamic Combo Input System (Anti-Mash Penalty & Rotating Input Bonuses)
    const comboEval = proCombatAI.evaluateDynamicComboInput('RIGHT_CLICK', 'PLASMA SHOOT', '🔫');
    if (comboEval.feedbackBanner) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 58, comboEval.feedbackBanner, comboEval.feedbackColor);
    }

    if (comboEval.isMashed) {
      sound.playBluntMashPenalty();
    } else if (comboEval.isCriticalFinisher) {
      sound.playCriticalFinisher();
      this.createPulseWave(this.player.position.x, this.player.position.y, '#FFD700');
    } else if (comboEval.isFinisherReady) {
      sound.playComboBridge();
    }

    if (this.player.overdriveTimer <= 0) {
      this.player.energy = Math.max(0, this.player.energy - energyCost);
    }

    this.player.shootTimer = currentWeapon.cooldownFrames;
    this.player.actionState = 'SHOOTING';

    // Record Shoot action into AI combat memory
    const shootTag: PlayerCombatMove =
      this.activeWeapon === 'PLASMA_BLASTER'
        ? 'SHOOT_BLASTER'
        : this.activeWeapon === 'SPREAD_CANNON'
        ? 'SHOOT_SPREAD'
        : this.activeWeapon === 'LIGHTNING_CHAIN'
        ? 'SHOOT_CHAIN'
        : this.activeWeapon === 'HOMING_MISSILES'
        ? 'SHOOT_HOMING'
        : 'SHOOT_VORTEX';
    proCombatAI.recordPlayerMove(shootTag);

    const facing = this.player.facingDirection;
    const shootAngle = facing === 'RIGHT' ? 0 : Math.PI;
    const spawnX = this.player.position.x + (facing === 'RIGHT' ? 28 : -28);
    const spawnY = this.player.position.y - 4;

    const finalDamage = Math.round(currentWeapon.damage * comboEval.damageMultiplier);

    // --- 1. CYBER PLASMA BLASTER ---
    if (this.activeWeapon === 'PLASMA_BLASTER') {
      sound.playLaserFire();
      const boltSpeed = 24;
      this.projectiles.push({
        id: ++this.entityIdCounter,
        position: { x: spawnX, y: spawnY },
        velocity: {
          x: Math.cos(shootAngle) * boltSpeed,
          y: Math.sin(shootAngle) * boltSpeed,
        },
        radius: comboEval.isCriticalFinisher ? 10 : 6,
        color: comboEval.isCriticalFinisher ? '#FFD700' : this.player.overdriveTimer > 0 ? '#FF00E5' : '#00FFD1',
        damage: finalDamage,
        life: 50,
        maxLife: 50,
        trail: [],
        weaponType: 'PLASMA_BLASTER',
        isCriticalFinisher: comboEval.isCriticalFinisher,
        isMashed: comboEval.isMashed,
      });
      this.screenShake = Math.max(this.screenShake, comboEval.isCriticalFinisher ? 10 : 4);
    }

    // --- 2. TRI-SPREAD SCATTER CANNON ---
    else if (this.activeWeapon === 'SPREAD_CANNON') {
      sound.playWeaponSpread();
      const pellets = 5;
      const spreadArc = 0.45;
      for (let p = 0; p < pellets; p++) {
        const pAngle = shootAngle + ((p / (pellets - 1)) - 0.5) * spreadArc;
        const speed = 20 + Math.random() * 4;
        this.projectiles.push({
          id: ++this.entityIdCounter,
          position: { x: spawnX, y: spawnY },
          velocity: {
            x: Math.cos(pAngle) * speed,
            y: Math.sin(pAngle) * speed,
          },
          radius: comboEval.isCriticalFinisher ? 8 : 5,
          color: comboEval.isCriticalFinisher ? '#FFD700' : '#FF0055',
          damage: finalDamage,
          life: 35,
          maxLife: 35,
          trail: [],
          weaponType: 'SPREAD_CANNON',
          knockback: 14,
          isCriticalFinisher: comboEval.isCriticalFinisher,
          isMashed: comboEval.isMashed,
        });
      }
      this.screenShake = Math.max(this.screenShake, 12);
      this.applyDirectionalScreenShake(14, shootAngle + Math.PI);
    }

    // --- 3. TESLA ARC CHAIN DISRUPTOR ---
    else if (this.activeWeapon === 'LIGHTNING_CHAIN') {
      sound.playWeaponLightning();
      this.screenShake = Math.max(this.screenShake, 10);
      this.flashAlpha = 0.25;
      this.flashColor = '#00FF66';

      // Find up to 4 closest active mutated bacteria
      const targets: WorldEntity[] = [];
      for (const ent of this.proceduralMap.activeTerminals) {
        if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
        const d = Math.hypot(ent.position.x - spawnX, ent.position.y - spawnY);
        if (d < 280) {
          targets.push(ent);
        }
      }
      targets.sort((a, b) => {
        const da = Math.hypot(a.position.x - spawnX, a.position.y - spawnY);
        const db = Math.hypot(b.position.x - spawnX, b.position.y - spawnY);
        return da - db;
      });

      const chainTargets = targets.slice(0, 4);
      let lastPoint = { x: spawnX, y: spawnY };

      if (chainTargets.length > 0) {
        for (const ent of chainTargets) {
          const bac = ent.bacteriaData!;
          bac.health = Math.max(0, bac.health - finalDamage);
          bac.hitStaggerTimer = 18;
          bac.state = 'STAGGER';
          checkEnemySurrender(bac);

          // Electric arc particles along line
          this.createElectricChainParticles(lastPoint.x, lastPoint.y, ent.position.x, ent.position.y, '#00FF66');
          this.addFloatingText(ent.position.x, ent.position.y - 25, `⚡ -${finalDamage} [TESLA ARC]`, '#00FF66');
          this.createExplosion(ent.position.x, ent.position.y, '#00FF66', 18);

          if (bac.health <= 0) {
            this.handleEnemyDefeat(ent, bac, shootAngle);
          }
          lastPoint = { x: ent.position.x, y: ent.position.y };
        }
      } else {
        // Blind arc fire if no target in range
        const tracerSpeed = 26;
        this.projectiles.push({
          id: ++this.entityIdCounter,
          position: { x: spawnX, y: spawnY },
          velocity: {
            x: Math.cos(shootAngle) * tracerSpeed,
            y: Math.sin(shootAngle) * tracerSpeed,
          },
          radius: 7,
          color: '#00FF66',
          damage: finalDamage,
          life: 40,
          maxLife: 40,
          trail: [],
          weaponType: 'LIGHTNING_CHAIN',
          isCriticalFinisher: comboEval.isCriticalFinisher,
          isMashed: comboEval.isMashed,
        });
      }
    }

    // --- 4. SMART MICRON HOMING MISSILES ---
    else if (this.activeWeapon === 'HOMING_MISSILES') {
      sound.playWeaponHoming();
      const missileOffsets = [-0.3, 0.3];
      for (const off of missileOffsets) {
        const mAngle = shootAngle + off;
        this.projectiles.push({
          id: ++this.entityIdCounter,
          position: { x: spawnX, y: spawnY },
          velocity: {
            x: Math.cos(mAngle) * 14,
            y: Math.sin(mAngle) * 14,
          },
          radius: 7,
          color: comboEval.isCriticalFinisher ? '#FFD700' : '#FF00E5',
          damage: finalDamage,
          life: 75,
          maxLife: 75,
          trail: [],
          weaponType: 'HOMING_MISSILES',
          isHoming: true,
          isCriticalFinisher: comboEval.isCriticalFinisher,
          isMashed: comboEval.isMashed,
        });
      }
      this.screenShake = Math.max(this.screenShake, 8);
    }

    // --- 5. SINGULARITY VORTEX CANNON ---
    else if (this.activeWeapon === 'QUANTUM_VORTEX') {
      sound.playWeaponVortex();
      const vSpeed = 12;
      this.projectiles.push({
        id: ++this.entityIdCounter,
        position: { x: spawnX, y: spawnY },
        velocity: {
          x: Math.cos(shootAngle) * vSpeed,
          y: Math.sin(shootAngle) * vSpeed,
        },
        radius: 15,
        color: '#9D00FF',
        damage: finalDamage,
        life: 80,
        maxLife: 80,
        trail: [],
        weaponType: 'QUANTUM_VORTEX',
        isVortex: true,
        vortexRadius: 180,
        isCriticalFinisher: comboEval.isCriticalFinisher,
        isMashed: comboEval.isMashed,
      });
      this.screenShake = Math.max(this.screenShake, 16);
      this.flashAlpha = 0.3;
      this.flashColor = '#9D00FF';
    }

    // Muzzle flash particles
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        position: { x: spawnX, y: spawnY },
        velocity: {
          x: Math.cos(shootAngle + (Math.random() - 0.5) * 0.8) * (4 + Math.random() * 8),
          y: Math.sin(shootAngle + (Math.random() - 0.5) * 0.8) * (4 + Math.random() * 8),
        },
        size: 3 + Math.random() * 4,
        color: currentWeapon.color,
        alpha: 1.0,
        decay: 0.08,
        shape: 'spark',
      });
    }
  }

  /** Legacy / Platformer Jump Mapping */
  public handleJump() {
    this.handleSlash();
  }

  /** Legacy / Platformer Slide Mapping */
  public handleSlide() {
    this.handleDash();
  }

  /** Data Terminal Breach & Enemy Surrender Mercy Action */
  public handleHack() {
    const comboEval = proCombatAI.evaluateDynamicComboInput('ACTION_KEY', 'CYBER HACK', '💻');
    if (comboEval.feedbackBanner) {
      this.addFloatingText(this.player.position.x, this.player.position.y - 55, comboEval.feedbackBanner, comboEval.feedbackColor);
    }
    if (comboEval.isMashed) {
      sound.playBluntMashPenalty();
    } else if (comboEval.isCriticalFinisher) {
      sound.playCriticalFinisher();
      this.createPulseWave(this.player.position.x, this.player.position.y, '#FFD700');
    } else if (comboEval.isFinisherReady) {
      sound.playComboBridge();
    }

    const terminals = this.proceduralMap.activeTerminals;
    let interacted = false;

    // 1. Check for Surrendered Mutated Bacteria to spare with karma reward
    for (const ent of terminals) {
      if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
      const bac = ent.bacteriaData;
      if (bac.surrendered || bac.state === 'SURRENDER') {
        const dist = Math.hypot(ent.position.x - this.player.position.x, ent.position.y - this.player.position.y);
        if (dist < 160) {
          ent.active = false;
          interacted = true;
          sound.playEnemySurrender();
          this.score += 800 * this.comboMultiplier;
          this.objectiveState.stageGoldEarned += 500;
          this.persistentProgression.totalGold += 500;
          this.addFloatingText(
            ent.position.x,
            ent.position.y - 35,
            '🕊️ SURRENDER ACCEPTED! +800 BIO-CREDIT KARMA',
            '#00FFD1'
          );
          this.createPulseWave(ent.position.x, ent.position.y, '#00FFD1');
          this.createExplosion(ent.position.x, ent.position.y, '#FFFFFF', 25);
          this.spawnDrop(ent.position.x, ent.position.y, 'METALLIC_GOLD');
          this.spawnDrop(ent.position.x + 10, ent.position.y, 'METALLIC_GOLD');
          break;
        }
      }
    }

    if (interacted) return;

    // 2. Data Terminal Hack
    for (const term of terminals) {
      if (!term.active || term.type !== 'DATA_TERMINAL') continue;
      const dist = Math.hypot(term.position.x - this.player.position.x, term.position.y - this.player.position.y);

      if (dist < 150) {
        term.active = false;
        interacted = true;
        this.terminalsHackedInRun += 1;
        this.score += 600 * this.comboMultiplier;
        this.comboCount += 3;
        this.comboMultiplier = Math.min(8, 1 + Math.floor(this.comboCount / 3));
        this.comboTimer = 300;

        sound.playHackSuccess();
        this.createExplosion(term.position.x, term.position.y, '#00FF66', 30);
        this.createPulseWave(term.position.x, term.position.y, '#00FF66');
        this.addFloatingText(term.position.x, term.position.y - 30, `+${600 * this.comboMultiplier} TERMINAL OVERRIDDEN`, '#00FF66');

        // Disable connected lasers in chunk
        for (const laser of this.proceduralMap.activeLasers) {
          const lDist = Math.hypot(laser.startX - term.position.x, laser.startY - term.position.y);
          if (lDist < 600) {
            laser.disabled = true;
            this.createExplosion(laser.startX, laser.startY, '#00FF66', 10);
          }
        }
      }
    }

    if (!interacted) {
      // Small pulse if no target in range
      this.createPulseWave(this.player.position.x, this.player.position.y, 'rgba(0,255,102,0.4)');
    }
  }

  public handlePointerAim(canvasX: number, canvasY: number) {
    const worldX = canvasX - this.canvas.width / (2 * this.dpr) + this.camera.position.x;
    const worldY = canvasY - this.canvas.height / (2 * this.dpr) + this.camera.position.y;
    this.mouseAimWorldPos = { x: worldX, y: worldY };

    if (worldX < this.player.position.x - 5) {
      this.player.facingDirection = 'LEFT';
    } else if (worldX > this.player.position.x + 5) {
      this.player.facingDirection = 'RIGHT';
    }
  }

  // --- POWERUP ACTIVATIONS ---

  private activateShield() {
    this.player.hasShield = true;
    this.player.shieldHitAnim = 0;
    sound.playPowerup();
    this.addFloatingText(this.player.position.x, this.player.position.y - 25, 'MATRIX SHIELD ACTIVE', '#00FFD1');
    this.createPulseWave(this.player.position.x, this.player.position.y, '#00FFD1');
  }

  private activateOverdrive() {
    this.player.overdriveTimer = 480; // 8 seconds
    sound.playOverdrive();
    this.screenShake = 15;
    this.flashAlpha = 0.6;
    this.flashColor = '#FF00E5';
    this.addFloatingText(this.player.position.x, this.player.position.y - 25, 'OVERDRIVE HYPERSPEED!', '#FF00E5');
    this.createPulseWave(this.player.position.x, this.player.position.y, '#FF00E5');
  }

  private activateChronoSlow() {
    this.player.chronoTimer = 420; // 7 seconds
    sound.playChrono();
    this.addFloatingText(this.player.position.x, this.player.position.y - 25, 'CHRONO MATRIX ENGAGED', '#00FF66');
    this.createPulseWave(this.player.position.x, this.player.position.y, '#00FF66');
  }

  public triggerHitstop(durationMs: number = 40) {
    this.hitstopTimer = Math.max(this.hitstopTimer, Math.max(1, Math.round(durationMs / 16.66)));
  }

  public applyDirectionalScreenShake(magnitude: number, angle?: number) {
    this.screenShake = Math.min(50, Math.max(this.screenShake, magnitude));
    if (angle !== undefined) {
      this.screenShakeAngle = angle;
    }
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    sound.setSoundEnabled(newSettings.soundEnabled);
    sound.setMusicEnabled(newSettings.musicEnabled);
  }

  // --- MAIN GAME LOOP WITH SCREEN-IMPACT FREEZING ---

  public start() {
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
      this.lastTimestamp = timestamp;

      if (this.state === 'PLAYING') {
        if (this.hitstopTimer > 0) {
          // Screen-impact freezing: Pause entity physics frames for 30-50ms on heavy strikes
          this.hitstopTimer--;
          if (this.screenShake > 0) this.screenShake *= 0.94;
        } else {
          this.update(dt);
        }
      }
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopMusic();
  }

  // --- PHYSICS, COLLISION & ENTITY UPDATES ---

  private update(dt: number) {
    this.player.animTimer += 0.05;

    // 1. Process 360° Joystick & 8-Way Keyboard Input
    let inputX = 0;
    let inputY = 0;
    let isJoystickActive = false;
    let joystickMag = 0;

    if (this.joystickVector && (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05)) {
      inputX = this.joystickVector.x;
      inputY = this.joystickVector.y;
      joystickMag = Math.hypot(inputX, inputY);
      isJoystickActive = true;
    } else {
      if (this.player.directionalStates.left) inputX -= 1;
      if (this.player.directionalStates.right) inputX += 1;
      if (this.player.directionalStates.up) inputY -= 1;
      if (this.player.directionalStates.down) inputY += 1;
    }

    // Update facing direction based on horizontal movement
    if (inputX < -0.1) {
      this.player.facingDirection = 'LEFT';
    } else if (inputX > 0.1) {
      this.player.facingDirection = 'RIGHT';
    }

    const hasInput = Math.abs(inputX) > 0.05 || Math.abs(inputY) > 0.05;
    
    // Check tactical stealth states: Crouch / Cover
    const isCrouching = !!this.player.isCrouching;
    let isCovered = false;

    // Check proximity to cover walls / cyber obstacles
    for (const obs of this.proceduralMap.activeObstacles) {
      const halfW = obs.bounds.width / 2 + 35;
      const halfH = obs.bounds.height / 2 + 35;
      if (
        Math.abs(this.player.position.x - obs.bounds.x) < halfW &&
        Math.abs(this.player.position.y - obs.bounds.y) < halfH
      ) {
        isCovered = true;
        break;
      }
    }
    this.player.isCovered = isCovered;

    // Stealth movement speed and noise calculation
    const stealthSpeedMultiplier = isCrouching ? 0.45 : isCovered ? 0.6 : 1.0;
    const targetMaxSpeed =
      (this.player.overdriveTimer > 0 ? this.player.maxSpeed * 1.5 : this.player.maxSpeed) *
      (this.player.chronoTimer > 0 ? 1.15 : 1.0) *
      stealthSpeedMultiplier;

    if (hasInput) {
      let normX = 0;
      let normY = 0;
      let effectiveSpeed = targetMaxSpeed;

      if (isJoystickActive) {
        const force = Math.min(joystickMag, 1.0);
        normX = inputX / (joystickMag || 1);
        normY = inputY / (joystickMag || 1);
        effectiveSpeed = targetMaxSpeed * force;
      } else {
        const length = Math.hypot(inputX, inputY);
        normX = inputX / length;
        normY = inputY / length;
      }

      // Snappy, ultra-responsive acceleration curve to minimize input latency
      const accelRate = isJoystickActive ? 0.42 : 0.38;
      this.player.velocity.x += (normX * effectiveSpeed - this.player.velocity.x) * accelRate;
      this.player.velocity.y += (normY * effectiveSpeed - this.player.velocity.y) * accelRate;

      const moveAngle = Math.atan2(normY, normX);
      if (this.mouseAimWorldPos) {
        const aimAngle = Math.atan2(
          this.mouseAimWorldPos.y - this.player.position.y,
          this.mouseAimWorldPos.x - this.player.position.x
        );
        this.player.angle = this.lerpAngle(this.player.angle, aimAngle, 0.42);
      } else {
        this.player.angle = this.lerpAngle(this.player.angle, moveAngle, isJoystickActive ? 0.45 : 0.38);
      }

      if (this.player.slashTimer <= 0 && this.player.shootTimer <= 0 && this.player.dashTimer <= 0) {
        if (isCovered) {
          this.player.actionState = 'COVER';
        } else if (isCrouching) {
          this.player.actionState = 'CROUCHING';
        } else if (this.player.overdriveTimer > 0) {
          this.player.actionState = 'OVERDRIVE';
        } else {
          this.player.actionState = 'WALKING';
        }
      }

      // Noise calculation: stealth walking is silent (0.05..0.15)
      this.player.noiseLevel = isCrouching ? 0.08 : isCovered ? 0.12 : 0.65;

      // Footstep thruster dust (only when not sneaking)
      if (!isCrouching && Math.random() < 0.35) {
        this.createThrusterParticle(this.player.position.x, this.player.position.y, this.player.angle + Math.PI);
      }
    } else {
      this.player.velocity.x *= this.player.friction;
      this.player.velocity.y *= this.player.friction;
      this.player.noiseLevel = isCrouching ? 0.02 : 0.05;

      if (Math.hypot(this.player.velocity.x, this.player.velocity.y) < 0.1) {
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        if (this.player.slashTimer <= 0 && this.player.shootTimer <= 0 && this.player.dashTimer <= 0) {
          this.player.actionState = isCovered ? 'COVER' : isCrouching ? 'CROUCHING' : 'IDLE';
        }
      }

      if (this.mouseAimWorldPos) {
        const aimAngle = Math.atan2(
          this.mouseAimWorldPos.y - this.player.position.y,
          this.mouseAimWorldPos.x - this.player.position.x
        );
        this.player.angle = this.lerpAngle(this.player.angle, aimAngle, 0.35);
      }
    }

    // 2. Action Timers Decay
    if (this.player.slashTimer > 0) this.player.slashTimer--;
    if (this.player.shootTimer > 0) this.player.shootTimer--;
    if (this.player.dashTimer > 0) {
      this.player.dashTimer--;
      this.player.afterimages.push({
        position: { x: this.player.position.x, y: this.player.position.y },
        angle: this.player.angle,
        alpha: 0.75,
        color: this.player.overdriveTimer > 0 ? '#FF00E5' : '#00FFD1',
        width: this.player.width,
        height: this.player.height,
      });
    }

    // Energy regeneration
    if (this.player.energy < this.player.maxEnergy) {
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 0.22);
    }

    // Powerup Timers
    if (this.player.overdriveTimer > 0) this.player.overdriveTimer--;
    if (this.player.chronoTimer > 0) this.player.chronoTimer--;
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;
    if (this.player.shieldHitAnim > 0) this.player.shieldHitAnim--;

    // Competitive Combat State Timers
    if (this.player.hitStunTimer && this.player.hitStunTimer > 0) {
      this.player.hitStunTimer--;
      this.player.velocity.x *= 0.5;
      this.player.velocity.y *= 0.5;
    }
    if (this.player.whiffRecoveryTimer && this.player.whiffRecoveryTimer > 0) {
      this.player.whiffRecoveryTimer--;
    }
    if (this.player.blindedTimer && this.player.blindedTimer > 0) {
      this.player.blindedTimer--;
    }

    // Flashlight Jammed / EMP Status Countdown & Reboot SFX
    if (this.player.flashlightJammedTimer && this.player.flashlightJammedTimer > 0) {
      this.player.flashlightJammedTimer--;
      if (this.player.flashlightJammedTimer === 0) {
        sound.playFlashlightReboot();
        this.addFloatingText(this.player.position.x, this.player.position.y - 35, '⚡ OPTICAL SENSORS ONLINE', '#00FFD1');
      }
    }

    // --- PRO AI COMBAT PACING & EXECUTIONER MODE DIRECTING ---
    let inCombatRange = false;
    let hasActiveThreats = false;
    for (const ent of this.proceduralMap.activeTerminals) {
      if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
      hasActiveThreats = true;
      const d = Math.hypot(ent.position.x - this.player.position.x, ent.position.y - this.player.position.y);
      if (d < 350) {
        inCombatRange = true;
        break;
      }
    }

    const wasExecutioner = proCombatAI.executionerModeActive;
    proCombatAI.updatePlayerCombatPacing(inCombatRange, hasActiveThreats, (this.player.whiffRecoveryTimer || 0) > 0);

    // If Executioner Mode activated on this frame, play alarm and alert
    if (!wasExecutioner && proCombatAI.executionerModeActive) {
      sound.playExecutionerAlarm();
      this.triggerHitstop(45);
      this.applyDirectionalScreenShake(20);
      this.flashAlpha = 0.6;
      this.flashColor = '#FF0055';
      this.addFloatingText(
        this.player.position.x,
        this.player.position.y - 60,
        '⚠️ EXECUTIONER PROTOCOL ACTIVE - BREAK DEFENSE NOW!',
        '#FF0055'
      );
    }

    // Afterimages decay
    for (let i = this.player.afterimages.length - 1; i >= 0; i--) {
      const img = this.player.afterimages[i];
      img.alpha -= 0.08;
      if (img.alpha <= 0) {
        this.player.afterimages.splice(i, 1);
      }
    }

    // 3. Collision Resolution against World Obstacles
    const collisionResult = this.proceduralMap.resolvePlayerCollision(
      this.player.position,
      this.player.velocity,
      this.player.width,
      this.player.height
    );
    this.player.position = collisionResult.resolvedPos;
    this.player.velocity = collisionResult.resolvedVel;

    if (collisionResult.collisions.length > 0 && Math.random() < 0.2) {
      this.createDashSparks(this.player.position.x, this.player.position.y, this.player.angle);
    }

    // 3.5 Check Broken Floor / Pit Abyss Falling Hazard
    if (!this.player.isFallingIntoAbyss) {
      const isOverPit = this.proceduralMap.isPitHazardAt(this.player.position.x, this.player.position.y);
      // Hero safely phases/jumps across the chasm when dashing, executing takedowns, or in evasive maneuvers
      const isAirborneOrPhasing =
        this.player.dashTimer > 0 ||
        this.player.actionState === 'STEALTH_TAKEDOWN' ||
        this.player.actionState === 'SLASHING' ||
        this.player.actionState === 'SLIDING' ||
        this.player.actionState === 'JUMPING' ||
        (this.player.invulnerableTimer !== undefined && this.player.invulnerableTimer > 0);

      if (isOverPit && !isAirborneOrPhasing) {
        this.triggerPlayerFallIntoVoid();
      }
    } else {
      this.updatePlayerVoidFalling();
    }

    // 4. Update Pulsing Cyber Laser Hazards
    const playerBoundingBox: BoundingBox = {
      x: this.player.position.x - this.player.width / 2,
      y: this.player.position.y - this.player.height / 2,
      width: this.player.width,
      height: this.player.height,
    };
    this.proceduralMap.updateLasers(playerBoundingBox, (damage, color) => {
      this.handlePlayerDamage(damage, color);
    });

    // 5. Update Mutated Bacteria Organisms (AI, Organic Float, & Stagger)
    this.updateBacteriaEnemies();

    // 6. Update Projectiles & Slash Arcs
    this.updateProjectiles();
    this.updateSlashArcs();

    // Track exploration distance & score
    const frameDist = Math.hypot(this.player.velocity.x, this.player.velocity.y);
    this.distance += frameDist * 0.05;
    this.score += frameDist * 0.1 * this.comboMultiplier;
    dailyMissionManager.reportProgress('CHRONO_SPRINT', Math.floor(this.distance), true);

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1;
      }
    }

    // 7. Cinematic Smooth Camera Lerp & Dynamic Look-up/down
    this.updateCamera();

    // 8. 1000x1000px Procedural Chunk Exploration
    const { newChunksCount } = this.proceduralMap.updateWorld(this.player.position);
    if (newChunksCount > 0) {
      this.chunksDiscoveredCount = this.proceduralMap.getDiscoveredCount();
      this.score += newChunksCount * 150;
    }

    // 9. Interactive Collectibles (Magnetic Pull & Powerups)
    this.updateCollectibles();

    // 10. Visual FX, Flying Splatters & Decals
    this.updateParticles();
    updateFlyingSplatters(this.flyingSplatters, this.proceduralMap.activeObstacles, this.permanentDecals);
    this.updateFloatingTexts();
    this.updateRain();
    this.rhythmDirector.updateGlitch();

    // 10.5 High-Precision Ghost Speedrun Frame Recording & Real-time Delta Tracking
    const currentRunElapsedMs = performance.now() - this.stageStartTime;
    this.ghostManager.recordFrame(
      currentRunElapsedMs,
      this.player.position.x,
      this.player.position.y,
      this.player.facingDirection,
      this.player.actionState,
      this.player.dashTimer > 0,
      this.player.slashTimer > 0,
      this.player.slashCombo,
      this.player.integrity,
      this.distance
    );

    this.speedrunDelta = this.ghostManager.calculateSpeedrunDelta(currentRunElapsedMs, this.distance);
    this.rhythmBeatState = this.rhythmDirector.getBeatState();
    this.onRhythmBeatUpdate?.(this.rhythmBeatState, this.speedrunDelta);

    // 11. Objective State Tracking & Navigation Radar
    this.objectiveState.stageTimeSeconds = currentRunElapsedMs / 1000;

    let nearestObj: StageObjectiveState['nearestObjective'] = undefined;
    let minObjectiveDist = Infinity;

    if (this.objectiveState.collectedBioCores < 3) {
      // Find nearest Bio-Core
      for (const item of this.proceduralMap.activeCollectibles) {
        if (item.collected || item.type !== 'ENCRYPTED_BIO_CORE') continue;
        const dx = item.position.x - this.player.position.x;
        const dy = item.position.y - this.player.position.y;
        const d = Math.hypot(dx, dy);
        if (d < minObjectiveDist) {
          minObjectiveDist = d;
          nearestObj = {
            type: 'BIO_CORE',
            position: { x: item.position.x, y: item.position.y },
            distance: d,
            angle: Math.atan2(dy, dx),
            label: `BIO-CORE #${item.coreIndex || 1}`,
          };
        }
      }
    } else {
      // Find Cyber Exit Portal
      for (const ent of this.proceduralMap.activeTerminals) {
        if (!ent.active || ent.type !== 'CYBER_EXIT_PORTAL') continue;
        const dx = ent.position.x - this.player.position.x;
        const dy = ent.position.y - this.player.position.y;
        const d = Math.hypot(dx, dy);
        if (d < minObjectiveDist) {
          minObjectiveDist = d;
          nearestObj = {
            type: 'CYBER_EXIT_PORTAL',
            position: { x: ent.position.x, y: ent.position.y },
            distance: d,
            angle: Math.atan2(dy, dx),
            label: 'CYBER EXIT PORTAL',
          };
        }

        // Win Condition: Player enters unlocked cyber portal!
        if (this.objectiveState.portalUnlocked && d < 55) {
          this.triggerStageClear();
          return;
        }
      }
    }

    this.objectiveState.nearestObjective = nearestObj;
    this.onObjectiveUpdate?.(this.objectiveState);

    // Screen Shake & Flash decay
    if (this.screenShake > 0) this.screenShake *= 0.88;
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - 0.04);

    // Notify React UI
    if (this.onScoreUpdate) {
      this.onScoreUpdate(
        Math.floor(this.score),
        Math.floor(this.distance),
        this.comboCount,
        this.comboMultiplier,
        Math.floor(this.player.integrity),
        Math.floor(this.player.energy)
      );
    }
  }

  // --- 2. CINEMATIC LERP CAMERA IMPLEMENTATION ---

  /**
   * Cinematic Lerp Camera with:
   * 1. 2-Axis smooth damped tracking on X and Y
   * 2. Velocity lookahead in movement direction
   * 3. Dynamic lookup / lookdown vertical pan when standing still and holding Up/Down
   */
  private updateCamera() {
    const isPlayerStationary = Math.hypot(this.player.velocity.x, this.player.velocity.y) < 0.35;

    // Dynamic Look-Up / Look-Down System
    if (isPlayerStationary) {
      if (this.player.directionalStates.up) {
        this.camera.lookHoldTimer += 1;
        if (this.camera.lookHoldTimer > 12) {
          this.camera.lookVerticalOffset += (-180 - this.camera.lookVerticalOffset) * 0.08;
        }
      } else if (this.player.directionalStates.down) {
        this.camera.lookHoldTimer += 1;
        if (this.camera.lookHoldTimer > 12) {
          this.camera.lookVerticalOffset += (180 - this.camera.lookVerticalOffset) * 0.08;
        }
      } else {
        this.camera.lookHoldTimer = 0;
        this.camera.lookVerticalOffset += (0 - this.camera.lookVerticalOffset) * 0.12;
      }
    } else {
      this.camera.lookHoldTimer = 0;
      this.camera.lookVerticalOffset += (0 - this.camera.lookVerticalOffset) * 0.15;
    }

    // Dynamic Velocity Lookahead
    const targetLookaheadX = Math.max(-120, Math.min(120, this.player.velocity.x * 14));
    const targetLookaheadY = Math.max(-80, Math.min(80, this.player.velocity.y * 14));
    this.camera.lookaheadX += (targetLookaheadX - this.camera.lookaheadX) * 0.08;
    this.camera.lookaheadY += (targetLookaheadY - this.camera.lookaheadY) * 0.08;

    // Smooth Lerp Camera Target
    const targetX = this.player.position.x + this.camera.lookaheadX;
    const targetY = this.player.position.y + this.camera.lookaheadY + this.camera.lookVerticalOffset;
    const lerpFactor = 0.10;

    this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
    this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;
  }

  // --- MUTATED BACTERIA ORGANISM ADVANCED AI DIRECTOR ---

  /** Spawns high-voltage electric discharge lightning particles between 2 world coordinates */
  public createElectricChainParticles(x1: number, y1: number, x2: number, y2: number, color: string = '#00FF66') {
    const steps = 10;
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;
    for (let s = 0; s < steps; s++) {
      const px = x1 + dx * s + (Math.random() - 0.5) * 16;
      const py = y1 + dy * s + (Math.random() - 0.5) * 16;
      this.particles.push({
        position: { x: px, y: py },
        velocity: { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 },
        size: 3 + Math.random() * 3,
        color: color,
        alpha: 1.0,
        decay: 0.12,
        shape: 'spark',
      });
    }
  }

  /** Unified enemy defeat handler with Boss victory, Mission Target tracking, and Tech drops */
  public handleEnemyDefeat(ent: WorldEntity, bac: EnemyBacteria, impactAngle: number = 0) {
    ent.active = false;

    // Handle Neon Clone Decoy Dissipation (Instantly dissolves into digital dust without drops)
    if (bac.isCloneDecoy) {
      sound.playDecoyDestroyed();
      this.triggerHitstop(25);
      this.createExplosion(ent.position.x, ent.position.y, '#00FFD1', 20);
      this.flyingSplatters.push(
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#00FFD1', '#FFFFFF', 18, impactAngle, 7)
      );
      this.addFloatingText(ent.position.x, ent.position.y - 25, '⚡ NEON DECOY SHATTERED', '#00FFD1');
      return;
    }

    const isBoss = bac.isBoss || bac.variant === 'APEX_BOSS';
    const isMissionTarget = bac.variant === 'MISSION_TARGET_ELITE';

    // Track stage kills & persistent total
    this.objectiveState.stageEnemiesKilled += 1;
    this.persistentProgression.totalEnemiesKilled += 1;
    dailyMissionManager.reportProgress('ENEMY_PURGE', 1);

    if (isBoss) {
      this.score += 5000 * this.comboMultiplier;
      this.comboCount += 15;
      this.comboMultiplier = Math.min(15, this.comboMultiplier + 4);
      this.comboTimer = 400;

      this.triggerHitstop(80);
      this.applyDirectionalScreenShake(45, impactAngle);

      this.flyingSplatters.push(
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#FF0055', '#FFD700', 60, undefined, 18),
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#9D00FF', '#00FFD1', 40, undefined, 15),
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#39FF14', '#FFFFFF', 35, undefined, 16)
      );

      this.createExplosion(ent.position.x, ent.position.y, '#FF0055', 60);
      this.createExplosion(ent.position.x, ent.position.y, '#FFD700', 50);
      this.createPulseWave(ent.position.x, ent.position.y, '#FFD700');

      // Drop guaranteed tech parts + golden caches
      this.spawnDrop(ent.position.x - 20, ent.position.y, 'WEAPON_TECH_PART');
      this.spawnDrop(ent.position.x + 20, ent.position.y, 'METALLIC_GOLD');
      this.spawnDrop(ent.position.x, ent.position.y - 20, 'CASH_STACK');

      this.addFloatingText(ent.position.x, ent.position.y - 50, '👑 APEX CYBER-LORD OBLITERATED! +5000 BOUNTY', '#FFD700');

      // If Stage 5 or Boss Stage -> Trigger Final Game Victory!
      if (this.currentStage >= 5 || this.stageDefinition.isBossStage) {
        setTimeout(() => {
          this.triggerGameVictory();
        }, 1200);
      }
      return;
    }

    if (isMissionTarget) {
      this.score += 1800 * this.comboMultiplier;
      this.comboCount += 6;
      this.comboMultiplier = Math.min(12, this.comboMultiplier + 2);
      this.comboTimer = 320;

      this.triggerHitstop(55);
      this.applyDirectionalScreenShake(30, impactAngle);

      this.flyingSplatters.push(
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#FFAA00', '#FF0055', 40, undefined, 14),
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#00FFD1', '#FFFFFF', 25, undefined, 11)
      );

      this.createExplosion(ent.position.x, ent.position.y, '#FFAA00', 40);
      this.createPulseWave(ent.position.x, ent.position.y, '#FFAA00');
      this.spawnDrop(ent.position.x, ent.position.y, 'WEAPON_TECH_PART');
      this.spawnDrop(ent.position.x + 15, ent.position.y, 'METALLIC_GOLD');
      this.addFloatingText(ent.position.x, ent.position.y - 40, '★ MISSION TARGET ELITE NEUTRALIZED!', '#FFAA00');
      return;
    }

    // Standard organisms
    this.score += 350 * this.comboMultiplier;
    this.comboCount += 2;
    this.comboMultiplier = Math.min(8, 1 + Math.floor(this.comboCount / 3));
    this.comboTimer = 280;

    this.triggerHitstop(45);
    this.applyDirectionalScreenShake(24, impactAngle);

    this.flyingSplatters.push(
      ...spawnSplatterBurst(ent.position.x, ent.position.y, '#ff0055', '#39ff14', 36, undefined, 12),
      ...spawnSplatterBurst(ent.position.x, ent.position.y, '#9d00ff', '#ffffff', 20, undefined, 9),
      ...spawnSplatterBurst(ent.position.x, ent.position.y, '#39ff14', '#ffe600', 16, undefined, 10)
    );

    this.createExplosion(ent.position.x, ent.position.y, '#39ff14', 30);
    this.addFloatingText(ent.position.x, ent.position.y - 35, '+350 BIO-CORE DESTROYED', '#39ff14');

    // Randomized drop
    const rand = Math.random();
    const dropType: CollectibleType = rand < 0.12 ? 'WEAPON_TECH_PART' : rand < 0.65 ? 'BLOOD_PLASMA_CELL' : 'METALLIC_GOLD';
    this.spawnDrop(ent.position.x, ent.position.y, dropType);
  }

  private updateBacteriaEnemies() {
    for (const ent of this.proceduralMap.activeTerminals) {
      if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
      const bac = ent.bacteriaData;

      // Execute Advanced Enemy AI Director (Raycast pathfinding, gap-jumping, platform-dropping, pounce, shooting, glitch dash, EMP charge, neon clone split)
      updateBacteriaAIDirector(
        bac,
        ent,
        this.player,
        this.proceduralMap.activeObstacles,
        (damage, color) => {
          this.handlePlayerDamage(damage, color);
        },
        (proj) => {
          this.projectiles.push({
            id: ++this.entityIdCounter,
            position: { x: proj.x, y: proj.y },
            velocity: { x: proj.vx, y: proj.vy },
            radius: 7,
            color: proj.color,
            damage: proj.damage,
            life: 90,
            maxLife: 90,
            trail: [],
            isEnemy: true,
          });
        },
        (x, y, variant) => {
          // Boss/Elite minion spawn
          const minionEnt = this.proceduralMap.terminalPool.acquire();
          minionEnt.id = `minion_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          minionEnt.type = 'MUTATED_BACTERIA';
          minionEnt.position = { x, y };
          minionEnt.velocity = { x: 0, y: 0 };
          minionEnt.radius = 18;
          minionEnt.angle = 0;
          minionEnt.active = true;
          minionEnt.glowColor = variant === 'TOXIC_SPITTER' ? '#FFE600' : '#9D00FF';
          minionEnt.health = 80;
          minionEnt.maxHealth = 80;
          minionEnt.dataReward = 200;
          minionEnt.bacteriaData = {
            id: minionEnt.id,
            variant: variant || 'STEALTH_STALKER',
            position: minionEnt.position,
            velocity: minionEnt.velocity,
            radius: 18,
            baseRadius: 18,
            health: 80,
            maxHealth: 80,
            active: true,
            pulsePhase: 0,
            pulseSpeed: 4,
            wobbleAmount: 0.2,
            membraneAlpha: 0.85,
            membraneColor: variant === 'TOXIC_SPITTER' ? '#FFE600' : '#9D00FF',
            cytoplasmColor: 'rgba(157, 0, 255, 0.4)',
            nucleusColor: '#00FFD1',
            nucleusOffset: { x: 0, y: 0 },
            tentacles: [],
            organelles: [],
            toxicBubbleTimer: 0,
            hitStaggerTimer: 0,
            facing: 'LEFT',
            facingAngle: Math.PI,
            visionFov: Math.PI / 2.5,
            visionRange: 260,
            alertness: 100,
            state: 'CHASE',
            detectionRadius: 600,
            jumpCooldown: 0,
            leapTimer: 0,
            patrolTimer: 100,
            patrolDir: 1,
            alertTimer: 0,
            pounceTimer: 0,
            onGround: true,
            losDetected: true,
          };
          this.proceduralMap.activeTerminals.push(minionEnt);
        },
        (parentBac, parentEnt) => {
          // Neon Clone Ability: Spawn 2 Decoy Clones flanking the enemy
          sound.playNeonCloneSplit();
          this.createExplosion(parentEnt.position.x, parentEnt.position.y, '#00FFD1', 28);
          this.createPulseWave(parentEnt.position.x, parentEnt.position.y, '#00FFD1');
          this.addFloatingText(parentEnt.position.x, parentEnt.position.y - 35, '⚡ NEON CLONE TRI-SPLIT!', '#00FFD1');

          for (let i = -1; i <= 1; i += 2) {
            const cloneEnt = this.proceduralMap.terminalPool.acquire();
            cloneEnt.id = `clone_${parentEnt.id}_${Math.random().toString(36).substr(2, 5)}`;
            cloneEnt.type = 'MUTATED_BACTERIA';
            cloneEnt.position = { x: parentEnt.position.x + i * 50, y: parentEnt.position.y };
            cloneEnt.velocity = { x: i * 4.2, y: -3.0 };
            cloneEnt.radius = parentBac.radius;
            cloneEnt.angle = parentEnt.angle;
            cloneEnt.active = true;
            cloneEnt.glowColor = '#00FFD1';
            cloneEnt.health = 1;
            cloneEnt.maxHealth = 1;
            cloneEnt.dataReward = 0;
            cloneEnt.bacteriaData = {
              ...parentBac,
              id: cloneEnt.id,
              position: cloneEnt.position,
              velocity: cloneEnt.velocity,
              health: 1,
              maxHealth: 1,
              active: true,
              isCloneDecoy: true,
              hasCloned: true,
              membraneColor: '#00FFD1',
              cytoplasmColor: 'rgba(0, 255, 209, 0.45)',
              state: 'CHASE',
              alertness: 100,
            };
            this.proceduralMap.activeTerminals.push(cloneEnt);
          }
        },
        () => {
          // Flashlight Jamming: EMP Blast triggers 3-second blind / radar-only state
          this.player.flashlightJammedTimer = 180; // 3 seconds at 60fps
          sound.playEmpBlast();
          sound.playFlashlightJam();
          this.triggerHitstop(40);
          this.applyDirectionalScreenShake(30);
          this.addFloatingText(
            this.player.position.x,
            this.player.position.y - 45,
            '⚡ EMP BLAST! FLASHLIGHT JAMMED // RADAR ONLY',
            '#FF0055'
          );
        },
        (kbX, kbY) => {
          // Direct Knockback & Heavy Impact from Enemy Charge Attack
          this.player.velocity.x += kbX;
          this.player.velocity.y += kbY;
          this.applyDirectionalScreenShake(24, Math.atan2(kbY, kbX));
          this.triggerHitstop(35);
          sound.playPlayerHurt();
          this.addFloatingText(this.player.position.x, this.player.position.y - 25, '⚡ DIRECT CHARGE KNOCKBACK!', '#FF0055');
        },
        (wx, wy) => this.proceduralMap.isPitHazardAt(wx, wy)
      );

      // Hyper-Dash and Overdrive Crushing Impact against Bacteria
      if (this.player.dashTimer > 0) {
        const d = Math.hypot(ent.position.x - this.player.position.x, ent.position.y - this.player.position.y);
        if (d < ent.radius + this.player.width / 2 + 12) {
          const dashDmg = this.player.overdriveTimer > 0 ? 140 : 75;
          bac.health = Math.max(0, bac.health - dashDmg);
          bac.hitStaggerTimer = 22;
          bac.state = 'STAGGER';
          checkEnemySurrender(bac);
          sound.playHit();

          this.triggerHitstop(45);
          this.applyDirectionalScreenShake(26, this.player.angle);
          this.flyingSplatters.push(
            ...spawnSplatterBurst(ent.position.x, ent.position.y, '#39ff14', '#ffffff', 16, this.player.angle, 10)
          );
          this.createExplosion(ent.position.x, ent.position.y, '#39ff14', 18);
          this.addFloatingText(ent.position.x, ent.position.y - 25, `HYPER-DASH IMPACT! [${dashDmg} DMG]`, '#00FFD1');

          if (bac.health <= 0) {
            this.handleEnemyDefeat(ent, bac, this.player.angle);
          }
        }
      }

      // Ambient toxic bio-bubble emission
      bac.toxicBubbleTimer++;
      if (bac.toxicBubbleTimer > 35) {
        bac.toxicBubbleTimer = 0;
        const bAngle = Math.random() * Math.PI * 2;
        this.particles.push({
          position: {
            x: ent.position.x + Math.cos(bAngle) * bac.radius,
            y: ent.position.y + Math.sin(bAngle) * bac.radius,
          },
          velocity: {
            x: (Math.random() - 0.5) * 0.8,
            y: -0.6 - Math.random() * 0.8,
          },
          size: 3 + Math.random() * 4,
          color: bac.membraneColor,
          alpha: 0.7,
          decay: 0.03,
          shape: 'circle',
        });
      }
    }
  }

  // --- PROJECTILES & SLASH ARCS UPDATE ---

  private updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const bolt = this.projectiles[i];
      bolt.life--;

      // 1. SMART HOMING MISSILE GUIDANCE
      if (bolt.isHoming) {
        let closestDist = Infinity;
        let targetX = bolt.position.x + bolt.velocity.x;
        let targetY = bolt.position.y + bolt.velocity.y;

        for (const ent of this.proceduralMap.activeTerminals) {
          if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
          const d = Math.hypot(ent.position.x - bolt.position.x, ent.position.y - bolt.position.y);
          if (d < 450 && d < closestDist) {
            closestDist = d;
            targetX = ent.position.x;
            targetY = ent.position.y;
          }
        }

        if (closestDist < Infinity) {
          const desiredAngle = Math.atan2(targetY - bolt.position.y, targetX - bolt.position.x);
          const curAngle = Math.atan2(bolt.velocity.y, bolt.velocity.x);
          let diff = desiredAngle - curAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const turnRate = 0.14;
          const newAngle = curAngle + Math.max(-turnRate, Math.min(turnRate, diff));
          const speed = Math.hypot(bolt.velocity.x, bolt.velocity.y);
          bolt.velocity.x = Math.cos(newAngle) * speed;
          bolt.velocity.y = Math.sin(newAngle) * speed;
        }

        // Exhaust smoke particle
        if (Math.random() < 0.6) {
          this.particles.push({
            position: { x: bolt.position.x, y: bolt.position.y },
            velocity: { x: -bolt.velocity.x * 0.2 + (Math.random() - 0.5) * 2, y: -bolt.velocity.y * 0.2 + (Math.random() - 0.5) * 2 },
            size: 3 + Math.random() * 3,
            color: '#FF00E5',
            alpha: 0.8,
            decay: 0.08,
            shape: 'circle',
          });
        }
      }

      // 2. QUANTUM VORTEX GRAVITATIONAL SUCTION & DAMAGE
      if (bolt.isVortex && bolt.vortexRadius) {
        for (const ent of this.proceduralMap.activeTerminals) {
          if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
          const d = Math.hypot(ent.position.x - bolt.position.x, ent.position.y - bolt.position.y);
          if (d < bolt.vortexRadius) {
            const pullForce = (1 - d / bolt.vortexRadius) * 4.5;
            const pullAngle = Math.atan2(bolt.position.y - ent.position.y, bolt.position.x - ent.position.x);
            ent.position.x += Math.cos(pullAngle) * pullForce;
            ent.position.y += Math.sin(pullAngle) * pullForce;

            // Tick damage
            const bac = ent.bacteriaData;
            bac.health = Math.max(0, bac.health - 1.2);
            bac.hitStaggerTimer = 4;
            if (bac.health <= 0) {
              this.handleEnemyDefeat(ent, bac, pullAngle);
            }
          }
        }

        // Swirling vortex aura particles
        const swirlAngle = (Date.now() * 0.01) % (Math.PI * 2);
        const sr = 18 + Math.random() * 14;
        this.particles.push({
          position: {
            x: bolt.position.x + Math.cos(swirlAngle) * sr,
            y: bolt.position.y + Math.sin(swirlAngle) * sr,
          },
          velocity: { x: -Math.sin(swirlAngle) * 3, y: Math.cos(swirlAngle) * 3 },
          size: 3 + Math.random() * 4,
          color: '#9D00FF',
          alpha: 0.85,
          decay: 0.06,
          shape: 'spark',
        });
      }

      bolt.position.x += bolt.velocity.x;
      bolt.position.y += bolt.velocity.y;

      // Store trail points
      bolt.trail.push({ x: bolt.position.x, y: bolt.position.y });
      if (bolt.trail.length > 6) bolt.trail.shift();

      // 3. ENEMY HOSTILE PROJECTILE VS PLAYER
      if (bolt.isEnemy) {
        const pd = Math.hypot(this.player.position.x - bolt.position.x, this.player.position.y - bolt.position.y);
        if (pd < this.player.radius + bolt.radius) {
          this.handlePlayerDamage(bolt.damage, bolt.color);
          this.createExplosion(bolt.position.x, bolt.position.y, bolt.color, 14);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 4. PLAYER PROJECTILE VS MUTATED BACTERIA
      else {
        let hit = false;
        for (const ent of this.proceduralMap.activeTerminals) {
          if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
          const d = Math.hypot(ent.position.x - bolt.position.x, ent.position.y - bolt.position.y);
          if (d < ent.radius + bolt.radius) {
            const bac = ent.bacteriaData;

            // Check 75% tactical combo prediction on critical finishers
            if (bolt.isCriticalFinisher) {
              const prediction = proCombatAI.testEnemyComboPrediction(bac, ent, this.player.position);
              if (prediction.predicted) {
                if (prediction.defenseType === 'EVASION_DASH') {
                  sound.playDash();
                  this.createDashSparks(ent.position.x, ent.position.y, Math.atan2(ent.velocity.y, ent.velocity.x));
                  this.addFloatingText(
                    ent.position.x,
                    ent.position.y - 38,
                    '💨 75% AI PREDICTED FINISHER! [EVASION DASH]',
                    '#00FFD1'
                  );
                  hit = true;
                  break; // Completely evaded
                } else if (prediction.defenseType === 'DEFENSIVE_BLOCK') {
                  sound.playPredictiveBlock();
                  this.createPulseWave(ent.position.x, ent.position.y, '#FFD700');
                  this.addFloatingText(
                    ent.position.x,
                    ent.position.y - 38,
                    '🛡️ 75% AI PREDICTED COMBO! [DEFLECT -85%]',
                    '#FFD700'
                  );
                  bolt.damage = Math.max(1, Math.round(bolt.damage * 0.15));
                }
              }
            }

            hit = true;
            bac.health = Math.max(0, bac.health - bolt.damage);
            bac.hitStaggerTimer = 16;
            bac.state = 'STAGGER';
            checkEnemySurrender(bac);
            sound.playHit();

            const boltAngle = Math.atan2(bolt.velocity.y, bolt.velocity.x);

            // Screen-impact freezing (30-50ms) + Directional Screenshake
            this.triggerHitstop(bolt.isCriticalFinisher ? 50 : 35);
            this.applyDirectionalScreenShake(bolt.isCriticalFinisher ? 22 : 14, boltAngle);

            // Fluid splatter burst on projectile impact
            this.flyingSplatters.push(
              ...spawnSplatterBurst(bolt.position.x, bolt.position.y, '#39ff14', '#ffffff', bolt.isCriticalFinisher ? 18 : 10, boltAngle, 7.0)
            );

            this.createExplosion(bolt.position.x, bolt.position.y, bolt.color, bolt.isCriticalFinisher ? 22 : 14);
            this.addFloatingText(
              ent.position.x,
              ent.position.y - 20,
              bolt.isCriticalFinisher ? `💥 CRIT FINISHER! -${bolt.damage}` : bolt.isMashed ? `⚠️ MASH REDUCED -${bolt.damage}` : `-${bolt.damage}`,
              bolt.color
            );

            if (bac.health <= 0) {
              this.handleEnemyDefeat(ent, bac, boltAngle);
            }
            break;
          }
        }

        if (hit || bolt.life <= 0) {
          if (bolt.isVortex) {
            // Singularity collapse implosion burst
            this.createExplosion(bolt.position.x, bolt.position.y, '#9D00FF', 35);
            this.createPulseWave(bolt.position.x, bolt.position.y, '#9D00FF');
          }
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateSlashArcs() {
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const arc = this.slashArcs[i];
      arc.alpha -= 0.12;
      if (arc.alpha <= 0) {
        this.slashArcs.splice(i, 1);
      }
    }
  }

  // --- ITEM SPAWNING & DROPS ---

  public spawnDrop(x: number, y: number, type: CollectibleType, weaponDropType?: WeaponDropModel) {
    let glow = '#ffd700';
    let pts = 200;
    let heal = 0;
    let stack = 1;
    let radius = 15;
    let chosenWeaponType = weaponDropType;

    if (type === 'METALLIC_GOLD') {
      glow = '#ffd700';
      pts = 200;
      radius = 15;
    } else if (type === 'CASH_STACK') {
      glow = '#00ff66';
      pts = 500;
      stack = 5;
      radius = 18;
    } else if (type === 'BLOOD_PLASMA_CELL') {
      glow = '#00ff66';
      pts = 250;
      heal = 25;
      radius = 18;
    } else if (type === 'WEAPON_TECH_PART' || type === 'EXOTIC_WEAPON_DROP') {
      glow = '#00ffd1';
      pts = 1000;
      radius = 20;
      if (!chosenWeaponType) {
        const weaponPool: WeaponDropModel[] = ['KATANA', 'PLASMA_BLASTER', 'LIGHTNING_CHAIN', 'SPREAD_CANNON', 'HOMING_MISSILES', 'QUANTUM_VORTEX'];
        chosenWeaponType = weaponPool[Math.floor(Math.random() * weaponPool.length)];
      }
    }

    this.proceduralMap.activeCollectibles.push({
      id: ++this.entityIdCounter,
      type,
      weaponDropType: chosenWeaponType,
      position: { x, y },
      radius,
      collected: false,
      glowColor: glow,
      animTimer: Math.random() * Math.PI,
      points: pts,
      stackCount: stack,
      healAmount: heal,
    });
  }

  // --- INTERACTIVE COLLECTIBLES & POWERUPS ---

  private updateCollectibles() {
    const collectibles = this.proceduralMap.activeCollectibles;
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const item = collectibles[i];
      if (item.collected) continue;

      item.animTimer += 0.06;

      const dist = Math.hypot(item.position.x - this.player.position.x, item.position.y - this.player.position.y);

      // Magnetic Attraction towards player
      if (dist < 160) {
        const pullAngle = Math.atan2(this.player.position.y - item.position.y, this.player.position.x - item.position.x);
        item.position.x += Math.cos(pullAngle) * 10.5;
        item.position.y += Math.sin(pullAngle) * 10.5;
      }

      // Pickup trigger
      if (dist < this.player.radius + item.radius) {
        item.collected = true;
        this.chipsCollectedInRun += 1;
        this.score += item.points * this.comboMultiplier;
        this.comboCount += 1;
        this.comboTimer = 260;
        this.comboMultiplier = Math.min(8, 1 + Math.floor(this.comboCount / 3));

        if (this.comboCount > this.maxComboInRun) {
          this.maxComboInRun = this.comboCount;
        }
        dailyMissionManager.reportProgress('COMBO_OVERDRIVE', this.comboCount, true);

        // Apply Specialized Item Effects & Audio
        if (item.type === 'ENCRYPTED_BIO_CORE') {
          this.objectiveState.collectedBioCores += 1;
          this.persistentProgression.totalCoresExtracted += 1;
          dailyMissionManager.reportProgress('BIO_CORE_HARVEST', 1);
          sound.playBioCoreCollect();
          this.addFloatingText(
            item.position.x,
            item.position.y - 30,
            `BIO-CORE EXTRACTED [${this.objectiveState.collectedBioCores}/3]`,
            '#00FFD1'
          );
          this.createPulseWave(item.position.x, item.position.y, '#00FFD1');
          this.createExplosion(item.position.x, item.position.y, '#00FFD1', 28);

          if (this.objectiveState.collectedBioCores >= 3) {
            this.objectiveState.portalUnlocked = true;
            sound.playPortalUnlocked();
            this.addFloatingText(
              this.player.position.x,
              this.player.position.y - 45,
              'CYBER EXIT PORTAL UNLOCKED!',
              '#00FF66'
            );
            this.createExplosion(this.player.position.x, this.player.position.y, '#00FF66', 36);
            this.flashAlpha = 0.4;
            this.flashColor = '#00FF66';
          }
          this.onObjectiveUpdate?.(this.objectiveState);
        } else if (item.type === 'WEAPON_TECH_PART') {
          sound.playPowerup();
          this.objectiveState.stageGoldEarned += 600;
          this.createPulseWave(item.position.x, item.position.y, '#FF00E5');
          this.createExplosion(item.position.x, item.position.y, '#FF00E5', 30);

          // Check next locked weapon in progression
          const weaponOrder: WeaponType[] = ['SPREAD_CANNON', 'LIGHTNING_CHAIN', 'HOMING_MISSILES', 'QUANTUM_VORTEX'];
          const nextLocked = weaponOrder.find((w) => !this.weaponArsenal[w].unlocked);

          if (nextLocked) {
            this.unlockWeapon(nextLocked);
          } else {
            // Upgrade currently equipped weapon
            const curW = this.weaponArsenal[this.activeWeapon];
            curW.level += 1;
            curW.damage = Math.round(curW.damage * 1.22);
            this.addFloatingText(
              item.position.x,
              item.position.y - 35,
              `⚡ ${curW.name.toUpperCase()} OVERCLOCKED TO LV.${curW.level}!`,
              '#FF00E5'
            );
            this.onWeaponUpdate?.(this.activeWeapon, this.weaponArsenal);
          }
        } else if (item.type === 'METALLIC_GOLD') {
          sound.playCoinCollect();
          this.objectiveState.stageGoldEarned += item.points;
          this.addFloatingText(
            item.position.x,
            item.position.y - 20,
            `+${item.points * this.comboMultiplier} GOLD ($)`,
            '#ffd700'
          );
          this.createExplosion(item.position.x, item.position.y, '#ffd700', 16);
        } else if (item.type === 'CASH_STACK') {
          sound.playCashCollect();
          this.objectiveState.stageGoldEarned += item.points;
          this.addFloatingText(
            item.position.x,
            item.position.y - 20,
            `+${item.points * this.comboMultiplier} CASH STACK`,
            '#00ff66'
          );
          this.createExplosion(item.position.x, item.position.y, '#00ff66', 18);
        } else if (item.type === 'BLOOD_PLASMA_CELL') {
          sound.playHealCollect();
          const heal = item.healAmount || 25;
          this.player.integrity = Math.min(this.player.maxIntegrity, this.player.integrity + heal);
          this.addFloatingText(
            item.position.x,
            item.position.y - 20,
            `+${heal}% RECOVERY [PLASMA]`,
            '#ff0055'
          );
          this.createPulseWave(item.position.x, item.position.y, '#ff0033');
          this.createExplosion(item.position.x, item.position.y, '#ff0055', 18);
        } else if (item.type === 'SHIELD_NODE') {
          this.activateShield();
          this.addFloatingText(item.position.x, item.position.y - 20, `+${item.points * this.comboMultiplier}`, item.glowColor);
          this.createExplosion(item.position.x, item.position.y, item.glowColor, 12);
        } else if (item.type === 'OVERDRIVE_CELL') {
          this.activateOverdrive();
          this.addFloatingText(item.position.x, item.position.y - 20, `+${item.points * this.comboMultiplier}`, item.glowColor);
          this.createExplosion(item.position.x, item.position.y, item.glowColor, 12);
        } else if (item.type === 'CHRONO_CRYSTAL') {
          this.activateChronoSlow();
          this.addFloatingText(item.position.x, item.position.y - 20, `+${item.points * this.comboMultiplier}`, item.glowColor);
          this.createExplosion(item.position.x, item.position.y, item.glowColor, 12);
        } else {
          sound.playCollect(this.comboCount);
          this.addFloatingText(item.position.x, item.position.y - 20, `+${item.points * this.comboMultiplier}`, item.glowColor);
          this.createExplosion(item.position.x, item.position.y, item.glowColor, 12);
        }

        collectibles.splice(i, 1);
      }
    }
  }

  public handlePlayerDamage(amount: number, color = '#FF0055') {
    if (this.player.invulnerableTimer > 0) return;

    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.player.shieldHitAnim = 25;
      this.player.invulnerableTimer = 40;
      sound.playHit();
      this.triggerHitstop(35);
      this.applyDirectionalScreenShake(16, Math.random() * Math.PI * 2);
      this.flashAlpha = 0.5;
      this.flashColor = '#00FFD1';
      this.addFloatingText(this.player.position.x, this.player.position.y - 30, 'SHIELD BROKEN!', '#00FFD1');
      return;
    }

    this.player.integrity = Math.max(0, this.player.integrity - amount);
    this.player.invulnerableTimer = 55;
    
    // Screen impact freeze and directional screenshake calculated from damage magnitude
    this.triggerHitstop(amount >= 20 ? 45 : 30);
    this.applyDirectionalScreenShake(Math.min(35, 12 + amount * 0.8), Math.random() * Math.PI * 2);

    // Visceral organic blood drops from player hit
    this.flyingSplatters.push(
      ...spawnSplatterBurst(this.player.position.x, this.player.position.y, '#ff0055', '#ff3366', 10, undefined, 7)
    );

    this.flashAlpha = 0.7;
    this.flashColor = color;
    sound.playHit();

    // Reset Combo on Damage
    this.comboCount = 0;
    this.comboMultiplier = 1;

    this.addFloatingText(this.player.position.x, this.player.position.y - 30, `-${amount}% INTEGRITY`, '#FF0055');

    if (this.player.integrity <= 0) {
      this.triggerGameOver();
    }
  }

  /** Triggered when the hero steps on a broken floor / chasm void without dashing */
  public triggerPlayerFallIntoVoid() {
    if (this.player.isFallingIntoAbyss || this.state !== 'PLAYING') return;
    this.player.isFallingIntoAbyss = true;
    this.player.fallingTimer = 40;
    this.player.actionState = 'FALLING_INTO_VOID';
    this.player.velocity.x *= 0.1;
    this.player.velocity.y *= 0.1;

    sound.playPitFall();
    this.triggerHitstop(20);
    this.applyDirectionalScreenShake(28, Math.PI / 2);
    this.flashAlpha = 0.8;
    this.flashColor = '#FF0055';

    // Spawn falling void sparks and abyss debris
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      this.particles.push({
        position: { x: this.player.position.x, y: this.player.position.y },
        velocity: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#FF0055' : '#00FFD1',
        alpha: 1.0,
        decay: 0.04,
        shape: 'spark',
      });
    }

    this.addFloatingText(
      this.player.position.x,
      this.player.position.y - 45,
      '⚠️ FELL INTO BOTTOMLESS CHASM!',
      '#FF0055'
    );
  }

  /** Update void falling descent animation & trigger game over / restart */
  private updatePlayerVoidFalling() {
    if (!this.player.fallingTimer) this.player.fallingTimer = 0;
    this.player.fallingTimer--;

    // Spin and slow down in 2D / 3D
    this.player.angle += 0.35;
    this.player.velocity.x *= 0.8;
    this.player.velocity.y *= 0.8;

    // Emit void particles
    if (Math.random() < 0.6) {
      this.particles.push({
        position: {
          x: this.player.position.x + (Math.random() - 0.5) * 20,
          y: this.player.position.y + (Math.random() - 0.5) * 20,
        },
        velocity: { x: 0, y: 0 },
        size: 2 + Math.random() * 4,
        color: '#FF0055',
        alpha: 0.9,
        decay: 0.08,
        shape: 'circle',
      });
    }

    if (this.player.fallingTimer <= 0) {
      this.player.integrity = 0;
      this.triggerGameOver();
    }
  }

  // --- PARTICLES & VISUALS ---

  public createPulseWave(x: number, y: number, color: string) {
    this.particles.push({
      position: { x, y },
      velocity: { x: 0, y: 0 },
      size: 15,
      color,
      alpha: 0.9,
      decay: 0.03,
      shape: 'ring',
    });
  }

  public createDashSparks(x: number, y: number, angle: number) {
    for (let i = 0; i < 20; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        position: { x, y },
        velocity: {
          x: Math.cos(angle + Math.PI + spread) * speed,
          y: Math.sin(angle + Math.PI + spread) * speed,
        },
        size: 3 + Math.random() * 5,
        color: Math.random() < 0.5 ? '#00FFD1' : '#FF00E5',
        alpha: 1,
        decay: 0.04 + Math.random() * 0.04,
        shape: 'spark',
      });
    }
  }

  private createThrusterParticle(x: number, y: number, angle: number) {
    const speed = 2 + Math.random() * 3;
    this.particles.push({
      position: { x, y },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      size: 3 + Math.random() * 3,
      color: this.player.overdriveTimer > 0 ? '#FF00E5' : '#00FFD1',
      alpha: 0.8,
      decay: 0.06,
      shape: 'circle',
    });
  }

  public createExplosion(x: number, y: number, color: string, count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.particles.push({
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size: 4 + Math.random() * 6,
        color,
        alpha: 1,
        decay: 0.035 + Math.random() * 0.03,
        shape: Math.random() < 0.5 ? 'spark' : 'square',
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    // Purged messy floating text clutter from screen per user request.
    // Screen remains clean and unobstructed.
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.alpha -= p.decay;
      if (p.shape === 'ring') {
        p.size += 6.0;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.position.x += t.velocity.x;
      t.position.y += t.velocity.y;
      t.alpha -= 0.018;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateRain() {
    const W = this.camera.viewportWidth || this.V_WIDTH;
    const H = this.camera.viewportHeight || this.V_HEIGHT;

    for (const r of this.rainParticles) {
      r.y += r.speed;
      r.x += Math.tan(r.angle) * r.speed;
      if (r.y > H) {
        r.y = -20;
        r.x = Math.random() * W;
      }
    }
  }

  private lerpAngle(current: number, target: number, step: number): number {
    let diff = (target - current) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * step;
  }

  // --- 3. HIGH-FIDELITY RENDERING PIPELINE (3D WEBGL THREE.JS ENGINE) ---

  public render() {
    try {
      this.threeManager.render3D(
        this.player,
        this.camera,
        this.proceduralMap.activeObstacles,
        this.proceduralMap.activeTerminals,
        this.proceduralMap.activeCollectibles,
        this.proceduralMap.activeLasers,
        this.proceduralMap.activeProps,
        this.particles,
        this.flyingSplatters,
        this.floatingTexts,
        this.settings,
        this.rhythmBeatState,
        this.speedrunDelta,
        this.screenShake,
        this.screenShakeAngle,
        this.flashAlpha,
        this.flashColor,
        this.proceduralMap.activeChunks
      );
    } catch (err) {
      console.error('3D WebGL render pipeline error:', err);
    }
  }

  // --- SUB-RENDERERS ---

  private renderRhythmMetronome(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const beat = this.rhythmBeatState;
    const isNear = beat.isNearBeat;

    ctx.save();
    // Center at bottom above touch controls / HUD
    const barWidth = 240;
    const barHeight = 16;
    const cx = W / 2;
    const cy = H - 52;

    // Outer cyber frame
    ctx.fillStyle = 'rgba(10, 15, 29, 0.82)';
    ctx.strokeStyle = isNear ? '#00FFD1' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = isNear ? 2 : 1;
    ctx.shadowColor = isNear ? '#00FFD1' : 'transparent';
    ctx.shadowBlur = isNear ? 12 : 0;
    ctx.beginPath();
    ctx.roundRect(cx - barWidth / 2, cy - barHeight / 2, barWidth, barHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Center "Hit Zone"
    ctx.fillStyle = isNear ? 'rgba(0, 255, 209, 0.45)' : 'rgba(255, 0, 229, 0.25)';
    ctx.fillRect(cx - 24, cy - barHeight / 2 + 2, 48, barHeight - 4);

    // Converging Beat Target Pointers (Left and Right moving inward toward center)
    const phaseOffset = (1 - beat.beatPhase) * (barWidth / 2);
    ctx.fillStyle = isNear ? '#00FFD1' : '#FF00E5';
    ctx.shadowColor = isNear ? '#00FFD1' : '#FF00E5';
    ctx.shadowBlur = 8;

    // Left indicator
    ctx.fillRect(cx - phaseOffset - 3, cy - barHeight / 2 + 1, 6, barHeight - 2);
    // Right indicator
    ctx.fillRect(cx + phaseOffset - 3, cy - barHeight / 2 + 1, 6, barHeight - 2);

    // Center Gold Timing Line
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(cx - 1.5, cy - barHeight / 2 - 2, 3, barHeight + 4);

    // Top Label
    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isNear ? '#00FFD1' : 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = isNear ? 6 : 0;
    const streakStr = beat.streak > 0 ? ` [STREAK x${beat.streak}]` : '';
    ctx.fillText(`⚡ SYNTHWAVE BEAT SYNC (${beat.bpm} BPM)${streakStr}`, cx, cy - 12);

    ctx.restore();
  }

  private renderSpeedrunDeltaBadge(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const delta = this.speedrunDelta;
    if (!delta.hasGhost) return;

    ctx.save();
    const x = W - 140;
    const y = 84;

    ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
    const isAhead = delta.status === 'AHEAD';
    const borderColor = isAhead ? '#00FF66' : delta.status === 'BEHIND' ? '#FF0055' : '#00FFD1';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x - 65, y - 14, 130, 28, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = borderColor;
    ctx.fillText(`PB DELTA: ${delta.formattedDelta}`, x, y + 4);

    ctx.restore();
  }

  private renderWorldChunks(ctx: CanvasRenderingContext2D) {
    const tileSize = this.proceduralMap.TILE_SIZE;

    for (const chunk of this.proceduralMap.activeChunks) {
      const wx = chunk.worldX;
      const wy = chunk.worldY;

      for (let x = 0; x < chunk.chunkSize; x++) {
        for (let y = 0; y < chunk.chunkSize; y++) {
          const tile = chunk.tiles[x][y];
          if (tile.type === 'CYBER_BUILDING') continue;

          const px = wx + x * tileSize;
          const py = wy + y * tileSize;

          if (tile.type === 'CHASM_VOID' || tile.type === 'BROKEN_FLOOR' || tile.isPitHazard) {
            const isBroken = tile.type === 'BROKEN_FLOOR';
            const cx = px + tileSize / 2;
            const cy = py + tileSize / 2;
            const seed = Math.abs(Math.sin(chunk.chunkX * 127.1 + chunk.chunkY * 311.7 + x * 269.5 + y * 183.3));

            // 1. Base Dark Floor Tile
            ctx.fillStyle = '#060a12';
            ctx.fillRect(px, py, tileSize, tileSize);

            // 2. High-Contrast Hazard Caution Chevron Border (Diagonal Orange/Black Stripes)
            ctx.save();
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 1.5, py + 1.5, tileSize - 3, tileSize - 3);

            // Diagonal corner hazard stripes
            ctx.strokeStyle = 'rgba(255, 102, 0, 0.4)';
            ctx.lineWidth = 2;
            for (let s = 4; s < tileSize; s += 10) {
              ctx.beginPath();
              ctx.moveTo(px + s, py);
              ctx.lineTo(px, py + s);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(px + tileSize, py + s);
              ctx.lineTo(px + s, py + tileSize);
              ctx.stroke();
            }
            ctx.restore();

            // 3. Explosion Blast Scorch Halo (Singed dark carbon spreading outward)
            const scorchGrad = ctx.createRadialGradient(cx, cy, tileSize * 0.15, cx, cy, tileSize * 0.7);
            scorchGrad.addColorStop(0, 'rgba(2, 1, 4, 0.98)');
            scorchGrad.addColorStop(0.5, 'rgba(10, 4, 12, 0.85)');
            scorchGrad.addColorStop(0.8, 'rgba(22, 8, 14, 0.45)');
            scorchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = scorchGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // 4. Radial Blast Fracture Crack Lines Spreading Outward
            ctx.strokeStyle = '#020104';
            ctx.lineWidth = 1.8;
            for (let c = 0; c < 6; c++) {
              const cAngle = (c / 6) * Math.PI * 2 + seed * 3.5;
              const rStart = tileSize * 0.35;
              const rEnd = tileSize * (0.65 + ((c + seed) % 0.2));
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(cAngle) * rStart, cy + Math.sin(cAngle) * rStart);
              ctx.lineTo(
                cx + Math.cos(cAngle + 0.15) * ((rStart + rEnd) / 2),
                cy + Math.sin(cAngle + 0.15) * ((rStart + rEnd) / 2)
              );
              ctx.lineTo(cx + Math.cos(cAngle) * rEnd, cy + Math.sin(cAngle) * rEnd);
              ctx.stroke();
            }

            // Glowing Thermal Ember Micro-Veins
            ctx.strokeStyle = isBroken ? 'rgba(255, 60, 0, 0.65)' : 'rgba(255, 102, 0, 0.75)';
            ctx.lineWidth = 1.2;
            for (let e = 0; e < 3; e++) {
              const eAngle = e * 2.1 + seed * 2;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(eAngle) * (tileSize * 0.36), cy + Math.sin(eAngle) * (tileSize * 0.36));
              ctx.lineTo(cx + Math.cos(eAngle) * (tileSize * 0.52), cy + Math.sin(eAngle) * (tileSize * 0.52));
              ctx.stroke();
            }

            // 5. Circular / Oval Blown-Out Impact Crater Center
            const numPts = 10;
            const pts: [number, number][] = [];
            const rBase = tileSize * 0.38;

            for (let i = 0; i < numPts; i++) {
              const theta = (i / numPts) * Math.PI * 2;
              const rNoise = Math.sin(theta * 3 + seed * 10) * (tileSize * 0.05) +
                             Math.cos(theta * 4 + seed * 20) * (tileSize * 0.025);
              const r = Math.max(tileSize * 0.28, Math.min(tileSize * 0.44, rBase + rNoise));
              pts.push([cx + Math.cos(theta) * r, cy + Math.sin(theta) * r]);
            }

            // Deep Abyss Void Gradient (Pitch Black Center)
            const cavityGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, tileSize * 0.44);
            cavityGrad.addColorStop(0, '#000000');
            cavityGrad.addColorStop(0.7, '#020106');
            cavityGrad.addColorStop(1, isBroken ? 'rgba(40, 10, 16, 0.95)' : 'rgba(30, 10, 20, 0.95)');

            ctx.fillStyle = cavityGrad;
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < numPts; i++) {
              ctx.lineTo(pts[i][0], pts[i][1]);
            }
            ctx.closePath();
            ctx.fill();

            // 6. GLOWING NEON HAZARD WARNING PERIMETER OUTLINE (နီယွန်သတိပေးလိုင်း)
            ctx.save();
            ctx.strokeStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < numPts; i++) {
              ctx.lineTo(pts[i][0], pts[i][1]);
            }
            ctx.closePath();
            ctx.stroke();

            // Glowing Corner Warning Beacon Dots
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 6;
            const beaconOffset = 3;
            ctx.beginPath();
            ctx.arc(px + beaconOffset, py + beaconOffset, 2.5, 0, Math.PI * 2);
            ctx.arc(px + tileSize - beaconOffset, py + beaconOffset, 2.5, 0, Math.PI * 2);
            ctx.arc(px + tileSize - beaconOffset, py + tileSize - beaconOffset, 2.5, 0, Math.PI * 2);
            ctx.arc(px + beaconOffset, py + tileSize - beaconOffset, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 7. Tilted Concrete Slab & Rubble Chunks
            ctx.fillStyle = '#1e1828';
            ctx.fillRect(cx - tileSize * 0.28, cy - tileSize * 0.24, 4, 3);
            ctx.fillRect(cx + tileSize * 0.24, cy + tileSize * 0.20, 3, 3);
            ctx.fillRect(cx - tileSize * 0.12, cy + tileSize * 0.30, 3, 2);
          } else {
            ctx.fillStyle = tile.color;
            ctx.fillRect(px, py, tileSize, tileSize);

            if (tile.type === 'ASPHALT_ROAD') {
              ctx.strokeStyle = 'rgba(0, 255, 209, 0.08)';
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, tileSize, tileSize);

              if (tile.glowColor) {
                ctx.fillStyle = tile.glowColor;
                ctx.shadowColor = tile.glowColor;
                ctx.shadowBlur = 6;
                ctx.fillRect(px + tileSize / 2 - 2, py + tileSize / 2 - 2, 4, 4);
                ctx.shadowBlur = 0;
              }
            } else if (tile.type === 'HOLOGRAM_PLAZA') {
              ctx.strokeStyle = 'rgba(157, 0, 255, 0.25)';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
            } else if (tile.type === 'NEON_SIDEWALK') {
              ctx.strokeStyle = 'rgba(255, 0, 229, 0.08)';
              ctx.lineWidth = 1;
              ctx.strokeRect(px, py, tileSize, tileSize);
            }
          }
        }
      }
    }
  }

  private renderAlleyDecor(ctx: CanvasRenderingContext2D) {
    for (const decor of this.proceduralMap.activeDecor) {
      if (!decor.active) continue;
      ctx.save();
      ctx.translate(decor.position.x, decor.position.y);

      if (decor.type === 'NEON_PUDDLE') {
        const ripple = (Date.now() * 0.002) % 1;
        ctx.fillStyle = 'rgba(0, 255, 209, 0.15)';
        ctx.strokeStyle = decor.glowColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, decor.width / 2, decor.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = `rgba(0, 255, 209, ${1 - ripple})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, (decor.width / 2) * ripple, (decor.height / 2) * ripple, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (decor.type === 'STEAM_VENT') {
        ctx.fillStyle = '#120e20';
        ctx.fillRect(-decor.width / 2, -decor.height / 2, decor.width, decor.height);
        ctx.strokeStyle = '#2b2144';
        ctx.lineWidth = 2;
        ctx.strokeRect(-decor.width / 2, -decor.height / 2, decor.width, decor.height);

        const time = Date.now() * 0.003;
        const steamAlpha = 0.25 + Math.sin(time * 3) * 0.15;
        ctx.fillStyle = `rgba(0, 240, 255, ${steamAlpha})`;
        ctx.beginPath();
        ctx.arc(0, -6 + Math.sin(time) * 4, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'NEON_GRAFFITI') {
        ctx.font = '900 12px "Orbitron", monospace';
        ctx.fillStyle = decor.glowColor;
        ctx.shadowColor = decor.glowColor;
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText('CYBER_NODE', 0, 4);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  private renderCyberObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.proceduralMap.activeObstacles) {
      if (!obs.active) continue;
      ctx.save();
      const glow = obs.glowColor || '#00FFD1';
      const elevation = obs.elevation || 35;

      ctx.fillStyle = '#070410';
      ctx.fillRect(obs.bounds.x, obs.bounds.y, obs.bounds.width, obs.bounds.height);

      const roofX = obs.bounds.x + 3;
      const roofY = obs.bounds.y + 3 - elevation * 0.12;
      const roofW = obs.bounds.width - 6;
      const roofH = obs.bounds.height - 6;

      ctx.fillStyle = '#161028';
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.fillRect(roofX, roofY, roofW, roofH);
      ctx.strokeRect(roofX, roofY, roofW, roofH);

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(roofX + 6, roofY + 6);
      ctx.lineTo(roofX + roofW - 6, roofY + roofH - 6);
      ctx.moveTo(roofX + roofW - 6, roofY + 6);
      ctx.lineTo(roofX + 6, roofY + roofH - 6);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderLaserHazards(ctx: CanvasRenderingContext2D) {
    for (const laser of this.proceduralMap.activeLasers) {
      if (laser.disabled || !laser.active || laser.state === 'OFF') continue;
      ctx.save();

      let endX = laser.endX;
      let endY = laser.endY;

      if (laser.orientation === 'ROTATING') {
        const rad = laser.rotationAngle || 0;
        const length = 220;
        endX = laser.startX + Math.cos(rad) * length;
        endY = laser.startY + Math.sin(rad) * length;
      }

      ctx.fillStyle = '#1a142e';
      ctx.strokeStyle = laser.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(laser.startX, laser.startY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (laser.state === 'CHARGING') {
        const blink = Math.sin(Date.now() * 0.02) > 0;
        if (blink) {
          ctx.strokeStyle = laser.color;
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(laser.startX, laser.startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      } else if (laser.state === 'FIRING') {
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 24;
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderWorldEntities(ctx: CanvasRenderingContext2D) {
    for (const ent of this.proceduralMap.activeTerminals) {
      if (!ent.active) continue;

      if (ent.type === 'MUTATED_BACTERIA' && ent.bacteriaData) {
        this.renderBacteriaSprite(ctx, ent);
      } else if (ent.type === 'DATA_TERMINAL') {
        this.renderDataTerminal(ctx, ent);
      } else if (ent.type === 'CYBER_EXIT_PORTAL') {
        renderCyberExitPortal(
          ctx,
          ent,
          this.player.position,
          this.objectiveState.portalUnlocked,
          this.objectiveState.collectedBioCores,
          this.objectiveState.totalBioCores
        );
      }
    }
  }

  private renderDataTerminal(ctx: CanvasRenderingContext2D, term: WorldEntity) {
    ctx.save();
    ctx.translate(term.position.x, term.position.y);

    ctx.fillStyle = '#060312';
    ctx.strokeStyle = term.active ? term.glowColor : '#555566';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (term.active) {
      ctx.shadowColor = term.glowColor;
      ctx.shadowBlur = 18;

      const rotTime = Date.now() * 0.003;
      ctx.strokeStyle = term.glowColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, 26 + Math.sin(rotTime * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = term.glowColor;
      ctx.fillRect(-6, -6, 12, 12);

      const dist = Math.hypot(term.position.x - this.player.position.x, term.position.y - this.player.position.y);
      if (dist < 150) {
        ctx.font = 'bold 12px "Orbitron", monospace';
        ctx.fillStyle = '#00FF66';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText(term.interactionPrompt || '[E / TOUCH] HACK TERMINAL', 0, -34);
      }
    } else {
      ctx.fillStyle = '#00ff66';
      ctx.font = 'bold 10px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TERMINAL OVERRIDDEN', 0, -28);
    }

    ctx.restore();
  }

  // --- 4. ULTRA-REALISTIC ENEMY BACTERIA SPRITE RENDERING ---

  /**
   * Render Enemy Bacteria with gross, fluid organic scaling animations,
   * translucent membrane layering using ctx.globalAlpha, undulating flagella,
   * pulsating organelles, and dark bio-nucleus core.
   */
  public renderBacteriaSprite(ctx: CanvasRenderingContext2D, ent: WorldEntity) {
    const bac = ent.bacteriaData;
    if (!bac) return;

    ctx.save();
    ctx.translate(ent.position.x, ent.position.y);

    const time = Date.now() * 0.003;
    const pulse = Math.sin(time * bac.pulseSpeed + bac.pulsePhase);
    const squishX = (1 + bac.wobbleAmount * Math.sin(time * 3)) * (bac.hitStaggerTimer > 0 ? 1.25 : 1.0);
    const squishY = (1 - bac.wobbleAmount * Math.cos(time * 3)) * (bac.hitStaggerTimer > 0 ? 0.8 : 1.0);

    ctx.scale(squishX, squishY);

    // 1. Undulating Flagella / Bio-Tentacles (Fluid sine motion)
    for (const tentacle of bac.tentacles) {
      ctx.save();
      ctx.rotate(tentacle.baseAngle);

      ctx.strokeStyle = tentacle.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.75;
      ctx.shadowColor = tentacle.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(bac.radius * 0.7, 0);

      const segmentLen = tentacle.length / tentacle.segments;
      for (let s = 1; s <= tentacle.segments; s++) {
        const segX = bac.radius * 0.7 + s * segmentLen;
        const wave = Math.sin(s * 0.8 + time * tentacle.waveSpeed + tentacle.phaseOffset) * tentacle.waveAmplitude;
        ctx.lineTo(segX, wave);
      }
      ctx.stroke();

      // Suction spore bulb at tip
      const tipX = bac.radius * 0.7 + tentacle.length;
      const tipWave = Math.sin(tentacle.segments * 0.8 + time * tentacle.waveSpeed + tentacle.phaseOffset) * tentacle.waveAmplitude;
      ctx.fillStyle = tentacle.color;
      ctx.beginPath();
      ctx.arc(tipX, tipWave, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Outer Phospholipid Bilayer / Visceral Organic Soft-Body Membrane
    const points = 24;
    ctx.save();

    // Bio-reactive lighting gradient inside the cytoplasm
    const membraneR = (bac.radius + pulse * 2.5);
    const cytoGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, membraneR);
    if (bac.hitStaggerTimer > 0) {
      cytoGrad.addColorStop(0, '#ffffff');
      cytoGrad.addColorStop(0.5, '#ff4070');
      cytoGrad.addColorStop(1, '#ff0033');
    } else {
      cytoGrad.addColorStop(0, bac.nucleusColor || '#ff0055');
      cytoGrad.addColorStop(0.4, bac.cytoplasmColor || 'rgba(0, 255, 150, 0.4)');
      cytoGrad.addColorStop(0.85, bac.membraneColor || 'rgba(0, 255, 209, 0.6)');
      cytoGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    }

    ctx.fillStyle = cytoGrad;
    ctx.shadowColor = bac.membraneColor;
    ctx.shadowBlur = bac.hitStaggerTimer > 0 ? 28 : 18;
    ctx.globalAlpha = bac.hitStaggerTimer > 0 ? 0.95 : 0.82;

    // Undulating multi-harmonic organic membrane perimeter
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2;
      const harmonic1 = Math.sin(a * 3 + time * 4) * 0.09;
      const harmonic2 = Math.cos(a * 5 - time * 2.5) * 0.05;
      const r = membraneR * (1 + harmonic1 + harmonic2);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Membrane Glowing Outer Wall Stroke
    ctx.strokeStyle = bac.hitStaggerTimer > 0 ? '#ffffff' : bac.membraneColor;
    ctx.lineWidth = bac.hitStaggerTimer > 0 ? 3.5 : 2.2;
    ctx.globalAlpha = 0.95;
    ctx.stroke();

    // Spiky Chitin Protrusions / Toxic Pustules around perimeter
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.5;
      const spikeR = membraneR * 1.15;
      const sx = Math.cos(a) * spikeR;
      const sy = Math.sin(a) * spikeR;
      ctx.fillStyle = bac.membraneColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5 + Math.sin(time * 3 + i) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Floating Organelles & Toxic Vacuoles
    for (const org of bac.organelles) {
      ctx.save();
      const orgPulse = Math.sin(time * 3 + org.pulseOffset) * 1.5;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = org.color;
      ctx.shadowColor = org.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(org.x, org.y, Math.max(2, org.r + orgPulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Dark Mutated Bio-Nucleus Core (Dense wobbly genetic center)
    ctx.save();
    const nucleusR = bac.radius * 0.38 + Math.sin(time * 2) * 2;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = bac.nucleusColor;
    ctx.shadowColor = bac.nucleusColor;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = nucleusR * (1 + 0.12 * Math.sin(a * 3 + time * 2));
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Nuclear chromatin pattern
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, nucleusR * 0.45, 0, Math.PI * 1.3);
    ctx.stroke();
    ctx.restore();

    // 5. Clean Dynamic Health Bar Floating Directly Above Bacteria Head
    const maxHp = Math.max(1, bac.maxHealth || 100);
    const hpPct = Math.max(0, Math.min(1, bac.health / maxHp));
    const isBoss = bac.variant === 'APEX_BOSS';
    const isElite = bac.variant === 'MISSION_TARGET_ELITE' || bac.variant === 'CYBER_BRUTE';
    const barW = isBoss ? 64 : isElite ? 50 : 38;
    const barH = isBoss ? 6 : 4.5;
    const barX = -barW / 2;
    const barY = -bac.radius - 16;

    // Dark background capsule & high-contrast border
    ctx.fillStyle = 'rgba(6, 10, 18, 0.92)';
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.98)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
    ctx.fill();
    ctx.stroke();

    // Bright neon pink / red real-time draining fill
    if (hpPct > 0) {
      const fillW = Math.max(2, barW * hpPct);
      const hpGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      hpGrad.addColorStop(0, '#FF0055');
      hpGrad.addColorStop(1, '#FF2A6D');
      ctx.fillStyle = hpGrad;
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 1.5);
      ctx.fill();
    }

    // AI Director State Visual Badges & Tactical Feedback
    if (bac.state === 'ALERT') {
      ctx.save();
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.font = '900 14px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -bac.radius - 20);
      ctx.restore();
    } else if (bac.state === 'POUNCE') {
      ctx.save();
      ctx.strokeStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, bac.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // --- 5. ULTRA-REALISTIC PLAYER SPRITE RENDERING ---

  /**
   * Modular Cyber Warrior Sprite Renderer with:
   * 1. Accurate facing direction (left/right transform flip)
   * 2. Full action frame animations: IDLE, RUNNING, SLASHING, SHOOTING, DASHING/SLIDING
   * 3. Neon afterimage trails, weapon glow, visor scanning laser, and matrix shields.
   */
  public renderPlayerSprite(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.position.x, p.position.y);

    // 1. Render Motion Trail Afterimages
    for (const img of p.afterimages) {
      ctx.save();
      ctx.translate(img.position.x - p.position.x, img.position.y - p.position.y);
      ctx.rotate(img.angle);
      ctx.globalAlpha = img.alpha * 0.55;
      ctx.fillStyle = img.color;
      ctx.shadowColor = img.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Horizontal Flip for Facing Left/Right
    ctx.save();
    if (p.facingDirection === 'LEFT') {
      ctx.scale(-1, 1);
    }

    // Colors
    const suitColor = p.overdriveTimer > 0 ? '#FF00E5' : '#00FFD1';
    const accentColor = p.overdriveTimer > 0 ? '#FFE600' : '#FF00E5';
    const time = p.animTimer;

    // --- ACTION ANIMATIONS ---
    const isRunning = p.actionState === 'RUNNING' || p.actionState === 'OVERDRIVE';
    const isSlashing = p.actionState === 'SLASHING';
    const isShooting = p.actionState === 'SHOOTING';
    const isDashing = p.actionState === 'DASHING';

    // Bobbing & Stride physics
    const idleBob = Math.sin(time * 4) * 2;
    const runBob = Math.abs(Math.sin(time * 8)) * 4;
    const bodyY = isRunning ? -runBob : idleBob;
    const leanAngle = isRunning ? 0.14 : isDashing ? 0.35 : 0;

    ctx.rotate(leanAngle);

    // A. Holographic Trenchcoat / Scarf Flutter (Cyberpunk wind physics)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 229, 0.4)';
    ctx.shadowColor = '#FF00E5';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const coatWave1 = Math.sin(time * 6) * 5;
    const coatWave2 = Math.sin(time * 6 + 1.2) * 8;
    ctx.moveTo(-10, bodyY);
    ctx.quadraticCurveTo(-26, bodyY + coatWave1, -38, bodyY + 12 + coatWave2);
    ctx.lineTo(-30, bodyY + 18 + coatWave2);
    ctx.quadraticCurveTo(-20, bodyY + coatWave1 + 6, -6, bodyY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // B. Articulated Robotic Legs (Bipedal run cycle)
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    if (isRunning) {
      const legStride1 = Math.sin(time * 8) * 14;
      const legStride2 = -legStride1;
      // Leg 1
      ctx.beginPath();
      ctx.moveTo(-4, bodyY + 12);
      ctx.lineTo(-4 + legStride1 * 0.7, bodyY + 22);
      ctx.lineTo(-4 + legStride1, bodyY + 30);
      ctx.stroke();

      // Leg 2
      ctx.beginPath();
      ctx.moveTo(6, bodyY + 12);
      ctx.lineTo(6 + legStride2 * 0.7, bodyY + 22);
      ctx.lineTo(6 + legStride2, bodyY + 30);
      ctx.stroke();

      // Boots Neon Accents
      ctx.fillStyle = suitColor;
      ctx.fillRect(-6 + legStride1, bodyY + 28, 6, 3);
      ctx.fillRect(4 + legStride2, bodyY + 28, 6, 3);
    } else {
      // Idle Legs
      ctx.beginPath();
      ctx.moveTo(-6, bodyY + 12);
      ctx.lineTo(-8, bodyY + 28);
      ctx.moveTo(6, bodyY + 12);
      ctx.lineTo(8, bodyY + 28);
      ctx.stroke();

      // Boots
      ctx.fillStyle = suitColor;
      ctx.fillRect(-10, bodyY + 27, 6, 3);
      ctx.fillRect(6, bodyY + 27, 6, 3);
    }
    ctx.restore();

    // C. Armored Torso Chassis & Exoskeleton Armor
    ctx.save();
    ctx.globalAlpha = p.invulnerableTimer > 0 && Math.sin(time * 25) > 0 ? 0.35 : 1.0;

    // Outer Carbon Armor Chestplate
    const torsoGrad = ctx.createLinearGradient(-15, bodyY - 14, 15, bodyY + 12);
    torsoGrad.addColorStop(0, '#1e293b');
    torsoGrad.addColorStop(0.5, '#0f172a');
    torsoGrad.addColorStop(1, '#020617');
    ctx.fillStyle = torsoGrad;
    ctx.strokeStyle = suitColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = suitColor;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(-14, bodyY - 12, 28, 24, [6, 6, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Cybernetic Muscle Conduit Lines on Chest
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-10, bodyY - 6);
    ctx.lineTo(-2, bodyY);
    ctx.lineTo(-2, bodyY + 8);
    ctx.moveTo(10, bodyY - 6);
    ctx.lineTo(2, bodyY);
    ctx.lineTo(2, bodyY + 8);
    ctx.stroke();

    // Pulsing Arc Reactor Core on Chest
    const corePulse = 3.5 + Math.sin(time * 8) * 1;
    const coreGrad = ctx.createRadialGradient(0, bodyY - 1, 0, 0, bodyY - 1, 6);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, accentColor);
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, bodyY - 1, corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Jet Thrusters on Backpack (with active plasma plumes during dash/overdrive)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-17, bodyY - 9, 4, 14);
    if (isDashing || p.overdriveTimer > 0 || isRunning) {
      const plumeLen = isDashing ? 22 + Math.random() * 8 : p.overdriveTimer > 0 ? 16 + Math.random() * 6 : 8;
      const plumeGrad = ctx.createLinearGradient(-17, bodyY - 2, -17 - plumeLen, bodyY - 2);
      plumeGrad.addColorStop(0, '#ffffff');
      plumeGrad.addColorStop(0.3, '#00FFD1');
      plumeGrad.addColorStop(0.8, '#FF00E5');
      plumeGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.moveTo(-17, bodyY - 8);
      ctx.lineTo(-17 - plumeLen, bodyY - 2);
      ctx.lineTo(-17, bodyY + 4);
      ctx.closePath();
      ctx.fill();
    }

    // D. Cybernetic Helmet & Visor HUD
    const helmGrad = ctx.createLinearGradient(0, bodyY - 28, 8, bodyY - 10);
    helmGrad.addColorStop(0, '#1e293b');
    helmGrad.addColorStop(0.7, '#090d16');
    helmGrad.addColorStop(1, '#020617');
    ctx.fillStyle = helmGrad;
    ctx.strokeStyle = suitColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(4, bodyY - 19, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Luminous Cyber Visor with Active Scanline
    const visorGrad = ctx.createLinearGradient(4, bodyY - 22, 14, bodyY - 16);
    visorGrad.addColorStop(0, '#ffffff');
    visorGrad.addColorStop(0.4, accentColor);
    visorGrad.addColorStop(1, suitColor);
    ctx.fillStyle = visorGrad;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(4, bodyY - 22, 10, 6, 2);
    ctx.fill();

    // Visor Scanline Sweep
    const scanX = 5 + (Math.sin(time * 12) * 0.5 + 0.5) * 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(scanX, bodyY - 22, 1.5, 6);
    ctx.restore();

    // E. Arms & Animated Weapon Systems
    ctx.save();
    ctx.globalAlpha = p.invulnerableTimer > 0 && Math.sin(time * 25) > 0 ? 0.35 : 1.0;

    if (isSlashing) {
      // Slashing Stance: Forearm extended forward with dynamic swing
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2, bodyY - 2);
      ctx.lineTo(20, bodyY - 10);
      ctx.stroke();

      // Slashing Energy Arc Trail (180-degree plasma crescent)
      const slashAngle = (p.slashTimer / 0.28) * Math.PI;
      const bladeLen = 42;
      const bladeEndX = 20 + Math.cos(-0.4 + slashAngle * 0.5) * bladeLen;
      const bladeEndY = bodyY - 10 + Math.sin(-0.4 + slashAngle * 0.5) * bladeLen;

      // Outer Plasma Energy Glow
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(20, bodyY - 10);
      ctx.lineTo(bladeEndX, bladeEndY);
      ctx.stroke();

      // Inner Laser Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(20, bodyY - 10);
      ctx.lineTo(bladeEndX, bladeEndY);
      ctx.stroke();

      // Plasma Sparks at Blade Tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bladeEndX, bladeEndY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (isShooting) {
      // Shooting Blaster Stance: Recoil animation
      const recoil = 3 * Math.sin(time * 20);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2, bodyY - 2);
      ctx.lineTo(18 - recoil, bodyY - 4);
      ctx.stroke();

      // Heavy Plasma Rail-Blaster
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 1.8;
      ctx.fillRect(16 - recoil, bodyY - 8, 16, 8);
      ctx.strokeRect(16 - recoil, bodyY - 8, 16, 8);

      // Targeting Laser Guide Line
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(32 - recoil, bodyY - 4);
      ctx.lineTo(180, bodyY - 4);
      ctx.stroke();
      ctx.setLineDash([]);

      // Muzzle Flash Blast Core
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32 - recoil, bodyY - 4, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle Ring
      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32 - recoil, bodyY - 4, 11, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Idle / Running: Sheathed Plasma Katana along back
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-10, bodyY + 14);
      ctx.lineTo(-24, bodyY - 22);
      ctx.stroke();

      // Glowing Katana Hilt & Edge
      ctx.strokeStyle = suitColor;
      ctx.shadowColor = suitColor;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, bodyY + 6);
      ctx.lineTo(-24, bodyY - 22);
      ctx.stroke();

      // Idle Arm Stance
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, bodyY - 2);
      ctx.lineTo(8, bodyY + 8);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // Restore facing flip

    // 3. Matrix Shield Hexagon Bubble
    if (p.hasShield || p.shieldHitAnim > 0) {
      ctx.save();
      const shieldAlpha = p.shieldHitAnim > 0 ? p.shieldHitAnim / 25 : 0.75 + Math.sin(Date.now() * 0.008) * 0.2;
      ctx.globalAlpha = shieldAlpha;
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00FFD1';
      ctx.fillStyle = 'rgba(0, 255, 209, 0.15)';
      ctx.lineWidth = 2.5;

      const r = p.radius + 16;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = r * Math.cos(a);
        const hy = r * Math.sin(a);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Overdrive Lightning Aura
    if (p.overdriveTimer > 0) {
      ctx.save();
      ctx.shadowColor = '#FF00E5';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#FF00E5';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = p.radius + 10 + Math.random() * 18;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // --- 6. PROJECTILES & SLASH ARCS RENDERERS ---

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const bolt of this.projectiles) {
      ctx.save();

      // Motion Blur Trail
      if (bolt.trail.length > 1) {
        ctx.strokeStyle = bolt.color;
        ctx.lineWidth = bolt.radius * 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(bolt.trail[0].x, bolt.trail[0].y);
        for (let t = 1; t < bolt.trail.length; t++) {
          ctx.lineTo(bolt.trail[t].x, bolt.trail[t].y);
        }
        ctx.stroke();
      }

      // Energy Bolt Core
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = bolt.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bolt.position.x, bolt.position.y, bolt.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Plasma Ring
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bolt.position.x, bolt.position.y, bolt.radius + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderSlashArcs(ctx: CanvasRenderingContext2D) {
    for (const arc of this.slashArcs) {
      ctx.save();
      ctx.translate(arc.position.x, arc.position.y);
      ctx.globalAlpha = arc.alpha;

      const isRight = arc.facing === 'RIGHT';
      const startAngle = isRight ? -Math.PI * 0.45 : Math.PI * 0.55;
      const endAngle = isRight ? Math.PI * 0.45 : Math.PI * 1.45;

      // Outer Glowing Arc
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, arc.radius, startAngle, endAngle);
      ctx.stroke();

      // Inner White Hot Energy Arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, arc.radius, startAngle, endAngle);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D) {
    for (const item of this.proceduralMap.activeCollectibles) {
      if (item.collected) continue;

      if (item.type === 'METALLIC_GOLD') {
        renderMetallicGoldCoin(ctx, item, this.player.position);
      } else if (item.type === 'CASH_STACK') {
        renderPhysicalCashStack(ctx, item, this.player.position);
      } else if (item.type === 'BLOOD_PLASMA_CELL') {
        renderBloodPlasmaCell(ctx, item, this.player.position);
      } else if (item.type === 'ENCRYPTED_BIO_CORE') {
        renderEncryptedBioCore(ctx, item, this.player.position);
      } else {
        ctx.save();
        ctx.translate(item.position.x, item.position.y);

        const bob = Math.sin(item.animTimer) * 4;
        ctx.shadowColor = item.glowColor;
        ctx.shadowBlur = 14;

        if (item.type === 'DATA_CHIP') {
          ctx.rotate(item.animTimer * 0.8);
          ctx.fillStyle = '#00FFD1';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -10 + bob);
          ctx.lineTo(10, 0 + bob);
          ctx.lineTo(0, 10 + bob);
          ctx.lineTo(-10, 0 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (item.type === 'OVERDRIVE_CELL') {
          ctx.rotate(item.animTimer * 1.2);
          ctx.fillStyle = '#FF00E5';
          ctx.shadowColor = '#FF00E5';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, bob, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "Orbitron", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', 0, 4 + bob);
        } else if (item.type === 'SHIELD_NODE') {
          ctx.strokeStyle = '#00FFD1';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = 'rgba(0, 255, 209, 0.2)';
          ctx.beginPath();
          ctx.arc(0, bob, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#00FFD1';
          ctx.fillRect(-4, -4 + bob, 8, 8);
        } else if (item.type === 'CHRONO_CRYSTAL') {
          ctx.rotate(-item.animTimer);
          ctx.fillStyle = '#00FF66';
          ctx.fillRect(-8, -8 + bob, 16, 16);
        }

        ctx.restore();
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.position.x - p.size / 2, p.position.y - p.size / 2, p.size, p.size * 1.5);
      } else if (p.shape === 'square') {
        ctx.fillRect(p.position.x - p.size / 2, p.position.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    // Purged messy floating text popups to keep view clear and unobstructed
  }

  private renderRain(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.strokeStyle = '#00FFD1';
    ctx.lineWidth = 1.2;

    for (const r of this.rainParticles) {
      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + Math.tan(r.angle) * r.length, r.y + r.length);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderSpeedLines(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 229, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      const len = 40 + Math.random() * 80;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(this.player.angle) * len, sy + Math.sin(this.player.angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderRadarMinimap(ctx: CanvasRenderingContext2D, W: number, _H: number) {
    const mapSize = Math.min(104, Math.max(88, W * 0.12));
    const mapX = 16;
    const mapY = 16;
    const centerX = mapX + mapSize / 2;
    const centerY = mapY + mapSize / 2;
    const radius = mapSize / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(6, 3, 18, 0.92)';
    ctx.strokeStyle = '#00FFD1';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Radar Sweeper Beam
    const radarAngle = (Date.now() * 0.0028) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 209, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(radarAngle) * (radius - 2),
      centerY + Math.sin(radarAngle) * (radius - 2)
    );
    ctx.stroke();

    // Concentric Range Rings & Crosshairs
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 209, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, radius * 0.78, 0, Math.PI * 2);
    ctx.moveTo(centerX - radius + 4, centerY);
    ctx.lineTo(centerX + radius - 4, centerY);
    ctx.moveTo(centerX, centerY - radius + 4);
    ctx.lineTo(centerX, centerY + radius - 4);
    ctx.stroke();

    // Compass Ticks
    ctx.font = 'bold 8px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF00E5';
    ctx.fillText('N', centerX, centerY - radius + 9);
    ctx.fillStyle = 'rgba(0, 255, 209, 0.7)';
    ctx.fillText('S', centerX, centerY + radius - 8);
    ctx.fillText('W', centerX - radius + 8, centerY);
    ctx.fillText('E', centerX + radius - 8, centerY);

    // Player Pip at Center (with facing indicator)
    ctx.fillStyle = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    const facingAngle = this.player.facingDirection === 'RIGHT' ? 0 : Math.PI;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(facingAngle) * 8, centerY + Math.sin(facingAngle) * 8);
    ctx.stroke();

    // Terminals, Exit Portals & Dynamic Mutated Bacteria on Radar
    const radarScale = 0.045;
    for (const ent of this.proceduralMap.activeTerminals) {
      if (!ent.active) continue;
      const relX = (ent.position.x - this.player.position.x) * radarScale;
      const relY = (ent.position.y - this.player.position.y) * radarScale;
      const distFromCenter = Math.hypot(relX, relY);

      if (distFromCenter < radius - 4) {
        const px = centerX + relX;
        const py = centerY + relY;

        if (ent.type === 'CYBER_EXIT_PORTAL') {
          ctx.fillStyle = this.objectiveState.portalUnlocked ? '#00FF66' : '#FF0055';
          ctx.shadowColor = this.objectiveState.portalUnlocked ? '#00FF66' : '#FF0055';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.type === 'MUTATED_BACTERIA' && ent.bacteriaData) {
          const bac = ent.bacteriaData;

          // 1. Surrendered enemy (white waving pip)
          if (bac.surrendered || bac.state === 'SURRENDER') {
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#00FFD1';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          // 2. Boss Organism (large red pulsing pip)
          else if (bac.isBoss || bac.variant === 'APEX_BOSS') {
            const pulse = 5 + Math.sin(Date.now() * 0.01) * 1.5;
            ctx.fillStyle = '#FF0055';
            ctx.shadowColor = '#FF0055';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(px, py, pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          // 3. Mission Target Elite (Gold / Amber diamond)
          else if (bac.variant === 'MISSION_TARGET_ELITE') {
            ctx.fillStyle = '#FFAA00';
            ctx.shadowColor = '#FFAA00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(px, py - 4);
            ctx.lineTo(px + 4, py);
            ctx.lineTo(px, py + 4);
            ctx.lineTo(px - 4, py);
            ctx.closePath();
            ctx.fill();
          }
          // 4. Stealth Stalker (dim purple pip)
          else if (bac.variant === 'STEALTH_STALKER') {
            ctx.fillStyle = '#9D00FF';
            ctx.shadowColor = '#9D00FF';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // 5. Standard variants
          else {
            let color = '#39FF14';
            if (bac.variant === 'TOXIC_SPITTER') color = '#FFE600';
            else if (bac.variant === 'CYBER_BRUTE') color = '#FF0055';

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Data Terminal
          ctx.fillStyle = '#00FF66';
          ctx.fillRect(px - 2, py - 2, 4, 4);
        }
      }
    }

    // Encrypted Bio-Cores on Radar
    for (const item of this.proceduralMap.activeCollectibles) {
      if (item.collected || item.type !== 'ENCRYPTED_BIO_CORE') continue;
      const relX = (item.position.x - this.player.position.x) * radarScale;
      const relY = (item.position.y - this.player.position.y) * radarScale;
      if (Math.hypot(relX, relY) < radius - 4) {
        const cx = centerX + relX;
        const cy = centerY + relY;
        ctx.fillStyle = '#00FFD1';
        ctx.shadowColor = '#00FFD1';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 3.5);
        ctx.lineTo(cx + 3.5, cy);
        ctx.lineTo(cx, cy + 3.5);
        ctx.lineTo(cx - 3.5, cy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Header tag
    ctx.fillStyle = 'rgba(0, 255, 209, 0.85)';
    ctx.font = '900 7px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR // 360°', centerX, mapY - 4);

    ctx.restore();
  }

  public toggleCrouch(forceState?: boolean): boolean {
    this.player.isCrouching = forceState !== undefined ? forceState : !this.player.isCrouching;
    if (this.player.isCrouching) {
      sound.playSlide();
      const comboEval = proCombatAI.evaluateDynamicComboInput('ACTION_KEY', 'TACTICAL CROUCH', '🛡️');
      this.addFloatingText(this.player.position.x, this.player.position.y - 25, 'CROUCH // SILENT MODE', '#00FFD1');
      if (comboEval.feedbackBanner) {
        this.addFloatingText(this.player.position.x, this.player.position.y - 58, comboEval.feedbackBanner, comboEval.feedbackColor);
      }
    }
    return this.player.isCrouching;
  }

  public toggleCover(forceState?: boolean): boolean {
    this.player.isCovered = forceState !== undefined ? forceState : !this.player.isCovered;
    if (this.player.isCovered) {
      sound.playPowerup();
      const comboEval = proCombatAI.evaluateDynamicComboInput('ACTION_KEY', 'WALL COVER', '🧱');
      this.addFloatingText(this.player.position.x, this.player.position.y - 25, 'TAKEDOWN STANCE // IN COVER', '#0055FF');
      if (comboEval.feedbackBanner) {
        this.addFloatingText(this.player.position.x, this.player.position.y - 58, comboEval.feedbackBanner, comboEval.feedbackColor);
      }
    }
    return this.player.isCovered;
  }

  public handleStealthTakedown(): boolean {
    // Search for closest eligible enemy with canStealthKill flag within 95px
    let closestTarget: { ent: WorldEntity; bac: EnemyBacteria; dist: number } | null = null;

    for (const ent of this.proceduralMap.activeTerminals) {
      if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
      const bac = ent.bacteriaData;
      if (bac.canStealthKill) {
        const d = Math.hypot(ent.position.x - this.player.position.x, ent.position.y - this.player.position.y);
        if (d < 95 && (!closestTarget || d < closestTarget.dist)) {
          closestTarget = { ent, bac, dist: d };
        }
      }
    }

    if (closestTarget) {
      const { ent, bac } = closestTarget;
      // Execute Instant Silent Assassination Takedown!
      bac.health = 0;
      sound.playCritical();
      this.triggerHitstop(65);
      this.applyDirectionalScreenShake(24, this.player.angle);
      
      // Visceral stealth plasma burst
      this.flyingSplatters.push(
        ...spawnSplatterBurst(ent.position.x, ent.position.y, '#FF00E5', '#00FFD1', 35, this.player.angle, 12)
      );
      this.createExplosion(ent.position.x, ent.position.y, '#FF00E5', 30);
      this.createPulseWave(ent.position.x, ent.position.y, '#00FFD1');

      this.score += 2500;
      this.comboCount += 5;
      this.comboMultiplier = Math.min(12, this.comboMultiplier + 2);
      this.comboTimer = 350;

      this.addFloatingText(
        ent.position.x,
        ent.position.y - 35,
        '⚡ SILENT STEALTH ASSASSINATION! +2500',
        '#00FFD1'
      );

      const comboEval = proCombatAI.evaluateDynamicComboInput('ACTION_KEY', 'STEALTH ASSASSIN', '🎯');
      if (comboEval.feedbackBanner) {
        this.addFloatingText(this.player.position.x, this.player.position.y - 58, comboEval.feedbackBanner, comboEval.feedbackColor);
      }

      dailyMissionManager.reportProgress('STEALTH_ASSASSIN', 1);
      this.handleEnemyDefeat(ent, bac, this.player.angle);
      return true;
    }

    // Fallback to normal slash if no stealth target
    this.handleSlash();
    return false;
  }

  public getRadarTelemetry(): RadarTelemetryData {
    const facingAngle =
      this.player.angle !== undefined
        ? this.player.angle
        : this.player.facingDirection === 'RIGHT'
        ? 0
        : Math.PI;

    // Find if any enemy is currently eligible for stealth kill
    let stealthTargetId: string | null = null;
    for (const ent of this.proceduralMap.activeTerminals) {
      if (ent.active && ent.type === 'MUTATED_BACTERIA' && ent.bacteriaData?.canStealthKill) {
        const d = Math.hypot(ent.position.x - this.player.position.x, ent.position.y - this.player.position.y);
        if (d < 95) {
          stealthTargetId = ent.id;
          break;
        }
      }
    }

    return {
      player: {
        x: this.player.position.x,
        y: this.player.position.y,
        facingAngle,
        isCrouching: this.player.isCrouching,
        isCovered: this.player.isCovered,
        noiseLevel: this.player.noiseLevel || 0.05,
        stealthTargetId,
        flashlightJammedTimer: this.player.flashlightJammedTimer,
      },
      portalUnlocked: this.objectiveState.portalUnlocked,
      entities: this.proceduralMap.activeTerminals
        .filter((e) => e.active)
        .map((e) => ({
          id: e.id,
          type: e.type,
          x: e.position.x,
          y: e.position.y,
          variant: e.bacteriaData?.variant,
          isBoss: e.bacteriaData?.isBoss || e.bacteriaData?.variant === 'APEX_BOSS',
          surrendered: e.bacteriaData?.surrendered || e.bacteriaData?.state === 'SURRENDER',
          facingAngle: e.bacteriaData?.facingAngle !== undefined ? e.bacteriaData.facingAngle : (e.bacteriaData?.facing === 'RIGHT' ? 0 : Math.PI),
          visionFov: e.bacteriaData?.visionFov || (Math.PI / 2.8),
          visionRange: e.bacteriaData?.visionRange || 280,
          alertness: e.bacteriaData?.alertness || 0,
          state: e.bacteriaData?.state,
          canStealthKill: !!e.bacteriaData?.canStealthKill,
        })),
      obstacles: this.proceduralMap.activeObstacles.map((obs) => ({
        x: obs.bounds.x,
        y: obs.bounds.y,
        width: obs.bounds.width,
        height: obs.bounds.height,
      })),
      collectibles: this.proceduralMap.activeCollectibles
        .filter((c) => !c.collected && c.type === 'ENCRYPTED_BIO_CORE')
        .map((c) => ({
          x: c.position.x,
          y: c.position.y,
          type: c.type,
          collected: c.collected,
        })),
    };
  }
}
