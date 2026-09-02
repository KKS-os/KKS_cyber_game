// ============================================================================
// 2D SIDE-SCROLLING ACTION-ADVENTURE PHYSICS & CYBERPUNK WORLD ARCHITECTURE
// (Advanced multi-directional movement, combat matrix, and vertical map tiers)
// ============================================================================

// --- 1. PLAYER PHYSICS & MOBILITY ENGINE ---

export type MovementState = 
  | 'IDLE'
  | 'RUNNING'
  | 'AIRBORNE'
  | 'JUMP_ASCENDING'
  | 'JUMP_APEX'
  | 'FALLING'
  | 'WALL_SLIDING'
  | 'WALL_JUMPING'
  | 'SLIDING'
  | 'DUCKING'
  | 'PLATFORM_DROPPING'
  | 'DASHING'
  | 'LADDER_CLIMBING'
  | 'LEDGE_GRABBING'
  | 'HARD_LANDING'
  | 'STAGGERED';

export type WallTouchSide = 'LEFT' | 'RIGHT' | 'NONE';

export interface GroundRaycastResult {
  isGrounded: boolean;
  groundSurfaceNormal: Vector2D;
  groundSlopeAngle: number;
  standingOnPlatformId?: string;
  isOneWayPlatform: boolean;
}

export interface WallRaycastResult {
  touchingWall: boolean;
  wallSide: WallTouchSide;
  wallSurfaceFriction: number;
  wallNormal: Vector2D;
}

export interface VariableJumpConfig {
  minJumpHeight: number;       // Cut-off jump height on early button release (e.g., 32px)
  maxJumpHeight: number;       // Full-hold jump apex (e.g., 140px)
  jumpApexGravityMultiplier: number; // Low gravity sweet-spot at the crest of a jump (e.g. 0.45x)
  jumpBufferWindowMs: number;  // Input queue buffer before touching ground (e.g. 150ms)
  coyoteTimeMs: number;        // Grace period after stepping off a ledge (e.g. 120ms)
  jumpCutOffRate: number;      // Downward velocity multiplier when releasing jump key early (e.g. 0.5x)
}

export interface DoubleJumpState {
  hasDoubleJumpUnlocked: boolean;
  maxAirJumps: number;         // Usually 1 for double-jump, 2+ for cybernetic upgrades
  currentAirJumpsRemaining: number;
  doubleJumpForce: number;     // Vertical impulse (e.g., -14.5 m/s)
  horizontalBoostFactor: number; // Directional momentum redirection
  fxBurstColor: string;
}

export interface WallInteractionPhysics {
  wallSlideVelocityMax: number;// Terminal velocity during wall grip/slide (e.g. 2.5 m/s)
  wallSlideFriction: number;   // Deceleration rate on wall contact
  wallJumpKickImpulse: Vector2D;// [x: 12.0, y: -13.5] horizontal push + vertical pop
  wallStickTimeMs: number;     // Stickiness latch time to prevent accidental detachment (e.g. 80ms)
  wallJumpControlLockMs: number;// Brief horizontal input lock to preserve arc momentum (e.g. 120ms)
}

export interface DuckAndSlidePhysics {
  isDucking: boolean;
  isSliding: boolean;
  duckHitboxScale: { width: number; height: number }; // E.g., { width: 1.0, height: 0.5 }
  slideInitialBoost: number;   // Burst speed when initiating slide (e.g. 18.0 m/s)
  slideFrictionRate: number;   // Rate slide speed bleeds off
  slideDurationMs: number;     // Max continuous slide time (e.g. 450ms)
  slideCooldownMs: number;     // Cooldown between combat slides
  slideInvulnerabilityFrames: number; // I-frames during low slide
  canCancelIntoJump: boolean;  // Slide-jump momentum preservation
}

export interface PlatformDropDownState {
  isDroppingThrough: boolean;
  dropIgnoredPlatformId: string | null;
  dropCooldownMs: number;      // Duration platform collision is temporarily masked (e.g. 220ms)
  dropAccelerationFactor: number; // Slight downward burst on drop (e.g. 1.2x)
}

export interface InertiaFrictionModel {
  groundAcceleration: number;  // Smooth ramp-up to top speed
  groundFriction: number;      // Deceleration when no movement input is pressed
  airAcceleration: number;     // Directional control in mid-air
  airDrag: number;             // Horizontal air resistance
  gravity: number;             // Standard gravity pull (e.g. 32.0 m/s^2)
  terminalVelocity: number;    // Max falling speed clamp (e.g. 28.0 m/s)
  slopeAdhesionFactor: number; // Prevents hopping when running downhill
}

export interface PlayerPhysics {
  // Positional & Dynamic Vectors
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  residualMomentum: Vector2D;

  // Active State Machine
  movementState: MovementState;
  facingDirection: 'LEFT' | 'RIGHT';
  lookAngle: number;           // Aiming reticle / cyber-arm aim direction in radians

  // Physics Sub-Systems
  inertia: InertiaFrictionModel;
  jumpConfig: VariableJumpConfig;
  doubleJump: DoubleJumpState;
  wallPhysics: WallInteractionPhysics;
  slidePhysics: DuckAndSlidePhysics;
  platformDrop: PlatformDropDownState;

  // Collision & Environment Sensing
  groundCheck: GroundRaycastResult;
  wallCheck: WallRaycastResult;
  ceilingCheck: { isCeilingColliding: boolean; ceilingSurfaceType?: string };

  // Timers & State Latches
  coyoteTimerMs: number;
  jumpBufferTimerMs: number;
  wallStickTimerMs: number;
  inputLockTimerMs: number;
  invincibilityTimerMs: number;
}

// --- 2. REALISTIC CHARACTER ENTITY & COMBAT ARCHITECTURE ---

export type FacingDirection = 'LEFT' | 'RIGHT';

export type DamageType = 
  | 'PHYSICAL_BALLISTIC'
  | 'PLASMA_THERMAL'
  | 'EMP_ELECTRICAL'
  | 'CORROSIVE_ACID'
  | 'CRITICAL_NANITE'
  | 'PURE_TRUE_DAMAGE';

export interface HealthPool {
  currentHP: number;
  maxHP: number;
  tempShieldHP: number;
  maxTempShieldHP: number;
  hpRegenRatePerSec: number;
  regenDelayTimerMs: number;
  isDead: boolean;
  deathAnimTimerMs: number;
}

export interface ArmorMatrix {
  baseArmorRating: number;         // Flat damage absorption
  ballisticResistancePct: number;  // 0.0 to 1.0 (e.g., 0.35 = 35% damage reduction)
  plasmaResistancePct: number;
  empResistancePct: number;
  corrosiveResistancePct: number;
  poiseRating: number;             // Resistance to stagger/flinch
  currentPoise: number;
  poiseRegenRatePerSec: number;
  isPoiseBroken: boolean;
  shieldRechargeDelayMs: number;
  shieldRechargeRatePerSec: number;
}

export interface ParticleTrailEmitter {
  emitterId: string;
  enabled: boolean;
  emissionRatePerSec: number;      // Spawn frequency (e.g. 45 particles/sec)
  particleLifetimeMs: number;      // How long each ghosting trail lasts (e.g. 280ms)
  spawnOffset: Vector2D;           // Position relative to entity origin
  inheritedVelocityRatio: number;  // Percentage of entity velocity given to particle (e.g. 0.2)
  startColor: string;              // Cyber neon hex/rgba
  endColor: string;
  startScale: number;
  endScale: number;
  startAlpha: number;
  endAlpha: number;
  blendMode: 'source-over' | 'lighter' | 'screen' | 'overlay';
  shape: 'afterimage_silhouette' | 'cyber_dash_spark' | 'smoke_vapor' | 'plasma_ribbon';
  lastEmitTimestamp: number;
}

export interface RealisticEntity {
  id: string;
  entityName: string;
  faction: 'PLAYER' | 'CYBER_OPERATIVE' | 'CORPORATE_ENFORCER' | 'SYNTH_DROID' | 'NEUTRAL_NPC';
  
  // Spatial Coordinates & Dimensions
  position: Vector2D;
  velocity: Vector2D;
  facing: FacingDirection;
  boundingBox: BoundingBox;
  centerMassOffset: Vector2D;

  // Combat, Defense & Vitals
  vitals: HealthPool;
  armor: ArmorMatrix;

  // Visual Effects & Particle Emitters
  trailEmitter: ParticleTrailEmitter;
  statusEffects: Array<{
    type: 'EMP_STUN' | 'PLASMA_BURN' | 'OVERDRIVE_SPEED' | 'SHIELD_OVERCHARGE';
    durationMs: number;
    intensity: number;
    tintColor: string;
  }>;

  // Animation & Rendering
  currentAnimationKey: string;
  animationFrameIndex: number;
  animationTickMs: number;
  glowColor: string;
  elevationZIndex: number;
}

// --- 3. MULTI-LAYER 2D MAP ARCHITECTURE ---
// Vertical tiers, elevators, ladders, one-way floors, and breakable secret walls

export type TileLayerType = 
  | 'BACKGROUND_PARALLAX_DISTANT'
  | 'BACKGROUND_ARCHITECTURE'
  | 'SOLID_TERRAIN_MAIN'
  | 'ONE_WAY_PLATFORMS'
  | 'HAZARD_OVERLAY'
  | 'FOREGROUND_DECOR_OCCLUSION';

export interface OneWayPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  thickness: number;               // Usually 6-12px top surface collision boundary
  materialType: 'METAL_GRATE' | 'NEON_LATTICE' | 'GLASS_CATWALK' | 'SCAFFOLDING';
  allowDropDown: boolean;          // True: S + Jump drops down through
  dropPassThroughTimeMs: number;
}

export interface ElevatorShaft {
  id: string;
  startX: number;
  startY: number;
  endY: number;                    // Top and bottom travel bounds
  cabinWidth: number;
  cabinHeight: number;
  cabinY: number;                  // Current live position of moving cabin
  travelSpeed: number;             // E.g. 6.0 m/s
  state: 'MOVING_UP' | 'MOVING_DOWN' | 'STOPPED_AT_FLOOR' | 'CALL_PENDING';
  floorsServed: Array<{ floorIndex: number; heightY: number; name: string }>;
  currentFloorIndex: number;
  autoReturnToFloor?: number;
  callButtonPositions: Vector2D[];
}

export interface LadderClimbZone {
  id: string;
  x: number;
  topY: number;
  bottomY: number;
  width: number;
  climbSpeed: number;              // Vertical ascent/descent rate (e.g. 7.5 m/s)
  dismountTopY: number;
  dismountBottomY: number;
  ladderType: 'SERVICE_RUNGS' | 'WALL_PIPE_GRID' | 'ENERGY_LIFT_BEAM';
}

export interface BreakableSecretWall {
  id: string;
  bounds: BoundingBox;
  currentDurability: number;       // Breakable HP (e.g. 150)
  maxDurability: number;
  requiredWeaponType?: 'HEAVY_MELEE' | 'EXPLOSIVE_GRENADE' | 'PLASMA_BLAST' | 'ANY';
  crumbleParticleColor: string;
  isSecretRevealed: boolean;
  isBroken: boolean;
  revealedSecretRoomId: string;
  soundFxOnBreak: string;
  decorOverlayType: 'CRACKED_CONCRETE' | 'LOOSE_VENT_GRATE' | 'HOLOGRAPHIC_FALSE_WALL';
}

export interface VerticalFloorTier {
  tierIndex: number;               // 0 = Ground Level, 1 = Mezzanine, 2 = High Skyway, etc.
  name: string;                    // "Sub-Level 3: Cybernetics Lab"
  baseAltitudeY: number;
  ceilingAltitudeY: number;
  ambientLightColor: string;
  backgroundMusicTheme?: string;
  platforms: OneWayPlatform[];
  elevators: ElevatorShaft[];
  ladders: LadderClimbZone[];
  secretWalls: BreakableSecretWall[];
}

export interface MultiLayerChunk {
  chunkKey: string;
  chunkGridX: number;
  chunkGridY: number;
  pixelWidth: number;
  pixelHeight: number;
  verticalTiers: VerticalFloorTier[];
  collisionTileMatrix: Uint8Array; // 0 = Air, 1 = Solid Wall, 2 = One-Way Floor, 3 = Hazard Spike
  matrixCols: number;
  matrixRows: number;
  cellPixelSize: number;
}

export interface MultiLayerMap {
  mapId: string;
  worldName: string;
  biomeCategory: 'NEO_SECTOR_SLUMS' | 'CORP_SPIRE_TOWER' | 'SUBTERRANEAN_REACTOR' | 'INDUSTRIAL_UNDERBELLY';
  totalHorizontalChunks: number;
  totalVerticalChunks: number;
  chunkPixelDimension: { width: number; height: number };
  
  // Spatial Multi-Tier Chunks
  activeChunks: Map<string, MultiLayerChunk>;
  globalElevators: ElevatorShaft[];
  globalLadders: LadderClimbZone[];
  secretRoomsCatalog: Array<{
    roomId: string;
    roomName: string;
    bounds: BoundingBox;
    isDiscovered: boolean;
    rewardDescription: string;
  }>;

  // Parallax Layer Rendering Configuration
  parallaxLayers: Array<{
    layerType: TileLayerType;
    scrollSpeedRatioX: number;     // e.g. 0.2 for distant neon sky, 1.0 for player layer
    scrollSpeedRatioY: number;
    opacity: number;
    blurRadiusPx: number;
  }>;
}

// ============================================================================
// TOP-DOWN COMPATIBILITY INTERFACES
// ============================================================================

// Core Vector representation for multi-directional 2D physics
export interface Vector2D {
  x: number;
  y: number;
}

// 360-Degree Virtual Joystick Directional & Velocity Telemetry
export interface JoystickVelocity {
  x: number;
  y: number;
}

export interface JoystickData {
  velocity: JoystickVelocity;
  velocityArray: [number, number];
  angle: number; // Radian angle (-Math.PI to Math.PI)
  force: number; // Intensity (0.0 to 1.0)
}

// Active multi-directional player input states
export interface DirectionState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'SETTINGS' | 'MAP_VIEW' | 'STAGE_CLEAR' | 'GAME_VICTORY';

// Exotic Weapon Arsenal Definitions
export type WeaponType = 
  | 'PLASMA_BLASTER' 
  | 'SPREAD_CANNON' 
  | 'LIGHTNING_CHAIN' 
  | 'HOMING_MISSILES' 
  | 'QUANTUM_VORTEX';

export interface WeaponInfo {
  type: WeaponType;
  name: string;
  shortName: string;
  icon: string;
  damage: number;
  energyCost: number;
  cooldownFrames: number;
  color: string;
  accentColor: string;
  description: string;
  unlocked: boolean;
  level: number;
  partsCollected: number;
  partsRequired: number;
}

export type PlayerActionState = 
  | 'IDLE' 
  | 'WALKING' 
  | 'RUNNING' 
  | 'CROUCHING'
  | 'COVER'
  | 'STEALTH_TAKEDOWN'
  | 'DASHING' 
  | 'SLASHING' 
  | 'SHOOTING' 
  | 'SLIDING' 
  | 'JUMPING' 
  | 'HACKING' 
  | 'OVERDRIVE'
  | 'FALLING_INTO_VOID';

// Top-down 360-degree Cyberpunk Player Interface
export interface Player {
  // Multi-directional Vectors
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;

  // 360-degree Angular Rotation & Facing Direction
  angle: number;
  facingDirection: 'LEFT' | 'RIGHT';

  // Tactical Stealth Mechanics
  isCrouching: boolean;
  isCovered: boolean;
  noiseLevel: number; // 0 (Silent/Crouch) to 100 (Sprint/Blast)
  stealthTargetEnemyId?: string | null;
  stealthKillsCount: number;

  // Movement & Physics parameters
  maxSpeed: number;
  baseSpeed: number;
  dashSpeed: number;
  diagonalFactor: number; // Normalization factor for diagonal traversal (typically Math.SQRT1_2 ~0.7071)
  friction: number;
  rotationSpeed: number;

  // Active directional states
  directionalStates: DirectionState;
  actionState: PlayerActionState;

  // Combat & Action timers
  slashTimer: number;
  slashCombo: number;
  shootTimer: number;
  animTimer: number;
  animFrame: number;
  takedownAnimTimer?: number;

  // Abyss Falling States
  isFallingIntoAbyss?: boolean;
  fallingTimer?: number;

  // Dimensions & Hitbox
  radius: number;
  width: number;
  height: number;

  // Survival & Buffs
  integrity: number;
  maxIntegrity: number;
  energy: number;
  maxEnergy: number;
  hasShield: boolean;
  shieldHitAnim: number;
  overdriveTimer: number;
  chronoTimer: number;
  dashTimer: number;
  invulnerableTimer: number;
  flashlightJammedTimer: number; // When > 0, flashlight is jammed by enemy EMP blast
  hitStunTimer: number; // When > 0, player is frame-locked by enemy parry counter
  whiffRecoveryTimer: number; // When > 0, player is in vulnerable recovery after a missed swing
  blindedTimer: number; // When > 0, player vision is disoriented from trap decoy detonation

  // Motion Trails / Afterimages
  afterimages: Array<{
    position: Vector2D;
    angle: number;
    alpha: number;
    color: string;
    width: number;
    height: number;
  }>;
}

// Tile types for Cyberpunk City districts
export type TileType = 
  | 'ASPHALT_ROAD'
  | 'NEON_SIDEWALK'
  | 'CYBER_BUILDING'
  | 'HOLOGRAM_PLAZA'
  | 'TECH_GRID'
  | 'DATA_STREAM'
  | 'ALLEYWAY'
  | 'BARRIER_WALL'
  | 'BROKEN_FLOOR'
  | 'CHASM_VOID';

export interface Tile {
  type: TileType;
  walkable: boolean;
  isPitHazard?: boolean;
  crackSeed?: number;
  color: string;
  glowColor?: string;
  elevation?: number;
  decorType?: string;
}

// Axis-Aligned Bounding Box (AABB)
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 4-Sided Collision Resolution Result
export type CollisionSide = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'NONE';

export interface CollisionResult {
  collided: boolean;
  side: CollisionSide;
  penetration: number;
  resolvedPosition: Vector2D;
  obstacleId?: string;
}

// Grid Hazard: Pulsing Cyber Laser Beam
export type LaserState = 'OFF' | 'CHARGING' | 'FIRING';

export interface LaserHazard {
  id: string;
  chunkKey: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  orientation: 'HORIZONTAL' | 'VERTICAL' | 'ROTATING';
  state: LaserState;
  cycleTimer: number;
  chargeTime: number;
  fireTime: number;
  offTime: number;
  color: string;
  damage: number;
  active: boolean;
  disabled: boolean; // Disabled when connected terminal is hacked
  rotationAngle?: number;
  rotationSpeed?: number;
}

// Neon Alleyway Decor & Environmental Atmosphere
export type AlleyDecorType = 'NEON_GRAFFITI' | 'STEAM_VENT' | 'NEON_PUDDLE' | 'POWER_CONDUIT' | 'CYBER_CRATE';

export interface AlleywayDecor {
  id: string;
  chunkKey: string;
  type: AlleyDecorType;
  position: Vector2D;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  animTimer: number;
  active: boolean;
}

// Living Cyberpunk City Environment Props (Non-collidable, decorative layers)
export type EnvironmentPropType = 
  | 'CYBER_TREE'           // Digital holographic glowing tree with pulsing wireframe leaves
  | 'STREET_LIGHT'          // Sleek neon lamppost casting down-angled volumetric light cones
  | 'HOLO_BILLBOARD'       // Floating animated cyberpunk advertising hologram
  | 'GOLDEN_BILLBOARD'     // High-fidelity 3D Golden Neon Billboard (KKS, Cyber Game, Burma Batik)
  | 'ROOFTOP_HVAC'         // Industrial ventilation with spinning cyber fans
  | 'COMMS_ANTENNA'        // Tall spire with blinking warning beacons and radar array
  | 'COOLANT_PIPES'        // Glowing cybernetic pipes along platforms
  | 'SERVER_STACK';        // Micro server cabinet with flickering status LEDs

export type GoldenNeonBrand = 'KKS' | 'Cyber Game' | 'Burma Batik';
export type BillboardOrientation = 'HORIZONTAL_ROOFTOP' | 'VERTICAL_WALL_STRIP' | 'WALL_BANNER';

export interface GoldenBillboardData {
  brand: GoldenNeonBrand;
  title: string;
  subText?: string;
  tagline?: string;
  orientation: BillboardOrientation;
  glowColor: string; // Vibrant Glowing Gold #FFD700
  accentGlow: string; // Amber Gold #FFB900
  emissiveIntensity: number;
  scrollSpeed: number;
  pulsePhase: number;
  glitchTimer: number;
  hasPointLight?: boolean;
}

export interface CyberTreeBranch {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  depth: number;
  angle: number;
  length: number;
  leafNodes: Array<{ x: number; y: number; size: number; phase: number }>;
}

export interface CyberEnvironmentProp {
  id: string;
  chunkKey: string;
  type: EnvironmentPropType;
  position: Vector2D;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  accentColor: string;
  animPhase: number;
  animSpeed: number;
  rotation?: number;
  active: boolean;
  // Specific prop customization
  treeData?: {
    height: number;
    branches: CyberTreeBranch[];
    foliageColor: string;
    trunkColor: string;
    swaySpeed: number;
  };
  lightData?: {
    height: number;
    coneAngle: number;
    coneLength: number;
    intensity: number;
    flickerTimer: number;
    armDirection: 'LEFT' | 'RIGHT';
  };
  billboardData?: {
    text: string;
    subText?: string;
    hologramType: 'GLITCH' | 'CYBER_KANJI' | 'BRAND_LOGO' | 'BARCODE' | 'GOLDEN_BRAND';
    glitchTimer: number;
    goldenData?: GoldenBillboardData;
  };
  goldenBillboardData?: GoldenBillboardData;
  hvacData?: {
    fanSpeed: number;
    bladeAngle: number;
    steamInterval: number;
  };
  antennaData?: {
    height: number;
    dishAngle: number;
    beaconColor: string;
  };
}

// Solid Cyberpunk Building / Obstacle Bounding Box
export interface CyberObstacle {
  id: string;
  chunkKey: string;
  bounds: BoundingBox;
  color: string;
  glowColor: string;
  elevation: number;
  hasNeonTrim: boolean;
  active: boolean;
}

// Infinite Grid / Chunk Map Structure
export interface GridMapChunk {
  chunkX: number;
  chunkY: number;
  tileSize: number; // e.g., 50px or 62.5px
  chunkSize: number; // e.g., 20 or 16 tiles per chunk axis
  pixelSize: number; // e.g. 1000px
  worldX: number; // chunkX * pixelSize
  worldY: number; // chunkY * pixelSize
  tiles: Tile[][];
  entities: WorldEntity[];
  obstacles: CyberObstacle[];
  lasers: LaserHazard[];
  decor: AlleywayDecor[];
  props: CyberEnvironmentProp[];
  collectibles: Collectible[];
  discovered: boolean;
  biome: BiomeType;
}

// Top-Down & Side-Scrolling Camera with Zoom, Target Tracking & Dynamic Look-up/Look-down
export interface Camera2D {
  position: Vector2D;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  shake: number;
  targetOffset: Vector2D;
  lookVerticalOffset: number; // Dynamic panning offset for standing look up/down
  lookHoldTimer: number;      // Timer to latch gaze direction
  lookaheadX: number;         // Velocity lookahead for cinema framing
  lookaheadY: number;
}

// Interactive Open-World Entities
export type WorldEntityType = 
  | 'CYBER_DRONE' 
  | 'DATA_TERMINAL' 
  | 'SECURITY_TURRET' 
  | 'NEON_BILLBOARD' 
  | 'POWER_CONDUIT' 
  | 'LOOT_CACHE'
  | 'MUTATED_BACTERIA'
  | 'CYBER_EXIT_PORTAL';

export type BacteriaAIState = 
  | 'PATROL' 
  | 'SUSPICIOUS'
  | 'INVESTIGATING'
  | 'ALERT' 
  | 'CHASE' 
  | 'LEAP' 
  | 'DROP_DOWN' 
  | 'POUNCE' 
  | 'STAGGER'
  | 'SURRENDER'
  | 'BOSS_SPECIAL_ATTACK'
  | 'GHOST_AMBUSH'
  | 'PANIC_FLEE'
  | 'TACTICAL_RETREAT'
  | 'AMBUSH_FLANK'
  | 'GLITCH_DASH'
  | 'CHARGE_ATTACK'
  | 'EMP_CHARGE'
  | 'ADAPTIVE_EVASION_A' // Side Strafe Dash Mix-up
  | 'ADAPTIVE_EVASION_B' // Duck & Under-Roll Flank
  | 'ADAPTIVE_EVASION_C' // Tactical Smoke & Decoy Split
  | 'ADAPTIVE_EVASION_D' // Frame-Perfect Parry Stance
  | 'VAULT_PLUNGE_SLAM' // Plunging Aerial Counter Attack
  | 'PIT_RANGED_ATTACK' // Ranged bacterial acid splash attack when separated by pit hazard
  | 'PIT_AVOID_NAV'; // Steer around explosion crater rim on solid ground

export type BacteriaVariant = 
  | 'MUTATED_ORGANIC'
  | 'STEALTH_STALKER'
  | 'TOXIC_SPITTER'
  | 'CYBER_BRUTE'
  | 'MISSION_TARGET_ELITE'
  | 'APEX_BOSS';

export interface BacteriaTentacle {
  baseAngle: number;
  length: number;
  segments: number;
  waveSpeed: number;
  waveAmplitude: number;
  phaseOffset: number;
  color: string;
}

export interface EnemyBacteria {
  id: string;
  variant: BacteriaVariant;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  baseRadius: number;
  health: number;
  maxHealth: number;
  active: boolean;
  pulsePhase: number;
  pulseSpeed: number;
  wobbleAmount: number;
  membraneAlpha: number;
  membraneColor: string;
  cytoplasmColor: string;
  nucleusColor: string;
  nucleusOffset: Vector2D;
  tentacles: BacteriaTentacle[];
  organelles: Array<{ x: number; y: number; r: number; color: string; pulseOffset: number }>;
  toxicBubbleTimer: number;
  hitStaggerTimer: number;
  facing: 'LEFT' | 'RIGHT';
  state: BacteriaAIState;
  
  // Tactical Stealth & Sight-Cone Parameters
  facingAngle: number; // Radian direction enemy is looking
  visionFov: number;   // Field of view in radians (e.g. 70 deg ~1.22 rad)
  visionRange: number; // Sight distance in pixels (e.g. 260 - 340)
  alertness: number;   // 0 (Unaware) to 100 (Full Combat Alert)
  suspicionPos?: Vector2D | null;
  patrolWaitTimer?: number;
  scanSweepAngle?: number;
  canStealthKill?: boolean; // True when player is sneaking behind in takedown range

  // Advanced AI Director parameters
  detectionRadius: number;
  jumpCooldown: number;
  leapTimer: number;
  patrolTimer: number;
  patrolDir: number;
  alertTimer: number;
  pounceTimer: number;
  onGround: boolean;
  losDetected: boolean;
  targetPos?: Vector2D;
  // Surrender & Special Abilities
  surrendered?: boolean;
  surrenderTimer?: number;
  surrenderChance?: number;
  stealthAlpha?: number;
  projectileCooldown?: number;
  isMissionTarget?: boolean;
  isBoss?: boolean;
  bossPhase?: number;
  maxBossPhases?: number;
  shield?: number;
  maxShield?: number;
  enrageTimer?: number;
  summonMinionTimer?: number;
  laserSweepAngle?: number;
  dropWeaponType?: WeaponType;
  // Ghost Glitch & Ambush Mechanics
  ghostPhase?: 'IDLE' | 'GLITCHING' | 'VANISHED' | 'MANIFESTING';
  ghostGlitchTimer?: number;
  ghostCooldown?: number;
  ghostGlitchIntensity?: number;
  // Panic & Flee Mechanics
  panicTimer?: number;
  panicSpeed?: number;
  // Tactical Retreat & Flank Mechanics
  retreatTimer?: number;
  coverTargetPos?: Vector2D | null;
  flankTimer?: number;
  // Glitch Dash & Direct Counter
  counterCooldown?: number;
  glitchDashTimer?: number;
  chargeTimer?: number;
  chargeVector?: Vector2D;
  // Pro-Level Adaptive Evasion Mechanics
  evasionType?: 'A' | 'B' | 'C' | 'D';
  evasionTimer?: number;
  evasionDuckFrames?: number; // Invulnerable to high attacks
  evasionMixupChained?: boolean; // Second chained dash for Type A
  parryWindowTimer?: number; // 0.2s parry active window (12 frames)
  parryStanceFlash?: number;
  vaultTimer?: number;
  vaultStartPos?: Vector2D;
  vaultTargetPos?: Vector2D;
  frameCancelCooldown?: number;
  isExplosiveDecoy?: boolean;
  // Neon Clone System
  isCloneDecoy?: boolean;
  hasCloned?: boolean;
  cloneFlashTimer?: number;
  // Flashlight Jamming EMP Blast
  flashlightExposureTimer?: number;
  empChargeTimer?: number;
  empCooldown?: number;
  // Pit Hazard & Crater Navigation / Ranged Bio-Attack
  pitAttackCooldown?: number;
  pitNavAngle?: number;
  pitBlockedPlayer?: boolean;
}

export interface BossState {
  active: boolean;
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  phase: number;
  maxPhases: number;
  enraged: boolean;
  position?: Vector2D;
}

// Permanent Blood/Plasma Splatter Decal adhered to world surfaces
export interface SplatterDecal {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  coreColor: string;
  drips: Array<{ angle: number; length: number; width: number }>;
  splatBlobs: Array<{ dx: number; dy: number; r: number }>;
  alpha: number;
  rotation: number;
  attachedSurface?: 'WALL' | 'FLOOR' | 'CEILING' | 'FREE';
}

// In-Flight Organic Fluid Burst Particle
export interface FlyingSplatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  coreColor: string;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
}

export interface ExitPortalData {
  unlocked: boolean;
  active: boolean;
  requiredCores: number;
  collectedCores: number;
  stageTarget: number;
  pulsePhase: number;
  beaconHeight: number;
  vortexRotation: number;
}

export interface WorldEntity {
  id: string;
  type: WorldEntityType;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  angle: number;
  active: boolean;
  glowColor: string;
  health?: number;
  maxHealth?: number;
  interactionPrompt?: string;
  dataReward?: number;
  bacteriaData?: EnemyBacteria;
  portalData?: ExitPortalData;
}

// Collectible Cyber Assets & Powerups
export type CollectibleType = 
  | 'DATA_CHIP' 
  | 'METALLIC_GOLD'
  | 'CASH_STACK'
  | 'BLOOD_PLASMA_CELL'
  | 'ENCRYPTED_BIO_CORE'
  | 'CYBER_CORE' 
  | 'SHIELD_NODE' 
  | 'OVERDRIVE_CELL' 
  | 'CHRONO_CRYSTAL'
  | 'WEAPON_TECH_PART'
  | 'EXOTIC_WEAPON_DROP'
  | 'SURRENDER_BRIEFCASE';

export type WeaponDropModel = WeaponType | 'KATANA';

export interface Collectible {
  id: number;
  type: CollectibleType;
  position: Vector2D;
  radius: number;
  collected: boolean;
  glowColor: string;
  animTimer: number;
  points: number;
  stackCount?: number;
  healAmount?: number;
  rotation?: number;
  spinSpeed?: number;
  coreIndex?: number; // 1, 2, 3 for encrypted bio-cores
  weaponDropType?: WeaponDropModel;
}

// ============================================================================
// STAGE PROGRESSION & OBJECTIVE TELEMETRY INTERFACES
// ============================================================================

export type BiomeType = 'DOWNTOWN' | 'NEON_DISTRICT' | 'INDUSTRIAL' | 'TECH_CORE' | 'SLUMS' | 'BIO_LAB';

export interface StageDefinition {
  stageNumber: number;
  name: string;
  sectorName: string;
  subtitle: string;
  biome: BiomeType;
  enemyBaseHealth: number;
  enemyDamage: number;
  enemySpeedMultiplier: number;
  bacteriaDensity: number;
  hazardDensity: number;
  stageBonusGold: number;
  requiredBioCores: number;
  requiredMissionTargets?: number;
  isBossStage?: boolean;
}

export interface StageObjectiveState {
  currentStage: number;
  stageName: string;
  subtitle: string;
  biomeTheme: BiomeType;
  totalBioCores: number;
  collectedBioCores: number;
  portalUnlocked: boolean;
  portalActive: boolean;
  portalPosition?: Vector2D;
  stageTimeSeconds: number;
  stageEnemiesKilled: number;
  stageGoldEarned: number;
  // Mission Target Hunting & Surrender Stats
  missionTargetsTotal: number;
  missionTargetsKilled: number;
  surrenderedCount: number;
  // Weapon & Boss Status
  activeWeaponType: WeaponType;
  unlockedWeapons: WeaponType[];
  weaponArsenal?: WeaponInfo[];
  bossState?: BossState | null;
  nearestObjective?: {
    type: 'BIO_CORE' | 'PORTAL' | 'CYBER_EXIT_PORTAL' | 'MISSION_TARGET' | 'BOSS' | 'SURRENDERED_ENEMY';
    position?: Vector2D;
    distance: number;
    angle: number; // Angle in radians from player towards objective
    label: string;
  };
}

export interface PersistentPlayerProgression {
  totalGold: number;
  currentStage: number;
  highestStageReached: number;
  // Upgrade levels
  katanaLevel: number;
  blasterLevel: number;
  hullIntegrityLevel: number;
  shieldGenLevel: number;
  // Stats
  totalEnemiesKilled: number;
  totalCoresExtracted: number;
  totalStagesCleared: number;
}

export interface StageClearSummary {
  stage: number;
  stageName: string;
  subtitle: string;
  timeTakenFormatted: string;
  timeTakenSeconds: number;
  bioCoresCollected: number;
  totalBioCores: number;
  enemiesKilled: number;
  goldEarned: number;
  bonusReward: number;
  totalGold: number;
  grade: 'S' | 'A' | 'B' | 'C';
  healthRemainingPercent: number;
}

// Dynamic Visual Particles
export interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'spark' | 'ring' | 'line';
  rotation?: number;
  vRot?: number;
  glow?: boolean;
}

// HUD Holographic Text Popups
export interface FloatingText {
  position: Vector2D;
  text: string;
  color: string;
  alpha: number;
  velocity: Vector2D;
  scale: number;
}

// Open-World Exploration Statistics
export interface GameStats {
  highScore: number;
  totalDistanceExplored?: number;
  chunksDiscovered?: number;
  chipsCollected?: number;
  terminalsHacked?: number;
  highestCombo?: number;
  totalRuns?: number;
  totalDistance?: number;
  totalChips?: number;
  bestCombo?: number;
}

// --- RHYTHM-BASED COMBAT & SPEEDRUN GHOST ARCHITECTURE ---

export type RhythmTimingGrade = 'PERFECT' | 'CRITICAL' | 'GOOD' | 'NORMAL';

export interface RhythmBeatState {
  bpm: number;
  beatIntervalMs: number;
  currentBeat: number;
  beatPhase: number; // 0.0 to 1.0 within current beat
  pulseScale: number; // 1.0 to 1.4 for visual metronome pulse
  isNearBeat: boolean;
  accuracyMs: number; // Signed distance in ms to closest beat
  streak: number; // Consecutive on-beat strikes
  multiplier: number; // 1x to 3x+
}

export interface GhostFrame {
  t: number; // Milliseconds from stage start
  x: number;
  y: number;
  facing: 'LEFT' | 'RIGHT';
  actionState: string;
  isDashing: boolean;
  isSlashing: boolean;
  slashCombo?: number;
  integrity: number;
  distance: number;
}

export interface GhostRunData {
  stage: number;
  stageName: string;
  recordedAt: number;
  totalTimeMs: number;
  finalScore: number;
  finalDistance: number;
  frames: GhostFrame[];
}

export interface SpeedrunDeltaInfo {
  hasGhost: boolean;
  deltaSeconds: number; // Negative = Ahead of PB, Positive = Behind PB
  ghostDistance: number;
  playerDistance: number;
  status: 'AHEAD' | 'BEHIND' | 'TIED';
  formattedDelta: string;
  ghostPos?: { x: number; y: number };
}

// Game Settings
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  particlesLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  crtOverlay: boolean;
  touchControls: boolean;
  characterHue: number;
  compassEnabled?: boolean;
  minimapEnabled?: boolean;
  ghostEnabled?: boolean;
  rhythmCombatEnabled?: boolean;
}

export interface RadarTelemetryData {
  player: {
    x: number;
    y: number;
    facingAngle: number;
    isCrouching?: boolean;
    isCovered?: boolean;
    noiseLevel?: number;
    stealthTargetId?: string | null;
    flashlightJammedTimer?: number;
  };
  portalUnlocked: boolean;
  entities: Array<{
    id?: string;
    type: string;
    x: number;
    y: number;
    variant?: string;
    isBoss?: boolean;
    surrendered?: boolean;
    facingAngle?: number;
    visionFov?: number;
    visionRange?: number;
    alertness?: number; // 0..100
    state?: BacteriaAIState | string;
    canStealthKill?: boolean;
  }>;
  obstacles?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  collectibles: Array<{
    x: number;
    y: number;
    type: string;
    collected: boolean;
  }>;
}

export type PlayerCombatMove = 
  | 'SLASH_1'
  | 'SLASH_2'
  | 'SLASH_3'
  | 'DASH_SLASH'
  | 'DASH_EVADE'
  | 'SHOOT_BLASTER'
  | 'SHOOT_SPREAD'
  | 'SHOOT_CHAIN'
  | 'SHOOT_HOMING'
  | 'SHOOT_VORTEX'
  | 'JUMP_SLAM'
  | 'IDLE_TURTLE';

// --- DAILY MISSION DIRECTIVE ARCHITECTURE ---
export type DailyMissionType = 
  | 'BIO_CORE_HARVEST'
  | 'STEALTH_ASSASSIN'
  | 'COMBO_OVERDRIVE'
  | 'ENEMY_PURGE'
  | 'CHASM_ACROBAT'
  | 'CHRONO_SPRINT'
  | 'CYBER_SURVIVOR';

export interface DailyMission {
  id: string;
  dateKey: string; // e.g. '2026-08-29'
  title: string;
  codeName: string; // e.g. 'PROTOCOL: OMEGA_SIPHON'
  description: string;
  category: DailyMissionType;
  difficulty: 'STANDARD' | 'HARD' | 'APEX_ELITE';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  rewardCredits: number;
  rewardXp: number;
  rewardBadge: string;
  accentColor: string;
}

export interface ProAICombatDirectorState {
  playerActionHistory: PlayerCombatMove[];
  repeatedMovePunishRate: number; // 0.0 to 0.95
  lastActionTimestamp: number;
  playerIdleCombatTimer: number; // Ticks when in combat range without attacking
  executionerModeActive: boolean;
  cognitivePressureIntensity: number; // 0.0 to 1.0 (controls screen vignette throb and FOV shrink)
}

// --- ADVANCED DYNAMIC COMBO INPUT & AI PREDICTION ARCHITECTURE ---
export type DynamicComboInputType = 'LEFT_CLICK' | 'RIGHT_CLICK' | 'ACTION_KEY';

export interface DynamicComboStep {
  input: DynamicComboInputType;
  label: string;
  icon: string;
  timestamp: number;
}

export interface DynamicComboState {
  currentSequence: DynamicComboStep[];
  consecutiveSameInputCount: number;
  lastInputType: DynamicComboInputType | null;
  damageMultiplier: number;
  isMashed: boolean;
  isFinisherReady: boolean;
  isCriticalFinisherHit: boolean;
  activeComboTimeout: number; // in frames (e.g. 120 frames / 2.0s)
  comboStepIndex: number; // 0, 1, 2, 3
  feedbackBanner: string | null;
  feedbackColor: string;
  feedbackTimer: number;
}

export interface EnemyComboPredictionResult {
  predicted: boolean;
  defenseType: 'EVASION_DASH' | 'DEFENSIVE_BLOCK' | 'NONE';
  mitigationRatio: number; // e.g. 1.0 (evaded 100%), 0.85 (blocked 85%)
}


