import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { sound } from './audio';
import { proCombatAI } from './enemyAIDirector';
import {
  Player,
  WorldEntity,
  EnemyBacteria,
  Collectible,
  CollectibleType,
  WeaponDropModel,
  LaserHazard,
  CyberObstacle,
  AlleywayDecor,
  CyberEnvironmentProp,
  Particle,
  FloatingText,
  SplatterDecal,
  FlyingSplatter,
  Camera2D,
  GameSettings,
  SpeedrunDeltaInfo,
  RhythmBeatState,
  GridMapChunk,
  Projectile,
  LaserBurnMark,
  RemotePlayerState,
  TacticalPingMessage,
} from './types';

// ============================================================================
// ULTRA-FIDELITY 3D CYBER-ORGANIC THREE.JS SCENE MANAGER
// High-End Graphics Pipeline:
// 1. UnrealBloomPass Post-Processing (Intense Neon Glow & Light Bleed)
// 2. Sleek 3D Cyber Warrior Hero Chassis Model with Kinetic Servos & Plasma Blades
// 3. Realistic Menacing Bio-Mechanical Bacteria Monsters with Undulating Membranes, Virus Spikes & Moving Flagella
// 4. Detailed 3D Cyberpunk Laboratory / Infected Bio-Dome Corridor Environment
// 5. Dynamic Dual Cyan & Magenta Ambient Lighting Rig (Zero Black-Screen Glitches)
// ============================================================================

export class ThreeSceneManager {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private baseAdaptiveFov: number = 66;
  public isMobileDevice: boolean = false;

  // Zero-Allocation Memory Pools for Silky 60-120 FPS (Prevents V8 GC Micro-Stutters)
  private static readonly tmpTrailVec = new THREE.Vector3();
  private static readonly tmpTrailColor = new THREE.Color();
  private static readonly tmpParticleColor = new THREE.Color();

  // Post-Processing Pipeline
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public renderPass: RenderPass;
  public outputPass: OutputPass;

  // 2D Overlay Canvas for HUD/Text/Damage popups/Metronome rendered in crisp pixel-perfect pass
  public overlayCanvas: HTMLCanvasElement;
  public overlayCtx: CanvasRenderingContext2D;

  // 3D Cyber-Organic Laboratory Lighting Rig
  private ambientLight: THREE.AmbientLight;
  private dirCyanKeyLight: THREE.DirectionalLight;
  private dirMagentaRimLight: THREE.DirectionalLight;
  private heroSpotLight: THREE.SpotLight;
  private heroSpotLightTarget: THREE.Object3D;
  private heroVolumetricCone: THREE.Mesh;
  private playerPointLight: THREE.PointLight;
  private swordLight: THREE.PointLight;
  private blasterLight: THREE.PointLight;
  private portalPointLight: THREE.PointLight;
  private labVatLights: THREE.PointLight[] = [];

  // Volumetric Fog & Atmospheric Mist System
  private volumetricFogGroup: THREE.Group;
  private volumetricFogPlanes: THREE.Mesh[] = [];
  private volumetricShaftsGroup: THREE.Group;

  // Sleek 3D Cyber Warrior Hero Model Hierarchy (High-Poly Carbon-Fiber Cyber Armor & Plasma Katana)
  public playerGroup: THREE.Group;
  private playerTorso: THREE.Mesh;
  private playerChestArmor: THREE.Mesh;
  private playerReactorCore: THREE.Mesh;
  private playerReactorRing: THREE.Mesh;
  private playerSpineGroup: THREE.Group;
  private playerHeadGroup: THREE.Group;
  private playerHelmet: THREE.Mesh;
  private playerVisor: THREE.Mesh;
  private playerRespirator: THREE.Mesh;
  private playerLeftShoulder: THREE.Group;
  private playerRightShoulder: THREE.Group;
  private playerLeftArm: THREE.Group;
  private playerRightArm: THREE.Group;
  private playerLeftLeg: THREE.Group;
  private playerRightLeg: THREE.Group;
  private playerKatanaGroup: THREE.Group;
  private playerKatanaBlade: THREE.Mesh;
  private playerKatanaBladeSpine: THREE.Mesh;
  private playerKatanaCore: THREE.Mesh;
  private playerKatanaGlow: THREE.Mesh;
  private playerKatanaEnergyRing: THREE.Mesh;
  private playerSheathedKatanaGroup: THREE.Group;
  private playerBlasterGroup: THREE.Group;
  private playerBlasterBody: THREE.Mesh;
  private playerBlasterCoil: THREE.Mesh;
  private playerBlasterLaserBeam: THREE.Mesh;
  private playerMuzzleFlashMesh: THREE.Mesh;
  private playerShieldMesh: THREE.Mesh;
  private playerThrusterLeft: THREE.Mesh;
  private playerThrusterRight: THREE.Mesh;
  private playerPlasmaFlameLeft: THREE.Mesh;
  private playerPlasmaFlameRight: THREE.Mesh;
  private playerHaloRing1: THREE.Mesh;
  private playerHaloRing2: THREE.Mesh;

  // --- MULTIPLAYER SQUAD 3D RIG & WEBRTC MESHES ---
  public remotePlayersGroup: THREE.Group = new THREE.Group();
  private remotePlayerMeshMap: Map<
    string,
    {
      group: THREE.Group;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
      leftLeg: THREE.Group;
      rightLeg: THREE.Group;
      katanaBlade: THREE.Mesh;
      neonMaterial: THREE.MeshBasicMaterial;
      hue: number;
    }
  > = new Map();

  // Dynamic Neon Glow Motion Trails System (Katana & Limbs)
  private readonly MAX_TRAIL_POINTS = 18;
  private swordTrailHistory: THREE.Vector3[] = [];
  private leftHandTrailHistory: THREE.Vector3[] = [];
  private rightHandTrailHistory: THREE.Vector3[] = [];
  private leftFootTrailHistory: THREE.Vector3[] = [];
  private rightFootTrailHistory: THREE.Vector3[] = [];

  private swordTrailGeo!: THREE.BufferGeometry;
  private leftHandTrailGeo!: THREE.BufferGeometry;
  private rightHandTrailGeo!: THREE.BufferGeometry;
  private leftFootTrailGeo!: THREE.BufferGeometry;
  private rightFootTrailGeo!: THREE.BufferGeometry;

  private swordTrailMesh!: THREE.Mesh;
  private leftHandTrailMesh!: THREE.Mesh;
  private rightHandTrailMesh!: THREE.Mesh;
  private leftFootTrailMesh!: THREE.Mesh;
  private rightFootTrailMesh!: THREE.Mesh;

  private swordTrailMat!: THREE.MeshBasicMaterial;
  private limbTrailMat!: THREE.MeshBasicMaterial;

  // Procedural 2D Texture Maps for Glistening Wet Monsters, Emissive Veins & Carbon Fiber
  private carbonFiberTex: THREE.CanvasTexture;
  private plasmaBladeTexCyan: THREE.CanvasTexture;
  private plasmaBladeTexMagenta: THREE.CanvasTexture;
  private batteryCircuitTex!: THREE.CanvasTexture;
  private medkitDecalTex!: THREE.CanvasTexture;
  private wetOrganicTextures: Map<string, THREE.CanvasTexture> = new Map();
  private pulsingVeinTextures: Map<string, THREE.CanvasTexture> = new Map();

  // 3D Personal Best Ghost Mesh Hierarchy
  public ghostGroup: THREE.Group;
  private ghostBodyMesh: THREE.Mesh;
  private ghostVisorMesh: THREE.Mesh;

  // Dynamic Camera Juice, Smooth Lag Lerp & Dynamic Tilt
  private smoothedCamPos: THREE.Vector3 = new THREE.Vector3(0, 72, -165);
  private smoothedLookAt: THREE.Vector3 = new THREE.Vector3(0, 28, 140);
  private smoothedCamAngle: number = 0;
  private currentCamRoll: number = 0;
  private prevPlayerAngle: number = 0;
  private cameraInitialized: boolean = false;

  // Dynamic Neon Flickering & Threat Glitch System
  private ambientFlickerTimer: number = 0;
  private nextAmbientFlickerInterval: number = 4.2;
  private isAmbientFlickering: boolean = false;
  private ambientFlickerDuration: number = 0.28;
  private ambientFlickerElapsed: number = 0;
  private ambientFlickerFactor: number = 1.0;
  private lastFlashlightGlitchSoundTick: number = 0;
  private currentFlashlightGlitchThreat: number = 0;

  // Adaptive Performance Throttling for Canvas Brand Textures
  private goldenCanvasFrameCount: number = 0;

  // Frustum Culling Engine for Stable 60 FPS Performance
  private cameraFrustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private cullingSphere: THREE.Sphere = new THREE.Sphere();

  private isObjectInFrustum(obj: THREE.Object3D, radius: number = 100): boolean {
    if (!obj) return false;
    obj.updateMatrixWorld(false);
    this.cullingSphere.center.setFromMatrixPosition(obj.matrixWorld);
    this.cullingSphere.radius = radius;
    return this.cameraFrustum.intersectsSphere(this.cullingSphere);
  }

  // --- MASSIVE 3D SCI-FI FACTORY FLOOR & ENVIRONMENT ASSETS ---
  private factoryFloorGroup: THREE.Group;
  private movingPlatforms: Array<{
    group: THREE.Group;
    layer: 'CONVEYOR' | 'CRANE' | 'SKYWAY';
    basePos: THREE.Vector3;
    amplitude: THREE.Vector3;
    speed: number;
    phase: number;
    neonStrips: THREE.Mesh[];
    light?: THREE.PointLight;
  }> = [];
  private giantContainmentTubes: Array<{
    vatGroup: THREE.Group;
    specimenMesh: THREE.Group;
    liquidMesh: THREE.Mesh;
    light?: THREE.PointLight;
    specimenType: 'BIO_LEVIATHAN' | 'NEURAL_HIVE' | 'CHIMERA_APEX' | 'CRYSTAL_SPORE';
    pulsePhase: number;
    rotSpeed: number;
    bubbleParticles?: THREE.Points;
  }> = [];
  private spinningTurbines: Array<{ mesh: THREE.Mesh | THREE.Group; axis: 'x' | 'y' | 'z'; speed: number }> = [];
  private factoryPipes: THREE.Mesh[] = [];
  private factoryGantryTrusses: THREE.Group[] = [];
  private flyingDrones: Array<{ mesh: THREE.Group; speed: number; startX: number; endX: number; y: number; z: number }> = [];

  // Procedural Cyberpunk Rain & Puddle Splash System
  private rainGeo!: THREE.BufferGeometry;
  private rainPositions!: Float32Array;
  private rainVelocities!: Float32Array;
  private rainSystem!: THREE.Points;
  private readonly MAX_RAIN_DROPS = 2400;

  // Ground Splash Ripple Quads
  private splashGroup!: THREE.Group;
  private splashPool: Array<{ mesh: THREE.Mesh; active: boolean; life: number; maxLife: number; scaleSpeed: number }> = [];
  private readonly MAX_SPLASHES = 36;

  // 3D Ground & Grid Mesh
  private groundPlaneMesh: THREE.Mesh;
  private gridFloorMesh: THREE.LineSegments;
  private floorDecalsGroup: THREE.Group;

  // Dynamic 3D Object Pools & Caches
  private obstacleMeshMap: Map<string, THREE.Mesh> = new Map();
  private bacteriaMeshMap: Map<string, THREE.Group> = new Map();
  private sightConeMeshMap: Map<string, THREE.Mesh> = new Map();
  private takedownReticleMap: Map<string, THREE.Mesh> = new Map();
  private collectibleMeshMap: Map<number, THREE.Group> = new Map();
  private laserMeshMap: Map<string, THREE.Group> = new Map();
  private propMeshMap: Map<string, THREE.Group> = new Map();
  private pitMeshMap: Map<string, THREE.Group> = new Map();
  private enemyHealthAnimMap: Map<string, { currentDisplayHp: number; ghostHp: number; ghostTimer: number; lastHp: number; lastHitTime: number }> = new Map();
  private portalGroup: THREE.Group;
  private portalVortexMesh: THREE.Mesh;
  private portalRings: THREE.Mesh[] = [];
  private portalBeaconBeam: THREE.Mesh;

  // 3D Golden Neon Billboard Dynamic HTML5 Canvas Textures & Materials
  private kksCanvasH!: HTMLCanvasElement;
  private kksCtxH!: CanvasRenderingContext2D;
  private kksTexH!: THREE.CanvasTexture;

  private kksCanvasV!: HTMLCanvasElement;
  private kksCtxV!: CanvasRenderingContext2D;
  private kksTexV!: THREE.CanvasTexture;

  private cyberGameCanvasH!: HTMLCanvasElement;
  private cyberGameCtxH!: CanvasRenderingContext2D;
  private cyberGameTexH!: THREE.CanvasTexture;

  private cyberGameCanvasV!: HTMLCanvasElement;
  private cyberGameCtxV!: CanvasRenderingContext2D;
  private cyberGameTexV!: THREE.CanvasTexture;

  private burmaBatikCanvasH!: HTMLCanvasElement;
  private burmaBatikCtxH!: CanvasRenderingContext2D;
  private burmaBatikTexH!: THREE.CanvasTexture;

  private burmaBatikCanvasV!: HTMLCanvasElement;
  private burmaBatikCtxV!: CanvasRenderingContext2D;
  private burmaBatikTexV!: THREE.CanvasTexture;

  // 3D Hazard Pit Warning Border & Hologram Textures
  private hazardCautionTex!: THREE.CanvasTexture;
  private hazardWarningTex!: THREE.CanvasTexture;

  private goldenMaterials!: {
    kksH: THREE.MeshStandardMaterial;
    kksV: THREE.MeshStandardMaterial;
    cyberGameH: THREE.MeshStandardMaterial;
    cyberGameV: THREE.MeshStandardMaterial;
    burmaBatikH: THREE.MeshStandardMaterial;
    burmaBatikV: THREE.MeshStandardMaterial;
    goldNeonTrim: THREE.Material;
    goldNeonTrimBright: THREE.Material;
    amberNeonTrim: THREE.Material;
    darkChassis: THREE.MeshStandardMaterial;
    scaffoldingSteel: THREE.MeshStandardMaterial;
    beaconRed: THREE.MeshBasicMaterial;
    beaconAmber: THREE.MeshBasicMaterial;
  };

  // 3D Slash Arc Ribbon Mesh
  private slashArcMesh: THREE.Mesh;
  private slashArcGeometry: THREE.RingGeometry;

  // 3D Particle Cloud Systems
  private particleGeo: THREE.BufferGeometry;
  private particlePositions: Float32Array;
  private particleColors: Float32Array;
  private particleSizes: Float32Array;
  private particleSystem: THREE.Points;
  private readonly MAX_3D_PARTICLES = 1400;

  // 3D Bio-Spore Atmosphere Particles
  private sporeGeo: THREE.BufferGeometry;
  private sporePositions: Float32Array;
  private sporeColors: Float32Array;
  private sporeSystem: THREE.Points;
  private readonly MAX_SPORES = 1000;

  // Dynamic Golden Point Lights
  private dynamicGoldenLights: THREE.PointLight[] = [];
  private readonly MAX_GOLDEN_LIGHTS = 8;

  // 3D Thick Heavy Sci-Fi Plasma Projectiles & Laser Burn Mark Systems
  private projectileMeshMap: Map<number, THREE.Group> = new Map();
  private laserBurnMeshMap: Map<number, THREE.Group> = new Map();
  private projectilePointLight!: THREE.PointLight;

  // Shared High-End Materials with High Emissive Bloom Triggers
  private materials = {
    // Subtle Dark Metallic Factory Floor (Clean, non-distracting, dark navy base)
    cyberFloor: new THREE.MeshStandardMaterial({
      color: 0x02040a,
      roughness: 0.25,
      metalness: 0.95,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
    }),
    neonRoadGrid: new THREE.LineBasicMaterial({
      color: 0x121e33,
      transparent: true,
      opacity: 0.25,
    }),
    factorySteel: new THREE.MeshStandardMaterial({
      color: 0x0d1420,
      roughness: 0.28,
      metalness: 0.88,
      emissive: 0x020610,
      emissiveIntensity: 0.15,
    }),
    transparentFactorySteel: new THREE.MeshStandardMaterial({
      color: 0x0d1420,
      roughness: 0.28,
      metalness: 0.88,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
    transparentHazardStripes: new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
    factoryTrussSteel: new THREE.MeshStandardMaterial({
      color: 0x161f2c,
      roughness: 0.3,
      metalness: 0.9,
    }),
    labBulkhead: new THREE.MeshStandardMaterial({
      color: 0x0d1624,
      roughness: 0.22,
      metalness: 0.88,
      emissive: 0x030914,
      emissiveIntensity: 0.25,
    }),
    labGlassContainment: new THREE.MeshStandardMaterial({
      color: 0x00ffd1,
      roughness: 0.05,
      metalness: 0.28,
      transparent: true,
      opacity: 0.35,
      emissive: 0x002420,
      emissiveIntensity: 0.5,
    }),
    factoryHazardStripes: new THREE.MeshStandardMaterial({
      color: 0xcca000,
      roughness: 0.3,
      metalness: 0.5,
    }),
    labNeonCyan: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    labNeonMagenta: new THREE.MeshBasicMaterial({
      color: 0xff00e5,
    }),
    labNeonAmber: new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    }),
    labHazardStripes: new THREE.MeshBasicMaterial({
      color: 0xffe600,
    }),
    chasmVoidInterior: new THREE.MeshBasicMaterial({
      color: 0x000000,
    }),
    chasmFloorMask: new THREE.MeshBasicMaterial({
      color: 0x020104,
      side: THREE.DoubleSide,
    }),
    craterBlastDecal: new THREE.MeshStandardMaterial({
      color: 0x0a0810,
      roughness: 0.98,
      metalness: 0.1,
      emissive: 0x030105,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.92,
    }),
    chasmCrackedConcrete: new THREE.MeshStandardMaterial({
      color: 0x1a1624,
      roughness: 0.94,
      metalness: 0.18,
      emissive: 0x020104,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    }),
    chasmBrokenSlab: new THREE.MeshStandardMaterial({
      color: 0x14111e,
      roughness: 0.86,
      metalness: 0.32,
      emissive: 0x040208,
      emissiveIntensity: 0.2,
    }),
    chasmRockSpire: new THREE.MeshStandardMaterial({
      color: 0x0e0b16,
      roughness: 0.96,
      metalness: 0.1,
      emissive: 0x020104,
      emissiveIntensity: 0.15,
    }),
    chasmExposedRebar: new THREE.MeshStandardMaterial({
      color: 0x4a2e1c,
      roughness: 0.42,
      metalness: 0.88,
      emissive: 0x140802,
      emissiveIntensity: 0.3,
    }),
    chasmRebarTipGlow: new THREE.MeshBasicMaterial({
      color: 0xff6600,
    }),
    chasmThermalVein: new THREE.MeshBasicMaterial({
      color: 0xff3300,
    }),
    chasmConcreteRubble: new THREE.MeshStandardMaterial({
      color: 0x221c2e,
      roughness: 0.94,
      metalness: 0.12,
      emissive: 0x030206,
      emissiveIntensity: 0.15,
    }),
    chasmDustParticleMat: new THREE.PointsMaterial({
      color: 0x90a4be,
      size: 2.8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    hazardCautionBorderMat: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    }),
    hazardRimGlowMat: new THREE.LineBasicMaterial({
      color: 0xff6600,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
    }),
    hazardBeaconMat: new THREE.MeshBasicMaterial({
      color: 0xff7700,
    }),
    hazardLaserMat: new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    hazardHoloMat: new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    chasmLavaGlowMat: new THREE.MeshBasicMaterial({
      color: 0xff2200,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    hologramProjectorBeam: new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    hologramCyanBeam: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    rainStreak: new THREE.PointsMaterial({
      color: 0x4a80a0,
      size: 2.2,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    }),
    splashRipple: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    // High-Poly 3D Carbon-Fiber Cyber Armor & Titanium Warrior Materials
    playerCarbonArmor: new THREE.MeshStandardMaterial({
      color: 0x0f1624,
      roughness: 0.14,
      metalness: 0.92,
      emissive: 0x060e1c,
      emissiveIntensity: 0.4,
    }),
    playerSecondaryPlates: new THREE.MeshStandardMaterial({
      color: 0x182438,
      roughness: 0.18,
      metalness: 0.88,
    }),
    playerTitaniumTrim: new THREE.MeshStandardMaterial({
      color: 0x90a4be,
      roughness: 0.12,
      metalness: 0.95,
    }),
    playerCyanNeon: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    playerMagentaNeon: new THREE.MeshBasicMaterial({
      color: 0xff00e5,
    }),
    playerGoldNeon: new THREE.MeshBasicMaterial({
      color: 0xffe600,
    }),
    playerPlasmaJet: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.92,
    }),
    // Ultra-Realistic Glowing Plasma Katana Blade Materials
    katanaBladeSpine: new THREE.MeshStandardMaterial({
      color: 0x080d16,
      roughness: 0.08,
      metalness: 0.98,
    }),
    katanaBladeCyan: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    katanaBladeCore: new THREE.MeshBasicMaterial({
      color: 0xffffff,
    }),
    katanaGlowRibbon: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    }),
    shieldHologram: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    }),
    ghostHologram: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    }),
    // Glistening Organic Cyborg Monster Materials with High-Contrast Red Bioluminescent Cores
    bacteriaMembraneBase: new THREE.MeshStandardMaterial({
      color: 0x3d000f,
      emissive: 0xff0033,
      emissiveIntensity: 2.8,
      roughness: 0.08,
      metalness: 0.45,
      transparent: true,
      opacity: 0.96,
    }),
    bacteriaMembraneToxic: new THREE.MeshStandardMaterial({
      color: 0x220008,
      emissive: 0xff0044,
      emissiveIntensity: 2.9,
      roughness: 0.07,
      metalness: 0.4,
      transparent: true,
      opacity: 0.96,
    }),
    bacteriaMembraneStealth: new THREE.MeshStandardMaterial({
      color: 0x2b0010,
      emissive: 0xff0055,
      emissiveIntensity: 2.7,
      roughness: 0.06,
      metalness: 0.55,
      transparent: true,
      opacity: 0.94,
    }),
    bacteriaMembraneBrute: new THREE.MeshStandardMaterial({
      color: 0x4a0012,
      emissive: 0xff0033,
      emissiveIntensity: 3.0,
      roughness: 0.1,
      metalness: 0.65,
      transparent: true,
      opacity: 0.98,
    }),
    bacteriaMembraneElite: new THREE.MeshStandardMaterial({
      color: 0x540018,
      emissive: 0xff0044,
      emissiveIntensity: 3.1,
      roughness: 0.08,
      metalness: 0.5,
      transparent: true,
      opacity: 0.98,
    }),
    bacteriaMembraneBoss: new THREE.MeshStandardMaterial({
      color: 0x66001a,
      emissive: 0xff0022,
      emissiveIntensity: 3.4,
      roughness: 0.07,
      metalness: 0.55,
      transparent: true,
      opacity: 0.98,
    }),
    bacteriaMembraneSurrender: new THREE.MeshStandardMaterial({
      color: 0x063342,
      emissive: 0x00ffd1,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92,
    }),
    // Pulsing Emissive Arterial Vein Sub-Layer Materials (Additive Blending Over Organic Flesh)
    bacteriaVeinsBase: new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsToxic: new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsStealth: new THREE.MeshBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsBrute: new THREE.MeshBasicMaterial({
      color: 0xff0022,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsElite: new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsGold: new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsBoss: new THREE.MeshBasicMaterial({
      color: 0xff0037,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    bacteriaVeinsSurrender: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    // Cyborg Biomechanical Armor & Hardware Materials
    cyborgTitaniumPlate: new THREE.MeshStandardMaterial({
      color: 0x182233,
      roughness: 0.15,
      metalness: 0.92,
      emissive: 0x08101d,
      emissiveIntensity: 0.3,
    }),
    cyborgPistonHydraulic: new THREE.MeshStandardMaterial({
      color: 0x4a586e,
      roughness: 0.12,
      metalness: 0.96,
    }),
    cyborgOcularLaserRed: new THREE.MeshBasicMaterial({
      color: 0xff0044,
    }),
    cyborgOcularLaserCyan: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    cyborgOcularLaserGold: new THREE.MeshBasicMaterial({
      color: 0xffd700,
    }),
    cyborgOcularLaserGreen: new THREE.MeshBasicMaterial({
      color: 0x39ff14,
    }),
    cyborgOcularLaserPurple: new THREE.MeshBasicMaterial({
      color: 0x9d00ff,
    }),
    mechaLaserSightBeam: new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    mechaCarbonChassis: new THREE.MeshStandardMaterial({
      color: 0x0f1118,
      roughness: 0.22,
      metalness: 0.85,
      emissive: 0x050810,
      emissiveIntensity: 0.2,
    }),
    mechaBrassHazard: new THREE.MeshStandardMaterial({
      color: 0xffa000,
      roughness: 0.25,
      metalness: 0.7,
      emissive: 0x442200,
      emissiveIntensity: 0.3,
    }),
    cyborgConduitWire: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    bacteriaNucleusCore: new THREE.MeshBasicMaterial({
      color: 0x39ff14,
    }),
    bacteriaSpikeTipGreen: new THREE.MeshBasicMaterial({
      color: 0x39ff14,
    }),
    bacteriaSpikeTipMagenta: new THREE.MeshBasicMaterial({
      color: 0xff00e5,
    }),
    bacteriaSpikeTipGold: new THREE.MeshBasicMaterial({
      color: 0xffd700,
    }),
    bacteriaSpikeTipCyan: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    // Enemy Flashlight High-Contrast Outline & Glitch Shader Materials
    enemyFlashlightOutline: new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    enemyFlashlightGlitchAura: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    enemyFlashlightScanRing: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    bacteriaSpikeTipCrimson: new THREE.MeshBasicMaterial({
      color: 0xff0055,
    }),
    bacteriaTentacleOrganic: new THREE.MeshStandardMaterial({
      color: 0x6406a4,
      emissive: 0x3d0368,
      emissiveIntensity: 1.4,
      roughness: 0.14,
      metalness: 0.35,
    }),
    bioCoreCrystal: new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      roughness: 0.05,
      metalness: 0.95,
    }),
    goldCoin: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.98,
    }),
    laserBeam: new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.95,
    }),
    laserGlowCore: new THREE.MeshBasicMaterial({
      color: 0xff66aa,
      transparent: true,
      opacity: 0.85,
    }),
    portalRing: new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
    }),
    // 3D Collectible & Sci-Fi Tactical Props Materials
    medkitDarkChassis: new THREE.MeshStandardMaterial({
      color: 0x141a24,
      roughness: 0.32,
      metalness: 0.85,
      emissive: 0x060c14,
      emissiveIntensity: 0.25,
    }),
    medkitWhitePlates: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.5,
    }),
    medkitBumperTitanium: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.7,
    }),
    medkitLatchAlloy: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.18,
      metalness: 0.95,
    }),
    medkitNeonCrossGreen: new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      emissive: 0x00ff66,
      emissiveIntensity: 3.5,
      roughness: 0.05,
      metalness: 0.6,
    }),
    medkitNeonCrossRed: new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xff0033,
      emissiveIntensity: 3.5,
      roughness: 0.05,
      metalness: 0.6,
    }),
    medkitStatusGreen: new THREE.MeshBasicMaterial({
      color: 0x00ff66,
    }),
    medkitStatusCyan: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    medkitStatusAmber: new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    }),
    medkitHoloRingDisc: new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    // Weapon Props Materials
    weaponSteelGunmetal: new THREE.MeshStandardMaterial({
      color: 0x161b26,
      roughness: 0.28,
      metalness: 0.92,
      emissive: 0x040810,
      emissiveIntensity: 0.15,
    }),
    weaponTitaniumPlate: new THREE.MeshStandardMaterial({
      color: 0x5a6a80,
      roughness: 0.22,
      metalness: 0.9,
    }),
    weaponGoldTrim: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.95,
    }),
    weaponNeonCyan: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    weaponNeonMagenta: new THREE.MeshBasicMaterial({
      color: 0xff00e5,
    }),
    weaponNeonAmber: new THREE.MeshBasicMaterial({
      color: 0xff8800,
    }),
    weaponNeonElectricBlue: new THREE.MeshBasicMaterial({
      color: 0x00bfff,
    }),
    weaponKatanaBladeEdge: new THREE.MeshStandardMaterial({
      color: 0xddffff,
      emissive: 0x00ffd1,
      emissiveIntensity: 2.5,
      roughness: 0.04,
      metalness: 0.98,
    }),
    weaponKatanaHiltWrap: new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      roughness: 0.65,
      metalness: 0.2,
    }),
    weaponHoloPedestalRing: new THREE.MeshBasicMaterial({
      color: 0xff00e5,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    // Mechanical Battery Cell (Bio-Core) Materials
    batteryTerminalEndCap: new THREE.MeshStandardMaterial({
      color: 0x242d3c,
      roughness: 0.25,
      metalness: 0.94,
      emissive: 0x0b1320,
      emissiveIntensity: 0.3,
    }),
    batteryCopperContact: new THREE.MeshStandardMaterial({
      color: 0xd97724,
      roughness: 0.18,
      metalness: 0.96,
      emissive: 0x5a2d0c,
      emissiveIntensity: 0.5,
    }),
    batteryGlassCylinder: new THREE.MeshStandardMaterial({
      color: 0x00ffd1,
      roughness: 0.06,
      metalness: 0.15,
      transparent: true,
      opacity: 0.52,
      emissive: 0x003328,
      emissiveIntensity: 0.8,
    }),
    batteryQuantumFuelRod: new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      emissive: 0x00ffaa,
      emissiveIntensity: 3.8,
      roughness: 0.05,
      metalness: 0.9,
    }),
    batteryExoSupportRib: new THREE.MeshStandardMaterial({
      color: 0x111620,
      roughness: 0.35,
      metalness: 0.9,
    }),
    batteryCircuitNeonLine: new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
    }),
    batteryGyroRingNeon: new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00a8ff,
      emissiveIntensity: 2.2,
      roughness: 0.12,
      metalness: 0.92,
    }),
  };

  private readonly WORLD_SCALE = 1.0;
  private animTick: number = 0;

  // --- PROCEDURAL TEXTURE GENERATION FOR CARBON FIBER, GLISTENING MEMBRANES & PULSING VEINS ---
  private initProceduralTextures() {
    // 1. Procedural 2x2 Carbon Fiber Twill Weave Texture (512x512)
    const cfCanvas = document.createElement('canvas');
    cfCanvas.width = 512;
    cfCanvas.height = 512;
    const cfCtx = cfCanvas.getContext('2d');
    if (cfCtx) {
      cfCtx.fillStyle = '#0a0f18';
      cfCtx.fillRect(0, 0, 512, 512);

      const cellSize = 16;
      for (let y = 0; y < 512; y += cellSize) {
        for (let x = 0; x < 512; x += cellSize) {
          const isTwill = Math.floor((x + y) / cellSize) % 2 === 0;
          const grad = cfCtx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          if (isTwill) {
            grad.addColorStop(0, '#101726');
            grad.addColorStop(0.5, '#28374d');
            grad.addColorStop(1, '#0e1522');
          } else {
            grad.addColorStop(0, '#0c121e');
            grad.addColorStop(0.5, '#1e2b3e');
            grad.addColorStop(1, '#090e17');
          }
          cfCtx.fillStyle = grad;
          cfCtx.fillRect(x, y, cellSize, cellSize);

          // Micro-fiber weave strands
          cfCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          for (let s = 2; s < cellSize; s += 4) {
            if (isTwill) {
              cfCtx.fillRect(x + s, y, 1, cellSize);
            } else {
              cfCtx.fillRect(x, y + s, cellSize, 1);
            }
          }
        }
      }
    }
    this.carbonFiberTex = new THREE.CanvasTexture(cfCanvas);
    this.carbonFiberTex.wrapS = THREE.RepeatWrapping;
    this.carbonFiberTex.wrapT = THREE.RepeatWrapping;
    this.carbonFiberTex.repeat.set(6, 6);
    this.materials.playerCarbonArmor.map = this.carbonFiberTex;
    this.materials.playerCarbonArmor.needsUpdate = true;
    this.materials.cyborgTitaniumPlate.map = this.carbonFiberTex;
    this.materials.cyborgTitaniumPlate.needsUpdate = true;

    // 2. Procedural Glistening Wet Organic Membrane Textures
    const createWetOrganic = (baseHex: string, cellHex: string, veinHex: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      // Base organic gradient
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 512, 512);

      // Glistening wet cellular noise
      for (let i = 0; i < 240; i++) {
        const cx = (i * 137.5) % 512;
        const cy = (i * 219.3) % 512;
        const r = 8 + (i % 24);
        const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        radGrad.addColorStop(0.4, cellHex);
        radGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Branching glowing bio-cyber vascular lines
      ctx.strokeStyle = veinHex;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let v = 0; v < 18; v++) {
        let vx = (v * 73) % 512;
        let vy = (v * 127) % 512;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        for (let seg = 0; seg < 5; seg++) {
          vx += Math.sin(v + seg) * 45;
          vy += Math.cos(v + seg) * 45;
          ctx.lineTo(vx, vy);
        }
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    };

    // 3. Procedural Pulsing Cyber Vein Emissive Maps
    const createPulsingVeinMap = (veinColor: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);

      // High-intensity branching emissive pathways
      ctx.strokeStyle = veinColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = veinColor;
      ctx.shadowBlur = 12;

      for (let b = 0; b < 24; b++) {
        let bx = ((b * 89) % 480) + 16;
        let by = ((b * 131) % 480) + 16;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        for (let s = 0; s < 6; s++) {
          bx += (Math.sin(b * 1.5 + s) * 50);
          by += (Math.cos(b * 1.5 + s) * 50);
          ctx.lineTo(bx, by);

          // Junction nodes
          if (s === 2 || s === 4) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = veinColor;
          }
        }
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    };

    // Instantiate variant wet & vein textures
    const wetBase = createWetOrganic('#220538', 'rgba(174, 0, 255, 0.35)', '#ae00ff');
    const veinBase = createPulsingVeinMap('#ae00ff');
    this.wetOrganicTextures.set('BASE', wetBase);
    this.pulsingVeinTextures.set('BASE', veinBase);
    this.materials.bacteriaMembraneBase.map = wetBase;
    this.materials.bacteriaMembraneBase.emissiveMap = veinBase;
    this.materials.bacteriaMembraneBase.needsUpdate = true;
    this.materials.bacteriaVeinsBase.map = veinBase;
    this.materials.bacteriaVeinsBase.needsUpdate = true;

    const wetToxic = createWetOrganic('#1e3000', 'rgba(180, 255, 0, 0.4)', '#b4ff00');
    const veinToxic = createPulsingVeinMap('#b4ff00');
    this.wetOrganicTextures.set('TOXIC', wetToxic);
    this.pulsingVeinTextures.set('TOXIC', veinToxic);
    this.materials.bacteriaMembraneToxic.map = wetToxic;
    this.materials.bacteriaMembraneToxic.emissiveMap = veinToxic;
    this.materials.bacteriaMembraneToxic.needsUpdate = true;
    this.materials.bacteriaVeinsToxic.map = veinToxic;
    this.materials.bacteriaVeinsToxic.needsUpdate = true;

    const wetStealth = createWetOrganic('#100028', 'rgba(136, 0, 255, 0.35)', '#8800ff');
    const veinStealth = createPulsingVeinMap('#8800ff');
    this.wetOrganicTextures.set('STEALTH', wetStealth);
    this.pulsingVeinTextures.set('STEALTH', veinStealth);
    this.materials.bacteriaMembraneStealth.map = wetStealth;
    this.materials.bacteriaMembraneStealth.emissiveMap = veinStealth;
    this.materials.bacteriaMembraneStealth.needsUpdate = true;
    this.materials.bacteriaVeinsStealth.map = veinStealth;
    this.materials.bacteriaVeinsStealth.needsUpdate = true;

    const wetBrute = createWetOrganic('#3b0010', 'rgba(255, 0, 64, 0.4)', '#ff0040');
    const veinBrute = createPulsingVeinMap('#ff0040');
    this.wetOrganicTextures.set('BRUTE', wetBrute);
    this.pulsingVeinTextures.set('BRUTE', veinBrute);
    this.materials.bacteriaMembraneBrute.map = wetBrute;
    this.materials.bacteriaMembraneBrute.emissiveMap = veinBrute;
    this.materials.bacteriaMembraneBrute.needsUpdate = true;
    this.materials.bacteriaVeinsBrute.map = veinBrute;
    this.materials.bacteriaVeinsBrute.needsUpdate = true;

    const wetElite = createWetOrganic('#3d2400', 'rgba(255, 179, 0, 0.45)', '#ffb300');
    const veinElite = createPulsingVeinMap('#ffb300');
    this.wetOrganicTextures.set('ELITE', wetElite);
    this.pulsingVeinTextures.set('ELITE', veinElite);
    this.materials.bacteriaMembraneElite.map = wetElite;
    this.materials.bacteriaMembraneElite.emissiveMap = veinElite;
    this.materials.bacteriaMembraneElite.needsUpdate = true;
    this.materials.bacteriaVeinsElite.map = veinElite;
    this.materials.bacteriaVeinsElite.needsUpdate = true;
    this.materials.bacteriaVeinsGold.map = veinElite;
    this.materials.bacteriaVeinsGold.needsUpdate = true;

    const wetBoss = createWetOrganic('#450016', 'rgba(255, 0, 55, 0.48)', '#ff0037');
    const veinBoss = createPulsingVeinMap('#ff0037');
    this.wetOrganicTextures.set('BOSS', wetBoss);
    this.pulsingVeinTextures.set('BOSS', veinBoss);
    this.materials.bacteriaMembraneBoss.map = wetBoss;
    this.materials.bacteriaMembraneBoss.emissiveMap = veinBoss;
    this.materials.bacteriaMembraneBoss.needsUpdate = true;
    this.materials.bacteriaVeinsBoss.map = veinBoss;
    this.materials.bacteriaVeinsBoss.needsUpdate = true;

    const wetSurrender = createWetOrganic('#052834', 'rgba(0, 255, 209, 0.35)', '#00ffd1');
    const veinSurrender = createPulsingVeinMap('#00ffd1');
    this.wetOrganicTextures.set('SURRENDER', wetSurrender);
    this.pulsingVeinTextures.set('SURRENDER', veinSurrender);
    this.materials.bacteriaMembraneSurrender.map = wetSurrender;
    this.materials.bacteriaMembraneSurrender.emissiveMap = veinSurrender;
    this.materials.bacteriaMembraneSurrender.needsUpdate = true;
    this.materials.bacteriaVeinsSurrender.map = veinSurrender;
    this.materials.bacteriaVeinsSurrender.needsUpdate = true;

    // 4. Procedural Superheated Plasma Blade Gradient Textures (512x128)
    const createPlasmaBladeTex = (glowColor: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#ffffff');
      grad.addColorStop(0.6, glowColor);
      grad.addColorStop(1, '#001428');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 128);

      // Plasma frequency wave lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let x = 10; x < 512; x += 18) {
        ctx.fillRect(x, 40, 6, 48);
      }

      return new THREE.CanvasTexture(c);
    };

    this.plasmaBladeTexCyan = createPlasmaBladeTex('#00ffd1');
    this.plasmaBladeTexMagenta = createPlasmaBladeTex('#ff00e5');

    // 5. Procedural Rain-Slicked Metallic Factory Floor Texture (1024x1024)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 1024;
    floorCanvas.height = 1024;
    const floorCtx = floorCanvas.getContext('2d');
    if (floorCtx) {
      // Base dark industrial gunmetal gradient
      const baseGrad = floorCtx.createLinearGradient(0, 0, 1024, 1024);
      baseGrad.addColorStop(0, '#0a101d');
      baseGrad.addColorStop(0.5, '#0e1626');
      baseGrad.addColorStop(1, '#070b14');
      floorCtx.fillStyle = baseGrad;
      floorCtx.fillRect(0, 0, 1024, 1024);

      // Industrial Steel Floor Tiles with Seams & Rivets
      const tileSize = 128;
      floorCtx.strokeStyle = '#1a273c';
      floorCtx.lineWidth = 2;
      for (let y = 0; y < 1024; y += tileSize) {
        for (let x = 0; x < 1024; x += tileSize) {
          floorCtx.strokeRect(x, y, tileSize, tileSize);

          // Subtle diamond tread pattern inside each tile
          floorCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          floorCtx.beginPath();
          floorCtx.moveTo(x + tileSize / 2, y + 8);
          floorCtx.lineTo(x + tileSize - 8, y + tileSize / 2);
          floorCtx.lineTo(x + tileSize / 2, y + tileSize - 8);
          floorCtx.lineTo(x + 8, y + tileSize / 2);
          floorCtx.closePath();
          floorCtx.fill();

          // Corner bolt rivets
          floorCtx.fillStyle = '#22324b';
          floorCtx.fillRect(x + 4, y + 4, 3, 3);
          floorCtx.fillRect(x + tileSize - 7, y + 4, 3, 3);
          floorCtx.fillRect(x + 4, y + tileSize - 7, 3, 3);
          floorCtx.fillRect(x + tileSize - 7, y + tileSize - 7, 3, 3);
        }
      }

      // Rain-Slicked Wet Puddles & Specular Sheen Contours
      for (let p = 0; p < 18; p++) {
        const px = (p * 187) % 960 + 32;
        const py = (p * 341) % 960 + 32;
        const pr = 45 + (p % 5) * 35;
        const puddleGrad = floorCtx.createRadialGradient(px, py, 4, px, py, pr);
        puddleGrad.addColorStop(0, 'rgba(0, 255, 209, 0.12)');
        puddleGrad.addColorStop(0.4, 'rgba(20, 45, 75, 0.45)');
        puddleGrad.addColorStop(0.85, 'rgba(10, 20, 35, 0.25)');
        puddleGrad.addColorStop(1, 'transparent');
        floorCtx.fillStyle = puddleGrad;
        floorCtx.beginPath();
        floorCtx.ellipse(px, py, pr, pr * 0.65, (p * 0.5), 0, Math.PI * 2);
        floorCtx.fill();

        // High-gloss puddle specular reflection edge
        floorCtx.strokeStyle = 'rgba(0, 255, 209, 0.18)';
        floorCtx.lineWidth = 1.5;
        floorCtx.beginPath();
        floorCtx.ellipse(px, py, pr * 0.88, pr * 0.55, (p * 0.5), 0, Math.PI * 2);
        floorCtx.stroke();
      }

      // Embedded Cyber Circuit Reflection Traces
      floorCtx.strokeStyle = 'rgba(0, 255, 209, 0.35)';
      floorCtx.lineWidth = 1.5;
      for (let c = 0; c < 12; c++) {
        const cx = (c * 95) % 1024;
        floorCtx.beginPath();
        floorCtx.moveTo(cx, 0);
        floorCtx.lineTo(cx, 400);
        floorCtx.lineTo(cx + 60, 460);
        floorCtx.lineTo(cx + 60, 1024);
        floorCtx.stroke();
      }
    }
    const wetFloorTex = new THREE.CanvasTexture(floorCanvas);
    wetFloorTex.wrapS = THREE.RepeatWrapping;
    wetFloorTex.wrapT = THREE.RepeatWrapping;
    wetFloorTex.repeat.set(12, 12);
    this.materials.cyberFloor.map = wetFloorTex;
    this.materials.cyberFloor.needsUpdate = true;

    // 6. Procedural Hazard Caution Chevrons (Yellow/Black & Cyan/Dark) (512x128)
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 512;
    hazardCanvas.height = 128;
    const hazCtx = hazardCanvas.getContext('2d');
    if (hazCtx) {
      hazCtx.fillStyle = '#080c14';
      hazCtx.fillRect(0, 0, 512, 128);

      hazCtx.fillStyle = '#ffd700';
      const stripeW = 32;
      for (let x = -128; x < 512 + 128; x += stripeW * 2) {
        hazCtx.beginPath();
        hazCtx.moveTo(x, 0);
        hazCtx.lineTo(x + stripeW, 0);
        hazCtx.lineTo(x + stripeW - 40, 128);
        hazCtx.lineTo(x - 40, 128);
        hazCtx.closePath();
        hazCtx.fill();
      }
    }
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    hazardTex.repeat.set(4, 1);
    this.materials.factoryHazardStripes.map = hazardTex;
    this.materials.factoryHazardStripes.needsUpdate = true;

    // 7. Procedural Factory Steel Paneling Texture (512x512)
    const steelCanvas = document.createElement('canvas');
    steelCanvas.width = 512;
    steelCanvas.height = 512;
    const steelCtx = steelCanvas.getContext('2d');
    if (steelCtx) {
      steelCtx.fillStyle = '#121a28';
      steelCtx.fillRect(0, 0, 512, 512);

      // Steel Plate Grid
      steelCtx.strokeStyle = '#25354d';
      steelCtx.lineWidth = 3;
      for (let y = 0; y < 512; y += 128) {
        for (let x = 0; x < 512; x += 128) {
          steelCtx.strokeRect(x, y, 128, 128);
          // Rivets
          steelCtx.fillStyle = '#3c5274';
          steelCtx.beginPath();
          steelCtx.arc(x + 8, y + 8, 3, 0, Math.PI * 2);
          steelCtx.arc(x + 120, y + 8, 3, 0, Math.PI * 2);
          steelCtx.arc(x + 8, y + 120, 3, 0, Math.PI * 2);
          steelCtx.arc(x + 120, y + 120, 3, 0, Math.PI * 2);
          steelCtx.fill();
        }
      }
    }
    const steelTex = new THREE.CanvasTexture(steelCanvas);
    steelTex.wrapS = THREE.RepeatWrapping;
    steelTex.wrapT = THREE.RepeatWrapping;
    steelTex.repeat.set(2, 2);
    this.materials.factorySteel.map = steelTex;
    this.materials.factorySteel.needsUpdate = true;

    // 8. Procedural Fractured Pit Wall with Cracked Concrete, Exposed Rebar & Deep Shadow Gradient (512x512)
    const pitCanvas = document.createElement('canvas');
    pitCanvas.width = 512;
    pitCanvas.height = 512;
    const pitCtx = pitCanvas.getContext('2d');
    if (pitCtx) {
      // Vertical depth gradient: rough cracked slate concrete top sinking into pitch-black abyss
      const pitGrad = pitCtx.createLinearGradient(0, 0, 0, 512);
      pitGrad.addColorStop(0, '#221e2e');
      pitGrad.addColorStop(0.12, '#181422');
      pitGrad.addColorStop(0.35, '#0e0b16');
      pitGrad.addColorStop(0.65, '#05030a');
      pitGrad.addColorStop(1, '#000000');
      pitCtx.fillStyle = pitGrad;
      pitCtx.fillRect(0, 0, 512, 512);

      // Micro concrete aggregate noise & stippling
      for (let n = 0; n < 600; n++) {
        const nx = (n * 37) % 512;
        const ny = (n * 53) % 280;
        const nAlpha = (1 - ny / 280) * 0.18;
        pitCtx.fillStyle = n % 2 === 0 ? `rgba(255, 255, 255, ${nAlpha})` : `rgba(0, 0, 0, ${nAlpha * 1.5})`;
        pitCtx.fillRect(nx, ny, (n % 3) + 1, (n % 3) + 1);
      }

      // Horizontal Sub-Level Concrete Strata & Fractures
      for (let s = 0; s < 5; s++) {
        const sy = 40 + s * 55;
        pitCtx.strokeStyle = `rgba(10, 8, 16, ${0.8 - s * 0.12})`;
        pitCtx.lineWidth = 3 - s * 0.4;
        pitCtx.beginPath();
        pitCtx.moveTo(0, sy);
        for (let sx = 0; sx <= 512; sx += 40) {
          pitCtx.lineTo(sx, sy + Math.sin(sx * 0.05 + s * 2) * 6);
        }
        pitCtx.stroke();
      }

      // Embedded Structural Rebar Mesh Grid (Severed steel reinforcement rods)
      for (let rx = 30; rx < 512; rx += 70) {
        // Vertical rusted rebar rods
        pitCtx.strokeStyle = '#4a2c18';
        pitCtx.lineWidth = 2.5;
        pitCtx.beginPath();
        pitCtx.moveTo(rx, 0);
        pitCtx.lineTo(rx + ((rx % 3) - 1) * 8, 220);
        pitCtx.stroke();

        // Rusted rebar ribs & ridges
        pitCtx.strokeStyle = '#824823';
        pitCtx.lineWidth = 1.5;
        for (let ry = 10; ry < 220; ry += 16) {
          pitCtx.beginPath();
          pitCtx.moveTo(rx - 3, ry);
          pitCtx.lineTo(rx + 4, ry - 2);
          pitCtx.stroke();
        }
      }

      // Branching Jagged Structural Crack Veins
      const drawCrackVein = (startX: number, startY: number, length: number, angle: number) => {
        let cx = startX;
        let cy = startY;
        pitCtx.strokeStyle = '#040208';
        pitCtx.lineWidth = 2.5;
        pitCtx.beginPath();
        pitCtx.moveTo(cx, cy);

        const steps = 14;
        const stepLen = length / steps;
        for (let step = 0; step < steps; step++) {
          angle += ((Math.sin(step * 4.7 + startX) * 0.8) - 0.4);
          cx += Math.cos(angle) * stepLen;
          cy += Math.abs(Math.sin(angle)) * stepLen;
          pitCtx.lineTo(cx, cy);

          // Faint glowing stress micro-fracture along deep crevasse
          if (step % 4 === 0 && cy < 260) {
            pitCtx.fillStyle = 'rgba(255, 0, 85, 0.18)';
            pitCtx.fillRect(cx - 1, cy - 1, 2, 2);
          }
        }
        pitCtx.stroke();
      };

      drawCrackVein(80, 0, 320, Math.PI * 0.45);
      drawCrackVein(220, 0, 380, Math.PI * 0.52);
      drawCrackVein(360, 0, 290, Math.PI * 0.48);
      drawCrackVein(470, 0, 340, Math.PI * 0.55);

      // Dangling Conduit Lines & Frayed Wire Traces
      pitCtx.strokeStyle = '#0d131d';
      pitCtx.lineWidth = 2;
      pitCtx.beginPath();
      pitCtx.moveTo(140, 0);
      pitCtx.bezierCurveTo(145, 80, 160, 160, 150, 240);
      pitCtx.stroke();

      pitCtx.strokeStyle = '#0d131d';
      pitCtx.lineWidth = 1.5;
      pitCtx.beginPath();
      pitCtx.moveTo(390, 0);
      pitCtx.bezierCurveTo(380, 90, 410, 170, 400, 250);
      pitCtx.stroke();
    }

    const pitWallTex = new THREE.CanvasTexture(pitCanvas);
    pitWallTex.wrapS = THREE.RepeatWrapping;
    pitWallTex.wrapT = THREE.ClampToEdgeWrapping;
    pitWallTex.repeat.set(1, 1);
    this.materials.chasmCrackedConcrete.map = pitWallTex;
    this.materials.chasmCrackedConcrete.needsUpdate = true;
    this.materials.chasmBrokenSlab.map = pitWallTex;
    this.materials.chasmBrokenSlab.needsUpdate = true;
    this.materials.chasmRockSpire.map = pitWallTex;
    this.materials.chasmRockSpire.needsUpdate = true;

    // 9. Procedural Battery PCB Circuit Line & Battery Telemetry Texture (512x512)
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 512;
    circuitCanvas.height = 512;
    const circuitCtx = circuitCanvas.getContext('2d');
    if (circuitCtx) {
      circuitCtx.fillStyle = '#060f18';
      circuitCtx.fillRect(0, 0, 512, 512);

      // PCB Grid
      circuitCtx.strokeStyle = 'rgba(0, 255, 209, 0.1)';
      circuitCtx.lineWidth = 1;
      for (let i = 0; i < 512; i += 32) {
        circuitCtx.beginPath();
        circuitCtx.moveTo(i, 0);
        circuitCtx.lineTo(i, 512);
        circuitCtx.stroke();
        circuitCtx.beginPath();
        circuitCtx.moveTo(0, i);
        circuitCtx.lineTo(512, i);
        circuitCtx.stroke();
      }

      // Glowing Green/Cyan Bus Lines & Circuit Traces
      circuitCtx.strokeStyle = '#00ffd1';
      circuitCtx.lineWidth = 2.5;
      circuitCtx.shadowColor = '#00ffd1';
      circuitCtx.shadowBlur = 8;

      for (let t = 0; t < 16; t++) {
        const tx = (t * 32) % 512;
        circuitCtx.beginPath();
        circuitCtx.moveTo(tx, 0);
        circuitCtx.lineTo(tx, 140);
        circuitCtx.lineTo(tx + 20, 160);
        circuitCtx.lineTo(tx + 20, 350);
        circuitCtx.lineTo(tx, 370);
        circuitCtx.lineTo(tx, 512);
        circuitCtx.stroke();

        // Micro IC Chips & Vias
        circuitCtx.fillStyle = '#ffffff';
        circuitCtx.fillRect(tx + 16, 240, 8, 8);
        circuitCtx.fillStyle = '#00ff88';
        circuitCtx.beginPath();
        circuitCtx.arc(tx, 80, 3.5, 0, Math.PI * 2);
        circuitCtx.arc(tx, 440, 3.5, 0, Math.PI * 2);
        circuitCtx.fill();
      }

      // Battery Level Telemetry Meter (25%, 50%, 75%, 100%)
      circuitCtx.fillStyle = '#00ff66';
      circuitCtx.shadowColor = '#00ff66';
      circuitCtx.shadowBlur = 10;
      for (let b = 0; b < 4; b++) {
        circuitCtx.fillRect(60 + b * 100, 220, 70, 24);
      }
      circuitCtx.font = 'bold 20px monospace';
      circuitCtx.fillStyle = '#ffffff';
      circuitCtx.fillText('BIO-CELL 100%', 160, 280);
    }
    this.batteryCircuitTex = new THREE.CanvasTexture(circuitCanvas);
    this.batteryCircuitTex.wrapS = THREE.RepeatWrapping;
    this.batteryCircuitTex.wrapT = THREE.RepeatWrapping;
    this.batteryCircuitTex.repeat.set(2, 1);

    // 10. Procedural High-Contrast Hazard Caution Warning Stripes Texture (512x128)
    const cautionCanvas = document.createElement('canvas');
    cautionCanvas.width = 512;
    cautionCanvas.height = 128;
    const cautionCtx = cautionCanvas.getContext('2d');
    if (cautionCtx) {
      // Base Neon Amber Background
      cautionCtx.fillStyle = '#FF7700';
      cautionCtx.fillRect(0, 0, 512, 128);

      // Diagonal Heavy Black Caution Chevron Bands
      cautionCtx.fillStyle = '#070B14';
      const stripeWidth = 48;
      for (let x = -128; x < 640; x += stripeWidth * 2) {
        cautionCtx.beginPath();
        cautionCtx.moveTo(x, 0);
        cautionCtx.lineTo(x + stripeWidth, 0);
        cautionCtx.lineTo(x + stripeWidth + 128, 128);
        cautionCtx.lineTo(x + 128, 128);
        cautionCtx.closePath();
        cautionCtx.fill();
      }

      // Neon Red Glowing Edge Bars
      cautionCtx.strokeStyle = '#FF0055';
      cautionCtx.lineWidth = 6;
      cautionCtx.strokeRect(0, 0, 512, 128);
    }
    this.hazardCautionTex = new THREE.CanvasTexture(cautionCanvas);
    this.hazardCautionTex.wrapS = THREE.RepeatWrapping;
    this.hazardCautionTex.wrapT = THREE.RepeatWrapping;
    this.hazardCautionTex.repeat.set(4, 1);
    this.materials.hazardCautionBorderMat.map = this.hazardCautionTex;
    this.materials.hazardCautionBorderMat.needsUpdate = true;

    // 11. Procedural Holographic Warning Sign Texture (256x128)
    const warnCanvas = document.createElement('canvas');
    warnCanvas.width = 256;
    warnCanvas.height = 128;
    const warnCtx = warnCanvas.getContext('2d');
    if (warnCtx) {
      warnCtx.fillStyle = 'rgba(10, 4, 16, 0.9)';
      warnCtx.fillRect(0, 0, 256, 128);

      warnCtx.strokeStyle = '#FF7700';
      warnCtx.lineWidth = 3;
      warnCtx.strokeRect(4, 4, 248, 120);

      warnCtx.font = '900 22px "Orbitron", monospace';
      warnCtx.fillStyle = '#FF0055';
      warnCtx.textAlign = 'center';
      warnCtx.fillText('⚠️ DANGER // VOID ⚠️', 128, 44);

      warnCtx.font = 'bold 15px "Orbitron", monospace';
      warnCtx.fillStyle = '#FF7700';
      warnCtx.fillText('CHASM HAZARD PIT', 128, 76);

      warnCtx.font = 'bold 12px "Orbitron", monospace';
      warnCtx.fillStyle = '#00FFD1';
      warnCtx.fillText('>>> HYPER-DASH JUMP >>>', 128, 106);
    }
    this.hazardWarningTex = new THREE.CanvasTexture(warnCanvas);
    this.materials.hazardHoloMat.map = this.hazardWarningTex;
    this.materials.hazardHoloMat.needsUpdate = true;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.isMobileDevice =
      typeof window !== 'undefined' &&
      (Math.min(window.innerWidth, window.innerHeight) < 768 ||
        'ontouchstart' in window ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    const width = canvas.clientWidth || window.innerWidth || 1200;
    const height = canvas.clientHeight || window.innerHeight || 600;
    // Mobile Performance Optimization: 1.0 DPR on mobile completely eliminates GPU thermal throttling and lag
    const dpr = this.isMobileDevice
      ? Math.min(window.devicePixelRatio || 1, 1.0)
      : Math.min(window.devicePixelRatio || 1, 1.5);

    // 1. Create WebGLRenderer on the canvas with safe GPU fallback
    // Enable antialiasing ONLY for high-end screens (desktop 1080p/Retina) - never on mobile to prevent GPU thermal throttling
    const isHighEndScreen =
      !this.isMobileDevice &&
      typeof window !== 'undefined' &&
      (window.devicePixelRatio || 1) >= 1.5 &&
      window.innerWidth >= 1280;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: isHighEndScreen,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        precision: this.isMobileDevice ? 'mediump' : 'highp',
        desynchronized: true, // Direct-to-compositor low-latency pipeline (Mobile Legends / Unreal grade)
      } as any);
    } catch {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
      });
    }
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isMobileDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35; // Rich deep cyber-noir blacks with vivid neon glow highlights

    // 2. Initialize 3D Scene & Cyberpunk Atmospheric Laboratory Lighting
    // Dark & Moody Cyberpunk Atmosphere (0x030610) with glowing soft neon accents
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030610);
    // High-fidelity Volumetric Atmospheric Fog wrapping distant cyber structures into neon haze
    this.scene.fog = new THREE.FogExp2(0x030610, 0.00075);

    const aspect = width / height;
    // PerspectiveCamera with dynamic adaptive Field of View for mobile landscapes
    const baseFov = 65;
    const targetAspect = 16 / 9;
    let initialFov = baseFov;
    if (aspect < targetAspect) {
      const hFov = 2 * Math.atan(Math.tan((baseFov * Math.PI) / 360) * targetAspect);
      initialFov = (2 * Math.atan(Math.tan(hFov / 2) / aspect) * 180) / Math.PI;
    }
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 1.0, 14000);
    this.camera.position.set(0, 115, 175);
    this.camera.lookAt(0, 12, -180);

    // 3. Setup Contained, Balanced UnrealBloomPass Post-Processing Pipeline
    this.renderPass = new RenderPass(this.scene, this.camera);

    // Bloom Resolution & Parameters: bloomStrength = 0.28, bloomRadius = 0.22, threshold = 0.82
    const bloomResolution = new THREE.Vector2(width * dpr, height * dpr);
    this.bloomPass = new UnrealBloomPass(bloomResolution, 0.28, 0.22, 0.82);

    this.outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);

    // 4. Create 2D Overlay canvas for high-DPI text popups and metronome
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.id = 'game-overlay-canvas';
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.width = '100%';
    this.overlayCanvas.style.height = '100%';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '1';
    this.overlayCanvas.width = canvas.width;
    this.overlayCanvas.height = canvas.height;

    if (this.canvas.parentElement) {
      this.canvas.parentElement.appendChild(this.overlayCanvas);
    } else {
      setTimeout(() => {
        if (this.canvas.parentElement && !this.overlayCanvas.parentElement) {
          this.canvas.parentElement.appendChild(this.overlayCanvas);
        }
      }, 50);
    }

    const ctx = this.overlayCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create overlay canvas 2D context');
    this.overlayCtx = ctx;

    // Mobile Performance Optimization: Bypass CPU Gaussian shadowBlur calculations on mobile
    if (this.isMobileDevice) {
      try {
        Object.defineProperty(this.overlayCtx, 'shadowBlur', {
          get: () => 0,
          set: () => {},
          configurable: true,
        });
      } catch {}
    }

    // 5. Initialize Sub-Systems & Procedural Textures
    this.initProceduralTextures();
    this.initLights();
    this.initGroundAndGrid();
    this.initGoldenBillboardSystem();
    this.initFactoryEnvironment();
    this.initCyberRainSystem();
    this.initVolumetricFog();
    this.initPlayer3D();
    this.initGhost3D();
    this.initPortal3D();
    this.initSlashArc3D();
    this.initPlayerNeonTrails();
    this.init3DParticles();
    this.init3DBioSpores();
  }

  // --- 0. DYNAMIC GOLDEN NEON BILLBOARDS & BRANDING ENGINE (KKS, Cyber Game, Burma Batik) ---
  private initGoldenBillboardSystem() {
    // 1. Create Offscreen Canvases for Horizontal & Vertical Brand Signs
    const createOffscreen = (w: number, h: number) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Could not create offscreen billboard canvas 2D');
      return { canvas: c, ctx };
    };

    // Horizontal Billboards (512 x 200)
    const kksH = createOffscreen(512, 200);
    this.kksCanvasH = kksH.canvas;
    this.kksCtxH = kksH.ctx;
    this.kksTexH = new THREE.CanvasTexture(this.kksCanvasH);
    this.kksTexH.minFilter = THREE.LinearFilter;
    this.kksTexH.magFilter = THREE.LinearFilter;

    const cyberH = createOffscreen(512, 200);
    this.cyberGameCanvasH = cyberH.canvas;
    this.cyberGameCtxH = cyberH.ctx;
    this.cyberGameTexH = new THREE.CanvasTexture(this.cyberGameCanvasH);
    this.cyberGameTexH.minFilter = THREE.LinearFilter;
    this.cyberGameTexH.magFilter = THREE.LinearFilter;

    const burmaH = createOffscreen(512, 200);
    this.burmaBatikCanvasH = burmaH.canvas;
    this.burmaBatikCtxH = burmaH.ctx;
    this.burmaBatikTexH = new THREE.CanvasTexture(this.burmaBatikCanvasH);
    this.burmaBatikTexH.minFilter = THREE.LinearFilter;
    this.burmaBatikTexH.magFilter = THREE.LinearFilter;

    // Vertical Billboard Strips (140 x 512)
    const kksV = createOffscreen(140, 512);
    this.kksCanvasV = kksV.canvas;
    this.kksCtxV = kksV.ctx;
    this.kksTexV = new THREE.CanvasTexture(this.kksCanvasV);
    this.kksTexV.minFilter = THREE.LinearFilter;
    this.kksTexV.magFilter = THREE.LinearFilter;

    const cyberV = createOffscreen(140, 512);
    this.cyberGameCanvasV = cyberV.canvas;
    this.cyberGameCtxV = cyberV.ctx;
    this.cyberGameTexV = new THREE.CanvasTexture(this.cyberGameCanvasV);
    this.cyberGameTexV.minFilter = THREE.LinearFilter;
    this.cyberGameTexV.magFilter = THREE.LinearFilter;

    const burmaV = createOffscreen(140, 512);
    this.burmaBatikCanvasV = burmaV.canvas;
    this.burmaBatikCtxV = burmaV.ctx;
    this.burmaBatikTexV = new THREE.CanvasTexture(this.burmaBatikCanvasV);
    this.burmaBatikTexV.minFilter = THREE.LinearFilter;
    this.burmaBatikTexV.magFilter = THREE.LinearFilter;

    // 2. High-Emissive Golden Materials configured for UnrealBloomPass Post-Processing
    this.goldenMaterials = {
      kksH: new THREE.MeshStandardMaterial({
        map: this.kksTexH,
        emissiveMap: this.kksTexH,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      kksV: new THREE.MeshStandardMaterial({
        map: this.kksTexV,
        emissiveMap: this.kksTexV,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      cyberGameH: new THREE.MeshStandardMaterial({
        map: this.cyberGameTexH,
        emissiveMap: this.cyberGameTexH,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      cyberGameV: new THREE.MeshStandardMaterial({
        map: this.cyberGameTexV,
        emissiveMap: this.cyberGameTexV,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      burmaBatikH: new THREE.MeshStandardMaterial({
        map: this.burmaBatikTexH,
        emissiveMap: this.burmaBatikTexH,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      burmaBatikV: new THREE.MeshStandardMaterial({
        map: this.burmaBatikTexV,
        emissiveMap: this.burmaBatikTexV,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      goldNeonTrim: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.8,
      }),
      goldNeonTrimBright: new THREE.MeshStandardMaterial({
        color: 0xffe600,
        emissive: new THREE.Color(0xffe600),
        emissiveIntensity: 0.48,
        roughness: 0.2,
        metalness: 0.8,
      }),
      amberNeonTrim: new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: new THREE.Color(0xffaa00),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      }),
      darkChassis: new THREE.MeshStandardMaterial({
        color: 0x121522,
        roughness: 0.2,
        metalness: 0.8,
      }),
      scaffoldingSteel: new THREE.MeshStandardMaterial({
        color: 0x181a28,
        roughness: 0.3,
        metalness: 0.85,
      }),
      beaconRed: new THREE.MeshBasicMaterial({
        color: 0xff0044,
      }),
      beaconAmber: new THREE.MeshBasicMaterial({
        color: 0xffaa00,
      }),
    };

    // 3. Dynamic Golden PointLight Pool for real-time light bleed & reflections
    for (let l = 0; l < this.MAX_GOLDEN_LIGHTS; l++) {
      const pLight = new THREE.PointLight(0xffb900, 0, 360, 1.2);
      pLight.visible = false;
      this.scene.add(pLight);
      this.dynamicGoldenLights.push(pLight);
    }

    // Initial render pass on all 6 brand textures
    this.renderGoldenCanvasTextures(0);
  }

  // --- DYNAMIC HTML5 CANVAS BRAND TEXTURE DRAWING ENGINE ---
  public renderGoldenCanvasTextures(time: number) {
    this.drawKKSCanvas(this.kksCtxH, 512, 200, time, false);
    this.drawKKSCanvas(this.kksCtxV, 140, 512, time, true);
    this.kksTexH.needsUpdate = true;
    this.kksTexV.needsUpdate = true;

    this.drawCyberGameCanvas(this.cyberGameCtxH, 512, 200, time, false);
    this.drawCyberGameCanvas(this.cyberGameCtxV, 140, 512, time, true);
    this.cyberGameTexH.needsUpdate = true;
    this.cyberGameTexV.needsUpdate = true;

    this.drawBurmaBatikCanvas(this.burmaBatikCtxH, 512, 200, time, false);
    this.drawBurmaBatikCanvas(this.burmaBatikCtxV, 140, 512, time, true);
    this.burmaBatikTexH.needsUpdate = true;
    this.burmaBatikTexV.needsUpdate = true;
  }

  // 1. BRAND SIGNAGE: "KKS" (Luxury Cybernetic S-Tier Monogram & Quantum Corp)
  private drawKKSCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _time: number,
    isVertical: boolean
  ) {
    ctx.save();
    // Solid Pitch Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Sharp Gold Neon Frame Border
    const pad = isVertical ? 6 : 8;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    if (!isVertical) {
      // Horizontal Brand Billboard: "KKS"
      const cx = w / 2;
      const cy = h / 2;

      // Status Header Tagline
      ctx.font = 'bold 12px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('◆ QUANTUM CORP // S-TIER ◆', cx, 36);

      // Main Text: "KKS" (Sharp Gold)
      ctx.font = '900 84px "Orbitron", sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('KKS', cx, cy + 28);

      ctx.fillStyle = '#FFF8DC';
      ctx.fillText('KKS', cx, cy + 28);

      // Sub-Caption Ticker
      ctx.font = 'bold 11px "Orbitron", monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('CYBER MAINFRAME // [ONLINE]', cx, h - 22);
    } else {
      // Vertical Strip Billboard: "K · K · S"
      const cx = w / 2;
      ctx.font = 'bold 10px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('KKS', cx, 28);

      const glyphs = ['K', 'K', 'S'];
      const startY = 110;
      const stepY = 120;

      for (let i = 0; i < glyphs.length; i++) {
        const gy = startY + i * stepY;
        ctx.font = '900 62px "Orbitron", sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(glyphs[i], cx, gy + 20);
      }

      ctx.font = 'bold 9px "Orbitron", monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('2099', cx, h - 18);
    }

    ctx.restore();
  }

  // 2. BRAND SIGNAGE: "Cyber Game" (High-Energy Arcade Synthwave Golden Sign)
  private drawCyberGameCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
    isVertical: boolean
  ) {
    ctx.save();
    // Solid Pitch Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Outer Gold Border
    const pad = isVertical ? 6 : 8;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    if (!isVertical) {
      const cx = w / 2;

      // Header Tagline
      ctx.font = 'bold 11px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('► ARCADE 2099 // LEVEL 99 ◄', cx, 36);

      // Main Text: "Cyber Game"
      ctx.font = 'italic 900 54px "Orbitron", sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('Cyber Game', cx, 105);

      ctx.fillStyle = '#FFF8DC';
      ctx.fillText('Cyber Game', cx, 105);

      // Clean Audio Spectrum Equalizer Bars
      const numBars = 16;
      const barW = 14;
      const barGap = 6;
      const startX = cx - ((numBars * (barW + barGap)) / 2);
      const baseY = h - 20;

      for (let b = 0; b < numBars; b++) {
        const barH = 6 + Math.abs(Math.sin(time * 5 + b * 0.5)) * 22;
        const bx = startX + b * (barW + barGap);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(bx, baseY - barH, barW, barH);
      }
    } else {
      // Vertical Strip: "CYBER" & "GAME"
      const cx = w / 2;
      ctx.font = 'bold 10px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('ARCADE', cx, 30);

      const words = ['C', 'Y', 'B', 'E', 'R', '•', 'G', 'A', 'M', 'E'];
      const startY = 62;
      const stepY = 40;

      for (let i = 0; i < words.length; i++) {
        const wy = startY + i * stepY;
        const isBullet = words[i] === '•';
        ctx.font = isBullet ? '900 22px "Orbitron", sans-serif' : 'italic 900 30px "Orbitron", sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(words[i], cx, wy);
      }

      ctx.font = 'bold 9px "Orbitron", monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('LVL.99', cx, h - 18);
    }

    ctx.restore();
  }

  // 3. BRAND SIGNAGE: "Burma Batik" (Royal Burmese Heritage & Intricate Geometric Batik Filigree)
  private drawBurmaBatikCanvas(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _time: number,
    isVertical: boolean
  ) {
    ctx.save();
    // Solid Pitch Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Outer Gold Border
    const pad = isVertical ? 6 : 8;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    if (!isVertical) {
      const cx = w / 2;

      // Header Tagline
      ctx.font = 'bold 12px "Orbitron", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('★ ROYAL HERITAGE 2099 ★', cx, 36);

      // Main Text: "Burma Batik"
      ctx.font = 'bold 52px "Cinzel", "Georgia", serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('Burma Batik', cx, 105);

      ctx.fillStyle = '#FFF8DC';
      ctx.fillText('Burma Batik', cx, 105);

      // Status Footer
      ctx.font = 'bold 11px "Orbitron", monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('BURMESE SILK & NEON WEAVE', cx, h - 22);
    } else {
      // Vertical Strip: "BURMA" & "BATIK"
      const cx = w / 2;
      ctx.font = 'bold 10px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('ROYAL', cx, 28);

      const burmaLetters = ['B', 'U', 'R', 'M', 'A'];
      const batikLetters = ['B', 'A', 'T', 'I', 'K'];

      // Draw BURMA (Top half)
      for (let i = 0; i < burmaLetters.length; i++) {
        const y = 70 + i * 36;
        ctx.font = 'bold 30px "Cinzel", "Georgia", serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(burmaLetters[i], cx, y);
      }

      // Draw BATIK (Bottom half)
      for (let i = 0; i < batikLetters.length; i++) {
        const y = 280 + i * 36;
        ctx.font = 'bold 30px "Cinzel", "Georgia", serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(batikLetters[i], cx, y);
      }

      ctx.font = 'bold 9px "Orbitron", monospace';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('2099', cx, h - 18);
    }

    ctx.restore();
  }

  // --- 3D HOLOGRAPHIC CYBERPUNK ADVERTISEMENT & BILLBOARD MESH ENGINE ---
  public create3DGoldenBillboardMesh(
    brand: 'KKS' | 'Cyber Game' | 'Burma Batik',
    orientation: 'HORIZONTAL_ROOFTOP' | 'VERTICAL_WALL_STRIP' | 'WALL_BANNER',
    width: number = 140,
    height: number = 55
  ): THREE.Group {
    const group = new THREE.Group();
    const isVertical = orientation === 'VERTICAL_WALL_STRIP';

    // 1. Select the dynamic high-emissive screen material
    let screenMat: THREE.MeshStandardMaterial;
    if (brand === 'KKS') {
      screenMat = isVertical ? this.goldenMaterials.kksV : this.goldenMaterials.kksH;
    } else if (brand === 'Cyber Game') {
      screenMat = isVertical ? this.goldenMaterials.cyberGameV : this.goldenMaterials.cyberGameH;
    } else {
      screenMat = isVertical ? this.goldenMaterials.burmaBatikV : this.goldenMaterials.burmaBatikH;
    }

    const screenW = width;
    const screenH = height;

    // 2. Heavy Industrial Rooftop / Wall Mounting Base with Emitter Louvers
    const projectorBaseGeo = new THREE.BoxGeometry(screenW * 0.95, 10, 16);
    const projectorBase = new THREE.Mesh(projectorBaseGeo, this.materials.factorySteel);
    projectorBase.position.set(0, -screenH / 2 - 6, 0);
    projectorBase.castShadow = true;
    projectorBase.receiveShadow = true;
    group.add(projectorBase);

    // Optical Hologram Emitter Lenses (Glow Discs)
    const lensCount = Math.max(3, Math.floor(screenW / 35));
    for (let l = 0; l < lensCount; l++) {
      const lx = ((l / (lensCount - 1)) - 0.5) * (screenW * 0.82);
      const lensGeo = new THREE.CylinderGeometry(4.5, 5, 2, 12);
      const lensMat = brand === 'Burma Batik'
        ? this.goldenMaterials.beaconAmber
        : brand === 'KKS'
        ? this.materials.labNeonCyan
        : this.materials.labNeonMagenta;
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.set(lx, -screenH / 2, 0);
      group.add(lensMesh);
    }

    // 4. Floating 3D Holographic Display Panel
    const screenGeo = new THREE.BoxGeometry(screenW, screenH, 3);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, 0);
    screenMesh.name = 'hologramScreen';
    group.add(screenMesh);

    // 5. Dark Titanium Chassis Beveled Backing Frame
    const chassisGeo = new THREE.BoxGeometry(screenW + 4, screenH + 4, 5);
    const chassisMesh = new THREE.Mesh(chassisGeo, this.goldenMaterials.darkChassis);
    chassisMesh.position.set(0, 0, -2);
    chassisMesh.castShadow = true;
    group.add(chassisMesh);

    // 6. Perimeter Golden / Cyan Neon Tube Trim (Intense Bloom Bleed)
    const trimGeo = new THREE.BoxGeometry(screenW + 6, screenH + 6, 2);
    const trimEdges = new THREE.EdgesGeometry(trimGeo);
    const trimMat = brand === 'Burma Batik'
      ? this.goldenMaterials.goldNeonTrimBright
      : this.goldenMaterials.amberNeonTrim;
    const trimMesh = new THREE.LineSegments(trimEdges, trimMat);
    trimMesh.position.set(0, 0, 1.8);
    group.add(trimMesh);

    // 7. Scaffolding Support Stanchions & Hydraulic Braces
    const legGeo = new THREE.CylinderGeometry(2, 2.5, 26, 8);
    const leftLeg = new THREE.Mesh(legGeo, this.goldenMaterials.scaffoldingSteel);
    leftLeg.position.set(-screenW * 0.38, -screenH / 2 - 14, -4);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, this.goldenMaterials.scaffoldingSteel);
    rightLeg.position.set(screenW * 0.38, -screenH / 2 - 14, -4);
    group.add(rightLeg);

    // 8. Rooftop Warning Aviation Beacons (Flashing Hazard Strobes)
    const beaconGeo = new THREE.BoxGeometry(4.5, 6, 4.5);
    const leftBeacon = new THREE.Mesh(beaconGeo, this.goldenMaterials.beaconAmber);
    leftBeacon.position.set(-screenW / 2, screenH / 2 + 4, 0);
    group.add(leftBeacon);

    const rightBeacon = new THREE.Mesh(beaconGeo, this.goldenMaterials.beaconRed);
    rightBeacon.position.set(screenW / 2, screenH / 2 + 4, 0);
    group.add(rightBeacon);

    return group;
  }

  // --- 1. LIGHTING RIG (REAL-TIME 3D CYBER-ORGANIC ILLUMINATION & SHADOW RIG) ---
  private initLights() {
    // 1. Cyber Noir Ambient Light (Atmospheric depth with luminous blue undertones)
    this.ambientLight = new THREE.AmbientLight(0x060c1c, 0.12);
    this.scene.add(this.ambientLight);

    // 2. Subtle Directional Key Light (Electric Cyan 0x00ffd1 for distant silhouette highlights)
    const keyShadowRes = this.isMobileDevice ? 256 : 2048;

    this.dirCyanKeyLight = new THREE.DirectionalLight(0x00ffd1, 0.22);
    this.dirCyanKeyLight.position.set(450, 1400, 550);
    this.dirCyanKeyLight.castShadow = true;
    this.dirCyanKeyLight.shadow.mapSize.width = keyShadowRes;
    this.dirCyanKeyLight.shadow.mapSize.height = keyShadowRes;
    this.dirCyanKeyLight.shadow.bias = -0.00015;
    this.dirCyanKeyLight.shadow.camera.near = 50;
    this.dirCyanKeyLight.shadow.camera.far = 3800;
    const d = 950;
    this.dirCyanKeyLight.shadow.camera.left = -d;
    this.dirCyanKeyLight.shadow.camera.right = d;
    this.dirCyanKeyLight.shadow.camera.top = d;
    this.dirCyanKeyLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirCyanKeyLight);

    // 3. Directional Rim Light (Vibrant Magenta 0xff00e5 for high-contrast cinematic edge lighting)
    this.dirMagentaRimLight = new THREE.DirectionalLight(0xff00e5, 0.18);
    this.dirMagentaRimLight.position.set(-500, 1100, -600);
    this.scene.add(this.dirMagentaRimLight);

    // 4. Real-Time High-Intensity Forward Flashlight (Forward-facing tactical spotlight illuminating dark terrain & revealing hazards)
    this.heroSpotLight = new THREE.SpotLight(0xe8f8ff, 15.5, 1400, Math.PI / 3.4, 0.35, 1.2);
    this.heroSpotLight.position.set(0, 28, 0);
    // On mobile, keep flashlight illuminated but disable second shadow pass to cut shadow GPU cost by 50%
    this.heroSpotLight.castShadow = !this.isMobileDevice;
    if (!this.isMobileDevice) {
      this.heroSpotLight.shadow.mapSize.width = 1024;
      this.heroSpotLight.shadow.mapSize.height = 1024;
      this.heroSpotLight.shadow.bias = -0.0001;
      this.heroSpotLight.shadow.camera.near = 10;
      this.heroSpotLight.shadow.camera.far = 1300;
    }

    this.heroSpotLightTarget = new THREE.Object3D();
    this.heroSpotLightTarget.position.set(0, 0, -360);
    this.scene.add(this.heroSpotLightTarget);
    this.heroSpotLight.target = this.heroSpotLightTarget;
    this.scene.add(this.heroSpotLight);

    // 5. Player Dynamic Tactical PointLight (Radiant Core Neon Aura)
    this.playerPointLight = new THREE.PointLight(0x00ffd1, 2.0, 320, 1.2);
    this.playerPointLight.position.set(0, 30, 0);
    this.scene.add(this.playerPointLight);

    // 6. Katana Slash Point Light & Blaster Muzzle Light
    this.swordLight = new THREE.PointLight(0xff00e5, 0, 340, 1.8);
    this.swordLight.position.set(0, 35, 0);
    this.scene.add(this.swordLight);

    this.blasterLight = new THREE.PointLight(0x00ffd1, 0, 320, 2.0);
    this.blasterLight.position.set(0, 30, 0);
    this.scene.add(this.blasterLight);

    // 7. Portal Green Beacon Light
    this.portalPointLight = new THREE.PointLight(0x00ff66, 3.2, 700, 1.2);
    this.portalPointLight.position.set(0, 60, -1000);
    this.scene.add(this.portalPointLight);

    // 8. Projectile Real-Time Dynamic Point Light (Volumetric plasma illumination)
    this.projectilePointLight = new THREE.PointLight(0x00ffd1, 0, 420, 1.8);
    this.projectilePointLight.position.set(0, 30, 0);
    this.scene.add(this.projectilePointLight);
  }

  // --- 1.2 DYNAMIC GRAPHICS QUALITY & MOBILE SHADOW TUNING ---
  public applyGraphicsSettings(settings: GameSettings, isMobile: boolean) {
    const quality = settings.graphicsQuality || (isMobile ? 'LOW' : 'HIGH');
    const isLow = quality === 'LOW' || !!settings.lowGraphicsMode;

    if (isLow) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      if (this.dirCyanKeyLight && this.dirCyanKeyLight.shadow) {
        this.dirCyanKeyLight.shadow.mapSize.width = 256;
        this.dirCyanKeyLight.shadow.mapSize.height = 256;
      }
      if (this.heroSpotLight) {
        this.heroSpotLight.castShadow = false;
      }
    } else if (quality === 'MEDIUM') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      if (this.dirCyanKeyLight && this.dirCyanKeyLight.shadow) {
        this.dirCyanKeyLight.shadow.mapSize.width = 512;
        this.dirCyanKeyLight.shadow.mapSize.height = 512;
      }
      if (this.heroSpotLight) {
        this.heroSpotLight.castShadow = false;
      }
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
      if (this.dirCyanKeyLight && this.dirCyanKeyLight.shadow) {
        this.dirCyanKeyLight.shadow.mapSize.width = isMobile ? 512 : 2048;
        this.dirCyanKeyLight.shadow.mapSize.height = isMobile ? 512 : 2048;
      }
      if (this.heroSpotLight) {
        this.heroSpotLight.castShadow = !isMobile;
      }
    }
  }

  // --- 1.5 HIGH-FIDELITY VOLUMETRIC FOG & ATMOSPHERIC MIST SYSTEM ---
  private initVolumetricFog() {
    this.volumetricFogGroup = new THREE.Group();

    // 1. Procedural Ground Mist Planes with Soft Drifting Alpha Noise
    const createMistTexture = (colorHex: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(0.35, colorHex);
        grad.addColorStop(0.7, 'rgba(0, 255, 209, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        // Soft organic noise spots
        for (let i = 0; i < 30; i++) {
          const rx = Math.random() * 512;
          const ry = Math.random() * 512;
          const rr = 20 + Math.random() * 60;
          const spotGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
          spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
          spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = spotGrad;
          ctx.beginPath();
          ctx.arc(rx, ry, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const cyanMistTex = createMistTexture('rgba(0, 255, 209, 0.38)');
    const magentaMistTex = createMistTexture('rgba(255, 0, 229, 0.28)');

    // Multiple layered ground fog mist planes spanning the environment
    const mistPlaneGeo = new THREE.PlaneGeometry(3600, 3600, 1, 1);
    mistPlaneGeo.rotateX(-Math.PI / 2);

    const mistLayers = [
      { y: 6, tex: cyanMistTex, opacity: 0.28, rotSpeed: 0.0003 },
      { y: 14, tex: magentaMistTex, opacity: 0.20, rotSpeed: -0.00025 },
      { y: 24, tex: cyanMistTex, opacity: 0.16, rotSpeed: 0.0002 },
      { y: 38, tex: magentaMistTex, opacity: 0.12, rotSpeed: -0.00015 },
    ];

    for (let i = 0; i < mistLayers.length; i++) {
      const cfg = mistLayers[i];
      const mat = new THREE.MeshBasicMaterial({
        map: cfg.tex,
        transparent: true,
        opacity: cfg.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(mistPlaneGeo, mat);
      mesh.position.y = cfg.y;
      this.volumetricFogGroup.add(mesh);
      this.volumetricFogPlanes.push(mesh);
    }

    // 2. Hero Volumetric Light Beam Cone (Subtle, sleek, non-obstructive)
    const coneGeo = new THREE.ConeGeometry(70, 300, 16, 1, true);
    coneGeo.translate(0, -150, 0);
    coneGeo.rotateX(-Math.PI / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      transparent: true,
      opacity: 0.03,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.heroVolumetricCone = new THREE.Mesh(coneGeo, coneMat);
    this.heroVolumetricCone.position.set(0, 24, 0);
    this.scene.add(this.heroVolumetricCone);

    // 3. Volumetric Fog Base
    this.volumetricShaftsGroup = new THREE.Group();
    this.volumetricFogGroup.add(this.volumetricShaftsGroup);
    this.scene.add(this.volumetricFogGroup);
  }

  // --- 2. GROUND & HIGH-TECH CYBER-LABORATORY GRID WITH BRAND PROJECTIONS ---
  private initGroundAndGrid() {
    // Large Laboratory Ground Plane with High Reflectivity & Deep Dark Base Tone
    const groundGeo = new THREE.PlaneGeometry(12000, 12000, 1, 1);
    groundGeo.rotateX(-Math.PI / 2);
    this.groundPlaneMesh = new THREE.Mesh(groundGeo, this.materials.cyberFloor);
    this.groundPlaneMesh.position.y = -1;
    this.groundPlaneMesh.receiveShadow = true;
    this.scene.add(this.groundPlaneMesh);

    // Subtle, Thin, Dark Slate/Navy Floor Grid (Non-distracting, clean perspective lines)
    const size = 10000;
    const divisions = 180;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x142236, 0x09111c);
    gridHelper.position.y = 0.5;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.35;
    }
    this.gridFloorMesh = gridHelper as unknown as THREE.LineSegments;
    this.scene.add(this.gridFloorMesh);

    // Floor Decals Group (Subtle, non-distracting atmospheric runway markings)
    this.floorDecalsGroup = new THREE.Group();
    for (let r = 0; r < 8; r++) {
      const ringGeo = new THREE.RingGeometry(300 + r * 450, 303 + r * 450, 48);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0e1c2e,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = 0.8;
      this.floorDecalsGroup.add(ringMesh);
    }

    // --- PROCEDURAL GROUND PROJECTED TEXT STENCILS: "KKS" & "Burma Batik" ---
    const createProjectedTextTexture = (brand: 'KKS' | 'Burma Batik') => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 512, 256);

        if (brand === 'KKS') {
          // Sharp Cyber Gold / Cyan Neon Ground Projection
          ctx.strokeStyle = 'rgba(0, 255, 209, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(20, 20, 472, 216);

          ctx.textAlign = 'center';
          ctx.font = 'bold 14px "Orbitron", monospace';
          ctx.fillStyle = 'rgba(0, 255, 209, 0.6)';
          ctx.fillText('QUANTUM CORP // PROTOCOL 2099', 256, 56);

          ctx.font = '900 70px "Orbitron", sans-serif';
          ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
          ctx.fillText('KKS', 256, 142);

          ctx.font = 'bold 12px "Orbitron", monospace';
          ctx.fillStyle = 'rgba(0, 255, 209, 0.4)';
          ctx.fillText('[ SECTOR 01 ]', 256, 196);
        } else {
          // Royal Burmese Geometric Filigree Gold Ground Projection
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(20, 20, 472, 216);

          ctx.textAlign = 'center';
          ctx.font = 'bold 14px "Orbitron", serif';
          ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
          ctx.fillText('ROYAL HERITAGE', 256, 56);

          ctx.font = 'bold 52px "Cinzel", "Georgia", serif';
          ctx.fillStyle = 'rgba(255, 248, 220, 0.75)';
          ctx.fillText('Burma Batik', 256, 138);

          ctx.font = 'bold 12px "Orbitron", monospace';
          ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
          ctx.fillText('BURMESE CULTURE × METAVERSE 2099', 256, 196);
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const kksGroundTex = createProjectedTextTexture('KKS');
    const burmaGroundTex = createProjectedTextTexture('Burma Batik');

    const kksGroundMat = new THREE.MeshBasicMaterial({
      map: kksGroundTex,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const burmaGroundMat = new THREE.MeshBasicMaterial({
      map: burmaGroundTex,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const stencilGeo = new THREE.PlaneGeometry(240, 120);
    stencilGeo.rotateX(-Math.PI / 2);

    // Populate highway runways with subtle KKS and Burma Batik ground markings
    const stencilZPositions = [-2400, -1500, -600, 300, 1200, 2100];
    for (let idx = 0; idx < stencilZPositions.length; idx++) {
      const zPos = stencilZPositions[idx];
      const isKKS = idx % 2 === 0;
      const mesh = new THREE.Mesh(stencilGeo, isKKS ? kksGroundMat : burmaGroundMat);
      const laneOffset = (idx % 3 - 1) * 350;
      mesh.position.set(laneOffset, 1.2, zPos);
      this.floorDecalsGroup.add(mesh);
    }

    this.scene.add(this.floorDecalsGroup);
  }

  // --- 3. MASSIVE 3D SCI-FI FACTORY FLOOR & ENVIRONMENT ARCHITECTURE ---
  private initFactoryEnvironment() {
    this.factoryFloorGroup = new THREE.Group();

    // 1. Sprawling Industrial Factory Mega-Towers & Heavy Perimeter Architecture
    const towerCount = 12;
    for (let t = 0; t < towerCount; t++) {
      const angle = (t / towerCount) * Math.PI * 2;
      const dist = 2200 + (t % 3) * 380;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;
      const towerHeight = 750 + (t % 4) * 220;
      const towerWidth = 140 + (t % 3) * 50;

      const towerGroup = new THREE.Group();
      towerGroup.position.set(tx, 0, tz);

      // Main Reinforced Steel Bulkhead Tower Body
      const towerGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerWidth);
      towerGeo.translate(0, towerHeight / 2, 0);
      const towerMesh = new THREE.Mesh(towerGeo, this.materials.factorySteel);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      towerGroup.add(towerMesh);

      // Structural Heavy Steel Truss Ribs
      for (let s = 120; s < towerHeight - 80; s += 160) {
        const trussGeo = new THREE.BoxGeometry(towerWidth + 12, 14, towerWidth + 12);
        const trussMesh = new THREE.Mesh(trussGeo, this.materials.factoryTrussSteel);
        trussMesh.position.y = s;
        towerGroup.add(trussMesh);

        // Glowing Neon Hazard Band
        const bandGeo = new THREE.BoxGeometry(towerWidth + 14, 3, towerWidth + 14);
        const bandMat = t % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonMagenta;
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.y = s + 7;
        towerGroup.add(bandMesh);
      }

      // Rooftop Industrial Smokestack & Exhaust Turbine
      const stackGeo = new THREE.CylinderGeometry(18, 24, 90, 12);
      stackGeo.translate(0, 45, 0);
      const stackMesh = new THREE.Mesh(stackGeo, this.materials.factorySteel);
      stackMesh.position.set(0, towerHeight, 0);
      towerGroup.add(stackMesh);

      // Spinning Rooftop Turbine Blades
      const turbineGroup = new THREE.Group();
      turbineGroup.position.set(0, towerHeight + 90, 0);
      for (let b = 0; b < 4; b++) {
        const bladeGeo = new THREE.BoxGeometry(32, 2, 8);
        bladeGeo.rotateY((b / 4) * Math.PI * 2);
        const bladeMesh = new THREE.Mesh(bladeGeo, this.materials.factoryTrussSteel);
        turbineGroup.add(bladeMesh);
      }
      towerGroup.add(turbineGroup);
      this.spinningTurbines.push({ mesh: turbineGroup, axis: 'y', speed: 0.08 + (t % 3) * 0.04 });

      // Rooftop Aviation Warning Beacons
      const beaconGeo = new THREE.BoxGeometry(6, 10, 6);
      const beaconMesh = new THREE.Mesh(beaconGeo, t % 2 === 0 ? this.goldenMaterials.beaconAmber : this.goldenMaterials.beaconRed);
      beaconMesh.position.set(0, towerHeight + 100, 0);
      towerGroup.add(beaconMesh);

      // Attach Glowing 3D Hologram Advertisements to Mega-Tower Facades
      const brands: Array<'KKS' | 'Cyber Game' | 'Burma Batik'> = ['KKS', 'Cyber Game', 'Burma Batik'];
      const brand = brands[t % 3];
      const towerAd = this.create3DGoldenBillboardMesh(brand, 'VERTICAL_WALL_STRIP', 44, 130);
      towerAd.position.set(0, towerHeight * 0.55, towerWidth / 2 + 4);
      towerGroup.add(towerAd);

      this.factoryFloorGroup.add(towerGroup);
    }

    // 2. Overhead Heavy Steel Gantry Bridges & Suspended Crane I-Beam Tracks
    const bridgeCount = 6;
    for (let bg = 0; bg < bridgeCount; bg++) {
      const gantryGroup = new THREE.Group();
      const angle = (bg / bridgeCount) * Math.PI;
      const gHeight = 220 + bg * 45;
      const gLength = 4600;

      // Heavy I-Beam Rail Track
      const beamGeo = new THREE.BoxGeometry(gLength, 18, 36);
      const beamMesh = new THREE.Mesh(beamGeo, this.materials.factoryTrussSteel);
      beamMesh.position.y = gHeight;
      beamMesh.rotation.y = angle;
      gantryGroup.add(beamMesh);

      // Underside Glowing Neon Rail Light Strip
      const railGlowGeo = new THREE.BoxGeometry(gLength * 0.96, 2.5, 3);
      const railGlowMat = bg % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonAmber;
      const railGlowMesh = new THREE.Mesh(railGlowGeo, railGlowMat);
      railGlowMesh.position.set(0, gHeight - 9.5, 0);
      railGlowMesh.rotation.y = angle;
      gantryGroup.add(railGlowMesh);

      this.factoryFloorGroup.add(gantryGroup);
      this.factoryGantryTrusses.push(gantryGroup);
    }

    // 3. Multi-Tiered Industrial Ventilation Fan Units along the Floor Perimeter
    const fanCount = 8;
    for (let f = 0; f < fanCount; f++) {
      const fAngle = (f / fanCount) * Math.PI * 2 + 0.3;
      const fDist = 1500;
      const fx = Math.cos(fAngle) * fDist;
      const fz = Math.sin(fAngle) * fDist;

      const fanHousing = new THREE.Group();
      fanHousing.position.set(fx, 40, fz);
      fanHousing.rotation.y = fAngle + Math.PI / 2;

      // Fan Housing Outer Ring
      const ductGeo = new THREE.CylinderGeometry(42, 42, 28, 16, 1, true);
      ductGeo.rotateZ(Math.PI / 2);
      const ductMesh = new THREE.Mesh(ductGeo, this.materials.factorySteel);
      fanHousing.add(ductMesh);

      // Rotating Fan Propeller
      const bladesGroup = new THREE.Group();
      for (let b = 0; b < 6; b++) {
        const bladeGeo = new THREE.BoxGeometry(34, 7, 2);
        bladeGeo.rotateZ((b / 6) * Math.PI * 2);
        const bladeMesh = new THREE.Mesh(bladeGeo, this.materials.factoryTrussSteel);
        bladesGroup.add(bladeMesh);
      }
      fanHousing.add(bladesGroup);
      this.spinningTurbines.push({ mesh: bladesGroup, axis: 'x', speed: 0.12 });

      // Glowing Hazard Outer Ring
      const ringGeo = new THREE.TorusGeometry(43, 2, 8, 24);
      ringGeo.rotateY(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, this.materials.labNeonAmber);
      fanHousing.add(ringMesh);

      this.factoryFloorGroup.add(fanHousing);
    }

    // 4. MULTI-LAYERED MOVING NEON PLATFORMS
    // Layer 1: Low-Altitude Conveyor Cargo Lifts (Y = 28 to 55)
    for (let p1 = 0; p1 < 6; p1++) {
      const pGroup = new THREE.Group();
      const pWidth = 110 + (p1 % 2) * 35;
      const pDepth = 85 + (p1 % 2) * 25;
      const pHeight = 12;

      // Platform Base Deck (Heavy Steel Plates)
      const deckGeo = new THREE.BoxGeometry(pWidth, pHeight, pDepth);
      deckGeo.translate(0, pHeight / 2, 0);
      const deckMesh = new THREE.Mesh(deckGeo, this.materials.factorySteel);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      pGroup.add(deckMesh);

      // Perimeter Caution Hazard Border
      const hazBorderGeo = new THREE.BoxGeometry(pWidth + 2, 3, pDepth + 2);
      const hazBorder = new THREE.Mesh(hazBorderGeo, this.materials.factoryHazardStripes);
      hazBorder.position.y = pHeight + 1.5;
      pGroup.add(hazBorder);

      // High-Emissive Neon Edge Strips
      const neonStrips: THREE.Mesh[] = [];
      const stripGeo = new THREE.BoxGeometry(pWidth + 3, 2, 2);
      const stripMat = p1 % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonMagenta;
      const stripFront = new THREE.Mesh(stripGeo, stripMat);
      stripFront.position.set(0, pHeight + 2, pDepth / 2 + 1);
      pGroup.add(stripFront);
      neonStrips.push(stripFront);

      const stripBack = new THREE.Mesh(stripGeo, stripMat);
      stripBack.position.set(0, pHeight + 2, -pDepth / 2 - 1);
      pGroup.add(stripBack);
      neonStrips.push(stripBack);

      // Cargo Pods & Crates on Deck
      for (let c = 0; c < 2; c++) {
        const crateGeo = new THREE.BoxGeometry(26, 22, 26);
        crateGeo.translate(0, 11, 0);
        const crateMesh = new THREE.Mesh(crateGeo, this.materials.factoryTrussSteel);
        crateMesh.position.set((c === 0 ? -24 : 24), pHeight, 0);
        pGroup.add(crateMesh);

        // Glowing Core Barcode Tag
        const tagGeo = new THREE.BoxGeometry(16, 6, 28);
        const tagMat = p1 % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonAmber;
        const tagMesh = new THREE.Mesh(tagGeo, tagMat);
        tagMesh.position.set((c === 0 ? -24 : 24), pHeight + 12, 0);
        pGroup.add(tagMesh);
      }

      // Base Rails underneath
      const railGeo = new THREE.BoxGeometry(650, 4, 6);
      const railMesh = new THREE.Mesh(railGeo, this.materials.factoryTrussSteel);
      railMesh.position.set(0, 2, 0);
      if (p1 % 2 === 1) railMesh.rotation.y = Math.PI / 2;

      const baseX = -700 + (p1 % 3) * 700;
      const baseZ = -700 + Math.floor(p1 / 3) * 1400;
      const baseY = 28 + (p1 % 2) * 18;

      pGroup.position.set(baseX, baseY, baseZ);
      this.factoryFloorGroup.add(pGroup);

      this.movingPlatforms.push({
        group: pGroup,
        layer: 'CONVEYOR',
        basePos: new THREE.Vector3(baseX, baseY, baseZ),
        amplitude: p1 % 2 === 0 ? new THREE.Vector3(260, 0, 0) : new THREE.Vector3(0, 0, 260),
        speed: 0.8 + (p1 % 3) * 0.4,
        phase: p1 * 1.1,
        neonStrips,
      });
    }

    // Layer 2: Suspended Heavy Crane Gantry Platforms (Y = 85 to 165)
    for (let p2 = 0; p2 < 6; p2++) {
      const craneGroup = new THREE.Group();
      const cWidth = 130;
      const cDepth = 95;
      const cHeight = 10;

      // Platform Deck
      const cDeckGeo = new THREE.BoxGeometry(cWidth, cHeight, cDepth);
      const cDeck = new THREE.Mesh(cDeckGeo, this.materials.factorySteel);
      cDeck.castShadow = true;
      cDeck.receiveShadow = true;
      craneGroup.add(cDeck);

      // Glowing Hazard Perimeter
      const hazGeo = new THREE.BoxGeometry(cWidth + 2, 2.5, cDepth + 2);
      const haz = new THREE.Mesh(hazGeo, this.materials.factoryHazardStripes);
      haz.position.y = 5.5;
      craneGroup.add(haz);

      // Suspension Cables to Overhead Ceiling
      for (let cb = 0; cb < 4; cb++) {
        const cx = cb % 2 === 0 ? -cWidth * 0.42 : cWidth * 0.42;
        const cz = cb < 2 ? -cDepth * 0.42 : cDepth * 0.42;
        const cableGeo = new THREE.CylinderGeometry(1.2, 1.2, 240, 6);
        cableGeo.translate(0, 120, 0);
        const cableMesh = new THREE.Mesh(cableGeo, this.materials.factoryTrussSteel);
        cableMesh.position.set(cx, 5, cz);
        craneGroup.add(cableMesh);
      }

      // Underside Floodlight / Neon Beacon
      const floodGeo = new THREE.CylinderGeometry(10, 14, 6, 12);
      const floodMat = p2 % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonAmber;
      const floodMesh = new THREE.Mesh(floodGeo, floodMat);
      floodMesh.position.set(0, -6, 0);
      craneGroup.add(floodMesh);

      // Mount 3D Hologram Ads onto Mid-Tier Gantry Platforms
      const brands: Array<'KKS' | 'Cyber Game' | 'Burma Batik'> = ['KKS', 'Cyber Game', 'Burma Batik'];
      const ad = this.create3DGoldenBillboardMesh(brands[p2 % 3], 'HORIZONTAL_ROOFTOP', 85, 34);
      ad.position.set(0, 22, 0);
      craneGroup.add(ad);

      const baseX = -1000 + (p2 % 3) * 1000;
      const baseZ = -900 + Math.floor(p2 / 3) * 1800;
      const baseY = 110 + (p2 % 2) * 45;

      craneGroup.position.set(baseX, baseY, baseZ);
      this.factoryFloorGroup.add(craneGroup);

      this.movingPlatforms.push({
        group: craneGroup,
        layer: 'CRANE',
        basePos: new THREE.Vector3(baseX, baseY, baseZ),
        amplitude: new THREE.Vector3((p2 % 2 === 0 ? 180 : 0), 38, (p2 % 2 === 1 ? 180 : 0)),
        speed: 0.6 + (p2 % 3) * 0.25,
        phase: p2 * 1.4,
        neonStrips: [],
      });
    }

    // Layer 3: High-Altitude Skyway Logistics Railcars (Y = 250 to 420)
    for (let p3 = 0; p3 < 6; p3++) {
      const skyGroup = new THREE.Group();
      const sLength = 150;
      const sWidth = 42;
      const sHeight = 24;

      // Aerodynamic Logistics Transport Fuselage
      const fuseGeo = new THREE.BoxGeometry(sLength, sHeight, sWidth);
      const fuseMesh = new THREE.Mesh(fuseGeo, this.materials.playerCarbonArmor);
      skyGroup.add(fuseMesh);

      // Glowing Cockpit / Status Strips
      const statusGeo = new THREE.BoxGeometry(sLength * 0.8, 3, sWidth + 2);
      const statusMat = p3 % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonMagenta;
      const statusMesh = new THREE.Mesh(statusGeo, statusMat);
      skyGroup.add(statusMesh);

      // Plasma Jet Thrusters on Tail
      const jetGeo = new THREE.ConeGeometry(8, 28, 12);
      jetGeo.rotateZ(Math.PI / 2);
      const jetMat = this.materials.playerPlasmaJet;
      const leftJet = new THREE.Mesh(jetGeo, jetMat);
      leftJet.position.set(-sLength / 2 - 12, 0, -12);
      skyGroup.add(leftJet);

      const rightJet = new THREE.Mesh(jetGeo, jetMat);
      rightJet.position.set(-sLength / 2 - 12, 0, 12);
      skyGroup.add(rightJet);

      const baseX = -1400 + (p3 % 3) * 1400;
      const baseZ = -1200 + Math.floor(p3 / 3) * 2400;
      const baseY = 270 + (p3 % 3) * 60;

      skyGroup.position.set(baseX, baseY, baseZ);
      this.factoryFloorGroup.add(skyGroup);

      this.movingPlatforms.push({
        group: skyGroup,
        layer: 'SKYWAY',
        basePos: new THREE.Vector3(baseX, baseY, baseZ),
        amplitude: new THREE.Vector3(950, 22, 140),
        speed: 1.4 + (p3 % 2) * 0.5,
        phase: p3 * 1.8,
        neonStrips: [],
      });
    }

    // 5. GIANT GLASS CONTAINMENT TUBES WITH GIANT 3D SPECIMENS
    const specimenConfigs: Array<{
      type: 'BIO_LEVIATHAN' | 'NEURAL_HIVE' | 'CHIMERA_APEX' | 'CRYSTAL_SPORE';
      fluidColor: number;
      fluidEmissive: number;
      radius: number;
      height: number;
    }> = [
      { type: 'BIO_LEVIATHAN', fluidColor: 0x39ff14, fluidEmissive: 0x1f990a, radius: 72, height: 420 },
      { type: 'NEURAL_HIVE', fluidColor: 0x00ffd1, fluidEmissive: 0x008870, radius: 68, height: 390 },
      { type: 'CHIMERA_APEX', fluidColor: 0xff0055, fluidEmissive: 0x990033, radius: 76, height: 450 },
      { type: 'CRYSTAL_SPORE', fluidColor: 0xffaa00, fluidEmissive: 0x996600, radius: 64, height: 380 },
      { type: 'BIO_LEVIATHAN', fluidColor: 0x00ffd1, fluidEmissive: 0x008870, radius: 74, height: 440 },
      { type: 'NEURAL_HIVE', fluidColor: 0xff00e5, fluidEmissive: 0x88007a, radius: 66, height: 400 },
      { type: 'CHIMERA_APEX', fluidColor: 0x39ff14, fluidEmissive: 0x1f990a, radius: 78, height: 460 },
      { type: 'CRYSTAL_SPORE', fluidColor: 0x00ffd1, fluidEmissive: 0x008870, radius: 65, height: 390 },
    ];

    for (let i = 0; i < specimenConfigs.length; i++) {
      const cfg = specimenConfigs[i];
      const angle = (i / specimenConfigs.length) * Math.PI * 2;
      const dist = 1450 + (i % 3) * 220;
      const px = Math.cos(angle) * dist;
      const pz = Math.sin(angle) * dist;

      const vatGroup = new THREE.Group();
      vatGroup.position.set(px, 0, pz);

      // Heavy Cast-Iron Base Collar with Pneumatic Flanges
      const baseGeo = new THREE.CylinderGeometry(cfg.radius + 18, cfg.radius + 28, 36, 18);
      const baseMesh = new THREE.Mesh(baseGeo, this.materials.factorySteel);
      baseMesh.position.y = 18;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      vatGroup.add(baseMesh);

      // Base Hazard Warning Chevron Ring
      const hazRingGeo = new THREE.CylinderGeometry(cfg.radius + 20, cfg.radius + 22, 6, 18);
      const hazRing = new THREE.Mesh(hazRingGeo, this.materials.factoryHazardStripes);
      hazRing.position.y = 36;
      vatGroup.add(hazRing);

      // Heavy Reinforced Top Dome Bulkhead
      const topCapGeo = new THREE.CylinderGeometry(cfg.radius + 12, cfg.radius + 18, 32, 18);
      const topCapMesh = new THREE.Mesh(topCapGeo, this.materials.factorySteel);
      topCapMesh.position.y = cfg.height - 16;
      vatGroup.add(topCapMesh);

      // Reinforced Glass Containment Outer Cylinder
      const glassGeo = new THREE.CylinderGeometry(cfg.radius, cfg.radius, cfg.height - 58, 20);
      glassGeo.translate(0, cfg.height / 2, 0);
      const glassMesh = new THREE.Mesh(glassGeo, this.materials.labGlassContainment);
      vatGroup.add(glassMesh);

      // Glowing Bioluminescent Cryogenic Fluid Core
      const liquidGeo = new THREE.CylinderGeometry(cfg.radius - 8, cfg.radius - 8, cfg.height - 70, 16);
      liquidGeo.translate(0, cfg.height / 2, 0);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: cfg.fluidColor,
        emissive: cfg.fluidEmissive,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.38,
        roughness: 0.08,
      });
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
      vatGroup.add(liquidMesh);

      // External Cryo-Coolant Pipelines wrapping around the Vat
      const pipeGeo = new THREE.TorusGeometry(cfg.radius + 10, 3.5, 8, 24);
      pipeGeo.rotateX(Math.PI / 2);
      for (let r = 1; r <= 3; r++) {
        const pRing = new THREE.Mesh(pipeGeo, this.materials.factoryTrussSteel);
        pRing.position.y = (cfg.height * r) / 4;
        vatGroup.add(pRing);

        const pGlow = new THREE.Mesh(pipeGeo, this.materials.labNeonCyan);
        pGlow.position.y = (cfg.height * r) / 4 + 2;
        pGlow.scale.set(1.02, 1.02, 1.02);
        vatGroup.add(pGlow);
      }

      // 3D GIANT SPECIMEN MODEL INSIDE THE TUBE
      const specimenMesh = new THREE.Group();
      specimenMesh.position.set(0, cfg.height / 2, 0);

      if (cfg.type === 'BIO_LEVIATHAN') {
        // Giant Cephalopod Organism with undulating tentacles and organelle core
        const coreGeo = new THREE.SphereGeometry(28, 16, 16);
        const coreMesh = new THREE.Mesh(coreGeo, this.materials.bacteriaMembraneBase);
        specimenMesh.add(coreMesh);

        // Glowing Pulsing Organelle Core
        const organelleGeo = new THREE.OctahedronGeometry(16, 1);
        const organelleMat = new THREE.MeshBasicMaterial({ color: cfg.fluidColor });
        const organelleMesh = new THREE.Mesh(organelleGeo, organelleMat);
        organelleMesh.name = 'organelleCore';
        specimenMesh.add(organelleMesh);

        // 6 Large Segmented Bioluminescent Tentacles
        const tentacleGroup = new THREE.Group();
        tentacleGroup.name = 'tentacles';
        for (let tn = 0; tn < 6; tn++) {
          const tAngle = (tn / 6) * Math.PI * 2;
          const tArm = new THREE.Group();
          for (let seg = 0; seg < 5; seg++) {
            const segGeo = new THREE.CylinderGeometry(5 - seg * 0.8, 6 - seg * 0.8, 22, 8);
            segGeo.translate(0, -11 - seg * 20, 0);
            const segMesh = new THREE.Mesh(segGeo, this.materials.bacteriaTentacleOrganic);
            tArm.add(segMesh);
          }
          tArm.position.set(Math.cos(tAngle) * 14, 0, Math.sin(tAngle) * 14);
          tArm.rotation.z = 0.4;
          tArm.rotation.y = tAngle;
          tentacleGroup.add(tArm);
        }
        specimenMesh.add(tentacleGroup);
      } else if (cfg.type === 'NEURAL_HIVE') {
        // Colossal Twin-Lobed Cybernetic Brain with Synapses
        const lobeGeo = new THREE.SphereGeometry(22, 14, 14);
        lobeGeo.scale(1.3, 0.9, 0.9);

        const leftLobe = new THREE.Mesh(lobeGeo, this.materials.bacteriaMembraneElite);
        leftLobe.position.set(-14, 0, 0);
        specimenMesh.add(leftLobe);

        const rightLobe = new THREE.Mesh(lobeGeo, this.materials.bacteriaMembraneElite);
        rightLobe.position.set(14, 0, 0);
        specimenMesh.add(rightLobe);

        // Branching Optic Stalks & Data Tendrils
        for (let st = 0; st < 8; st++) {
          const stAngle = (st / 8) * Math.PI * 2;
          const stGeo = new THREE.CylinderGeometry(2, 4, 38, 6);
          stGeo.translate(0, -19, 0);
          const stMesh = new THREE.Mesh(stGeo, this.materials.cyborgTitaniumPlate);
          stMesh.position.set(Math.cos(stAngle) * 20, -10, Math.sin(stAngle) * 20);
          stMesh.rotation.z = Math.sin(st) * 0.4;
          specimenMesh.add(stMesh);

          // Optical Node
          const oNode = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), this.materials.cyborgOcularLaserCyan);
          oNode.position.set(Math.cos(stAngle) * 20, -40, Math.sin(stAngle) * 20);
          specimenMesh.add(oNode);
        }
      } else if (cfg.type === 'CHIMERA_APEX') {
        // Armored Chimera Embryo with Spinal Carapace
        const spineGeo = new THREE.CylinderGeometry(14, 18, 55, 10);
        const spineMesh = new THREE.Mesh(spineGeo, this.materials.bacteriaMembraneBoss);
        specimenMesh.add(spineMesh);

        // Armored Carapace Plates
        for (let cp = 0; cp < 4; cp++) {
          const plateGeo = new THREE.BoxGeometry(32, 10, 22);
          const plateMesh = new THREE.Mesh(plateGeo, this.materials.playerCarbonArmor);
          plateMesh.position.set(0, cp * 12 - 18, 8);
          specimenMesh.add(plateMesh);
        }

        // Orbiting Magnetic Restraint Rings
        const restraintGeo = new THREE.TorusGeometry(36, 2.5, 8, 24);
        const ring1 = new THREE.Mesh(restraintGeo, this.materials.cyborgTitaniumPlate);
        ring1.name = 'restraintRing1';
        specimenMesh.add(ring1);

        const ring2 = new THREE.Mesh(restraintGeo, this.materials.labNeonMagenta);
        ring2.name = 'restraintRing2';
        ring2.rotation.x = Math.PI / 3;
        specimenMesh.add(ring2);
      } else {
        // Crystalline Alien Spore Colossus with Helical Energy Strands
        const coreCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(26, 0), this.materials.bioCoreCrystal);
        coreCrystal.name = 'crystalCore';
        specimenMesh.add(coreCrystal);

        // Orbiting Shards
        for (let sh = 0; sh < 6; sh++) {
          const shardGeo = new THREE.ConeGeometry(5, 18, 4);
          const shardMesh = new THREE.Mesh(shardGeo, this.materials.goldCoin);
          const shAngle = (sh / 6) * Math.PI * 2;
          shardMesh.position.set(Math.cos(shAngle) * 38, Math.sin(sh) * 12, Math.sin(shAngle) * 38);
          shardMesh.rotation.z = Math.PI / 2;
          shardMesh.rotation.y = shAngle;
          specimenMesh.add(shardMesh);
        }
      }

      vatGroup.add(specimenMesh);

      // Rising Aeration Bubble Particle Column inside Vat
      const bubbleCount = 45;
      const bGeo = new THREE.BufferGeometry();
      const bPos = new Float32Array(bubbleCount * 3);
      for (let b = 0; b < bubbleCount; b++) {
        bPos[b * 3] = (Math.random() - 0.5) * (cfg.radius * 1.2);
        bPos[b * 3 + 1] = Math.random() * (cfg.height - 80) + 40;
        bPos[b * 3 + 2] = (Math.random() - 0.5) * (cfg.radius * 1.2);
      }
      bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
      const bMat = new THREE.PointsMaterial({
        color: cfg.fluidColor,
        size: 3.5,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const bubbles = new THREE.Points(bGeo, bMat);
      vatGroup.add(bubbles);

      // Local Dynamic Specimen Glow PointLight
      const vatLight = new THREE.PointLight(cfg.fluidColor, 2.2, 550, 1.3);
      vatLight.position.set(0, cfg.height / 2, 0);
      vatGroup.add(vatLight);

      this.factoryFloorGroup.add(vatGroup);
      this.giantContainmentTubes.push({
        vatGroup,
        specimenMesh,
        liquidMesh,
        light: vatLight,
        specimenType: cfg.type,
        pulsePhase: i * 0.9,
        rotSpeed: 0.015 + (i % 3) * 0.008,
        bubbleParticles: bubbles,
      });
    }

    // 6. Flying Heavy Cargo & Security Drones in Factory Atmosphere
    for (let d = 0; d < 8; d++) {
      const droneGroup = new THREE.Group();
      const dBodyMesh = new THREE.Mesh(new THREE.BoxGeometry(32, 10, 20), this.materials.playerCarbonArmor);
      droneGroup.add(dBodyMesh);

      const dVisorMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 2), d % 2 === 0 ? this.materials.labNeonCyan : this.materials.labNeonMagenta);
      dVisorMesh.position.set(0, 0, 10.5);
      droneGroup.add(dVisorMesh);

      const startX = -3200 + Math.random() * 6400;
      const y = 320 + Math.random() * 220;
      const z = -2800 + Math.random() * 5600;
      droneGroup.position.set(startX, y, z);

      this.factoryFloorGroup.add(droneGroup);
      this.flyingDrones.push({
        mesh: droneGroup,
        speed: 110 + Math.random() * 140,
        startX: -3600,
        endX: 3600,
        y,
        z,
      });
    }

    this.scene.add(this.factoryFloorGroup);
  }

  // --- 3.5 PROCEDURAL CYBERPUNK RAIN & GROUND SPLASH SIMULATION ---
  private initCyberRainSystem() {
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.MAX_RAIN_DROPS * 3);
    this.rainVelocities = new Float32Array(this.MAX_RAIN_DROPS);

    for (let i = 0; i < this.MAX_RAIN_DROPS; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 3600;
      this.rainPositions[i * 3 + 1] = Math.random() * 800;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 3600;
      this.rainVelocities[i] = 750 + Math.random() * 450;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    this.rainSystem = new THREE.Points(this.rainGeo, this.materials.rainStreak);
    this.scene.add(this.rainSystem);

    // Ground Splash Ripple Pool
    this.splashGroup = new THREE.Group();
    const rippleGeo = new THREE.RingGeometry(2, 6, 16);
    rippleGeo.rotateX(-Math.PI / 2);

    for (let s = 0; s < this.MAX_SPLASHES; s++) {
      const rMesh = new THREE.Mesh(rippleGeo, this.materials.splashRipple.clone());
      rMesh.position.set(0, 0.6, 0);
      rMesh.visible = false;
      this.splashGroup.add(rMesh);
      this.splashPool.push({
        mesh: rMesh,
        active: false,
        life: 0,
        maxLife: 1.0,
        scaleSpeed: 2.5,
      });
    }
    this.scene.add(this.splashGroup);
  }

  // --- 4. HIGH-POLY 3D ROBOTIC CYBORG HERO MODEL WITH VISIBLE MECHANICAL JOINTS & FLASHLIGHT POD ---
  private initPlayer3D() {
    this.playerGroup = new THREE.Group();

    // 1. High-Poly Sculpted Carbon/Titanium Cyborg Chassis
    const torsoGeo = new THREE.CylinderGeometry(7.2, 9.4, 23, 12);
    this.playerTorso = new THREE.Mesh(torsoGeo, this.materials.playerCarbonArmor);
    this.playerTorso.position.y = 22;
    this.playerTorso.castShadow = true;
    this.playerGroup.add(this.playerTorso);

    // Hardened Titanium Chest Chassis Plates
    const chestPlateGeo = new THREE.BoxGeometry(13.8, 15.5, 6.8);
    this.playerChestArmor = new THREE.Mesh(chestPlateGeo, this.materials.playerSecondaryPlates);
    this.playerChestArmor.position.set(0, 2.5, 4.2);
    this.playerTorso.add(this.playerChestArmor);

    // Reinforced Titanium Rib & Actuator Mounts
    const ribLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 12, 5), this.materials.playerTitaniumTrim);
    ribLeft.position.set(-6.8, 0, 1.2);
    ribLeft.rotation.z = 0.15;
    this.playerTorso.add(ribLeft);

    const ribRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 12, 5), this.materials.playerTitaniumTrim);
    ribRight.position.set(6.8, 0, 1.2);
    ribRight.rotation.z = -0.15;
    this.playerTorso.add(ribRight);

    // TACTICAL CYBORG SHOULDER-MOUNTED LED FLASHLIGHT POD
    const flPodGroup = new THREE.Group();
    flPodGroup.position.set(5.5, 7.5, 3.8);

    const flHousing = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 7.5, 12), this.materials.playerTitaniumTrim);
    flHousing.rotateX(Math.PI / 2);
    flPodGroup.add(flHousing);

    // Cooling ribs on flashlight barrel
    for (let r = 0; r < 3; r++) {
      const flRib = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.3, 6, 16), this.materials.playerSecondaryPlates);
      flRib.position.z = -2.0 + r * 1.6;
      flPodGroup.add(flRib);
    }

    // Glowing Neon Cyan Bezel & White Projector Lens
    const flBezel = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.45, 8, 16), this.materials.playerCyanNeon);
    flBezel.position.z = 3.8;
    flPodGroup.add(flBezel);

    const flLens = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    flLens.position.z = 3.85;
    flPodGroup.add(flLens);

    this.playerTorso.add(flPodGroup);

    // Multi-Tier Arc Reactor Core with Kinetic Magnetic Containment Ring (Super Emissive Bloom)
    const reactorCoreGeo = new THREE.CylinderGeometry(3.6, 3.6, 2.8, 24);
    reactorCoreGeo.rotateX(Math.PI / 2);
    this.playerReactorCore = new THREE.Mesh(reactorCoreGeo, this.materials.playerCyanNeon);
    this.playerReactorCore.position.set(0, 2.2, 4.2);
    this.playerChestArmor.add(this.playerReactorCore);

    const reactorRingGeo = new THREE.TorusGeometry(4.8, 0.7, 8, 24);
    this.playerReactorRing = new THREE.Mesh(reactorRingGeo, this.materials.playerTitaniumTrim);
    this.playerReactorRing.position.set(0, 2.2, 4.5);
    this.playerChestArmor.add(this.playerReactorRing);

    // Articulated Carbon Spine Vertebrae Column with Hydraulic Rods & Glowing Neural Conduits
    this.playerSpineGroup = new THREE.Group();
    for (let v = 0; v < 5; v++) {
      const vertMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.2), this.materials.playerTitaniumTrim);
      vertMesh.position.set(0, 7 - v * 4, -4.6);
      this.playerSpineGroup.add(vertMesh);

      // Exposed Hydraulic Cylinder
      const pistonMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3.8, 8), this.materials.cyborgPistonHydraulic);
      pistonMesh.position.set(0, 7 - v * 4, -3.8);
      this.playerSpineGroup.add(pistonMesh);

      const conduitMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.5, 6), this.materials.playerCyanNeon);
      conduitMesh.position.set(0, 7 - v * 4, -5.6);
      this.playerSpineGroup.add(conduitMesh);
    }
    this.playerTorso.add(this.playerSpineGroup);

    // 2. Robotic Cyber Ninja Head & Multi-Facet Optical HUD Visor
    this.playerHeadGroup = new THREE.Group();
    this.playerHeadGroup.position.set(0, 16.5, 0);
    this.playerTorso.add(this.playerHeadGroup);

    // Faceted Carbon-Fiber Skull Dome
    const helmGeo = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(5.8, 6.2, 8, 16) : new THREE.SphereGeometry(6.2, 16, 16);
    this.playerHelmet = new THREE.Mesh(helmGeo, this.materials.playerCarbonArmor);
    this.playerHeadGroup.add(this.playerHelmet);

    // Mechanical Neck Servo Pivot Ring
    const neckServo = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.8, 8, 16), this.materials.playerCyanNeon);
    neckServo.rotateX(Math.PI / 2);
    neckServo.position.y = -4.5;
    this.playerHeadGroup.add(neckServo);

    // Curved Multi-Facet LED Cyber Visor (Ultra High Bloom)
    const visorGeo = new THREE.TorusGeometry(5.4, 1.6, 8, 24, Math.PI * 0.75);
    visorGeo.rotateZ(Math.PI * 0.125);
    visorGeo.rotateX(Math.PI / 2);
    this.playerVisor = new THREE.Mesh(visorGeo, this.materials.playerCyanNeon);
    this.playerVisor.position.set(0, 0.6, 3.3);
    this.playerHeadGroup.add(this.playerVisor);

    // Lower Cybernetic Respirator Rebreather Mask
    const respiratorGeo = new THREE.BoxGeometry(6.5, 4.2, 4.8);
    this.playerRespirator = new THREE.Mesh(respiratorGeo, this.materials.playerSecondaryPlates);
    this.playerRespirator.position.set(0, -3.2, 3.2);
    this.playerHeadGroup.add(this.playerRespirator);

    // Respirator Glowing Micro-Filters
    const filterL = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.6, 8), this.materials.playerCyanNeon);
    filterL.rotateZ(Math.PI / 2);
    filterL.position.set(-3.2, -3.2, 4.2);
    this.playerHeadGroup.add(filterL);

    const filterR = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.6, 8), this.materials.playerCyanNeon);
    filterR.rotateZ(Math.PI / 2);
    filterR.position.set(3.2, -3.2, 4.2);
    this.playerHeadGroup.add(filterR);

    // Aerodynamic Cyber Sensor Blades / Ear Fins
    const antennaGeo = new THREE.BoxGeometry(0.8, 9, 2.5);
    const antennaLeft = new THREE.Mesh(antennaGeo, this.materials.playerCyanNeon);
    antennaLeft.position.set(-6.4, 3.5, -0.8);
    antennaLeft.rotation.z = 0.38;
    this.playerHeadGroup.add(antennaLeft);

    const antennaRight = new THREE.Mesh(antennaGeo, this.materials.playerCyanNeon);
    antennaRight.position.set(6.4, 3.5, -0.8);
    antennaRight.rotation.z = -0.38;
    this.playerHeadGroup.add(antennaRight);

    // 3. Layered Carbon-Fiber Shoulder Pauldrons with Exposed Rotary Joint Servos
    const createPauldron = (isLeft: boolean) => {
      const pGroup = new THREE.Group();

      // Mechanical Rotary Ball-and-Socket Joint Pivot
      const ballJoint = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 12), this.materials.playerTitaniumTrim);
      pGroup.add(ballJoint);

      const servoRing = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.6, 8, 16), this.materials.playerCyanNeon);
      servoRing.rotation.y = Math.PI / 2;
      pGroup.add(servoRing);

      const mainPlate = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.5, 8.5), this.materials.playerCarbonArmor);
      mainPlate.position.set(isLeft ? -2.2 : 2.2, 1.2, 0);
      pGroup.add(mainPlate);

      const trimPlate = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.8, 8.8), this.materials.playerTitaniumTrim);
      trimPlate.position.set(isLeft ? -2.2 : 2.2, -0.6, 0);
      pGroup.add(trimPlate);

      const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.8, 9.0), this.materials.playerCyanNeon);
      neonStrip.position.set(isLeft ? -2.2 : 2.2, 1.7, 0);
      pGroup.add(neonStrip);

      pGroup.position.set(isLeft ? -11.8 : 11.8, 8.8, 0);
      pGroup.rotation.z = isLeft ? -0.4 : 0.4;
      return pGroup;
    };

    this.playerLeftShoulder = createPauldron(true);
    this.playerTorso.add(this.playerLeftShoulder);

    this.playerRightShoulder = createPauldron(false);
    this.playerTorso.add(this.playerRightShoulder);

    // 4. Kinetic Robotic Arms with Exposed Mechanical Hinge Elbows & Rotary Wrist Servos
    const armMat = this.materials.playerCarbonArmor;
    const gauntletMat = this.materials.playerSecondaryPlates;

    this.playerLeftArm = new THREE.Group();
    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 9, 8), armMat);
    lUpperArm.position.y = -4.5;
    this.playerLeftArm.add(lUpperArm);

    // Hydraulic piston along bicep
    const lBicepPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), this.materials.cyborgPistonHydraulic);
    lBicepPiston.position.set(0, -4.5, 2.6);
    this.playerLeftArm.add(lBicepPiston);

    // Mechanical Rotary Elbow Joint with Cyan Servo Ring
    const lElbow = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 4.2, 12), this.materials.playerTitaniumTrim);
    lElbow.rotateZ(Math.PI / 2);
    lElbow.position.y = -9;
    this.playerLeftArm.add(lElbow);

    const lElbowRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.45, 8, 16), this.materials.playerCyanNeon);
    lElbowRing.rotateY(Math.PI / 2);
    lElbowRing.position.y = -9;
    this.playerLeftArm.add(lElbowRing);

    const lForearm = new THREE.Mesh(new THREE.BoxGeometry(4.8, 9.5, 5.2), gauntletMat);
    lForearm.position.y = -13.5;
    lForearm.castShadow = true;
    this.playerLeftArm.add(lForearm);

    // Rotary Wrist Joint
    const lWristServo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.5, 8, 16), this.materials.playerCyanNeon);
    lWristServo.rotateX(Math.PI / 2);
    lWristServo.position.y = -18.2;
    this.playerLeftArm.add(lWristServo);

    const lGauntletNeon = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 5.5), this.materials.playerCyanNeon);
    lGauntletNeon.position.y = -12;
    this.playerLeftArm.add(lGauntletNeon);

    this.playerLeftArm.position.set(-11.5, 5.5, 0);
    this.playerTorso.add(this.playerLeftArm);

    this.playerRightArm = new THREE.Group();
    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 9, 8), armMat);
    rUpperArm.position.y = -4.5;
    this.playerRightArm.add(rUpperArm);

    // Hydraulic piston along bicep
    const rBicepPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), this.materials.cyborgPistonHydraulic);
    rBicepPiston.position.set(0, -4.5, 2.6);
    this.playerRightArm.add(rBicepPiston);

    // Mechanical Rotary Elbow Joint with Cyan Servo Ring
    const rElbow = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 4.2, 12), this.materials.playerTitaniumTrim);
    rElbow.rotateZ(Math.PI / 2);
    rElbow.position.y = -9;
    this.playerRightArm.add(rElbow);

    const rElbowRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.45, 8, 16), this.materials.playerCyanNeon);
    rElbowRing.rotateY(Math.PI / 2);
    rElbowRing.position.y = -9;
    this.playerRightArm.add(rElbowRing);

    const rForearm = new THREE.Mesh(new THREE.BoxGeometry(4.8, 9.5, 5.2), gauntletMat);
    rForearm.position.y = -13.5;
    rForearm.castShadow = true;
    this.playerRightArm.add(rForearm);

    // Rotary Wrist Joint
    const rWristServo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.5, 8, 16), this.materials.playerCyanNeon);
    rWristServo.rotateX(Math.PI / 2);
    rWristServo.position.y = -18.2;
    this.playerRightArm.add(rWristServo);

    const rGauntletNeon = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 5.5), this.materials.playerCyanNeon);
    rGauntletNeon.position.y = -12;
    this.playerRightArm.add(rGauntletNeon);

    this.playerRightArm.position.set(11.5, 5.5, 0);
    this.playerTorso.add(this.playerRightArm);

    // 5. Kinetic Articulated Cyborg Legs (Exposed Mechanical Hip & Knee Joints)
    const legThighGeo = new THREE.CylinderGeometry(3.2, 3.8, 10, 8);
    const legKneeGeo = new THREE.BoxGeometry(5.5, 4.5, 5.8);
    const legShinGeo = new THREE.BoxGeometry(5.2, 11, 5.6);
    const bootGeo = new THREE.BoxGeometry(5.6, 4.5, 9.2);

    this.playerLeftLeg = new THREE.Group();
    // Hip Rotary Ball Joint
    const lHipBall = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 10), this.materials.playerTitaniumTrim);
    lHipBall.position.y = 0;
    this.playerLeftLeg.add(lHipBall);

    const lHipRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.5, 8, 16), this.materials.playerCyanNeon);
    lHipRing.rotateX(Math.PI / 2);
    this.playerLeftLeg.add(lHipRing);

    const lThigh = new THREE.Mesh(legThighGeo, armMat);
    lThigh.position.y = -5;
    lThigh.castShadow = true;
    this.playerLeftLeg.add(lThigh);

    // Mechanical Knee Hinge & Hydraulic Piston
    const lKnee = new THREE.Mesh(legKneeGeo, this.materials.playerTitaniumTrim);
    lKnee.position.set(0, -10, 1.2);
    this.playerLeftLeg.add(lKnee);

    const lKneePiston = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 6, 6), this.materials.cyborgPistonHydraulic);
    lKneePiston.position.set(0, -12, -2.4);
    this.playerLeftLeg.add(lKneePiston);

    const lShin = new THREE.Mesh(legShinGeo, gauntletMat);
    lShin.position.y = -15.5;
    lShin.castShadow = true;
    this.playerLeftLeg.add(lShin);

    // Ankle Servo Joint
    const lAnkleServo = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), this.materials.playerTitaniumTrim);
    lAnkleServo.position.set(0, -20.5, 0);
    this.playerLeftLeg.add(lAnkleServo);

    const lBoot = new THREE.Mesh(bootGeo, this.materials.playerTitaniumTrim);
    lBoot.position.set(0, -21, 1.8);
    this.playerLeftLeg.add(lBoot);

    this.playerLeftLeg.position.set(-5.6, 0, 0);
    this.playerGroup.add(this.playerLeftLeg);

    this.playerRightLeg = new THREE.Group();
    // Hip Rotary Ball Joint
    const rHipBall = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 10), this.materials.playerTitaniumTrim);
    rHipBall.position.y = 0;
    this.playerRightLeg.add(rHipBall);

    const rHipRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.5, 8, 16), this.materials.playerCyanNeon);
    rHipRing.rotateX(Math.PI / 2);
    this.playerRightLeg.add(rHipRing);

    const rThigh = new THREE.Mesh(legThighGeo, armMat);
    rThigh.position.y = -5;
    rThigh.castShadow = true;
    this.playerRightLeg.add(rThigh);

    // Mechanical Knee Hinge & Hydraulic Piston
    const rKnee = new THREE.Mesh(legKneeGeo, this.materials.playerTitaniumTrim);
    rKnee.position.set(0, -10, 1.2);
    this.playerRightLeg.add(rKnee);

    const rKneePiston = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 6, 6), this.materials.cyborgPistonHydraulic);
    rKneePiston.position.set(0, -12, -2.4);
    this.playerRightLeg.add(rKneePiston);

    const rShin = new THREE.Mesh(legShinGeo, gauntletMat);
    rShin.position.y = -15.5;
    rShin.castShadow = true;
    this.playerRightLeg.add(rShin);

    // Ankle Servo Joint
    const rAnkleServo = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), this.materials.playerTitaniumTrim);
    rAnkleServo.position.set(0, -20.5, 0);
    this.playerRightLeg.add(rAnkleServo);

    const rBoot = new THREE.Mesh(bootGeo, this.materials.playerTitaniumTrim);
    rBoot.position.set(0, -21, 1.8);
    this.playerRightLeg.add(rBoot);

    this.playerRightLeg.position.set(5.6, 0, 0);
    this.playerGroup.add(this.playerRightLeg);

    // 6. Ultra-Realistic Glowing Plasma Katana Blade (Ray-Skin Wrapped Hilt, Damascus Spine & Superheated Plasma Edge)
    this.playerKatanaGroup = new THREE.Group();

    // Kashira (Chrome Pommel Cap)
    const kashira = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 2, 8), this.materials.playerTitaniumTrim);
    kashira.position.y = -11;
    this.playerKatanaGroup.add(kashira);

    // Tsuka Handle (Carbon Menuki Diamond Wrapped Grip)
    const katanaHandle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 11, 8), this.materials.playerCarbonArmor);
    katanaHandle.position.y = -5.5;
    this.playerKatanaGroup.add(katanaHandle);

    // Cyber Tsuba (Handguard with Status Indicator LEDs)
    const katanaTsuba = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.8, 4.2), this.materials.playerTitaniumTrim);
    katanaTsuba.position.y = 0;
    this.playerKatanaGroup.add(katanaTsuba);

    const tsubaLed = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.6, 4.6), this.materials.playerCyanNeon);
    tsubaLed.position.y = 0;
    this.playerKatanaGroup.add(tsubaLed);

    // Habaki (Polished Chrome Blade Collar)
    const habaki = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 2.2, 8), this.materials.playerTitaniumTrim);
    habaki.position.y = 1.6;
    this.playerKatanaGroup.add(habaki);

    // Hardened Damascus/Carbon Spine (Mune)
    const spineGeo = new THREE.BoxGeometry(1.2, 40, 2.4);
    spineGeo.translate(0, 21, -1.0);
    this.playerKatanaBladeSpine = new THREE.Mesh(spineGeo, this.materials.katanaBladeSpine);
    this.playerKatanaGroup.add(this.playerKatanaBladeSpine);

    // Superheated Glowing Plasma Cutting Edge (Ha) - Emissive Plasma
    const bladeGeo = new THREE.BoxGeometry(1.6, 40, 3.2);
    bladeGeo.translate(0, 21, 0.8);
    this.playerKatanaBlade = new THREE.Mesh(bladeGeo, this.materials.katanaBladeCyan);
    this.playerKatanaGroup.add(this.playerKatanaBlade);

    // White-Hot Energy Core Filament
    const coreGeo = new THREE.BoxGeometry(0.6, 38, 1.2);
    coreGeo.translate(0, 21, 0.8);
    this.playerKatanaCore = new THREE.Mesh(coreGeo, this.materials.katanaBladeCore);
    this.playerKatanaGroup.add(this.playerKatanaCore);

    // Outer Additive Plasma Energy Bloom Ribbon
    const bladeGlowGeo = new THREE.BoxGeometry(1.0, 42, 5.2);
    bladeGlowGeo.translate(0, 21, 0.8);
    this.playerKatanaGlow = new THREE.Mesh(bladeGlowGeo, this.materials.katanaGlowRibbon);
    this.playerKatanaGroup.add(this.playerKatanaGlow);

    this.playerKatanaGroup.position.set(0, -18, 4.5);
    this.playerKatanaGroup.rotation.x = Math.PI / 3.2;
    this.playerRightArm.add(this.playerKatanaGroup);

    // 6.5. Sheathed Katana on Back Chassis (Visible when Blaster is active)
    this.playerSheathedKatanaGroup = new THREE.Group();
    const scabbardGeo = new THREE.BoxGeometry(1.6, 38, 2.8);
    const scabbard = new THREE.Mesh(scabbardGeo, this.materials.playerCarbonArmor);
    scabbard.position.y = 8;
    this.playerSheathedKatanaGroup.add(scabbard);

    const scabbardTrim = new THREE.Mesh(new THREE.BoxGeometry(2.0, 39, 0.8), this.materials.playerCyanNeon);
    scabbardTrim.position.y = 8;
    this.playerSheathedKatanaGroup.add(scabbardTrim);

    const sheathedHilt = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 10, 8), this.materials.playerTitaniumTrim);
    sheathedHilt.position.y = 31;
    this.playerSheathedKatanaGroup.add(sheathedHilt);

    const sheathedTsuba = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, 3.8), this.materials.playerTitaniumTrim);
    sheathedTsuba.position.y = 26;
    this.playerSheathedKatanaGroup.add(sheathedTsuba);

    this.playerSheathedKatanaGroup.position.set(-5.5, 4.5, -6.0);
    this.playerSheathedKatanaGroup.rotation.z = -0.55;
    this.playerSheathedKatanaGroup.rotation.x = -0.15;
    this.playerTorso.add(this.playerSheathedKatanaGroup);

    // 6.6. High-Tech Heavy Sci-Fi Blaster Gun (Attached to Right Arm)
    this.playerBlasterGroup = new THREE.Group();

    // Gun Receiver Chassis
    const blasterBodyGeo = new THREE.BoxGeometry(3.6, 6.5, 14);
    this.playerBlasterBody = new THREE.Mesh(blasterBodyGeo, this.materials.playerCarbonArmor);
    this.playerBlasterBody.position.set(0, 0, 4);
    this.playerBlasterGroup.add(this.playerBlasterBody);

    // Titanium Barrel Shroud
    const barrelGeo = new THREE.CylinderGeometry(1.5, 1.7, 10, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const blasterBarrel = new THREE.Mesh(barrelGeo, this.materials.playerTitaniumTrim);
    blasterBarrel.position.set(0, 1.2, 13);
    this.playerBlasterGroup.add(blasterBarrel);

    // Glowing Neon Dual Plasma Coils
    const coilGeo = new THREE.BoxGeometry(3.0, 1.6, 11);
    this.playerBlasterCoil = new THREE.Mesh(coilGeo, this.materials.playerCyanNeon);
    this.playerBlasterCoil.position.set(0, 3.2, 4);
    this.playerBlasterGroup.add(this.playerBlasterCoil);

    // Battery / Power Cell Pack
    const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.0, 4.0), this.materials.playerSecondaryPlates);
    batteryPack.position.set(0, -3.8, 1.5);
    this.playerBlasterGroup.add(batteryPack);

    // Holographic Targeting Guide Beam
    const guideBeamGeo = new THREE.CylinderGeometry(0.15, 0.15, 75, 4);
    guideBeamGeo.rotateX(Math.PI / 2);
    this.playerBlasterLaserBeam = new THREE.Mesh(
      guideBeamGeo,
      new THREE.MeshBasicMaterial({ color: 0x00ffd1, transparent: true, opacity: 0.55 })
    );
    this.playerBlasterLaserBeam.position.set(0, 1.2, 54);
    this.playerBlasterGroup.add(this.playerBlasterLaserBeam);

    // Muzzle Flash Starburst FX
    const muzzleGeo = new THREE.OctahedronGeometry(3.8, 0);
    this.playerMuzzleFlashMesh = new THREE.Mesh(
      muzzleGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    );
    this.playerMuzzleFlashMesh.position.set(0, 1.2, 19);
    this.playerMuzzleFlashMesh.visible = false;
    this.playerBlasterGroup.add(this.playerMuzzleFlashMesh);

    this.playerBlasterGroup.position.set(0, -18, 4.5);
    this.playerBlasterGroup.rotation.x = -Math.PI / 2.2;
    this.playerRightArm.add(this.playerBlasterGroup);

    // 7. Dual High-Output Vector Jetpack Thrusters on Back
    const thrusterHousingGeo = new THREE.CylinderGeometry(2.8, 4.2, 10, 8);
    thrusterHousingGeo.rotateX(Math.PI / 3);

    this.playerThrusterLeft = new THREE.Mesh(thrusterHousingGeo, this.materials.playerTitaniumTrim);
    this.playerThrusterLeft.position.set(-4.8, 3.5, -6.8);
    this.playerTorso.add(this.playerThrusterLeft);

    this.playerThrusterRight = new THREE.Mesh(thrusterHousingGeo, this.materials.playerTitaniumTrim);
    this.playerThrusterRight.position.set(4.8, 3.5, -6.8);
    this.playerTorso.add(this.playerThrusterRight);

    // Animated High-Velocity Plasma Jet Plumes
    const flameGeo = new THREE.ConeGeometry(3.2, 16, 8);
    flameGeo.rotateX(-Math.PI / 3);

    this.playerPlasmaFlameLeft = new THREE.Mesh(flameGeo, this.materials.playerPlasmaJet);
    this.playerPlasmaFlameLeft.position.set(-4.8, 0, -13);
    this.playerTorso.add(this.playerPlasmaFlameLeft);

    this.playerPlasmaFlameRight = new THREE.Mesh(flameGeo, this.materials.playerPlasmaJet);
    this.playerPlasmaFlameRight.position.set(4.8, 0, -13);
    this.playerTorso.add(this.playerPlasmaFlameRight);

    // 8. Orbiting Kinetic Holographic Halo Rings
    const haloGeo = new THREE.TorusGeometry(18, 0.8, 8, 28);
    haloGeo.rotateX(Math.PI / 2);

    this.playerHaloRing1 = new THREE.Mesh(haloGeo, this.materials.playerCyanNeon);
    this.playerHaloRing1.position.y = 12;
    this.playerGroup.add(this.playerHaloRing1);

    this.playerHaloRing2 = new THREE.Mesh(haloGeo, this.materials.playerMagentaNeon);
    this.playerHaloRing2.position.y = 12;
    this.playerHaloRing2.rotation.x = Math.PI / 4;
    this.playerGroup.add(this.playerHaloRing2);

    // 9. Holographic Hexagonal Energy Shield Sphere
    const shieldGeo = new THREE.SphereGeometry(32, 20, 16);
    this.playerShieldMesh = new THREE.Mesh(shieldGeo, this.materials.shieldHologram);
    this.playerShieldMesh.position.y = 20;
    this.playerShieldMesh.visible = false;
    this.playerGroup.add(this.playerShieldMesh);

    this.scene.add(this.playerGroup);
    this.scene.add(this.remotePlayersGroup);
  }

  // --- 5. 3D PERSONAL BEST GHOST WIREFRAME ---
  private initGhost3D() {
    this.ghostGroup = new THREE.Group();

    const torsoGeo = new THREE.CylinderGeometry(7, 9, 22, 8);
    this.ghostBodyMesh = new THREE.Mesh(torsoGeo, this.materials.ghostHologram);
    this.ghostBodyMesh.position.y = 22;
    this.ghostGroup.add(this.ghostBodyMesh);

    const headGeo = new THREE.SphereGeometry(6, 12, 12);
    const ghostHead = new THREE.Mesh(headGeo, this.materials.ghostHologram);
    ghostHead.position.set(0, 16, 0);
    this.ghostBodyMesh.add(ghostHead);

    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);
  }

  // --- 6. 3D CYBER EXIT PORTAL VORTEX ---
  private initPortal3D() {
    this.portalGroup = new THREE.Group();

    // Vortex Disc
    const vortexGeo = new THREE.RingGeometry(10, 65, 32);
    vortexGeo.rotateX(-Math.PI / 2);
    this.portalVortexMesh = new THREE.Mesh(
      vortexGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00ff66,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    this.portalVortexMesh.position.y = 2;
    this.portalGroup.add(this.portalVortexMesh);

    // Concentric Orbiting Torus Rings
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(38 + r * 18, 2.5, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, this.materials.portalRing);
      ringMesh.position.y = 22 + r * 16;
      ringMesh.rotation.x = Math.PI / 2;
      this.portalGroup.add(ringMesh);
      this.portalRings.push(ringMesh);
    }

    // Sky Beacon Cylinder Beam
    const beamGeo = new THREE.CylinderGeometry(18, 30, 2400, 16);
    beamGeo.translate(0, 1200, 0);
    this.portalBeaconBeam = new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00ff66,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      })
    );
    this.portalGroup.add(this.portalBeaconBeam);

    this.scene.add(this.portalGroup);
  }

  // --- 7. 3D KATANA SLASH ARC RIBBON ---
  private initSlashArc3D() {
    this.slashArcGeometry = new THREE.RingGeometry(26, 52, 28, 1, 0, Math.PI);
    this.slashArcGeometry.rotateX(-Math.PI / 2);
    this.slashArcMesh = new THREE.Mesh(
      this.slashArcGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x00ffd1,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    this.slashArcMesh.position.y = 20;
    this.scene.add(this.slashArcMesh);
  }

  // --- 7B. DYNAMIC NEON GLOW TRAILS (KATANA BLADE & CYBERNETIC LIMBS) ---
  private initPlayerNeonTrails() {
    const createTrailGeo = () => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(this.MAX_TRAIL_POINTS * 2 * 3);
      const col = new Float32Array(this.MAX_TRAIL_POINTS * 2 * 3);
      const indices: number[] = [];
      for (let i = 0; i < this.MAX_TRAIL_POINTS - 1; i++) {
        const top1 = i * 2;
        const btm1 = i * 2 + 1;
        const top2 = (i + 1) * 2;
        const btm2 = (i + 1) * 2 + 1;
        indices.push(top1, btm1, top2);
        indices.push(btm1, btm2, top2);
      }
      geo.setIndex(indices);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return geo;
    };

    this.swordTrailMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.limbTrailMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.swordTrailGeo = createTrailGeo();
    this.swordTrailMesh = new THREE.Mesh(this.swordTrailGeo, this.swordTrailMat);
    this.swordTrailMesh.frustumCulled = false;
    this.scene.add(this.swordTrailMesh);

    this.leftHandTrailGeo = createTrailGeo();
    this.leftHandTrailMesh = new THREE.Mesh(this.leftHandTrailGeo, this.limbTrailMat);
    this.leftHandTrailMesh.frustumCulled = false;
    this.scene.add(this.leftHandTrailMesh);

    this.rightHandTrailGeo = createTrailGeo();
    this.rightHandTrailMesh = new THREE.Mesh(this.rightHandTrailGeo, this.limbTrailMat);
    this.rightHandTrailMesh.frustumCulled = false;
    this.scene.add(this.rightHandTrailMesh);

    this.leftFootTrailGeo = createTrailGeo();
    this.leftFootTrailMesh = new THREE.Mesh(this.leftFootTrailGeo, this.limbTrailMat);
    this.leftFootTrailMesh.frustumCulled = false;
    this.scene.add(this.leftFootTrailMesh);

    this.rightFootTrailGeo = createTrailGeo();
    this.rightFootTrailMesh = new THREE.Mesh(this.rightFootTrailGeo, this.limbTrailMat);
    this.rightFootTrailMesh.frustumCulled = false;
    this.scene.add(this.rightFootTrailMesh);
  }

  private updateSingleTrail(
    history: THREE.Vector3[],
    currentPos: THREE.Vector3,
    geo: THREE.BufferGeometry,
    ribbonHalfWidth: number,
    baseColor: THREE.Color,
    intensityBoost: number
  ) {
    // Zero-allocation ring buffer: recycle the oldest element instead of allocating new Vector3 each frame
    let pointToInsert: THREE.Vector3;
    if (history.length >= this.MAX_TRAIL_POINTS) {
      pointToInsert = history.pop()!;
      pointToInsert.copy(currentPos);
    } else {
      pointToInsert = currentPos.clone();
    }
    history.unshift(pointToInsert);

    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;

    const len = history.length;
    for (let i = 0; i < this.MAX_TRAIL_POINTS; i++) {
      const pIndex = Math.min(i, len - 1);
      const p = history[pIndex] || currentPos;
      const progress = i / (this.MAX_TRAIL_POINTS - 1);
      const taper = Math.max(0.2, (1 - progress) * ribbonHalfWidth * intensityBoost);
      const alphaFade = Math.pow(Math.max(0, 1 - progress), 1.5) * Math.min(1.0, intensityBoost);

      posArray[i * 6 + 0] = p.x;
      posArray[i * 6 + 1] = p.y + taper;
      posArray[i * 6 + 2] = p.z;

      posArray[i * 6 + 3] = p.x;
      posArray[i * 6 + 4] = p.y - taper;
      posArray[i * 6 + 5] = p.z;

      colArray[i * 6 + 0] = baseColor.r * alphaFade;
      colArray[i * 6 + 1] = baseColor.g * alphaFade;
      colArray[i * 6 + 2] = baseColor.b * alphaFade;

      colArray[i * 6 + 3] = baseColor.r * alphaFade;
      colArray[i * 6 + 4] = baseColor.g * alphaFade;
      colArray[i * 6 + 5] = baseColor.b * alphaFade;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  private updatePlayerNeonTrails(player: Player, activeNeonHex: number) {
    ThreeSceneManager.tmpTrailColor.set(activeNeonHex);
    const activeColor = ThreeSceneManager.tmpTrailColor;
    const isDashing = player.dashTimer > 0;
    const isSlashing = player.slashTimer > 0;
    const speed = Math.hypot(player.velocity.x, player.velocity.y);
    const isMoving = speed > 0.5;

    const swordBoost = isSlashing ? 3.2 : isDashing ? 2.5 : isMoving ? 1.4 : 0.6;
    const limbBoost = isDashing ? 2.6 : isMoving ? 1.3 : 0.35;

    // 1. Katana Blade Tip World Position (Zero Allocation)
    ThreeSceneManager.tmpTrailVec.set(0, -22, 0);
    this.playerKatanaGroup.localToWorld(ThreeSceneManager.tmpTrailVec);
    this.updateSingleTrail(this.swordTrailHistory, ThreeSceneManager.tmpTrailVec, this.swordTrailGeo, 2.8, activeColor, swordBoost);

    // 2. Left Gauntlet / Wrist World Position (Zero Allocation)
    ThreeSceneManager.tmpTrailVec.set(0, -18, 0);
    this.playerLeftArm.localToWorld(ThreeSceneManager.tmpTrailVec);
    this.updateSingleTrail(this.leftHandTrailHistory, ThreeSceneManager.tmpTrailVec, this.leftHandTrailGeo, 1.8, activeColor, limbBoost);

    // 3. Right Gauntlet / Wrist World Position (Zero Allocation)
    ThreeSceneManager.tmpTrailVec.set(0, -18, 0);
    this.playerRightArm.localToWorld(ThreeSceneManager.tmpTrailVec);
    this.updateSingleTrail(this.rightHandTrailHistory, ThreeSceneManager.tmpTrailVec, this.rightHandTrailGeo, 1.8, activeColor, limbBoost);

    // 4. Left Ankle / Boot World Position (Zero Allocation)
    ThreeSceneManager.tmpTrailVec.set(0, -21, 1.2);
    this.playerLeftLeg.localToWorld(ThreeSceneManager.tmpTrailVec);
    this.updateSingleTrail(this.leftFootTrailHistory, ThreeSceneManager.tmpTrailVec, this.leftFootTrailGeo, 1.8, activeColor, limbBoost);

    // 5. Right Ankle / Boot World Position (Zero Allocation)
    ThreeSceneManager.tmpTrailVec.set(0, -21, 1.2);
    this.playerRightLeg.localToWorld(ThreeSceneManager.tmpTrailVec);
    this.updateSingleTrail(this.rightFootTrailHistory, ThreeSceneManager.tmpTrailVec, this.rightFootTrailGeo, 1.8, activeColor, limbBoost);
  }

  // --- 8. 3D PARTICLE SYSTEMS (SPARKS, SLLATTERS, BLOOD) ---
  private init3DParticles() {
    this.particleGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.MAX_3D_PARTICLES * 3);
    this.particleColors = new Float32Array(this.MAX_3D_PARTICLES * 3);
    this.particleSizes = new Float32Array(this.MAX_3D_PARTICLES);

    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 7.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(this.particleGeo, particleMat);
    this.scene.add(this.particleSystem);
  }

  // --- 9. 3D ATMOSPHERIC BIO-SPORES ---
  private init3DBioSpores() {
    this.sporeGeo = new THREE.BufferGeometry();
    this.sporePositions = new Float32Array(this.MAX_SPORES * 3);
    this.sporeColors = new Float32Array(this.MAX_SPORES * 3);

    for (let i = 0; i < this.MAX_SPORES; i++) {
      this.sporePositions[i * 3] = (Math.random() - 0.5) * 5000;
      this.sporePositions[i * 3 + 1] = 10 + Math.random() * 450;
      this.sporePositions[i * 3 + 2] = (Math.random() - 0.5) * 5000;

      const isCyan = i % 2 === 0;
      const c = isCyan ? new THREE.Color(0x00ffd1) : new THREE.Color(0xff00e5);
      this.sporeColors[i * 3] = c.r;
      this.sporeColors[i * 3 + 1] = c.g;
      this.sporeColors[i * 3 + 2] = c.b;
    }

    this.sporeGeo.setAttribute('position', new THREE.BufferAttribute(this.sporePositions, 3));
    this.sporeGeo.setAttribute('color', new THREE.BufferAttribute(this.sporeColors, 3));

    const sporeMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.sporeSystem = new THREE.Points(this.sporeGeo, sporeMat);
    this.scene.add(this.sporeSystem);
  }

  // ============================================================================
  // MAIN 3D SCENE UPDATE & RENDER LOOP
  // ============================================================================

  public render3D(
    player: Player,
    camera2D: Camera2D,
    obstacles: CyberObstacle[],
    entities: WorldEntity[],
    collectibles: Collectible[],
    lasers: LaserHazard[],
    props: CyberEnvironmentProp[],
    particles: Particle[],
    flyingSplatters: FlyingSplatter[],
    floatingTexts: FloatingText[],
    settings: GameSettings,
    rhythmState: RhythmBeatState,
    speedrunDelta: SpeedrunDeltaInfo,
    screenShake: number,
    screenShakeAngle: number,
    flashAlpha: number,
    flashColor: string,
    chunks: GridMapChunk[] = [],
    projectiles: Projectile[] = [],
    laserBurnMarks: LaserBurnMark[] = [],
    targetLockedEnemy: WorldEntity | null = null,
    remotePlayers: Map<string, RemotePlayerState> = new Map(),
    tacticalPings: TacticalPingMessage[] = []
  ) {
    this.animTick += 0.032;

    // 0. Update Dynamic HTML5 Canvas Golden Neon Billboard Textures (Throttled on mobile to prevent GPU bus stalls)
    this.goldenCanvasFrameCount++;
    const canvasThrottle = this.isMobileDevice ? 60 : 6;
    if (this.goldenCanvasFrameCount % canvasThrottle === 0) {
      this.renderGoldenCanvasTextures(this.animTick);
    }

    // 1. Sync 3D Camera with 2D Player, Dynamic Neon Flickering & Enemy Proximity Flashlight Glitch
    this.update3DCamera(player, camera2D, screenShake, screenShakeAngle, settings, entities);

    // 2. Update 3D Cyber Warrior Player Model & Animations
    this.update3DPlayer(player, rhythmState);

    // 2.5 Update 3D Multiplayer Squad (WebRTC Co-op)
    this.update3DRemotePlayers(remotePlayers);

    // 3. Update 3D Speedrun Ghost Silhouette
    this.update3DGhost(speedrunDelta);

    // 4. Update 3D Sci-Fi Factory Floor, Moving Neon Platforms, Containment Tubes & Rain
    this.updateFactoryEnvironment(player);
    this.updateCyberRain(player);
    this.updateVolumetricFog(player);

    // 4.5 Update 3D Chasm Void & Broken Floor Pit Hazards (Floor Cutouts, 3D Abyss Wells & Warning Rails)
    this.update3DPits(chunks, player);

    // 5. Update 3D Solid Obstacles & Building Geometry
    this.update3DObstacles(obstacles, player);

    // 6. Update 3D Mutated Bacteria Entities & World Entities
    this.update3DBacteria(entities);

    // 7. Update 3D Collectibles & Powerups
    this.update3DCollectibles(collectibles);

    // 8. Update 3D Laser Hazard Beams
    this.update3DLasers(lasers);

    // 8.5 Update 3D Thick Heavy Sci-Fi Plasma Projectiles & Laser Burn Scars
    this.update3DProjectiles(projectiles);
    this.update3DLaserBurns(laserBurnMarks);

    // 9. Update 3D Environment Props (Cyber Trees, Streetlights, Golden Billboards)
    this.update3DProps(props);
    this.updateGoldenPointLights(player, props);

    // 10. Update 3D Exit Portal
    this.update3DPortal(entities, player);

    // 11. Update 3D Particle System
    this.update3DParticleCloud(particles, flyingSplatters);

    // 12. Update 3D Atmospheric Bio-Spores
    this.update3DBioSpores(player);

    // 12.5 Frustum Culling Pass for 60 FPS Stability
    this.updateFrustumCulling();

    // 13. Render via WebGL (Fast direct hardware render pass on mobile for 60 FPS, EffectComposer on desktop)
    if (this.isMobileDevice) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render();
    }

    // 14. Render High-DPI 2D Overlay Pass (Floating Damage Texts, Flash, CRT, Metronome, Radar, Crosshair, Plasma Bloom)
    this.render2DOverlay(
      player,
      entities,
      collectibles,
      floatingTexts,
      rhythmState,
      speedrunDelta,
      flashAlpha,
      flashColor,
      settings,
      projectiles,
      laserBurnMarks,
      targetLockedEnemy,
      camera2D,
      remotePlayers,
      tacticalPings
    );
  }

  // --- FRUSTUM CULLING PASS (60 FPS PERFORMANCE OPTIMIZATION) ---
  private updateFrustumCulling() {
    this.camera.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.cameraFrustum.setFromProjectionMatrix(this.projScreenMatrix);

    // 1. Cull 3D Obstacle & Road Meshes
    for (const [, obsMesh] of this.obstacleMeshMap.entries()) {
      obsMesh.visible = this.isObjectInFrustum(obsMesh, 350);
    }

    // 2. Cull Cyber Props (Trees, Streetlights)
    for (const [, propGroup] of this.propMeshMap.entries()) {
      propGroup.visible = this.isObjectInFrustum(propGroup, 250);
    }
  }

  // --- 3D DYNAMIC HIGH-ANGLE TOP-DOWN OVER-THE-SHOULDER CAMERA CONTROLLER ---
  private update3DCamera(
    player: Player,
    _camera2D: Camera2D,
    screenShake: number,
    screenShakeAngle: number,
    _settings: GameSettings,
    entities: WorldEntity[] = []
  ) {
    const px = player.position.x * this.WORLD_SCALE;
    const pz = player.position.y * this.WORLD_SCALE;

    // Movement & Hero Dynamics
    const isDashing = player.dashTimer > 0;
    const isOverdrive = player.overdriveTimer > 0;
    const isCrouching = !!player.isCrouching;
    const isCovered = !!player.isCovered;
    const velX = player.velocity.x;
    const velY = player.velocity.y;
    const speed = Math.hypot(velX, velY);

    // High-Angle Top-Down Over-The-Shoulder Dimensions
    // Responsive camera framing for both portrait and landscape mobile screens
    const isMobileScreen = typeof window !== 'undefined' && (window.innerHeight < 600 || window.innerWidth < 900);
    const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;

    // Over-The-Shoulder Lateral Offset (Subtle in portrait to keep hero centered, right-biased in landscape)
    const shoulderOffsetDist = isPortrait ? 5 : (isCovered ? 10 : isCrouching ? 12 : 16);
    const shoulderX = shoulderOffsetDist;

    // Portrait mode pulls camera back and up slightly so the full corridor and enemies are framed cleanly without distortion
    const portraitDistScale = isPortrait ? 1.34 : 1.0;
    const portraitHeightScale = isPortrait ? 1.22 : 1.0;

    const baseCamDist = (isDashing ? 165 : isCovered ? 122 : isCrouching ? 128 : 142) + (isMobileScreen ? 14 : 0);
    const baseCamHeight = (isDashing ? 136 : isCovered ? 106 : isCrouching ? 102 : 122) + (isMobileScreen ? 10 : 0) + (screenShake > 0 ? (Math.random() - 0.5) * screenShake * 0.3 : 0);
    const camDist = baseCamDist * portraitDistScale;
    const camHeight = baseCamHeight * portraitHeightScale;
    const forwardLeadDist = ((isDashing ? 90 : 70) + (isMobileScreen ? 10 : 0)) * (isPortrait ? 1.15 : 1.0);

    // Directional Screen Shake Offset in 3D Space
    let shakeX = 0;
    let shakeZ = 0;
    let shakeY = 0;
    if (screenShake > 0) {
      const trauma = Math.pow(Math.min(screenShake / 40, 1), 1.5);
      const shakeMag = trauma * 14;
      shakeX = Math.cos(screenShakeAngle) * shakeMag;
      shakeZ = Math.sin(screenShakeAngle) * shakeMag;
      shakeY = (Math.random() - 0.5) * shakeMag * 0.5;
    }

    // Velocity Lookahead Vector in Forward Direction
    const maxLookahead = isDashing ? 45 : 22;
    const lookaheadX = speed > 0.2 ? (velX / speed) * Math.min(speed * 3.0, maxLookahead) : 0;
    const lookaheadZ = speed > 0.2 ? (velY / speed) * Math.min(speed * 3.0, maxLookahead) : 0;

    // Initialize camera position over the shoulder on first frame
    if (!this.cameraInitialized) {
      this.smoothedCamPos.set(
        px + shoulderX,
        camHeight,
        pz + camDist
      );
      this.smoothedLookAt.set(
        px + shoulderX * 0.2,
        12,
        pz - forwardLeadDist
      );
      this.cameraInitialized = true;
    }

    const isFalling = !!player.isFallingIntoAbyss || player.actionState === 'FALLING_INTO_VOID';
    const maxTimer = player.fallingMaxTimer || 75;
    const fallProg = isFalling ? Math.min(1.0, (maxTimer - (player.fallingTimer || 0)) / maxTimer) : 0;

    // Stable, natural perspective FOV: Never stretch beyond human vision
    const baseFov = this.baseAdaptiveFov || (isPortrait ? 58 : 60);
    const targetFov = isFalling
      ? (baseFov + 10 + fallProg * 26)
      : isDashing ? (baseFov + 4) : isCovered ? (baseFov - 3) : isCrouching ? (baseFov - 2) : baseFov;
    this.camera.fov += (targetFov - this.camera.fov) * (isFalling ? 0.22 : 0.08);
    this.camera.updateProjectionMatrix();

    // Target Camera Position (High Angle or Over-The-Chasm-Hole Peering Downward)
    const targetCamX = isFalling
      ? px + (Math.random() - 0.5) * fallProg * 8
      : px + shoulderX + shakeX + lookaheadX * 0.15;
    const targetCamY = isFalling
      ? Math.max(45, camHeight * (1 - fallProg * 0.35)) + shakeY
      : Math.max(70, camHeight + shakeY);
    const targetCamZ = isFalling
      ? pz + camDist * (1 - fallProg * 0.6)
      : pz + camDist + shakeZ + lookaheadZ * 0.15;

    // Smooth Camera Position Lag (Lerp Damping)
    const camPosLerp = isFalling ? 0.24 : isDashing ? 0.18 : isCrouching ? 0.12 : 0.14;
    this.smoothedCamPos.x += (targetCamX - this.smoothedCamPos.x) * camPosLerp;
    this.smoothedCamPos.y += (targetCamY - this.smoothedCamPos.y) * camPosLerp;
    this.smoothedCamPos.z += (targetCamZ - this.smoothedCamPos.z) * camPosLerp;

    // Target Look-At Point (Tilted downward towards ground or directly plunging down into abyss)
    const targetLookX = isFalling ? px : px + shoulderX * 0.25 + lookaheadX * 0.45 + shakeX * 0.3;
    const targetLookY = isFalling
      ? (12 - Math.pow(fallProg, 1.8) * 380)
      : 12 + (isCrouching ? -4 : 0);
    const targetLookZ = isFalling
      ? pz
      : pz - forwardLeadDist + lookaheadZ * 0.45 + shakeZ * 0.3;

    const lookLerpFactor = isFalling ? 0.25 : 0.16;
    this.smoothedLookAt.x += (targetLookX - this.smoothedLookAt.x) * lookLerpFactor;
    this.smoothedLookAt.y += (targetLookY - this.smoothedLookAt.y) * lookLerpFactor;
    this.smoothedLookAt.z += (targetLookZ - this.smoothedLookAt.z) * lookLerpFactor;

    // Apply Smoothed Position and Downward-Tilted LookAt
    this.camera.position.copy(this.smoothedCamPos);
    this.camera.up.set(0, 1, 0); // Always upright
    this.camera.lookAt(this.smoothedLookAt.x, this.smoothedLookAt.y, this.smoothedLookAt.z);

    // =========================================================================
    // 1. DYNAMIC RANDOM AMBIENT & BILLBOARD FLICKERING SYSTEM (မှိတ်တုတ်မှိတ်တုတ် မီးရောင်)
    // =========================================================================
    const dt = 0.032;
    this.ambientFlickerTimer += dt;

    // Check if it's time to trigger an ambient light dropout/stutter (every 3 to 7 seconds)
    if (!this.isAmbientFlickering && this.ambientFlickerTimer >= this.nextAmbientFlickerInterval) {
      this.isAmbientFlickering = true;
      this.ambientFlickerElapsed = 0;
      this.ambientFlickerDuration = 0.2 + Math.random() * 0.25; // 0.20s to 0.45s rapid glitch
      this.nextAmbientFlickerInterval = 3.0 + Math.random() * 4.0; // Next flicker in 3 to 7 seconds
      this.ambientFlickerTimer = 0;
      sound.playNeonFlicker();
    }

    if (this.isAmbientFlickering) {
      this.ambientFlickerElapsed += dt;
      if (this.ambientFlickerElapsed >= this.ambientFlickerDuration) {
        this.isAmbientFlickering = false;
        this.ambientFlickerFactor = 1.0;
      } else {
        // High-frequency failing neon tube strobe waveform with dark dropouts
        const strobeWave = Math.sin(this.animTick * 60) + Math.sin(this.animTick * 115);
        if (strobeWave < -0.4) {
          this.ambientFlickerFactor = 0.04; // Near total pitch darkness
        } else if (strobeWave < 0.2) {
          this.ambientFlickerFactor = 0.28; // Low dim buzzing glow
        } else if (Math.random() < 0.3) {
          this.ambientFlickerFactor = 0.08; // Sudden glitch blackout
        } else {
          this.ambientFlickerFactor = 0.95; // Snap back
        }
      }
    } else {
      this.ambientFlickerFactor = 1.0;
    }

    // Apply ambient flicker factor to global ambient and directional city lights
    this.ambientLight.intensity = 0.18 * this.ambientFlickerFactor;
    this.dirCyanKeyLight.intensity = 0.28 * this.ambientFlickerFactor;
    this.dirMagentaRimLight.intensity = 0.22 * this.ambientFlickerFactor;

    // Modulate wall billboards ("KKS", "Cyber Game", "Burma Batik") and neon trims
    if (this.goldenMaterials) {
      const bEmissive = 0.4 * this.ambientFlickerFactor;
      this.goldenMaterials.kksH.emissiveIntensity = bEmissive;
      this.goldenMaterials.kksV.emissiveIntensity = bEmissive;
      this.goldenMaterials.cyberGameH.emissiveIntensity = bEmissive;
      this.goldenMaterials.cyberGameV.emissiveIntensity = bEmissive;
      this.goldenMaterials.burmaBatikH.emissiveIntensity = bEmissive;
      this.goldenMaterials.burmaBatikV.emissiveIntensity = bEmissive;
      (this.goldenMaterials.goldNeonTrim as THREE.MeshStandardMaterial).emissiveIntensity = 0.45 * this.ambientFlickerFactor;
      (this.goldenMaterials.goldNeonTrimBright as THREE.MeshStandardMaterial).emissiveIntensity = 0.48 * this.ambientFlickerFactor;
      (this.goldenMaterials.amberNeonTrim as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 * this.ambientFlickerFactor;
    }

    // =========================================================================
    // 2. FLASHLIGHT GLITCH & SHAKE NEAR ENEMIES (ရန်သူအနားရောက်ရင် ဓာတ်မီးတုန်ခါခြင်း)
    // =========================================================================
    let minThreatDist = 99999;
    let isPointingAtThreat = false;
    const playerAngle = player.angle;

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (!e.active) continue;
      if (e.type === 'MUTATED_BACTERIA' && e.bacteriaData) {
        const b = e.bacteriaData;
        if (b.surrendered || b.health <= 0) continue;

        const bx = b.position.x;
        const bz = b.position.y;
        const edx = bx - px;
        const edz = bz - pz;
        const eDist = Math.hypot(edx, edz);

        if (eDist < 360) {
          if (eDist < minThreatDist) {
            minThreatDist = eDist;
          }

          // Check if enemy is in forward cone of player flashlight (or close stalker radius)
          const angleToEnemy = Math.atan2(edz, edx);
          let angleDiff = Math.abs(angleToEnemy - playerAngle);
          while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

          if (angleDiff < Math.PI / 2.2 || eDist < 190) {
            isPointingAtThreat = true;
          }
        }
      }
    }

    let targetThreatGlitch = 0;
    if (minThreatDist < 340 && (isPointingAtThreat || minThreatDist < 190)) {
      // 0.0 at 340, ramping up to 1.0 at 60
      targetThreatGlitch = Math.max(0, Math.min(1.0, 1 - (minThreatDist - 60) / 280));
    }

    this.currentFlashlightGlitchThreat += (targetThreatGlitch - this.currentFlashlightGlitchThreat) * 0.25;
    const glitchAmount = this.currentFlashlightGlitchThreat;

    // Calculate forward orientation with dynamic glitch jitter & beam shake
    let jitterX = 0;
    let jitterZ = 0;
    let jitterAngle = 0;
    let beamStrobeFactor = 1.0;

    if (glitchAmount > 0.05) {
      const shakePower = glitchAmount * 40;
      jitterX = (Math.random() - 0.5) * shakePower;
      jitterZ = (Math.random() - 0.5) * shakePower;
      jitterAngle = (Math.random() - 0.5) * 0.25 * glitchAmount;

      // Stuttering brightness drop & electronic glitch
      if (Math.random() < glitchAmount * 0.7) {
        beamStrobeFactor = 0.15 + Math.random() * 0.45;
      }

      // Sync electric glitch sound effect when proximity threat is active (throttled)
      if (glitchAmount > 0.35 && (this.animTick - this.lastFlashlightGlitchSoundTick > 1.1)) {
        sound.playFlashlightGlitch();
        this.lastFlashlightGlitchSoundTick = this.animTick;
      }
    }

    // --- REAL-TIME DYNAMIC LIGHTING & HERO HEADLIGHT RIG SYNC ---
    const isJammed = !!(player.flashlightJammedTimer && player.flashlightJammedTimer > 0);

    if (isJammed) {
      // 3-second blackout from Elite EMP Blast
      this.heroSpotLight.intensity = 0;
      if (this.heroVolumetricCone) {
        (this.heroVolumetricCone.material as THREE.MeshBasicMaterial).opacity = 0;
      }
      this.ambientLight.intensity = 0.03; // Pitch darkness: player relies on radar & red emergency pulse
      this.dirCyanKeyLight.intensity = 0.04;
      this.dirMagentaRimLight.intensity = 0.04;

      // Emergency hazard red strobe on player point light
      const empStrobe = Math.sin(this.animTick * 30) > 0 ? 0xff0044 : 0x220005;
      this.playerPointLight.position.set(px, isCrouching ? 22 : 35, pz);
      this.playerPointLight.color.setHex(empStrobe);
      this.playerPointLight.intensity = 1.2;
    } else {
      this.playerPointLight.position.set(px, isCrouching ? 22 : 35, pz);
      this.playerPointLight.color.setHex(isOverdrive ? 0xff00e5 : isCovered ? 0x00aaff : 0x00ffd1);
      this.playerPointLight.intensity = isCovered ? 0.8 : isCrouching ? 1.4 : 2.4;

      // Real-Time Hero Forward Spotlight & Volumetric Cone with Jitter & Glitch
      const fwdX = Math.cos(player.angle + jitterAngle);
      const fwdZ = Math.sin(player.angle + jitterAngle);

      const baseIntensity = isCovered ? 0.5 : isCrouching ? 2.0 : 4.2;
      this.heroSpotLight.position.set(px + (Math.random() - 0.5) * 3 * glitchAmount, 26, pz + (Math.random() - 0.5) * 3 * glitchAmount);
      this.heroSpotLightTarget.position.set(px + fwdX * 280 + jitterX, 12, pz + fwdZ * 280 + jitterZ);
      this.heroSpotLight.color.setHex(isOverdrive ? 0xff0055 : 0x00ffd1);
      this.heroSpotLight.intensity = baseIntensity * beamStrobeFactor;

      if (this.heroVolumetricCone) {
        this.heroVolumetricCone.position.set(px, 24, pz);
        this.heroVolumetricCone.rotation.y = -(player.angle + jitterAngle) + Math.PI / 2;
        const baseConeOpacity = isCovered ? 0.04 : isCrouching ? 0.08 : 0.16;
        (this.heroVolumetricCone.material as THREE.MeshBasicMaterial).opacity = baseConeOpacity * beamStrobeFactor;

        // Electromagnetic interference color distortion when glitching near enemies
        if (glitchAmount > 0.35 && Math.random() < 0.35) {
          (this.heroVolumetricCone.material as THREE.MeshBasicMaterial).color.setHex(0x55ffff);
        } else {
          (this.heroVolumetricCone.material as THREE.MeshBasicMaterial).color.setHex(
            isOverdrive ? 0xff0055 : isCovered ? 0x00aaff : 0x00ffd1
          );
        }
      }
    }

    // Directional Key Light & Soft Shadow Box follows player smoothly
    this.dirCyanKeyLight.position.set(px + 450, 1400, pz + 550);
    this.dirCyanKeyLight.target.position.set(px, 0, pz);
    this.dirMagentaRimLight.position.set(px - 500, 1100, pz - 600);
    this.dirMagentaRimLight.target.position.set(px, 0, pz);
  }

  // --- VOLUMETRIC FOG & ATMOSPHERIC DRIFT UPDATE ---
  private updateVolumetricFog(player: Player) {
    const px = player.position.x * this.WORLD_SCALE;
    const pz = player.position.y * this.WORLD_SCALE;

    // Drift ground fog planes smoothly around player
    if (this.volumetricFogGroup) {
      this.volumetricFogGroup.position.set(px * 0.15, 0, pz * 0.15);
    }

    for (let i = 0; i < this.volumetricFogPlanes.length; i++) {
      const plane = this.volumetricFogPlanes[i];
      const rotDir = i % 2 === 0 ? 1 : -1;
      plane.rotation.y += (0.0002 + i * 0.0001) * rotDir;

      // Subtle atmospheric breathing pulse
      const pulse = 1.0 + Math.sin(this.animTick * 1.5 + i) * 0.06;
      plane.scale.set(pulse, 1, pulse);
    }

    // Rotate overhead skylight shafts
    if (this.volumetricShaftsGroup) {
      this.volumetricShaftsGroup.rotation.y += 0.0004;
    }
  }

  // --- 3D SLEEK PLAYER ANIMATIONS & RIG UPDATE ---
  private update3DPlayer(player: Player, rhythmState: RhythmBeatState) {
    const px = player.position.x * this.WORLD_SCALE;
    const pz = player.position.y * this.WORLD_SCALE;

    const isCrouching = !!player.isCrouching;
    const isCovered = !!player.isCovered;

    // Lower player body when crouching / taking cover or plunging into bottomless abyss pit
    const isFalling = !!player.isFallingIntoAbyss || player.actionState === 'FALLING_INTO_VOID';
    const maxTimer = player.fallingMaxTimer || 75;
    const fallProgress = isFalling ? Math.min(1.0, (maxTimer - (player.fallingTimer || 0)) / maxTimer) : 0;
    const playerBaseY = isFalling
      ? -Math.pow(fallProgress, 1.85) * 550
      : isCrouching
      ? -6
      : 0;

    this.playerGroup.position.set(px, playerBaseY, pz);

    // Dynamic scale when falling down into the void
    const fallScale = isFalling ? Math.max(0.01, Math.pow(1 - fallProgress * 0.98, 2)) : 1.0;
    this.playerGroup.scale.set(fallScale, fallScale, fallScale);

    // Player Rotation: 3D Y-axis aligns with 2D Movement Angle + tumble spin on void fall
    this.playerGroup.rotation.y = -player.angle + Math.PI / 2;
    if (isFalling) {
      this.playerGroup.rotation.x = fallProgress * Math.PI * 8;
      this.playerGroup.rotation.z = fallProgress * Math.PI * 6;
    } else {
      this.playerGroup.rotation.x = 0;
      this.playerGroup.rotation.z = 0;
    }

    // Movement Animation: Sneaking or Run-Cycle stride on limbs
    const speed = Math.hypot(player.velocity.x, player.velocity.y);
    const isMoving = speed > 0.3;
    const strideFreq = isCrouching ? 10 : 20;
    const strideMag = isCrouching ? 0.35 : 0.75;
    const runCycle = isMoving ? Math.sin(this.animTick * strideFreq) : 0;

    this.playerLeftArm.rotation.x = runCycle * strideMag + (isCrouching ? 0.4 : 0);
    this.playerRightArm.rotation.x = -runCycle * strideMag + (isCrouching ? 0.4 : 0);
    this.playerLeftLeg.rotation.x = -runCycle * (strideMag * 1.1) + (isCrouching ? 0.3 : 0);
    this.playerRightLeg.rotation.x = runCycle * (strideMag * 1.1) + (isCrouching ? 0.3 : 0);

    // Crouching torso bend
    this.playerTorso.rotation.x = isCrouching ? 0.32 : 0;

    // Orbiting Halo Rings Animation
    this.playerHaloRing1.rotation.z += 0.05;
    this.playerHaloRing1.rotation.y += 0.03;
    this.playerHaloRing2.rotation.z -= 0.04;
    this.playerHaloRing2.rotation.y -= 0.03;

    // Arc Reactor Kinetic Containment Ring Rotation
    if (this.playerReactorRing) {
      this.playerReactorRing.rotation.z += 0.08;
    }

    // Combat Style & Action Determination
    const isBlaster = player.activeCombatStyle === 'BLASTER';
    const isShooting = player.actionState === 'SHOOTING' || player.shootTimer > 0 || (player.muzzleFlashTimer !== undefined && player.muzzleFlashTimer > 0);
    const isSlashing = player.actionState === 'SLASHING' || player.slashTimer > 0;

    if (isBlaster) {
      // --- BLASTER WEAPON ACTIVE ---
      this.playerBlasterGroup.visible = true;
      this.playerKatanaGroup.visible = false;
      this.playerSheathedKatanaGroup.visible = true;
      this.slashArcMesh.visible = false;
      this.swordLight.intensity = 0;

      if (isShooting) {
        // Shooting Aim Stance & Recoil Kickback
        const recoilKick = Math.sin(this.animTick * 45) * 2.2;
        this.playerRightArm.rotation.x = -Math.PI / 2.05 + Math.sin(this.animTick * 45) * 0.08;
        this.playerRightArm.rotation.y = 0.05;
        this.playerBlasterGroup.position.z = 4.5 - recoilKick;

        // Active Muzzle Flash Burst & Point Light
        this.playerMuzzleFlashMesh.visible = true;
        const flashScale = 1.0 + Math.random() * 0.7;
        this.playerMuzzleFlashMesh.scale.set(flashScale, flashScale, flashScale * 1.5);

        this.blasterLight.position.set(px, 28, pz);
        this.blasterLight.intensity = 6.0;
        this.playerBlasterLaserBeam.visible = true;
      } else {
        // Idle / Running Ready Stance
        this.playerBlasterGroup.position.z = 4.5;
        this.playerMuzzleFlashMesh.visible = false;
        this.blasterLight.intensity = 0;
        this.playerBlasterLaserBeam.visible = isMoving;

        if (isMoving) {
          this.playerRightArm.rotation.x = -0.65 - runCycle * 0.25;
          this.playerRightArm.rotation.y = 0;
        } else {
          this.playerRightArm.rotation.x = -0.55;
          this.playerRightArm.rotation.y = 0;
        }
      }
    } else {
      // --- KATANA / TAKEDOWN ACTIVE ---
      this.playerBlasterGroup.visible = false;
      this.playerKatanaGroup.visible = true;
      this.playerSheathedKatanaGroup.visible = false;
      this.playerMuzzleFlashMesh.visible = false;
      this.blasterLight.intensity = 0;

      if (isSlashing) {
        const slashProgress = 1 - (player.slashTimer || 12) / 18;
        this.playerRightArm.rotation.x = -Math.PI / 2 + slashProgress * Math.PI * 1.3;
        this.playerRightArm.rotation.y = Math.sin(slashProgress * Math.PI) * 1.2;

        // Activate Slash Arc Mesh with High Intensity
        this.slashArcMesh.visible = true;
        this.slashArcMesh.position.set(px, 18, pz);
        this.slashArcMesh.rotation.y = this.playerGroup.rotation.y + Math.PI / 2;
        (this.slashArcMesh.material as THREE.MeshBasicMaterial).opacity = ((player.slashTimer || 12) / 18) * 0.95;

        // Sword Light Pulse
        this.swordLight.position.set(px, 30, pz);
        this.swordLight.intensity = ((player.slashTimer || 12) / 18) * 6.5;

        // Plasma Blade Frequency Flare
        if (this.playerKatanaGlow) {
          this.playerKatanaGlow.scale.set(1.4, 1.1, 1.6);
        }
      } else {
        this.slashArcMesh.visible = false;
        this.swordLight.intensity = 0;
        if (this.playerKatanaGlow) {
          const idlePulse = (isCovered ? 0.4 : 1.0) + Math.sin(this.animTick * 12) * 0.15;
          this.playerKatanaGlow.scale.set(idlePulse, 1.0, idlePulse);
        }
      }
    }

    // Dynamic Color Neon Shift (Overdrive / 130 BPM Beat Sync / Health State / EMP Jam / Stealth Cloak)
    const bpmFrequency = 130 / 60; // 2.1667 Hz
    const bpmPhase = this.animTick * bpmFrequency * Math.PI * 2;
    const bpmPulse = 0.75 + 0.25 * Math.pow(Math.max(0, Math.sin(bpmPhase)), 3);

    const isOverdrive = player.overdriveTimer > 0;
    const isJammed = !!(player.flashlightJammedTimer && player.flashlightJammedTimer > 0);
    const healthPct = (player.integrity || 100) / (player.maxIntegrity || 100);

    let neonColor = 0x00ffd1; // Default: Vibrant Cyber Cyan
    if (isOverdrive) {
      neonColor = 0xff00e5; // Hyper Magenta Overdrive
    } else if (isJammed) {
      // EMP Hazard Alert: High-speed Strobe Crimson Red
      neonColor = Math.sin(this.animTick * 30) > 0 ? 0xff0033 : 0x440011;
    } else if (healthPct < 0.35) {
      // Critical Health: Emergency Red Pulse
      neonColor = Math.sin(this.animTick * 22) > 0 ? 0xff0044 : 0xaa0022;
    } else if (healthPct < 0.70) {
      // Warning State (Sub-70% Health): Tactical Amber Gold
      neonColor = 0xffaa00;
    } else if (isCovered) {
      neonColor = 0x0088ff; // Stealth Cloak: Deep Cobalt
    } else if (rhythmState.isNearBeat) {
      neonColor = 0x39ff14; // Perfect Beat Sync: Acid Green Flash
    }

    (this.playerVisor.material as THREE.MeshBasicMaterial).color.setHex(neonColor);
    (this.playerReactorCore.material as THREE.MeshBasicMaterial).color.setHex(neonColor);
    (this.playerKatanaBlade.material as THREE.MeshBasicMaterial).color.setHex(neonColor);
    (this.playerBlasterCoil.material as THREE.MeshBasicMaterial).color.setHex(neonColor);
    (this.playerPlasmaFlameLeft.material as THREE.MeshBasicMaterial).color.setHex(neonColor);
    (this.playerPlasmaFlameRight.material as THREE.MeshBasicMaterial).color.setHex(neonColor);
    this.playerPointLight.color.setHex(neonColor);
    this.blasterLight.color.setHex(neonColor);

    // Pulse the core Arc Reactor with 130 BPM rhythm
    if (this.playerReactorCore) {
      this.playerReactorCore.scale.set(bpmPulse, bpmPulse, bpmPulse);
    }
    if (this.playerKatanaBlade) {
      const kScale = (player.slashTimer > 0 ? 1.3 : 1.0) * bpmPulse;
      this.playerKatanaBlade.scale.set(kScale, 1.0, kScale);
    }

    // Stealth Cover Cloak Aura / Shield Hologram Sphere
    this.playerShieldMesh.visible = player.hasShield || isCovered;
    if (player.hasShield || isCovered) {
      this.playerShieldMesh.rotation.y += 0.04;
      this.playerShieldMesh.rotation.x += 0.02;
      (this.playerShieldMesh.material as THREE.MeshBasicMaterial).color.setHex(isCovered ? 0x0088ff : 0x00ffd1);
      (this.playerShieldMesh.material as THREE.MeshBasicMaterial).opacity = isCovered ? 0.22 : 0.35;
    }

    // Jet Thruster Plasma Scale & Pulse
    if (player.dashTimer > 0) {
      this.playerPlasmaFlameLeft.scale.set(2.2, 3.5, 2.2);
      this.playerPlasmaFlameRight.scale.set(2.2, 3.5, 2.2);
    } else if (isMoving) {
      const pulse = (1.0 + Math.sin(this.animTick * 15) * 0.3) * bpmPulse;
      this.playerPlasmaFlameLeft.scale.set(1.1 * pulse, 1.6 * pulse, 1.1 * pulse);
      this.playerPlasmaFlameRight.scale.set(1.1 * pulse, 1.6 * pulse, 1.1 * pulse);
    } else {
      this.playerPlasmaFlameLeft.scale.set(0.6 * bpmPulse, 0.7 * bpmPulse, 0.6 * bpmPulse);
      this.playerPlasmaFlameRight.scale.set(0.6 * bpmPulse, 0.7 * bpmPulse, 0.6 * bpmPulse);
    }

    // Update Dynamic Neon Motion Trails on Sword and Cybernetic Limbs
    this.updatePlayerNeonTrails(player, neonColor);
  }

  // --- MULTIPLAYER SQUAD REMOTE PLAYERS 3D SYNCHRONIZATION ---
  private update3DRemotePlayers(remotePlayers: Map<string, RemotePlayerState>) {
    // 1. Remove disconnected players
    for (const [id, entry] of this.remotePlayerMeshMap.entries()) {
      if (!remotePlayers.has(id)) {
        this.remotePlayersGroup.remove(entry.group);
        this.remotePlayerMeshMap.delete(id);
      }
    }

    // 2. Update or spawn remote players
    for (const [id, remote] of remotePlayers.entries()) {
      let entry = this.remotePlayerMeshMap.get(id);

      if (!entry) {
        // Build streamlined 3D Cyber Warrior Rig
        const group = new THREE.Group();
        const hue = remote.characterHue ?? 140;
        const neonColor = new THREE.Color(`hsl(${hue}, 100%, 55%)`);
        const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });

        // Torso
        const torso = new THREE.Mesh(
          new THREE.CylinderGeometry(7, 9, 22, 10),
          this.materials.playerCarbonArmor
        );
        torso.position.y = 22;
        group.add(torso);

        // Chest neon core
        const chest = new THREE.Mesh(
          new THREE.BoxGeometry(10, 10, 5),
          neonMat
        );
        chest.position.set(0, 2, 4);
        torso.add(chest);

        // Helmet & Visor
        const head = new THREE.Group();
        head.position.y = 15;
        const helmet = new THREE.Mesh(
          new THREE.SphereGeometry(6, 12, 10),
          this.materials.playerCarbonArmor
        );
        head.add(helmet);
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(8, 3, 3),
          neonMat
        );
        visor.position.set(0, 0, 4.5);
        head.add(visor);
        torso.add(head);

        // Limbs
        const armGeo = new THREE.CylinderGeometry(2, 2.4, 14, 8);
        const legGeo = new THREE.CylinderGeometry(2.5, 3.2, 18, 8);

        const leftArm = new THREE.Group();
        leftArm.position.set(-9, 8, 0);
        const lArmMesh = new THREE.Mesh(armGeo, this.materials.playerSecondaryPlates);
        lArmMesh.position.y = -6;
        leftArm.add(lArmMesh);
        torso.add(leftArm);

        const rightArm = new THREE.Group();
        rightArm.position.set(9, 8, 0);
        const rArmMesh = new THREE.Mesh(armGeo, this.materials.playerSecondaryPlates);
        rArmMesh.position.y = -6;
        rightArm.add(rArmMesh);
        torso.add(rightArm);

        // Katana Blade
        const katanaGeo = new THREE.BoxGeometry(0.8, 26, 2.5);
        const katanaBlade = new THREE.Mesh(katanaGeo, neonMat);
        katanaBlade.position.set(0, -10, 8);
        katanaBlade.rotation.x = Math.PI / 4;
        rightArm.add(katanaBlade);

        const leftLeg = new THREE.Group();
        leftLeg.position.set(-4.5, -11, 0);
        const lLegMesh = new THREE.Mesh(legGeo, this.materials.playerSecondaryPlates);
        lLegMesh.position.y = -8;
        leftLeg.add(lLegMesh);
        torso.add(leftLeg);

        const rightLeg = new THREE.Group();
        rightLeg.position.set(4.5, -11, 0);
        const rLegMesh = new THREE.Mesh(legGeo, this.materials.playerSecondaryPlates);
        rLegMesh.position.y = -8;
        rightLeg.add(rLegMesh);
        torso.add(rightLeg);

        this.remotePlayersGroup.add(group);
        entry = {
          group,
          leftArm,
          rightArm,
          leftLeg,
          rightLeg,
          katanaBlade,
          neonMaterial: neonMat,
          hue,
        };
        this.remotePlayerMeshMap.set(id, entry);
      }

      // Smooth Position Interpolation
      const targetX = remote.x * this.WORLD_SCALE;
      const targetZ = remote.y * this.WORLD_SCALE;
      const dx = targetX - entry.group.position.x;
      const dz = targetZ - entry.group.position.z;
      if (Math.hypot(dx, dz) > 250) {
        entry.group.position.x = targetX;
        entry.group.position.z = targetZ;
      } else {
        entry.group.position.x += dx * 0.45;
        entry.group.position.z += dz * 0.45;
      }

      const isFalling = !!remote.isFallingIntoAbyss;
      if (isFalling) {
        entry.group.position.y -= 15;
        entry.group.rotation.x += 0.2;
        entry.group.rotation.z += 0.15;
        entry.group.scale.multiplyScalar(0.96);
      } else {
        entry.group.position.y = remote.isCrouching ? -6 : 0;
        entry.group.rotation.x = 0;
        entry.group.rotation.z = 0;
        entry.group.scale.set(1, 1, 1);
        entry.group.rotation.y = -remote.angle + Math.PI / 2;
      }

      // Stride animation
      const speed = Math.hypot(remote.vx || 0, remote.vy || 0);
      const isMoving = speed > 0.3;
      const stride = isMoving ? Math.sin(this.animTick * 20) * 0.7 : 0;
      entry.leftArm.rotation.x = stride;
      entry.rightArm.rotation.x = -stride;
      entry.leftLeg.rotation.x = -stride * 1.1;
      entry.rightLeg.rotation.x = stride * 1.1;

      // Slashing motion
      if (remote.isSlashing) {
        entry.rightArm.rotation.x = -Math.PI / 2 + Math.sin(this.animTick * 35) * 0.8;
      }
    }
  }

  // --- 3D SPEEDRUN GHOST ---
  private update3DGhost(speedrunDelta: SpeedrunDeltaInfo) {
    if (speedrunDelta.hasGhost && speedrunDelta.ghostPos) {
      this.ghostGroup.visible = true;
      this.ghostGroup.position.set(speedrunDelta.ghostPos.x, 0, speedrunDelta.ghostPos.y);
      this.ghostGroup.rotation.y += 0.02;
    } else {
      this.ghostGroup.visible = false;
    }
  }

  // --- 3D SCI-FI FACTORY FLOOR & ENVIRONMENT ANIMATION ENGINE ---
  private updateFactoryEnvironment(player: Player) {
    // 1. Rotate Industrial Exhaust Turbines & Ventilation Fans
    for (const turb of this.spinningTurbines) {
      if (turb.axis === 'y') {
        turb.mesh.rotation.y += turb.speed;
      } else {
        turb.mesh.rotation.z += turb.speed;
      }
    }

    // 2. Animate Multi-Layered Moving Neon Platforms
    this.updateMovingPlatforms();

    // 3. Animate Glass Containment Tubes with Giant Specimens
    this.updateGiantSpecimens();

    // 4. Animate Flying Heavy Cargo Drones in Upper Factory Atmosphere
    for (const d of this.flyingDrones) {
      d.mesh.position.x += d.speed * 0.016;
      d.mesh.position.y = d.y + Math.sin(this.animTick * 2.2 + d.z * 0.01) * 14;
      if (d.mesh.position.x > d.endX) {
        d.mesh.position.x = d.startX;
      }
    }

    // 5. Keep Factory Floor Geometry Centered gracefully around Player Coordinates
    if (this.groundPlaneMesh) {
      this.groundPlaneMesh.position.set(player.position.x, -1, player.position.y);
    }
    if (this.gridFloorMesh) {
      const gridStep = 55.55;
      this.gridFloorMesh.position.set(
        Math.floor(player.position.x / gridStep) * gridStep,
        0.5,
        Math.floor(player.position.y / gridStep) * gridStep
      );
    }
    if (this.floorDecalsGroup) {
      this.floorDecalsGroup.position.set(
        Math.floor(player.position.x / 1200) * 1200,
        0,
        Math.floor(player.position.y / 1200) * 1200
      );
    }
    if (this.factoryFloorGroup) {
      const px = player.position.x * 0.15;
      const pz = player.position.y * 0.15;
      this.factoryFloorGroup.position.set(px, 0, pz);
    }
  }

  // --- MULTI-LAYERED MOVING NEON PLATFORMS ANIMATION ---
  private updateMovingPlatforms() {
    for (let i = 0; i < this.movingPlatforms.length; i++) {
      const plat = this.movingPlatforms[i];
      const time = this.animTick * plat.speed + plat.phase;

      if (plat.layer === 'CONVEYOR') {
        // Low-tier sliding horizontal rail movement
        const offsetX = Math.sin(time) * plat.amplitude.x;
        const offsetZ = Math.cos(time) * plat.amplitude.z;
        plat.group.position.x = plat.basePos.x + offsetX;
        plat.group.position.z = plat.basePos.z + offsetZ;

        // Pulse high-emissive neon edge strips
        const neonPulse = 1.0 + Math.sin(time * 3) * 0.25;
        for (const strip of plat.neonStrips) {
          strip.scale.set(1, neonPulse, 1);
        }
      } else if (plat.layer === 'CRANE') {
        // Mid-tier suspended crane: horizontal sway + vertical hydraulic oscillation
        const offsetX = Math.sin(time) * plat.amplitude.x;
        const offsetY = Math.sin(time * 1.5) * plat.amplitude.y;
        const offsetZ = Math.cos(time) * plat.amplitude.z;
        plat.group.position.x = plat.basePos.x + offsetX;
        plat.group.position.y = plat.basePos.y + offsetY;
        plat.group.position.z = plat.basePos.z + offsetZ;

        // Slight natural pendulum tilt
        plat.group.rotation.z = Math.sin(time) * 0.04;
        plat.group.rotation.x = Math.cos(time) * 0.04;
      } else if (plat.layer === 'SKYWAY') {
        // High-altitude logistics railcars: long rapid traverses
        const offsetX = Math.sin(time * 0.8) * plat.amplitude.x;
        const offsetY = Math.sin(time * 1.6) * plat.amplitude.y;
        const offsetZ = Math.cos(time * 0.8) * plat.amplitude.z;
        plat.group.position.x = plat.basePos.x + offsetX;
        plat.group.position.y = plat.basePos.y + offsetY;
        plat.group.position.z = plat.basePos.z + offsetZ;

        // Face forward along trajectory
        plat.group.rotation.y = Math.cos(time * 0.8) >= 0 ? 0 : Math.PI;
      }
    }
  }

  // --- GIANT SPECIMENS IN GLASS CONTAINMENT TUBES ANIMATION ---
  private updateGiantSpecimens() {
    for (let i = 0; i < this.giantContainmentTubes.length; i++) {
      const tube = this.giantContainmentTubes[i];
      const time = this.animTick * 2.5 + tube.pulsePhase;

      // 1. Slow Suspended Specimen Floating & Rotation
      tube.specimenMesh.rotation.y += tube.rotSpeed;
      tube.specimenMesh.position.y = tube.vatGroup.position.y + 190 + Math.sin(time) * 12;

      // 2. Liquid Bioluminescent Breathing Pulse
      const fluidPulse = 1.0 + Math.sin(time * 1.4) * 0.035;
      tube.liquidMesh.scale.set(fluidPulse, 1, fluidPulse);

      // 3. Local Vat PointLight Pulsing Intensity
      tube.light.intensity = 2.0 + Math.sin(time * 2) * 0.7;

      // 4. Specimen-Specific Organic / Mechanical Animations
      if (tube.specimenType === 'BIO_LEVIATHAN') {
        const organelle = tube.specimenMesh.getObjectByName('organelleCore');
        if (organelle) {
          organelle.rotation.x += 0.03;
          organelle.rotation.z += 0.02;
          const scale = 1.0 + Math.sin(time * 3) * 0.2;
          organelle.scale.set(scale, scale, scale);
        }

        const tentacles = tube.specimenMesh.getObjectByName('tentacles');
        if (tentacles) {
          for (let t = 0; t < tentacles.children.length; t++) {
            const arm = tentacles.children[t];
            arm.rotation.z = 0.35 + Math.sin(time * 2 + t * 1.1) * 0.25;
            arm.rotation.x = Math.cos(time * 2 + t * 1.1) * 0.2;
          }
        }
      } else if (tube.specimenType === 'CHIMERA_APEX') {
        const ring1 = tube.specimenMesh.getObjectByName('restraintRing1');
        if (ring1) ring1.rotation.z += 0.04;
        const ring2 = tube.specimenMesh.getObjectByName('restraintRing2');
        if (ring2) ring2.rotation.y += 0.03;
      } else if (tube.specimenType === 'CRYSTAL_SPORE') {
        const crystal = tube.specimenMesh.getObjectByName('crystalCore');
        if (crystal) {
          crystal.rotation.y += 0.04;
          crystal.rotation.x = Math.sin(time) * 0.2;
        }
      }

      // 5. Rising Aeration Bubbles inside the Fluid
      const bPos = tube.bubbleParticles.geometry.attributes.position.array as Float32Array;
      const bCount = bPos.length / 3;
      for (let b = 0; b < bCount; b++) {
        bPos[b * 3 + 1] += 1.6; // Rise speed
        if (bPos[b * 3 + 1] > 360) {
          bPos[b * 3 + 1] = 40;
          bPos[b * 3] = (Math.random() - 0.5) * 80;
          bPos[b * 3 + 2] = (Math.random() - 0.5) * 80;
        }
      }
      tube.bubbleParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  // --- CYBERPUNK RAIN & GROUND SPLASH UPDATE ---
  private updateCyberRain(player: Player) {
    if (!this.rainSystem || !this.rainGeo) return;

    const px = player.position.x * this.WORLD_SCALE;
    const pz = player.position.y * this.WORLD_SCALE;

    // Follow player in X/Z while raining downward
    this.rainSystem.position.set(px, 0, pz);

    const pos = this.rainPositions;
    const count = this.MAX_RAIN_DROPS;
    const dt = 0.016;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos[idx + 1] -= this.rainVelocities[i] * dt;
      // Slight wind slant along X
      pos[idx] += 45 * dt;

      // Hit Ground (Y <= 0)
      if (pos[idx + 1] <= 0) {
        // Spawn Ground Splash Ripple from Pool
        if (i % 6 === 0) {
          this.spawnSplashRipple(px + pos[idx], pz + pos[idx + 2]);
        }

        // Reset raindrop back to sky
        pos[idx + 1] = 600 + Math.random() * 200;
        pos[idx] = (Math.random() - 0.5) * 3600;
        pos[idx + 2] = (Math.random() - 0.5) * 3600;
      }
    }

    this.rainGeo.attributes.position.needsUpdate = true;

    // Update Ground Splash Ripples
    for (let s = 0; s < this.splashPool.length; s++) {
      const splash = this.splashPool[s];
      if (!splash.active) continue;

      splash.life += dt * 3.5;
      if (splash.life >= splash.maxLife) {
        splash.active = false;
        splash.mesh.visible = false;
      } else {
        const scale = 1 + splash.life * splash.scaleSpeed;
        splash.mesh.scale.set(scale, scale, scale);
        (splash.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - splash.life / splash.maxLife) * 0.6;
      }
    }
  }

  private spawnSplashRipple(worldX: number, worldZ: number) {
    const splash = this.splashPool.find((s) => !s.active);
    if (!splash) return;

    splash.active = true;
    splash.life = 0;
    splash.mesh.visible = true;
    splash.mesh.position.set(worldX, 0.8, worldZ);
    splash.mesh.scale.set(1, 1, 1);
    (splash.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
  }

  // --- 3D FACTORY STEEL SOLID OBSTACLES & HOLOGRAPHIC ADVERTISEMENTS ---
  private update3DObstacles(obstacles: CyberObstacle[], player: Player) {
    const px = player.position.x;
    const pz = player.position.y;
    const renderDist = 2200;

    const visibleIds = new Set<string>();

    for (const obs of obstacles) {
      if (!obs.active) continue;

      const ox = obs.bounds.x + obs.bounds.width / 2;
      const oz = obs.bounds.y + obs.bounds.height / 2;

      // Cull far obstacles
      if (Math.abs(ox - px) > renderDist || Math.abs(oz - pz) > renderDist) {
        continue;
      }

      visibleIds.add(obs.id);

      let mesh = this.obstacleMeshMap.get(obs.id);
      if (!mesh) {
        const height = 95 + (Math.abs(obs.bounds.x * 73856093) % 190);
        const geo = new THREE.BoxGeometry(obs.bounds.width, height, obs.bounds.height);
        geo.translate(0, height / 2, 0);

        // Heavy Rain-Slicked Factory Steel Wall Paneling
        mesh = new THREE.Mesh(geo, this.materials.factorySteel);
        mesh.position.set(ox, 0, oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Glowing Rooftop Caution Hazard Bevel Cornice
        const roofTrimGeo = new THREE.BoxGeometry(obs.bounds.width + 1.5, 4, obs.bounds.height + 1.5);
        const roofTrimMat = (Math.abs(ox + oz) % 2 === 0)
          ? this.materials.factoryHazardStripes
          : this.materials.labNeonCyan;
        const roofTrimMesh = new THREE.Mesh(roofTrimGeo, roofTrimMat);
        roofTrimMesh.position.set(0, height, 0);
        mesh.add(roofTrimMesh);

        // --- ATTACH GLOWING 3D HOLOGRAPHIC ADVERTISEMENTS ("KKS", "Cyber Game", "Burma Batik") ---
        const brandSeed = Math.abs(Math.floor(ox * 13 + oz * 7));
        const brands: Array<'KKS' | 'Cyber Game' | 'Burma Batik'> = ['KKS', 'Cyber Game', 'Burma Batik'];
        const brand1 = brands[brandSeed % 3];
        const brand2 = brands[(brandSeed + 1) % 3];

        // 1. Front-Facing 3D Hologram Facade Banner
        const wallSignW = Math.max(32, Math.min(obs.bounds.width * 0.88, 120));
        const wallSignH = Math.max(24, Math.min(height * 0.4, 52));
        const wallSign = this.create3DGoldenBillboardMesh(brand1, 'WALL_BANNER', wallSignW, wallSignH);
        wallSign.position.set(0, height * 0.52, obs.bounds.height / 2 + 3);
        mesh.add(wallSign);

        // 2. Rooftop 3D Holographic Projector Billboard
        const roofSignW = Math.max(38, Math.min(obs.bounds.width * 0.92, 140));
        const roofSignH = 48;
        const roofSign = this.create3DGoldenBillboardMesh(brand2, 'HORIZONTAL_ROOFTOP', roofSignW, roofSignH);
        roofSign.position.set(0, height + 26, 0);
        mesh.add(roofSign);

        // 3. Side Wall Vertical Holographic Light Strip
        if (obs.bounds.height >= 80) {
          const sideSign = this.create3DGoldenBillboardMesh(brand1, 'VERTICAL_WALL_STRIP', 36, Math.min(height * 0.65, 110));
          sideSign.position.set(obs.bounds.width / 2 + 3, height * 0.48, 0);
          sideSign.rotation.y = Math.PI / 2;
          mesh.add(sideSign);
        }

        this.scene.add(mesh);
        this.obstacleMeshMap.set(obs.id, mesh);
      }

      // --- SMART CAMERA OCCLUSION DETECTION ---
      // Check if this building comes between the over-the-shoulder camera and the player
      const camX = this.camera.position.x;
      const camZ = this.camera.position.z;

      const minX = obs.bounds.x - 10;
      const maxX = obs.bounds.x + obs.bounds.width + 10;
      const minZ = obs.bounds.y - 10;
      const maxZ = obs.bounds.y + obs.bounds.height + 10;

      // 1. Check if camera position is within or close to the obstacle
      const isCamNear = camX >= minX - 25 && camX <= maxX + 25 && camZ >= minZ - 25 && camZ <= maxZ + 25;

      // 2. Check line segment intersection between camera (camX, camZ) and player (px, pz)
      let isOccluding = isCamNear;
      if (!isOccluding) {
        const dx = px - camX;
        const dz = pz - camZ;
        let tmin = 0;
        let tmax = 1;

        if (Math.abs(dx) > 0.0001) {
          let t1 = (minX - camX) / dx;
          let t2 = (maxX - camX) / dx;
          if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
        } else if (camX < minX || camX > maxX) {
          tmin = 2;
        }

        if (Math.abs(dz) > 0.0001) {
          let t1 = (minZ - camZ) / dz;
          let t2 = (maxZ - camZ) / dz;
          if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
        } else if (camZ < minZ || camZ > maxZ) {
          tmin = 2;
        }

        if (tmin <= tmax && tmax > 0.02 && tmin < 0.98) {
          isOccluding = true;
        }
      }

      // Apply instant smart transparency to ensure player screen is NEVER blocked by buildings
      if (mesh) {
        if (isOccluding) {
          mesh.material = this.materials.transparentFactorySteel;
          mesh.traverse((child) => {
            if (child !== mesh && (child as THREE.Mesh).isMesh) {
              const cMesh = child as THREE.Mesh;
              if (cMesh.material && !Array.isArray(cMesh.material)) {
                (cMesh.material as THREE.Material).transparent = true;
                (cMesh.material as THREE.Material).opacity = 0.12;
                (cMesh.material as THREE.Material).depthWrite = false;
              }
            }
          });
        } else {
          mesh.material = this.materials.factorySteel;
          mesh.traverse((child) => {
            if (child !== mesh && (child as THREE.Mesh).isMesh) {
              const cMesh = child as THREE.Mesh;
              if (cMesh.material && !Array.isArray(cMesh.material)) {
                (cMesh.material as THREE.Material).transparent = false;
                (cMesh.material as THREE.Material).opacity = 1.0;
                (cMesh.material as THREE.Material).depthWrite = true;
              }
            }
          });
        }
      }
    }

    // Cleanup culled meshes
    for (const [id, mesh] of this.obstacleMeshMap.entries()) {
      if (!visibleIds.has(id)) {
        this.scene.remove(mesh);
        this.obstacleMeshMap.delete(id);
      }
    }
  }

  // --- 3D HIGH-POLY ORGANIC CYBORG BACTERIA MONSTER BUILDER ---
  private createBacteriaMonsterMesh(b: EnemyBacteria): THREE.Group {
    const group = new THREE.Group();
    const rad = Math.max(16, b.radius);

    // 1. Pick Material Set & Variant Configurations
    let membraneMat: THREE.MeshStandardMaterial = this.materials.bacteriaMembraneBase;
    let veinMat: THREE.MeshBasicMaterial = this.materials.bacteriaVeinsBase;
    let spikeMat: THREE.MeshBasicMaterial = this.materials.bacteriaSpikeTipGreen;
    let tentacleMat: THREE.MeshStandardMaterial = this.materials.bacteriaTentacleOrganic;
    let eyeMat: THREE.MeshBasicMaterial = this.materials.cyborgOcularLaserRed;
    let spikeCount = 10;
    let tentacleCount = 4;

    if (b.surrendered) {
      membraneMat = this.materials.bacteriaMembraneSurrender;
      veinMat = this.materials.bacteriaVeinsSurrender;
      spikeMat = this.materials.bacteriaSpikeTipCyan;
      eyeMat = this.materials.cyborgOcularLaserCyan;
      spikeCount = 6;
      tentacleCount = 4;
    } else if (b.isBoss) {
      membraneMat = this.materials.bacteriaMembraneBoss;
      veinMat = this.materials.bacteriaVeinsBoss;
      spikeMat = this.materials.bacteriaSpikeTipCrimson;
      eyeMat = this.materials.cyborgOcularLaserRed;
      spikeCount = 18;
      tentacleCount = 8;
    } else if (b.isMissionTarget) {
      membraneMat = this.materials.bacteriaMembraneElite;
      veinMat = this.materials.bacteriaVeinsGold;
      spikeMat = this.materials.bacteriaSpikeTipGold;
      eyeMat = this.materials.cyborgOcularLaserGold;
      spikeCount = 14;
      tentacleCount = 6;
    } else if (b.variant === 'TOXIC_SPITTER') {
      membraneMat = this.materials.bacteriaMembraneToxic;
      veinMat = this.materials.bacteriaVeinsToxic;
      spikeMat = this.materials.bacteriaSpikeTipGreen;
      eyeMat = this.materials.cyborgOcularLaserRed;
      spikeCount = 12;
      tentacleCount = 4;
    } else if (b.variant === 'STEALTH_STALKER') {
      membraneMat = this.materials.bacteriaMembraneStealth;
      veinMat = this.materials.bacteriaVeinsStealth;
      spikeMat = this.materials.bacteriaSpikeTipMagenta;
      eyeMat = this.materials.cyborgOcularLaserCyan;
      spikeCount = 8;
      tentacleCount = 4;
    } else if (b.variant === 'CYBER_BRUTE') {
      membraneMat = this.materials.bacteriaMembraneBrute;
      veinMat = this.materials.bacteriaVeinsBrute;
      spikeMat = this.materials.bacteriaSpikeTipCrimson;
      eyeMat = this.materials.cyborgOcularLaserRed;
      spikeCount = 14;
      tentacleCount = 6;
    }

    // 2. Dual-Layer Glistening Wet Organic Membrane (High-Poly Cellular Structure)
    const membraneGeo = new THREE.IcosahedronGeometry(rad * 1.05, 3);
    const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
    membraneMesh.castShadow = true;
    membraneMesh.name = 'membrane';
    group.add(membraneMesh);

    // Overlay Pulsing Emissive Arterial Vein Mesh (Sub-Layer with Emissive Vein Maps)
    const veinGeo = new THREE.IcosahedronGeometry(rad * 1.065, 2);
    const veinMesh = new THREE.Mesh(veinGeo, veinMat);
    veinMesh.name = 'veinMesh';
    group.add(veinMesh);

    // 3. Glowing Bioluminescent Nucleus Core & Spinning Organelle Crystals
    const nucleusGroup = new THREE.Group();
    nucleusGroup.name = 'nucleusGroup';
    const nucleusGeo = new THREE.SphereGeometry(rad * 0.44, 16, 16);
    const nucleusMat = b.isBoss
      ? this.materials.bacteriaSpikeTipCrimson
      : b.isMissionTarget
      ? this.materials.bacteriaSpikeTipGold
      : this.materials.bacteriaNucleusCore;
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleusGroup.add(nucleusMesh);

    // Inner Floating Organelle Crystal Bits
    for (let c = 0; c < 3; c++) {
      const crystalGeo = new THREE.OctahedronGeometry(rad * 0.16, 0);
      const crystalMesh = new THREE.Mesh(crystalGeo, spikeMat);
      crystalMesh.position.set(
        Math.sin((c * Math.PI * 2) / 3) * (rad * 0.22),
        Math.cos((c * Math.PI * 2) / 3) * (rad * 0.22),
        (c - 1) * (rad * 0.1)
      );
      nucleusGroup.add(crystalMesh);
    }
    group.add(nucleusGroup);

    // 4. Cyborg Biomechanical Suite: Titanium Carapace Plates & Rivets
    const carapaceGroup = new THREE.Group();
    carapaceGroup.name = 'carapaceGroup';

    // Segmented Upper Dorsal Titanium Shell
    const plateUpper = new THREE.Mesh(new THREE.BoxGeometry(rad * 1.4, rad * 0.35, rad * 1.2), this.materials.cyborgTitaniumPlate);
    plateUpper.position.set(0, rad * 0.95, -rad * 0.15);
    plateUpper.castShadow = true;
    carapaceGroup.add(plateUpper);

    // Flank Armor Plates with Machined Bevels
    const plateLeft = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.3, rad * 1.1, rad * 1.3), this.materials.cyborgTitaniumPlate);
    plateLeft.position.set(-rad * 0.95, rad * 0.1, 0);
    plateLeft.rotation.z = -0.3;
    carapaceGroup.add(plateLeft);

    const plateRight = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.3, rad * 1.1, rad * 1.3), this.materials.cyborgTitaniumPlate);
    plateRight.position.set(rad * 0.95, rad * 0.1, 0);
    plateRight.rotation.z = 0.3;
    carapaceGroup.add(plateRight);

    // 5. Cybernetic Ocular Targeting Sensor Array (Mechanical Eye)
    const eyeGroup = new THREE.Group();
    eyeGroup.name = 'eyeGroup';

    // Select eye material based on robot glow color or variant
    let activeEyeMat = eyeMat;
    if (b.robotGlowColor === '#39ff14') activeEyeMat = this.materials.cyborgOcularLaserGreen;
    else if (b.robotGlowColor === '#9d00ff') activeEyeMat = this.materials.cyborgOcularLaserPurple;
    else if (b.robotGlowColor === '#00ffd1' || b.robotGlowColor === '#00f0ff') activeEyeMat = this.materials.cyborgOcularLaserCyan;
    else if (b.robotGlowColor === '#ffe600' || b.robotGlowColor === '#ff9900') activeEyeMat = this.materials.cyborgOcularLaserGold;
    else if (b.robotGlowColor === '#ff0055') activeEyeMat = this.materials.cyborgOcularLaserRed;

    const eyeStyle = b.robotEyeStyle || 'CYCLOPS_BEAM';

    if (eyeStyle === 'VISOR_SCANNER') {
      // Sleek Cybernetic Visor Bar
      const visorBarMesh = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.9, rad * 0.22, rad * 0.28), this.materials.cyborgTitaniumPlate);
      visorBarMesh.position.set(0, rad * 0.25, rad * 0.98);
      eyeGroup.add(visorBarMesh);

      const scannerDiode = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.75, rad * 0.1, rad * 0.32), activeEyeMat);
      scannerDiode.position.set(0, rad * 0.25, rad * 1.02);
      eyeGroup.add(scannerDiode);
    } else if (eyeStyle === 'DUAL_DIODE') {
      // Twin Binocular Cybernetic Diodes
      for (const offset of [-rad * 0.22, rad * 0.22]) {
        const dualSocket = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.18, rad * 0.22, rad * 0.26, 12), this.materials.cyborgTitaniumPlate);
        dualSocket.rotateX(Math.PI / 2);
        dualSocket.position.set(offset, rad * 0.25, rad * 0.98);
        eyeGroup.add(dualSocket);

        const dualIris = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.11, rad * 0.11, rad * 0.28, 12), activeEyeMat);
        dualIris.rotateX(Math.PI / 2);
        dualIris.position.set(offset, rad * 0.25, rad * 1.04);
        eyeGroup.add(dualIris);
      }
    } else if (eyeStyle === 'COMPOUND_HEX') {
      // Multi-Faceted Hexagonal Sensor Cluster
      for (let h = 0; h < 5; h++) {
        const hAngle = (h / 5) * Math.PI * 2;
        const hRad = h === 0 ? 0 : rad * 0.22;
        const hx = Math.cos(hAngle) * hRad;
        const hy = Math.sin(hAngle) * hRad + rad * 0.25;
        const hexMesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.1, rad * 0.12, rad * 0.24, 6), activeEyeMat);
        hexMesh.rotateX(Math.PI / 2);
        hexMesh.position.set(hx, hy, rad * 0.98);
        eyeGroup.add(hexMesh);
      }
    } else {
      // CYCLOPS_BEAM: Machined Titanium Ocular Socket
      const socketMesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.42, rad * 0.48, rad * 0.3, 16), this.materials.cyborgTitaniumPlate);
      socketMesh.rotateX(Math.PI / 2);
      socketMesh.position.set(0, rad * 0.25, rad * 0.96);
      eyeGroup.add(socketMesh);

      const irisMesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.26, rad * 0.26, rad * 0.32, 16), activeEyeMat);
      irisMesh.rotateX(Math.PI / 2);
      irisMesh.position.set(0, rad * 0.25, rad * 1.02);
      eyeGroup.add(irisMesh);

      const pinMesh = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.08, 8, 8), this.materials.katanaBladeCore);
      pinMesh.position.set(0, rad * 0.25, rad * 1.2);
      eyeGroup.add(pinMesh);
    }

    group.add(eyeGroup);

    // 5b. Procedural Mecha Weapon Arms
    const armStyle = b.robotArmStyle || 'PLASMA_CANNON';
    const armsGroup = new THREE.Group();
    armsGroup.name = 'mechaArmsGroup';

    for (const side of [-1, 1]) {
      const armMount = new THREE.Group();
      armMount.position.set(side * rad * 1.15, rad * 0.1, rad * 0.2);

      // Piston Shoulder Socket
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.22, 10, 10), this.materials.cyborgPistonHydraulic);
      armMount.add(shoulder);

      if (armStyle === 'PLASMA_CANNON') {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.12, rad * 0.15, rad * 0.9, 8), this.materials.cyborgTitaniumPlate);
        barrel.rotateX(Math.PI / 2);
        barrel.position.set(0, 0, rad * 0.45);
        armMount.add(barrel);

        const muzzleGlow = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.08, rad * 0.08, rad * 0.15, 8), activeEyeMat);
        muzzleGlow.rotateX(Math.PI / 2);
        muzzleGlow.position.set(0, 0, rad * 0.92);
        armMount.add(muzzleGlow);
      } else if (armStyle === 'ROTARY_BLADE') {
        const bladeGeo = new THREE.CylinderGeometry(rad * 0.38, rad * 0.38, rad * 0.06, 8);
        bladeGeo.rotateZ(Math.PI / 2);
        const bladeMesh = new THREE.Mesh(bladeGeo, this.materials.katanaBladeCore);
        bladeMesh.name = `rotaryBlade_${side}`;
        bladeMesh.position.set(0, 0, rad * 0.4);
        armMount.add(bladeMesh);
      } else if (armStyle === 'HYDRAULIC_CLAW') {
        for (const clawPincer of [-0.3, 0.3]) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.09, rad * 0.5, 4), this.materials.cyborgTitaniumPlate);
          claw.rotateX(Math.PI / 2);
          claw.rotateZ(clawPincer);
          claw.position.set(clawPincer * rad * 0.3, 0, rad * 0.45);
          armMount.add(claw);
        }
      } else {
        // NEEDLE_LASER
        const needle = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.05, rad * 0.07, rad * 1.1, 6), this.materials.cyborgTitaniumPlate);
        needle.rotateX(Math.PI / 2);
        needle.position.set(0, 0, rad * 0.55);
        armMount.add(needle);

        const tip = new THREE.Mesh(new THREE.OctahedronGeometry(rad * 0.1, 0), activeEyeMat);
        tip.position.set(0, 0, rad * 1.12);
        armMount.add(tip);
      }

      armsGroup.add(armMount);
    }
    group.add(armsGroup);

    // 5c. Wall Ambush Tactical Laser Sight Targeting Beam
    const ambushLaserSight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 280, 6),
      this.materials.mechaLaserSightBeam
    );
    ambushLaserSight.name = 'ambushLaserSight';
    ambushLaserSight.visible = false;
    ambushLaserSight.rotateX(Math.PI / 2);
    ambushLaserSight.position.set(0, rad * 0.25, rad + 140);
    group.add(ambushLaserSight);

    // 6. Hydraulic Cyber Spine & Glowing Conduits
    const spineGroup = new THREE.Group();
    spineGroup.name = 'cyborgSpine';
    for (let s = 0; s < 4; s++) {
      const segMesh = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.5, rad * 0.22, rad * 0.32), this.materials.cyborgPistonHydraulic);
      segMesh.position.set(0, rad * 0.8 - s * (rad * 0.35), -rad * 0.92);
      spineGroup.add(segMesh);

      // Glowing Power Wire Conduit
      const wireMesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.04, rad * 0.04, rad * 0.35, 6), this.materials.cyborgConduitWire);
      wireMesh.position.set(rad * 0.28, rad * 0.8 - s * (rad * 0.35), -rad * 0.92);
      spineGroup.add(wireMesh);

      const wireMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.04, rad * 0.04, rad * 0.35, 6), this.materials.cyborgConduitWire);
      wireMesh2.position.set(-rad * 0.28, rad * 0.8 - s * (rad * 0.35), -rad * 0.92);
      spineGroup.add(wireMesh2);
    }
    carapaceGroup.add(spineGroup);

    // 7. Dual Heat Sink Exhaust Ports
    const ventL = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.18, rad * 0.22, rad * 0.5, 8), this.materials.cyborgTitaniumPlate);
    ventL.position.set(-rad * 0.65, rad * 0.9, -rad * 0.6);
    ventL.rotation.x = -0.5;
    carapaceGroup.add(ventL);

    const ventR = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.18, rad * 0.22, rad * 0.5, 8), this.materials.cyborgTitaniumPlate);
    ventR.position.set(rad * 0.65, rad * 0.9, -rad * 0.6);
    ventR.rotation.x = -0.5;
    carapaceGroup.add(ventR);

    group.add(carapaceGroup);

    // 8. Capsid Spikes with Titanium Bases & Glowing Crystalline Receptor Tips
    const spikesGroup = new THREE.Group();
    spikesGroup.name = 'spikesGroup';
    for (let s = 0; s < spikeCount; s++) {
      const phi = Math.acos(-1 + (2 * s) / spikeCount);
      const theta = Math.sqrt(spikeCount * Math.PI) * phi;

      const spikeGroup = new THREE.Group();

      // Machined Titanium Mounting Collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.1, rad * 0.14, rad * 0.18, 6), this.materials.cyborgTitaniumPlate);
      collar.position.y = rad * 0.1;
      spikeGroup.add(collar);

      // Organic/Cyber Stem
      const spikeStemGeo = new THREE.CylinderGeometry(rad * 0.05, rad * 0.09, rad * 0.65, 6);
      spikeStemGeo.translate(0, rad * 0.42, 0);
      const spikeStem = new THREE.Mesh(spikeStemGeo, tentacleMat);
      spikeGroup.add(spikeStem);

      // Faceted Crystalline Receptor Tip (Emits Intense Bloom Glow)
      const tipGeo = new THREE.OctahedronGeometry(rad * 0.16, 0);
      tipGeo.translate(0, rad * 0.8, 0);
      const tipMesh = new THREE.Mesh(tipGeo, spikeMat);
      spikeGroup.add(tipMesh);

      // Orientation radially outwards
      const dir = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(phi)
      ).normalize();

      spikeGroup.position.copy(dir.clone().multiplyScalar(rad * 0.95));
      spikeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      spikesGroup.add(spikeGroup);
    }
    group.add(spikesGroup);

    // 9. Articulated Hybrid Cyborg Tentacles with Hydraulic Pistons & Titanium Claws
    const tentaclesGroup = new THREE.Group();
    tentaclesGroup.name = 'tentaclesGroup';

    for (let t = 0; t < tentacleCount; t++) {
      const tAngle = (t / tentacleCount) * Math.PI * 2;
      const tGroup = new THREE.Group();
      tGroup.name = `tentacle_${t}`;

      const numSegments = 4;
      const segLength = (rad * 1.5) / numSegments;

      let parentGroup = tGroup;
      for (let seg = 0; seg < numSegments; seg++) {
        // Organic muscle tube
        const segGeo = new THREE.CylinderGeometry(
          rad * (0.13 - seg * 0.02),
          rad * (0.17 - seg * 0.02),
          segLength,
          8
        );
        segGeo.translate(0, -segLength / 2, 0);
        const segMesh = new THREE.Mesh(segGeo, tentacleMat);
        parentGroup.add(segMesh);

        // Biomechanical Titanium Cuff Ring
        const cuffGeo = new THREE.CylinderGeometry(rad * (0.15 - seg * 0.02), rad * (0.15 - seg * 0.02), segLength * 0.35, 8);
        cuffGeo.translate(0, -segLength * 0.3, 0);
        const cuffMesh = new THREE.Mesh(cuffGeo, this.materials.cyborgTitaniumPlate);
        parentGroup.add(cuffMesh);

        // Glowing Node Joint or Sharp Titanium Bio-Claw at Tip
        if (seg < numSegments - 1) {
          const jointGeo = new THREE.SphereGeometry(rad * 0.11, 8, 8);
          const jointMesh = new THREE.Mesh(jointGeo, spikeMat);
          jointMesh.position.y = -segLength;
          parentGroup.add(jointMesh);

          const nextParent = new THREE.Group();
          nextParent.position.y = -segLength;
          parentGroup.add(nextParent);
          parentGroup = nextParent;
        } else {
          // Sharp Titanium Claw on Tentacle Tip
          const clawGeo = new THREE.ConeGeometry(rad * 0.12, rad * 0.55, 6);
          clawGeo.translate(0, -rad * 0.28, 0);
          clawGeo.rotateX(Math.PI);
          const clawMesh = new THREE.Mesh(clawGeo, this.materials.cyborgTitaniumPlate);
          clawMesh.position.y = -segLength;
          parentGroup.add(clawMesh);
        }
      }

      tGroup.position.set(
        Math.cos(tAngle) * (rad * 0.78),
        -rad * 0.22,
        Math.sin(tAngle) * (rad * 0.78)
      );
      tGroup.rotation.z = Math.cos(tAngle) * 0.35;
      tGroup.rotation.x = Math.sin(tAngle) * 0.35;

      tentaclesGroup.add(tGroup);
    }
    group.add(tentaclesGroup);

    // 10. Boss / Elite Aura Rings & Special Variant Augments
    if (b.isBoss || b.isMissionTarget) {
      const haloGeo = new THREE.TorusGeometry(rad * 1.45, rad * 0.06, 8, 36);
      haloGeo.rotateX(Math.PI / 2);
      const haloMat = b.isBoss ? this.materials.playerMagentaNeon : this.materials.playerGoldNeon;
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.name = 'bossHalo';
      group.add(haloMesh);
    }

    // High-Contrast Pulsating Corruption Halo & Bioluminescent Silhouette Corona (All Enemies)
    const coronaGeo = new THREE.TorusGeometry(rad * 1.25, rad * 0.045, 6, 24);
    coronaGeo.rotateX(Math.PI / 2);
    const coronaMat = b.isBoss
      ? this.materials.bacteriaSpikeTipCrimson
      : b.isMissionTarget
      ? this.materials.bacteriaSpikeTipGold
      : b.variant === 'TOXIC_SPITTER'
      ? this.materials.bacteriaSpikeTipGreen
      : b.variant === 'STEALTH_STALKER'
      ? this.materials.bacteriaSpikeTipMagenta
      : this.materials.bacteriaSpikeTipCrimson;
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    coronaMesh.name = 'coronaMesh';
    group.add(coronaMesh);

    // Glowing Radial Spiked Outer Silhouette Ring (Sharp contrast in dark sectors)
    const spikedCoronaGroup = new THREE.Group();
    spikedCoronaGroup.name = 'spikedCoronaGroup';
    for (let sp = 0; sp < 8; sp++) {
      const spAngle = (sp / 8) * Math.PI * 2;
      const spikeConeGeo = new THREE.ConeGeometry(rad * 0.12, rad * 0.45, 5);
      spikeConeGeo.rotateZ(-Math.PI / 2);
      const spikeCone = new THREE.Mesh(spikeConeGeo, coronaMat);
      spikeCone.position.set(Math.cos(spAngle) * (rad * 1.25), 0, Math.sin(spAngle) * (rad * 1.25));
      spikeCone.rotation.y = -spAngle;
      spikedCoronaGroup.add(spikeCone);
    }
    group.add(spikedCoronaGroup);

    if (b.variant === 'TOXIC_SPITTER') {
      // Chemical Acid Plasma Injector Nozzle on Forehead
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.15, rad * 0.25, rad * 0.6, 8), this.materials.cyborgTitaniumPlate);
      nozzle.rotateX(Math.PI / 2);
      nozzle.position.set(0, rad * 0.65, rad * 0.88);
      group.add(nozzle);
    }

    // --- 7. FLASHLIGHT HIGH-CONTRAST OUTLINE & GLITCH SCANNER HIGHLIGHT GROUP ---
    const flHighlightGroup = new THREE.Group();
    flHighlightGroup.name = 'flashlightHighlightGroup';
    flHighlightGroup.visible = false;

    // High-Contrast Cybernetic Wireframe Cage Outline
    const outlineGeo = new THREE.IcosahedronGeometry(rad * 1.2, 2);
    const outlineMesh = new THREE.Mesh(outlineGeo, this.materials.enemyFlashlightOutline);
    outlineMesh.name = 'flOutlineMesh';
    flHighlightGroup.add(outlineMesh);

    // Glitchy Outer Holographic Scan Aura
    const auraGeo = new THREE.IcosahedronGeometry(rad * 1.32, 1);
    const auraMesh = new THREE.Mesh(auraGeo, this.materials.enemyFlashlightGlitchAura);
    auraMesh.name = 'flAuraMesh';
    flHighlightGroup.add(auraMesh);

    // Rotating Holographic Tactical Target Reticle Ring
    const reticleGeo = new THREE.TorusGeometry(rad * 1.45, 1.4, 4, 32);
    const reticleMesh = new THREE.Mesh(reticleGeo, this.materials.enemyFlashlightScanRing);
    reticleMesh.name = 'flReticleMesh';
    flHighlightGroup.add(reticleMesh);

    // Lock-on Diamond Indicator Crown
    const diamondGeo = new THREE.OctahedronGeometry(rad * 0.28, 0);
    const diamondMesh = new THREE.Mesh(diamondGeo, this.materials.katanaBladeCore);
    diamondMesh.position.y = rad * 1.7;
    flHighlightGroup.add(diamondMesh);

    group.add(flHighlightGroup);

    return group;
  }

  // --- 3D MUTATED ORGANIC CYBORG BACTERIA ANIMATION & WORLD SYNC ---
  private update3DBacteria(entities: WorldEntity[]) {
    const activeIds = new Set<string>();

    for (const ent of entities) {
      if (!ent.active) continue;

      if (ent.type === 'MUTATED_BACTERIA' && ent.bacteriaData) {
        const b = ent.bacteriaData;
        if (b.health <= 0) continue;

        activeIds.add(b.id);
        const bx = b.position.x;
        const bz = b.position.y;
        const rad = Math.max(16, b.radius);

        let group = this.bacteriaMeshMap.get(b.id);
        if (!group) {
          group = this.createBacteriaMonsterMesh(b);
          this.scene.add(group);
          this.bacteriaMeshMap.set(b.id, group);
        }

        // --- REAL-TIME FLASHLIGHT ILLUMINATION DETECTION & HIGH-CONTRAST GLITCH HIGHLIGHT ---
        const px = this.playerGroup ? this.playerGroup.position.x : 0;
        const pz = this.playerGroup ? this.playerGroup.position.z : 0;
        const pRot = this.playerGroup ? this.playerGroup.rotation.y : 0;

        // Forward vector of hero flashlight in XZ plane
        const fwdX = -Math.sin(pRot);
        const fwdZ = -Math.cos(pRot);

        const toEnemyX = bx - px;
        const toEnemyZ = bz - pz;
        const distToEnemy = Math.sqrt(toEnemyX * toEnemyX + toEnemyZ * toEnemyZ);

        // Flashlight illumination range ~950 units, cone ~45-50 degrees
        let isIlluminatedByFlashlight = false;
        if (distToEnemy > 0 && distToEnemy < 950) {
          const dot = fwdX * (toEnemyX / distToEnemy) + fwdZ * (toEnemyZ / distToEnemy);
          if (dot > 0.68) {
            isIlluminatedByFlashlight = true;
          }
        }

        // Dynamic Undulating Membrane Pulse & Sinusoidal Breathing Wobble
        const wobble = Math.sin(this.animTick * 7 + b.pulsePhase) * 0.12;
        let glitchJitterX = 0;
        let glitchJitterZ = 0;
        let glitchScaleMul = 1.0;

        // High-Contrast Visibility & Dynamic Glitch Response (Always fully visible)
        group.visible = true;
        if (isIlluminatedByFlashlight) {
          glitchJitterX = (Math.random() - 0.5) * 6;
          glitchJitterZ = (Math.random() - 0.5) * 6;
          glitchScaleMul = 1.08 + Math.sin(this.animTick * 25) * 0.06;
        } else if (b.state === 'PANIC_FLEE') {
          // Panic fleeing erratic vibration
          glitchJitterX = (Math.random() - 0.5) * 4;
          glitchJitterZ = (Math.random() - 0.5) * 4;
          glitchScaleMul = 1.0 + Math.sin(this.animTick * 30) * 0.08;
        }

        group.position.set(bx + glitchJitterX, rad + 6 + wobble * 6, bz + glitchJitterZ);
        group.scale.set((1 + wobble) * glitchScaleMul, (1 - wobble * 0.8) * glitchScaleMul, (1 + wobble) * glitchScaleMul);
        group.rotation.y += b.state === 'PANIC_FLEE' ? 0.08 : 0.02;

        // Animate Spiked Corona & Corruption Halo Ring
        const coronaMesh = group.getObjectByName('coronaMesh') as THREE.Mesh | undefined;
        if (coronaMesh) {
          const cPulse = 1.0 + Math.sin(this.animTick * 12 + b.pulsePhase) * 0.12;
          coronaMesh.scale.set(cPulse, cPulse, cPulse);
        }

        const spikedCoronaGroup = group.getObjectByName('spikedCoronaGroup');
        if (spikedCoronaGroup) {
          spikedCoronaGroup.rotation.y += b.state === 'PANIC_FLEE' ? 0.09 : 0.03;
          const sPulse = 1.0 + Math.sin(this.animTick * 14 + b.pulsePhase) * 0.08;
          spikedCoronaGroup.scale.set(sPulse, sPulse, sPulse);
        }

        // Animate Flashlight Highlight High-Contrast Outline & Scanner
        const flHighlightGroup = group.getObjectByName('flashlightHighlightGroup');
        if (flHighlightGroup) {
          if (isIlluminatedByFlashlight) {
            flHighlightGroup.visible = true;
            flHighlightGroup.rotation.y += 0.06;
            flHighlightGroup.rotation.z += 0.03;
            const hPulse = 1.0 + Math.sin(this.animTick * 20) * 0.06;
            flHighlightGroup.scale.set(hPulse, hPulse, hPulse);

            // Glitch chromatic flicker on the outline mesh
            const outlineMesh = flHighlightGroup.getObjectByName('flOutlineMesh') as THREE.Mesh | undefined;
            if (outlineMesh && outlineMesh.material) {
              const oMat = outlineMesh.material as THREE.MeshBasicMaterial;
              oMat.opacity = 0.85 + Math.sin(this.animTick * 30) * 0.15;
            }
          } else {
            flHighlightGroup.visible = false;
          }
        }

        // Animate Pulsing Emissive Vein Map Intensity (Flare up when lit by flashlight)
        const veinMesh = group.getObjectByName('veinMesh') as THREE.Mesh | undefined;
        if (veinMesh && veinMesh.material) {
          const baseVeinPulse = 0.75 + Math.sin(this.animTick * 9 + b.pulsePhase) * 0.25;
          const veinMultiplier = isIlluminatedByFlashlight ? 1.8 : 1.0;
          (veinMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1.0, baseVeinPulse * veinMultiplier);
        }

        // Animate Nucleus Organelle Crystals
        const nucleusGroup = group.getObjectByName('nucleusGroup');
        if (nucleusGroup) {
          nucleusGroup.rotation.y += 0.04;
          nucleusGroup.rotation.z += 0.02;
        }

        // Animate Cybernetic Ocular Targeting Array (Eye turns toward hero)
        const eyeGroup = group.getObjectByName('eyeGroup');
        if (eyeGroup && this.playerGroup) {
          const targetPos = this.playerGroup.position;
          const lookDirX = targetPos.x - bx;
          const lookDirZ = targetPos.z - bz;
          const targetEyeAngle = Math.atan2(lookDirX, lookDirZ);
          eyeGroup.rotation.y = (targetEyeAngle - group.rotation.y) * 0.5;
        }

        // Animate Articulated Flagella / Tentacles
        const tentaclesGroup = group.getObjectByName('tentaclesGroup');
        if (tentaclesGroup) {
          const tChildren = tentaclesGroup.children;
          for (let t = 0; t < tChildren.length; t++) {
            const tentacle = tChildren[t];
            const wave = Math.sin(this.animTick * 9 + b.pulsePhase + t * 1.2) * 0.35;
            tentacle.rotation.z = Math.cos(t) * 0.3 + wave;
            tentacle.rotation.x = Math.sin(t) * 0.3 + wave * 0.8;
          }
        }

        // Animate Spikes Corona & Halo
        const spikesGroup = group.getObjectByName('spikesGroup');
        if (spikesGroup) {
          spikesGroup.rotation.y += 0.015;
        }

        const bossHalo = group.getObjectByName('bossHalo');
        if (bossHalo) {
          bossHalo.rotation.z += 0.04;
          bossHalo.rotation.x = Math.sin(this.animTick * 3) * 0.2;
        }

        // Animate Rotary Cutter Blades
        const bladeL = group.getObjectByName('rotaryBlade_-1');
        if (bladeL) bladeL.rotation.x += 0.35;
        const bladeR = group.getObjectByName('rotaryBlade_1');
        if (bladeR) bladeR.rotation.x += 0.35;

        // Animate Wall Ambush Sniper Laser Sight
        const ambushLaserSight = group.getObjectByName('ambushLaserSight') as THREE.Mesh | undefined;
        if (ambushLaserSight) {
          if (b.ambushState === 'PEEKING' || b.state === 'AMBUSH_PEEK_ATTACK') {
            ambushLaserSight.visible = true;
            if (this.playerGroup) {
              const dx = this.playerGroup.position.x - bx;
              const dz = this.playerGroup.position.z - bz;
              const angle = Math.atan2(dx, dz);
              ambushLaserSight.rotation.y = angle - group.rotation.y;
              const chargeRatio = Math.min(1.0, (b.ambushWeaponCharge || 0) / 20);
              const sightMat = ambushLaserSight.material as THREE.MeshBasicMaterial;
              sightMat.opacity = 0.4 + chargeRatio * 0.55 + Math.sin(this.animTick * 25) * 0.1;
              if (b.robotGlowColor) {
                sightMat.color.set(b.robotGlowColor);
              }
            }
          } else {
            ambushLaserSight.visible = false;
          }
        }

        // Crouch lower to floor when hugging wall cover
        if (b.ambushState === 'IN_COVER') {
          group.position.y = Math.max(6, rad * 0.62);
        }

        // --- 3D TACTICAL ENEMY SIGHT-CONE RENDERING ON FACTORY FLOOR ---
        if (!b.surrendered && b.state !== 'SURRENDER' && b.state !== 'STAGGER') {
          const vRange = b.visionRange || 280;
          const vFov = b.visionFov || (Math.PI / 2.8);
          const vAngle = b.facingAngle !== undefined ? b.facingAngle : (b.facing === 'RIGHT' ? 0 : Math.PI);

          let coneMesh = this.sightConeMeshMap.get(b.id);
          if (!coneMesh) {
            const coneGeo = new THREE.RingGeometry(rad * 0.8, vRange, 20, 1, -vFov / 2, vFov);
            coneGeo.rotateX(-Math.PI / 2);
            const coneMat = new THREE.MeshBasicMaterial({
              color: 0x00ffd1,
              transparent: true,
              opacity: 0.22,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            coneMesh = new THREE.Mesh(coneGeo, coneMat);
            coneMesh.position.y = 1.6;
            this.scene.add(coneMesh);
            this.sightConeMeshMap.set(b.id, coneMesh);
          }

          coneMesh.visible = true;
          coneMesh.position.set(bx, 1.6, bz);
          coneMesh.rotation.y = -vAngle;

          // Dynamic Cone Alert Colors: Cyan/Green (Patrol) -> Yellow/Amber (Suspicious) -> Neon Red (Alert/Chase) -> Purple (Panic) -> Amber (Retreat/Flank)
          const coneMat = coneMesh.material as THREE.MeshBasicMaterial;
          if (b.ghostPhase === 'VANISHED') {
            coneMesh.visible = false;
          } else if (b.state === 'WALL_AMBUSH' || b.state === 'AMBUSH_PEEK_ATTACK' || b.isAmbushing) {
            coneMat.color.setHex(0xff0055);
            coneMat.opacity = 0.48 + Math.sin(this.animTick * 22) * 0.18;
          } else if (b.state === 'PANIC_FLEE') {
            coneMat.color.setHex(0xbf00ff);
            coneMat.opacity = 0.45 + Math.sin(this.animTick * 18) * 0.15;
          } else if (b.state === 'TACTICAL_RETREAT' || b.state === 'AMBUSH_FLANK') {
            coneMat.color.setHex(0xff6600);
            coneMat.opacity = 0.35 + Math.sin(this.animTick * 10) * 0.1;
          } else if (b.state === 'ALERT' || b.state === 'CHASE' || b.state === 'POUNCE' || b.state === 'LEAP') {
            coneMat.color.setHex(0xff0055);
            coneMat.opacity = 0.38 + Math.sin(this.animTick * 14) * 0.12;
          } else if (b.state === 'SUSPICIOUS' || (b.alertness && b.alertness > 15)) {
            coneMat.color.setHex(0xffaa00);
            coneMat.opacity = 0.32 + Math.sin(this.animTick * 8) * 0.08;
          } else {
            coneMat.color.setHex(0x00ffd1);
            coneMat.opacity = 0.18 + Math.sin(this.animTick * 4) * 0.04;
          }
        } else {
          const coneMesh = this.sightConeMeshMap.get(b.id);
          if (coneMesh) coneMesh.visible = false;
        }

        // --- 3D STEALTH TAKEDOWN TARGET RETICLE ---
        if (b.canStealthKill) {
          let reticle = this.takedownReticleMap.get(b.id);
          if (!reticle) {
            const rGeo = new THREE.RingGeometry(rad * 1.3, rad * 1.55, 24);
            rGeo.rotateX(-Math.PI / 2);
            const rMat = new THREE.MeshBasicMaterial({
              color: 0xff00e5,
              transparent: true,
              opacity: 0.85,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            reticle = new THREE.Mesh(rGeo, rMat);
            this.scene.add(reticle);
            this.takedownReticleMap.set(b.id, reticle);
          }
          reticle.visible = true;
          reticle.position.set(bx, 2.2, bz);
          const rPulse = 1.0 + Math.sin(this.animTick * 12) * 0.15;
          reticle.scale.set(rPulse, 1, rPulse);
        } else {
          const reticle = this.takedownReticleMap.get(b.id);
          if (reticle) reticle.visible = false;
        }
      }
    }

    // Cleanup dead bacteria meshes, sight cones and reticles
    for (const [id, group] of this.bacteriaMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.bacteriaMeshMap.delete(id);
      }
    }
    for (const [id, cone] of this.sightConeMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(cone);
        this.sightConeMeshMap.delete(id);
      }
    }
    for (const [id, reticle] of this.takedownReticleMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(reticle);
        this.takedownReticleMap.delete(id);
      }
    }
  }

  // --- 3D COLLECTIBLES & CYBERPUNK 3D PROP BUILDERS ---

  private build3DMedkit(group: THREE.Group) {
    // 1. Main Dark Alloy Tactical Casing
    const bodyGeo = new THREE.BoxGeometry(22, 11, 15);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.medkitDarkChassis);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // 2. Beveled Upper Lid Cover
    const lidGeo = new THREE.BoxGeometry(23, 2.6, 16);
    const lidMesh = new THREE.Mesh(lidGeo, this.materials.medkitWhitePlates);
    lidMesh.position.y = 5.8;
    group.add(lidMesh);

    // 3. Reinforced Shock-Absorbing Corner Bumpers (8 Corners)
    const bumperGeo = new THREE.BoxGeometry(4.2, 4.2, 4.2);
    const corners = [
      [-10, 4.5, -6.5], [10, 4.5, -6.5], [-10, 4.5, 6.5], [10, 4.5, 6.5],
      [-10, -4.5, -6.5], [10, -4.5, -6.5], [-10, -4.5, 6.5], [10, -4.5, 6.5],
    ];
    for (const [bx, by, bz] of corners) {
      const bMesh = new THREE.Mesh(bumperGeo, this.materials.medkitBumperTitanium);
      bMesh.position.set(bx, by, bz);
      group.add(bMesh);
    }

    // 4. Heavy-Duty Alloy Side Latches
    const latchGeo = new THREE.BoxGeometry(2.4, 5.5, 1.2);
    const latch1 = new THREE.Mesh(latchGeo, this.materials.medkitLatchAlloy);
    latch1.position.set(-6, 1.2, 7.8);
    group.add(latch1);
    const latch2 = new THREE.Mesh(latchGeo, this.materials.medkitLatchAlloy);
    latch2.position.set(6, 1.2, 7.8);
    group.add(latch2);

    // 5. Ergonomic Molded Top Carry Handle
    const handleMountGeo = new THREE.BoxGeometry(2.2, 2.8, 2.2);
    const hm1 = new THREE.Mesh(handleMountGeo, this.materials.medkitBumperTitanium);
    hm1.position.set(-4.5, 8.0, 0);
    group.add(hm1);
    const hm2 = new THREE.Mesh(handleMountGeo, this.materials.medkitBumperTitanium);
    hm2.position.set(4.5, 8.0, 0);
    group.add(hm2);

    const handleBarGeo = new THREE.CylinderGeometry(1.1, 1.1, 8.5, 8);
    handleBarGeo.rotateZ(Math.PI / 2);
    const handleBar = new THREE.Mesh(handleBarGeo, this.materials.medkitLatchAlloy);
    handleBar.position.set(0, 9.2, 0);
    group.add(handleBar);

    // 6. Glowing 3D Neon Green/Red Medical Cross on Top Lid
    const crossTopH = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 3.4), this.materials.medkitNeonCrossGreen);
    crossTopH.position.set(0, 7.3, 0);
    group.add(crossTopH);

    const crossTopV = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.2, 11), this.materials.medkitNeonCrossGreen);
    crossTopV.position.set(0, 7.3, 0);
    group.add(crossTopV);

    // 7. Glowing 3D Neon Medical Cross on Front Bezel
    const crossFrontH = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.4, 1.0), this.materials.medkitNeonCrossGreen);
    crossFrontH.position.set(0, 0.8, 8.0);
    group.add(crossFrontH);

    const crossFrontV = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.5, 1.0), this.materials.medkitNeonCrossGreen);
    crossFrontV.position.set(0, 0.8, 8.0);
    group.add(crossFrontV);

    // 8. Biometric Diagnostic Status LED Dots
    const ledGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 6);
    ledGeo.rotateX(Math.PI / 2);
    const led1 = new THREE.Mesh(ledGeo, this.materials.medkitStatusGreen);
    led1.position.set(-7, 7.2, -4);
    group.add(led1);
    const led2 = new THREE.Mesh(ledGeo, this.materials.medkitStatusCyan);
    led2.position.set(-5, 7.2, -4);
    group.add(led2);
    const led3 = new THREE.Mesh(ledGeo, this.materials.medkitStatusAmber);
    led3.position.set(-3, 7.2, -4);
    group.add(led3);

    // 9. Ground Medical Hologram Aura Disc
    const holoDisc = new THREE.Group();
    holoDisc.name = 'groundHoloDisc';
    holoDisc.position.y = -15;

    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(13, 19, 24), this.materials.medkitHoloRingDisc);
    ringMesh.rotateX(-Math.PI / 2);
    holoDisc.add(ringMesh);

    const crossFloorH = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.2), this.materials.medkitHoloRingDisc);
    crossFloorH.rotateX(-Math.PI / 2);
    holoDisc.add(crossFloorH);

    const crossFloorV = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 14), this.materials.medkitHoloRingDisc);
    crossFloorV.rotateX(-Math.PI / 2);
    holoDisc.add(crossFloorV);

    group.add(holoDisc);
  }

  private build3DWeaponProp(group: THREE.Group, weaponType?: WeaponDropModel) {
    const wType = weaponType || 'PLASMA_BLASTER';

    if (wType === 'KATANA') {
      // --- CYBERNETIC ENERGIZED KATANA BLADE ---
      const katanaGroup = new THREE.Group();
      katanaGroup.rotation.z = Math.PI / 8; // Dynamic 22.5° tilt
      katanaGroup.rotation.x = Math.PI / 12;

      // 1. Blade Core & Spine
      const bladeCoreGeo = new THREE.BoxGeometry(32, 2.2, 0.7);
      const bladeCoreMesh = new THREE.Mesh(bladeCoreGeo, this.materials.katanaBladeCore);
      bladeCoreMesh.position.set(16, 0, 0);
      katanaGroup.add(bladeCoreMesh);

      // 2. Energized Superheated Cyan/Magenta Cutting Edge
      const edgeGeo = new THREE.BoxGeometry(33, 0.8, 0.4);
      const edgeMesh = new THREE.Mesh(edgeGeo, this.materials.weaponKatanaBladeEdge);
      edgeMesh.position.set(16.5, -1.2, 0);
      katanaGroup.add(edgeMesh);

      // 3. Kissaki Angled Point Tip
      const tipGeo = new THREE.ConeGeometry(1.6, 4.5, 4);
      tipGeo.rotateZ(-Math.PI / 2);
      const tipMesh = new THREE.Mesh(tipGeo, this.materials.weaponKatanaBladeEdge);
      tipMesh.position.set(33.5, -0.4, 0);
      katanaGroup.add(tipMesh);

      // 4. Gold Habaki (Collar)
      const habakiGeo = new THREE.BoxGeometry(2.5, 3.0, 1.2);
      const habakiMesh = new THREE.Mesh(habakiGeo, this.materials.weaponGoldTrim);
      habakiMesh.position.set(1.2, 0, 0);
      katanaGroup.add(habakiMesh);

      // 5. Octagonal Tsuba (Handguard)
      const tsubaGeo = new THREE.CylinderGeometry(4.8, 4.8, 1.2, 8);
      tsubaGeo.rotateZ(Math.PI / 2);
      const tsubaMesh = new THREE.Mesh(tsubaGeo, this.materials.weaponSteelGunmetal);
      tsubaMesh.position.set(0, 0, 0);
      katanaGroup.add(tsubaMesh);

      const tsubaGoldRing = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.4, 6, 16), this.materials.weaponGoldTrim);
      tsubaGoldRing.rotateY(Math.PI / 2);
      tsubaMesh.add(tsubaGoldRing);

      // 6. Braided Diamond-Wrap Tsuka (Handle)
      const hiltGeo = new THREE.CylinderGeometry(1.8, 1.8, 11, 8);
      hiltGeo.rotateZ(Math.PI / 2);
      const hiltMesh = new THREE.Mesh(hiltGeo, this.materials.weaponKatanaHiltWrap);
      hiltMesh.position.set(-6, 0, 0);
      katanaGroup.add(hiltMesh);

      // Gold Kashira Pommel Cap
      const pommelGeo = new THREE.CylinderGeometry(2.1, 2.1, 1.4, 8);
      pommelGeo.rotateZ(Math.PI / 2);
      const pommelMesh = new THREE.Mesh(pommelGeo, this.materials.weaponGoldTrim);
      pommelMesh.position.set(-11.8, 0, 0);
      katanaGroup.add(pommelMesh);

      group.add(katanaGroup);
    } else if (wType === 'LIGHTNING_CHAIN') {
      // --- FUTURISTIC TESLA ARC RIFLE ---
      const rifleGroup = new THREE.Group();

      // Main Receiver Chassis
      const receiverGeo = new THREE.BoxGeometry(24, 6.5, 4.5);
      const receiverMesh = new THREE.Mesh(receiverGeo, this.materials.weaponSteelGunmetal);
      rifleGroup.add(receiverMesh);

      // Precision Extended Barrel
      const barrelGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 12);
      barrelGeo.rotateZ(Math.PI / 2);
      const barrelMesh = new THREE.Mesh(barrelGeo, this.materials.weaponTitaniumPlate);
      barrelMesh.position.set(18, 0.8, 0);
      rifleGroup.add(barrelMesh);

      // 3 High-Voltage Tesla Energy Coils
      for (let c = 0; c < 3; c++) {
        const coilGeo = new THREE.TorusGeometry(3.0, 0.65, 8, 16);
        coilGeo.rotateY(Math.PI / 2);
        const coilMesh = new THREE.Mesh(coilGeo, this.materials.weaponNeonElectricBlue);
        coilMesh.position.set(12 + c * 5.5, 0.8, 0);
        rifleGroup.add(coilMesh);
      }

      // Twin Forward Tesla Arc Prongs
      const prongGeo = new THREE.BoxGeometry(7, 0.8, 0.8);
      const prong1 = new THREE.Mesh(prongGeo, this.materials.weaponNeonCyan);
      prong1.position.set(28, 2.2, 1.2);
      rifleGroup.add(prong1);
      const prong2 = new THREE.Mesh(prongGeo, this.materials.weaponNeonCyan);
      prong2.position.set(28, -0.6, 1.2);
      rifleGroup.add(prong2);

      // Holographic Reflex Sight
      const sightMount = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 2.0), this.materials.weaponTitaniumPlate);
      sightMount.position.set(-2, 4.5, 0);
      rifleGroup.add(sightMount);
      const sightLens = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.8, 12), this.materials.weaponNeonCyan);
      sightLens.rotateY(Math.PI / 2);
      sightLens.position.set(-2, 5.8, 0);
      rifleGroup.add(sightLens);

      // Curved Power Magazine & Skeleton Stock
      const magGeo = new THREE.BoxGeometry(4.5, 9, 2.5);
      magGeo.rotateZ(-Math.PI / 10);
      const magMesh = new THREE.Mesh(magGeo, this.materials.weaponSteelGunmetal);
      magMesh.position.set(-4, -6.5, 0);
      rifleGroup.add(magMesh);

      const stockGeo = new THREE.BoxGeometry(10, 5, 3.2);
      const stockMesh = new THREE.Mesh(stockGeo, this.materials.weaponTitaniumPlate);
      stockMesh.position.set(-16, -1.0, 0);
      rifleGroup.add(stockMesh);

      group.add(rifleGroup);
    } else if (wType === 'SPREAD_CANNON') {
      // --- HEAVY CYBER SCATTERGUN / SHOTGUN ---
      const shotgunGroup = new THREE.Group();

      // Heavy Receiver
      const recGeo = new THREE.BoxGeometry(22, 7.5, 6.5);
      const recMesh = new THREE.Mesh(recGeo, this.materials.weaponSteelGunmetal);
      shotgunGroup.add(recMesh);

      // Triple Clustered Heavy Barrels with Shroud
      const barrelOffsets = [[14, 1.5, -1.6], [14, 1.5, 1.6], [14, -1.4, 0]];
      for (const [bx, by, bz] of barrelOffsets) {
        const barGeo = new THREE.CylinderGeometry(1.8, 1.8, 16, 10);
        barGeo.rotateZ(Math.PI / 2);
        const barMesh = new THREE.Mesh(barGeo, this.materials.weaponTitaniumPlate);
        barMesh.position.set(bx, by, bz);
        shotgunGroup.add(barMesh);

        const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.4, 6, 12), this.materials.weaponNeonAmber);
        muzzleRing.rotateY(Math.PI / 2);
        muzzleRing.position.set(bx + 8, by, bz);
        shotgunGroup.add(muzzleRing);
      }

      // Golden Rotary Ammo Drum
      const drumGeo = new THREE.CylinderGeometry(5.5, 5.5, 5.5, 16);
      drumGeo.rotateX(Math.PI / 2);
      const drumMesh = new THREE.Mesh(drumGeo, this.materials.weaponGoldTrim);
      drumMesh.position.set(-1, -4.5, 0);
      shotgunGroup.add(drumMesh);

      // Tactical Forearm Pump & Stock
      const pumpGeo = new THREE.BoxGeometry(9, 4, 7);
      const pumpMesh = new THREE.Mesh(pumpGeo, this.materials.weaponSteelGunmetal);
      pumpMesh.position.set(10, -3.2, 0);
      shotgunGroup.add(pumpMesh);

      const stockGeo = new THREE.BoxGeometry(11, 5.5, 4);
      const stockMesh = new THREE.Mesh(stockGeo, this.materials.weaponTitaniumPlate);
      stockMesh.position.set(-15, -1.5, 0);
      shotgunGroup.add(stockMesh);

      group.add(shotgunGroup);
    } else if (wType === 'HOMING_MISSILES') {
      // --- QUAD-POD TACTICAL MICRO-MISSILE LAUNCHER ---
      const podGroup = new THREE.Group();

      // Launcher Casing Box
      const boxGeo = new THREE.BoxGeometry(18, 13, 13);
      const boxMesh = new THREE.Mesh(boxGeo, this.materials.weaponSteelGunmetal);
      podGroup.add(boxMesh);

      // Front Face with 4 Circular Launch Tubes & Visible Missiles
      const tubeOffsets = [[-3.5, 3.5], [3.5, 3.5], [-3.5, -3.5], [3.5, -3.5]];
      for (const [ty, tz] of tubeOffsets) {
        const tubeRim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.5, 6, 16), this.materials.weaponTitaniumPlate);
        tubeRim.rotateY(Math.PI / 2);
        tubeRim.position.set(9.1, ty, tz);
        podGroup.add(tubeRim);

        const warheadCone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4, 8), this.materials.weaponNeonAmber);
        warheadCone.rotateZ(-Math.PI / 2);
        warheadCone.position.set(8.5, ty, tz);
        podGroup.add(warheadCone);
      }

      // Top Sensor Targeting Pod
      const sensorGeo = new THREE.CylinderGeometry(2.5, 2.5, 5, 12);
      sensorGeo.rotateZ(Math.PI / 2);
      const sensorMesh = new THREE.Mesh(sensorGeo, this.materials.weaponGoldTrim);
      sensorMesh.position.set(0, 8.5, 0);
      podGroup.add(sensorMesh);

      // Side Ergonomic Grips
      const gripGeo = new THREE.BoxGeometry(4, 9, 2.5);
      const g1 = new THREE.Mesh(gripGeo, this.materials.weaponTitaniumPlate);
      g1.position.set(-3, -9, 0);
      podGroup.add(g1);

      group.add(podGroup);
    } else if (wType === 'QUANTUM_VORTEX') {
      // --- QUANTUM SINGULARITY ACCELERATOR CANNON ---
      const qGroup = new THREE.Group();

      // Top & Bottom Magnetic Accelerator Rails
      const railGeo = new THREE.BoxGeometry(28, 2.4, 4.5);
      const topRail = new THREE.Mesh(railGeo, this.materials.weaponSteelGunmetal);
      topRail.position.set(6, 4.5, 0);
      qGroup.add(topRail);

      const botRail = new THREE.Mesh(railGeo, this.materials.weaponSteelGunmetal);
      botRail.position.set(6, -4.5, 0);
      qGroup.add(botRail);

      // Central Spinning Quantum Core Containment Ring
      const qRing = new THREE.Mesh(new THREE.TorusGeometry(6.5, 1.6, 12, 24), this.materials.weaponNeonMagenta);
      qRing.name = 'quantumCoreRing';
      qRing.position.set(6, 0, 0);
      qGroup.add(qRing);

      // Singularity Plasma Orb Inside
      const plasmaOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(3.5, 1), this.materials.weaponNeonMagenta);
      plasmaOrb.position.set(6, 0, 0);
      qGroup.add(plasmaOrb);

      // Rear Reactor Body
      const reactorGeo = new THREE.CylinderGeometry(5.5, 5.5, 10, 16);
      reactorGeo.rotateZ(Math.PI / 2);
      const reactorMesh = new THREE.Mesh(reactorGeo, this.materials.weaponTitaniumPlate);
      reactorMesh.position.set(-11, 0, 0);
      qGroup.add(reactorMesh);

      group.add(qGroup);
    } else {
      // --- HIGH-TECH PLASMA BLASTER PISTOL (DEFAULT) ---
      const pistolGroup = new THREE.Group();

      // Upper Slide
      const slideGeo = new THREE.BoxGeometry(18, 5, 4.2);
      const slideMesh = new THREE.Mesh(slideGeo, this.materials.weaponSteelGunmetal);
      pistolGroup.add(slideMesh);

      // Inset Glowing Cyan Plasma Conduit
      const conduitGeo = new THREE.BoxGeometry(13, 1.2, 1.8);
      const conduitMesh = new THREE.Mesh(conduitGeo, this.materials.weaponNeonCyan);
      conduitMesh.position.set(1, 2.8, 0);
      pistolGroup.add(conduitMesh);

      // Muzzle Compensator with Glowing Bore
      const compGeo = new THREE.BoxGeometry(3.5, 4.2, 4.0);
      const compMesh = new THREE.Mesh(compGeo, this.materials.weaponTitaniumPlate);
      compMesh.position.set(9.5, 0, 0);
      pistolGroup.add(compMesh);

      const boreMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8), this.materials.weaponNeonCyan);
      boreMesh.rotateZ(Math.PI / 2);
      boreMesh.position.set(11.2, 0.4, 0);
      pistolGroup.add(boreMesh);

      // Lower Receiver & Ergonomic Grip
      const gripGeo = new THREE.BoxGeometry(4.8, 11, 3.6);
      gripGeo.rotateZ(-Math.PI / 12);
      const gripMesh = new THREE.Mesh(gripGeo, this.materials.weaponSteelGunmetal);
      gripMesh.position.set(-4.5, -6.5, 0);
      pistolGroup.add(gripMesh);

      // Gold Extended Mag Baseplate
      const magBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.8, 4.2), this.materials.weaponGoldTrim);
      magBase.position.set(-6.2, -12.5, 0);
      pistolGroup.add(magBase);

      // Underside Tactical Laser Sight
      const laserMod = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 2.5), this.materials.weaponTitaniumPlate);
      laserMod.position.set(4, -3.2, 0);
      pistolGroup.add(laserMod);

      group.add(pistolGroup);
    }

    // Ground Hologram Pedestal Disc
    const holoDisc = new THREE.Group();
    holoDisc.name = 'groundHoloDisc';
    holoDisc.position.y = -15;

    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(14, 21, 24), this.materials.weaponHoloPedestalRing);
    ringMesh.rotateX(-Math.PI / 2);
    holoDisc.add(ringMesh);

    group.add(holoDisc);
  }

  private build3DBioCoreBattery(group: THREE.Group, coreIndex?: number) {
    // --- HIGH-VALUE MECHANICAL BATTERY CELL WITH CIRCUITRY & QUANTUM POWER ROD ---

    // 1. Top Hexagonal Titanium Terminal Cap
    const topCapGeo = new THREE.CylinderGeometry(11, 11, 4.5, 6);
    const topCapMesh = new THREE.Mesh(topCapGeo, this.materials.batteryTerminalEndCap);
    topCapMesh.position.y = 13.5;
    group.add(topCapMesh);

    // Gold Anode Contact Pin (+)
    const topPinGeo = new THREE.CylinderGeometry(3.5, 3.5, 3.5, 12);
    const topPinMesh = new THREE.Mesh(topPinGeo, this.materials.batteryCopperContact);
    topPinMesh.position.y = 17.2;
    group.add(topPinMesh);

    // Glowing Neon Anode Polarity Ring (+)
    const topPolarityRing = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.8, 6, 16), this.materials.batteryCircuitNeonLine);
    topPolarityRing.rotateX(Math.PI / 2);
    topPolarityRing.position.y = 15.8;
    group.add(topPolarityRing);

    // 2. Bottom Hexagonal Titanium Terminal Cap
    const botCapGeo = new THREE.CylinderGeometry(11, 11, 4.5, 6);
    const botCapMesh = new THREE.Mesh(botCapGeo, this.materials.batteryTerminalEndCap);
    botCapMesh.position.y = -13.5;
    group.add(botCapMesh);

    // Gold Cathode Contact Pin (-)
    const botPinGeo = new THREE.CylinderGeometry(3.5, 3.5, 2.5, 12);
    const botPinMesh = new THREE.Mesh(botPinGeo, this.materials.batteryCopperContact);
    botPinMesh.position.y = -17.0;
    group.add(botPinMesh);

    // Glowing Neon Cathode Polarity Ring (-)
    const botPolarityRing = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.8, 6, 16), this.materials.batteryCircuitNeonLine);
    botPolarityRing.rotateX(Math.PI / 2);
    botPolarityRing.position.y = -15.8;
    group.add(botPolarityRing);

    // 3. Translucent Quartz-Glass Chamber
    const glassGeo = new THREE.CylinderGeometry(8.8, 8.8, 23, 24, 1, true);
    const glassMesh = new THREE.Mesh(glassGeo, this.materials.batteryGlassCylinder);
    group.add(glassMesh);

    // 4. Central Glowing High-Intensity Quantum Power Rod
    const rodGeo = new THREE.CylinderGeometry(3.4, 3.4, 22, 16);
    const rodMesh = new THREE.Mesh(rodGeo, this.materials.batteryQuantumFuelRod);
    group.add(rodMesh);

    // Concentric Neon Helical Filament Coils (3 stacked rings)
    for (let f = -1; f <= 1; f++) {
      const filament = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.65, 6, 24), this.materials.batteryCircuitNeonLine);
      filament.rotateX(Math.PI / 2);
      filament.position.y = f * 6.5;
      group.add(filament);
    }

    // 5. 4 External Carbon-Titanium Support Exoskeleton Ribs
    const ribGeo = new THREE.BoxGeometry(2.4, 26, 2.4);
    const ribPositions = [[9.2, 0], [-9.2, 0], [0, 9.2], [0, -9.2]];
    for (const [rx, rz] of ribPositions) {
      const ribMesh = new THREE.Mesh(ribGeo, this.materials.batteryExoSupportRib);
      ribMesh.position.set(rx, 0, rz);
      group.add(ribMesh);
    }

    // 6. Laser-Etched PCB Circuit Line Cylinder Overlay
    if (this.batteryCircuitTex) {
      const circuitMat = new THREE.MeshBasicMaterial({
        map: this.batteryCircuitTex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const circuitMesh = new THREE.Mesh(new THREE.CylinderGeometry(8.9, 8.9, 22.5, 24, 1, true), circuitMat);
      group.add(circuitMesh);
    }

    // 7. Counter-Rotating Gyroscopic Holographic Telemetry Rings
    const gyroRingGeo = new THREE.TorusGeometry(15, 1.1, 8, 24);
    const gyro1 = new THREE.Mesh(gyroRingGeo, this.materials.batteryGyroRingNeon);
    gyro1.name = 'batteryGyroRing1';
    gyro1.rotation.x = Math.PI / 5;
    group.add(gyro1);

    const gyro2 = new THREE.Mesh(gyroRingGeo, this.materials.batteryGyroRingNeon);
    gyro2.name = 'batteryGyroRing2';
    gyro2.rotation.y = Math.PI / 5;
    group.add(gyro2);

    // 8. Ground Hologram Aura Disc
    const holoDisc = new THREE.Group();
    holoDisc.name = 'groundHoloDisc';
    holoDisc.position.y = -15;

    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(15, 23, 24), this.materials.portalRing);
    ringMesh.rotateX(-Math.PI / 2);
    holoDisc.add(ringMesh);

    group.add(holoDisc);
  }

  private build3DMetallicGold(group: THREE.Group) {
    // 1. Heavy Cyber Gold Bullion Ingot
    const barGeo = new THREE.BoxGeometry(16, 5.5, 9.5);
    const barMesh = new THREE.Mesh(barGeo, this.materials.goldCoin);
    group.add(barMesh);

    // Security Verification Stamped Chip
    const chipGeo = new THREE.BoxGeometry(4, 1, 4);
    const chipMesh = new THREE.Mesh(chipGeo, this.materials.weaponGoldTrim);
    chipMesh.position.set(0, 3.0, 0);
    group.add(chipMesh);

    // 2. Stacked Cyber Credit Coins
    const coinGeo = new THREE.CylinderGeometry(7, 7, 2.2, 16);
    const coin1 = new THREE.Mesh(coinGeo, this.materials.goldCoin);
    coin1.position.set(-4, 6.5, 0);
    coin1.rotation.x = Math.PI / 12;
    group.add(coin1);

    const coin2 = new THREE.Mesh(coinGeo, this.materials.goldCoin);
    coin2.position.set(4, 8.5, 0);
    coin2.rotation.z = -Math.PI / 12;
    group.add(coin2);

    // Orbiting Golden Halo Ring
    const ringGeo = new THREE.TorusGeometry(14, 1.2, 6, 16);
    const ringMesh = new THREE.Mesh(ringGeo, this.materials.playerGoldNeon);
    group.add(ringMesh);

    // Ground Hologram
    const holoDisc = new THREE.Group();
    holoDisc.name = 'groundHoloDisc';
    holoDisc.position.y = -15;
    const ringFloor = new THREE.Mesh(new THREE.RingGeometry(12, 18, 20), this.materials.playerGoldNeon);
    ringFloor.rotateX(-Math.PI / 2);
    holoDisc.add(ringFloor);
    group.add(holoDisc);
  }

  private build3DCashStack(group: THREE.Group) {
    // 1. Stacked Physical Nano-Polymer Banknotes
    const chipGeo = new THREE.BoxGeometry(18, 9.5, 13);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      emissive: 0x00ff66,
      emissiveIntensity: 1.5,
      roughness: 0.25,
      metalness: 0.7,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    group.add(chipMesh);

    // 2. Glowing Holographic Security Band
    const bandGeo = new THREE.BoxGeometry(18.5, 9.8, 3.8);
    const bandMat = new THREE.MeshBasicMaterial({
      color: 0x00ffd1,
      wireframe: true,
    });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    group.add(bandMesh);

    // Ground Hologram
    const holoDisc = new THREE.Group();
    holoDisc.name = 'groundHoloDisc';
    holoDisc.position.y = -15;
    const ringFloor = new THREE.Mesh(new THREE.RingGeometry(12, 18, 20), this.materials.medkitHoloRingDisc);
    ringFloor.rotateX(-Math.PI / 2);
    holoDisc.add(ringFloor);
    group.add(holoDisc);
  }

  private build3DPowerupNode(group: THREE.Group, type: CollectibleType) {
    if (type === 'SHIELD_NODE') {
      // Kinetic Energy Shield Emitter
      const baseGeo = new THREE.CylinderGeometry(6, 8, 3, 6);
      const baseMesh = new THREE.Mesh(baseGeo, this.materials.cyborgTitaniumPlate);
      group.add(baseMesh);

      // Rotating Hexagonal Energy Barrier
      const shieldHex = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 1.2, 6), this.materials.labNeonCyan);
      shieldHex.name = 'shieldHexMesh';
      shieldHex.position.y = 6;
      group.add(shieldHex);
    } else if (type === 'OVERDRIVE_CELL') {
      // Cybernetic Adrenaline Overdrive Canister
      const canGeo = new THREE.CylinderGeometry(5, 5, 18, 12);
      const canMesh = new THREE.Mesh(canGeo, this.materials.playerMagentaNeon);
      group.add(canMesh);

      const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3, 12), this.materials.weaponTitaniumPlate);
      cap1.position.y = 9;
      group.add(cap1);

      const cap2 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3, 12), this.materials.weaponTitaniumPlate);
      cap2.position.y = -9;
      group.add(cap2);
    } else {
      // Standard / Chrono Powerup Crystal
      const itemGeo = new THREE.OctahedronGeometry(12, 0);
      const itemMat = type === 'CHRONO_CRYSTAL'
        ? this.materials.labNeonCyan
        : this.materials.bioCoreCrystal;
      const itemMesh = new THREE.Mesh(itemGeo, itemMat);
      group.add(itemMesh);

      const ringGeo = new THREE.TorusGeometry(16, 1.2, 8, 20);
      const ringMesh = new THREE.Mesh(ringGeo, itemMat);
      ringMesh.rotation.x = Math.PI / 4;
      group.add(ringMesh);
    }

    // Ground Hologram
    const holoDisc = new THREE.Group();
    holoDisc.name = 'groundHoloDisc';
    holoDisc.position.y = -15;
    const ringFloor = new THREE.Mesh(new THREE.RingGeometry(11, 16, 18), this.materials.labNeonCyan);
    ringFloor.rotateX(-Math.PI / 2);
    holoDisc.add(ringFloor);
    group.add(holoDisc);
  }

  // --- 3D COLLECTIBLES & ENCRYPTED BIO-CORES ---
  private update3DCollectibles(collectibles: Collectible[]) {
    const activeIds = new Set<number>();

    for (const col of collectibles) {
      if (col.collected) continue;

      activeIds.add(col.id);
      const cx = col.position.x;
      const cz = col.position.y;

      let group = this.collectibleMeshMap.get(col.id);
      if (!group) {
        group = new THREE.Group();

        if (col.type === 'ENCRYPTED_BIO_CORE' || col.type === 'CYBER_CORE') {
          // 3D Floating Mechanical Battery Cell with Visible Circuit Lines & Core Rod
          this.build3DBioCoreBattery(group, col.coreIndex);
        } else if (col.type === 'BLOOD_PLASMA_CELL') {
          // 3D Futuristic Tactical Sci-Fi Medical Box with Glowing Neon Cross
          this.build3DMedkit(group);
        } else if (col.type === 'WEAPON_TECH_PART' || col.type === 'EXOTIC_WEAPON_DROP') {
          // 3D Distinct Futuristic Weapon Model on Floor (Rifle, Katana, Pistol, Shotgun, Missiles, Vortex)
          this.build3DWeaponProp(group, col.weaponDropType);
        } else if (col.type === 'METALLIC_GOLD') {
          // 3D Gold Bullion Ingot & Credit Coins
          this.build3DMetallicGold(group);
        } else if (col.type === 'CASH_STACK') {
          // 3D Nano-Polymer Banknote Stack with Holographic Band
          this.build3DCashStack(group);
        } else {
          // Specialized Powerup Nodes (Shield, Overdrive, Chrono)
          this.build3DPowerupNode(group, col.type);
        }

        this.scene.add(group);
        this.collectibleMeshMap.set(col.id, group);
      }

      // Smooth Hover Bob & Rotation Animation
      const bob = Math.sin(this.animTick * 3.5 + col.id) * 5.0;
      group.position.set(cx, 16 + bob, cz);
      group.rotation.y += 0.038;
      group.rotation.x = Math.sin(this.animTick * 1.8 + col.id) * 0.08;

      // Animate Battery Gyro Rings
      const gyro1 = group.getObjectByName('batteryGyroRing1');
      if (gyro1) gyro1.rotation.z += 0.045;
      const gyro2 = group.getObjectByName('batteryGyroRing2');
      if (gyro2) gyro2.rotation.z -= 0.045;

      // Animate Quantum Core Singularity Ring
      const qRing = group.getObjectByName('quantumCoreRing');
      if (qRing) qRing.rotation.z += 0.06;

      // Animate Shield Hex Node
      const shieldHex = group.getObjectByName('shieldHexMesh');
      if (shieldHex) shieldHex.rotation.y += 0.05;

      // Keep Ground Holographic Pedestal / Aura Disc Grounded & Pulsing
      const groundHoloDisc = group.getObjectByName('groundHoloDisc');
      if (groundHoloDisc) {
        groundHoloDisc.position.y = -15 - bob;
        const discPulse = 1.0 + Math.sin(this.animTick * 5.5 + col.id) * 0.14;
        groundHoloDisc.scale.set(discPulse, 1, discPulse);
      }
    }

    // Cleanup collected items
    for (const [id, group] of this.collectibleMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.collectibleMeshMap.delete(id);
      }
    }
  }

  // --- 3D LASER HAZARDS ---
  private update3DLasers(lasers: LaserHazard[]) {
    const activeIds = new Set<string>();

    for (const laser of lasers) {
      if (!laser.active || laser.disabled) continue;

      activeIds.add(laser.id);
      let group = this.laserMeshMap.get(laser.id);

      const lx1 = laser.startX;
      const lz1 = laser.startY;
      const lx2 = laser.endX;
      const lz2 = laser.endY;
      const dx = lx2 - lx1;
      const dz = lz2 - lz1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);

      if (!group) {
        group = new THREE.Group();

        // Inner Intense Laser Core
        const coreGeo = new THREE.CylinderGeometry(3, 3, 1, 12);
        coreGeo.rotateZ(Math.PI / 2);
        const coreMesh = new THREE.Mesh(coreGeo, this.materials.laserGlowCore);
        group.add(coreMesh);

        // Outer Volumetric Glowing Cylinder
        const outerGeo = new THREE.CylinderGeometry(7, 7, 1, 12);
        outerGeo.rotateZ(Math.PI / 2);
        const outerMesh = new THREE.Mesh(outerGeo, this.materials.laserBeam);
        group.add(outerMesh);

        this.scene.add(group);
        this.laserMeshMap.set(laser.id, group);
      }

      const isFiring = laser.state === 'FIRING';
      const isCharging = laser.state === 'CHARGING';
      group.visible = isFiring || isCharging;

      group.position.set(lx1 + dx / 2, 15, lz1 + dz / 2);
      group.rotation.y = -angle;
      group.scale.set(len, isCharging ? 0.4 : 1.0, 1.0);
    }

    for (const [id, group] of this.laserMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.laserMeshMap.delete(id);
      }
    }
  }

  // --- 8.5 THICK HEAVY SCI-FI PLASMA LASER BEAMS (3D VOLUMETRIC HIGH-BLOOM) ---
  private update3DProjectiles(projectiles: Projectile[]) {
    const activeIds = new Set<number>();
    let leadProjectile: Projectile | null = null;

    for (const bolt of projectiles) {
      activeIds.add(bolt.id);
      if (!leadProjectile || !bolt.isEnemy) {
        leadProjectile = bolt;
      }

      let group = this.projectileMeshMap.get(bolt.id);
      const bx = bolt.position.x * this.WORLD_SCALE;
      const bz = bolt.position.y * this.WORLD_SCALE;
      const angle = Math.atan2(bolt.velocity.y, bolt.velocity.x);
      const isCrit = !!bolt.isCriticalFinisher;
      const colorHex = bolt.color === '#FF00E5' ? 0xff00e5 : bolt.color === '#FFD700' ? 0xffd700 : 0x00ffd1;

      if (!group) {
        group = new THREE.Group();

        // 1. Superheated Pure White Center Core Beam
        const coreGeo = new THREE.CylinderGeometry(bolt.radius * 0.45, bolt.radius * 0.45, 52, 10);
        coreGeo.rotateZ(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // 2. Thick Volumetric Plasma Bloom Outer Sheath (Intense glowing cylinder)
        const glowGeo = new THREE.CylinderGeometry(bolt.radius * 1.35, bolt.radius * 1.35, 48, 12);
        glowGeo.rotateZ(Math.PI / 2);
        const glowMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.88,
          blending: THREE.AdditiveBlending,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        group.add(glowMesh);

        // 3. Forward Plasma Shockhead (Aerodynamic superheated droplet)
        const headGeo = new THREE.SphereGeometry(bolt.radius * 0.95, 10, 10);
        const headMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.set(24, 0, 0);
        group.add(headMesh);

        // 4. Trailing Ion Acceleration Ring (Spinning plasma halo)
        const ringGeo = new THREE.TorusGeometry(bolt.radius * 1.25, 2.2, 8, 16);
        ringGeo.rotateY(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(-14, 0, 0);
        ringMesh.name = 'ionRing';
        group.add(ringMesh);

        this.scene.add(group);
        this.projectileMeshMap.set(bolt.id, group);
      }

      // Spin trailing ion ring
      const ring = group.getObjectByName('ionRing');
      if (ring) {
        ring.rotation.x += 0.25;
      }

      group.position.set(bx, 16, bz);
      group.rotation.y = -angle;
      const scaleMul = isCrit ? 1.4 : 1.0;
      group.scale.set(scaleMul, scaleMul, scaleMul);
    }

    // Dynamic Real-Time Volumetric Light illumination from lead projectile
    if (leadProjectile) {
      this.projectilePointLight.position.set(
        leadProjectile.position.x * this.WORLD_SCALE,
        22,
        leadProjectile.position.y * this.WORLD_SCALE
      );
      this.projectilePointLight.color.set(leadProjectile.color);
      this.projectilePointLight.intensity = leadProjectile.isCriticalFinisher ? 3.8 : 2.4;
    } else {
      this.projectilePointLight.intensity = 0;
    }

    // Clean up expired projectile 3D meshes
    for (const [id, group] of this.projectileMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.projectileMeshMap.delete(id);
      }
    }
  }

  // --- 8.6 PERSISTENT 3D LASER BURN MARKS (WALL & FLOOR IMPACT SCARS) ---
  private update3DLaserBurns(burns: LaserBurnMark[]) {
    const activeIds = new Set<number>();

    for (const mark of burns) {
      activeIds.add(mark.id);
      let group = this.laserBurnMeshMap.get(mark.id);
      const mx = mark.x * this.WORLD_SCALE;
      const mz = mark.y * this.WORLD_SCALE;
      const colorHex = mark.color === '#FF00E5' ? 0xff00e5 : mark.color === '#FFD700' ? 0xffd700 : 0x00ffd1;

      if (!group) {
        group = new THREE.Group();

        // Molten White-Hot Core Disc
        const coreGeo = new THREE.CircleGeometry(mark.radius * 0.38, 12);
        coreGeo.rotateX(-Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.name = 'core';
        group.add(coreMesh);

        // Superheated Neon Glow Outer Fringe
        const glowGeo = new THREE.RingGeometry(mark.radius * 0.35, mark.radius * 1.1, 16);
        glowGeo.rotateX(-Math.PI / 2);
        const glowMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.name = 'glow';
        group.add(glowMesh);

        // Charred Black Slag Outer Ring
        const slagGeo = new THREE.RingGeometry(mark.radius * 0.95, mark.radius * 1.45, 14);
        slagGeo.rotateX(-Math.PI / 2);
        const slagMat = new THREE.MeshBasicMaterial({
          color: 0x020408,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        });
        const slagMesh = new THREE.Mesh(slagGeo, slagMat);
        slagMesh.name = 'slag';
        group.add(slagMesh);

        this.scene.add(group);
        this.laserBurnMeshMap.set(mark.id, group);
      }

      // Height position: wall decals sit at wall mid-level, floor decals sit flush on floor
      const my = mark.surface === 'WALL' ? 14 : 0.45;
      group.position.set(mx, my, mz);

      // Fade out as mark cools down
      const core = group.getObjectByName('core') as THREE.Mesh;
      if (core && core.material instanceof THREE.MeshBasicMaterial) {
        core.material.opacity = Math.max(0, mark.alpha * 0.95);
      }
      const glow = group.getObjectByName('glow') as THREE.Mesh;
      if (glow && glow.material instanceof THREE.MeshBasicMaterial) {
        glow.material.opacity = Math.max(0, mark.alpha * 0.8);
      }
      const slag = group.getObjectByName('slag') as THREE.Mesh;
      if (slag && slag.material instanceof THREE.MeshBasicMaterial) {
        slag.material.opacity = Math.max(0, mark.alpha * 0.65);
      }
    }

    // Clean up expired burn mark 3D meshes
    for (const [id, group] of this.laserBurnMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.laserBurnMeshMap.delete(id);
      }
    }
  }

  // --- 3D EXPLOSION BLAST CRATER HAZARDS: HIGH-PERFORMANCE COMBAT IMPACT ZONE ---
  private update3DPits(chunks: GridMapChunk[] = [], player: Player) {
    const px = player.position.x;
    const pz = player.position.y;
    const renderDist = 1300;
    const visibleIds = new Set<string>();

    for (const chunk of chunks) {
      if (
        Math.abs(chunk.worldX + chunk.pixelSize / 2 - px) > renderDist + 400 ||
        Math.abs(chunk.worldY + chunk.pixelSize / 2 - pz) > renderDist + 400
      ) {
        continue;
      }

      for (let tx = 0; tx < chunk.chunkSize; tx++) {
        for (let ty = 0; ty < chunk.chunkSize; ty++) {
          const tile = chunk.tiles[tx]?.[ty];
          if (!tile) continue;
          if (!tile.isPitHazard && tile.type !== 'BROKEN_FLOOR' && tile.type !== 'CHASM_VOID') {
            continue;
          }

          const wx = chunk.worldX + tx * chunk.tileSize + chunk.tileSize / 2;
          const wz = chunk.worldY + ty * chunk.tileSize + chunk.tileSize / 2;

          const dx = wx - px;
          const dz = wz - pz;
          if (Math.abs(dx) > renderDist || Math.abs(dz) > renderDist) {
            continue;
          }

          const pitId = `pit_${chunk.chunkX}_${chunk.chunkY}_${tx}_${ty}`;
          visibleIds.add(pitId);

          let group = this.pitMeshMap.get(pitId);
          if (!group) {
            group = new THREE.Group();
            group.position.set(wx, 0, wz);

            const ts = chunk.tileSize; // 50px
            const isBroken = tile.type === 'BROKEN_FLOOR';
            const seed = Math.abs(Math.sin(chunk.chunkX * 127.1 + chunk.chunkY * 311.7 + tx * 269.5 + ty * 183.3));

            // 1. HIGH-CONTRAST HAZARD CAUTION CHEVRON STRIPED BASE COLLAR
            // Provides an unmistakable, prominent perimeter warning bordering the solid road
            const collarGeo = new THREE.PlaneGeometry(ts * 1.15, ts * 1.15);
            collarGeo.rotateX(-Math.PI / 2);
            const collarMesh = new THREE.Mesh(collarGeo, this.materials.hazardCautionBorderMat);
            collarMesh.position.y = 0.24;
            group.add(collarMesh);

            // 2. EXPLOSION BLAST SCORCH & RADIAL FRACTURE DECAL (Fast 2D Decal Plane on Road)
            const decalSize = ts * 1.45;
            const decalGeo = new THREE.PlaneGeometry(decalSize, decalSize);
            decalGeo.rotateX(-Math.PI / 2);
            const decalMesh = new THREE.Mesh(decalGeo, this.materials.craterBlastDecal);
            decalMesh.position.y = 0.28;
            decalMesh.rotation.y = seed * Math.PI * 2;
            group.add(decalMesh);

            // 3. CIRCULAR / OVAL BLAST IMPACT CRATER CENTER (10-Point Harmonic Circular Rim)
            const numPts = 10;
            const perimeterPts: THREE.Vector2[] = [];
            const radiusBase = ts * 0.40;

            for (let i = 0; i < numPts; i++) {
              const theta = (i / numPts) * Math.PI * 2;
              const rNoise =
                Math.sin(theta * 3 + seed * 12.3) * (ts * 0.07) +
                Math.cos(theta * 4 + seed * 23.7) * (ts * 0.035);
              const r = Math.max(ts * 0.30, Math.min(ts * 0.47, radiusBase + rNoise));
              perimeterPts.push(new THREE.Vector2(Math.cos(theta) * r, Math.sin(theta) * r));
            }

            // Central Blown-Out Floor Mask (Deep dark cutout)
            const shape = new THREE.Shape();
            shape.moveTo(perimeterPts[0].x, perimeterPts[0].y);
            for (let i = 1; i < numPts; i++) {
              shape.lineTo(perimeterPts[i].x, perimeterPts[i].y);
            }
            shape.closePath();

            const maskGeo = new THREE.ShapeGeometry(shape);
            maskGeo.rotateX(-Math.PI / 2);
            const maskMesh = new THREE.Mesh(maskGeo, this.materials.chasmFloorMask);
            maskMesh.position.y = 0.35;
            group.add(maskMesh);

            // 4. BRIGHT GLOWING NEON HAZARD WARNING PERIMETER OUTLINE (Line Loop)
            // Vibrant neon orange/red perimeter outline highlighting the dangerous edge
            const rimLinePositions: number[] = [];
            for (let i = 0; i < numPts; i++) {
              rimLinePositions.push(perimeterPts[i].x, 0.65, perimeterPts[i].y);
            }
            const rimLineGeo = new THREE.BufferGeometry();
            rimLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimLinePositions, 3));
            const rimLineMesh = new THREE.LineLoop(rimLineGeo, this.materials.hazardRimGlowMat.clone());
            rimLineMesh.name = 'hazardRimLine';
            group.add(rimLineMesh);

            // 5. 4 CARDINAL CORNER HAZARD WARNING BEACON POSTS & VERTICAL LASER BEAMS
            // Towering caution light pillars standing on the safe solid perimeter
            const cornerOffsets = [
              [-ts * 0.45, -ts * 0.45],
              [ts * 0.45, -ts * 0.45],
              [ts * 0.45, ts * 0.45],
              [-ts * 0.45, ts * 0.45],
            ];

            const cornerBeacons: THREE.Mesh[] = [];
            for (let c = 0; c < 4; c++) {
              const [cx, cz] = cornerOffsets[c];
              
              // Heavy Steel Bollard Post
              const postGeo = new THREE.CylinderGeometry(1.2, 1.8, 8, 6);
              postGeo.translate(0, 4, 0);
              const postMesh = new THREE.Mesh(postGeo, this.materials.factoryTrussSteel);
              postMesh.position.set(cx, 0, cz);
              group.add(postMesh);

              // High-Intensity Glowing Warning Beacon Orb
              const orbGeo = new THREE.SphereGeometry(2.2, 8, 8);
              const orbMesh = new THREE.Mesh(orbGeo, this.materials.hazardBeaconMat.clone());
              orbMesh.position.set(cx, 8.5, cz);
              orbMesh.name = `hazardBeaconOrb_${c}`;
              group.add(orbMesh);
              cornerBeacons.push(orbMesh);

              // Skyward Warning Laser Light Column
              const laserColGeo = new THREE.CylinderGeometry(0.4, 0.4, 38, 4);
              laserColGeo.translate(0, 19, 0);
              const laserCol = new THREE.Mesh(laserColGeo, this.materials.hazardLaserMat);
              laserCol.position.set(cx, 8.5, cz);
              group.add(laserCol);
            }

            // 6. FLOATING HOLOGRAPHIC HAZARD WARNING SIGN ABOVE PIT CENTER
            const holoGeo = new THREE.PlaneGeometry(24, 12);
            const holoMesh = new THREE.Mesh(holoGeo, this.materials.hazardHoloMat);
            holoMesh.position.set(0, 16, 0);
            holoMesh.rotation.x = -Math.PI / 5; // Tilted toward player camera
            holoMesh.name = 'hazardHoloSign';
            group.add(holoMesh);

            // 7. LOW-POLY CRATER CAVITY WALLS (Deep vertical plunge into the void)
            const wallH = 120;
            const wallPositions: number[] = [];
            const wallUVs: number[] = [];
            const wallNormals: number[] = [];

            for (let i = 0; i < numPts; i++) {
              const nextI = (i + 1) % numPts;
              const pA = perimeterPts[i];
              const pB = perimeterPts[nextI];

              const topAx = pA.x;
              const topAy = 0.35;
              const topAz = pA.y;

              const topBx = pB.x;
              const topBy = 0.35;
              const topBz = pB.y;

              // Bottom points taper slightly inward (0.82x)
              const botBx = pB.x * 0.82;
              const botBy = -wallH;
              const botBz = pB.y * 0.82;

              const botAx = pA.x * 0.82;
              const botAy = -wallH;
              const botAz = pA.y * 0.82;

              const u0 = i / numPts;
              const u1 = (i + 1) / numPts;

              // Triangle 1 (topA -> topB -> botB)
              wallPositions.push(topAx, topAy, topAz, topBx, topBy, topBz, botBx, botBy, botBz);
              wallUVs.push(u0, 0, u1, 0, u1, 1);

              // Triangle 2 (topA -> botB -> botA)
              wallPositions.push(topAx, topAy, topAz, botBx, botBy, botBz, botAx, botAy, botAz);
              wallUVs.push(u0, 0, u1, 1, u0, 1);

              const edge1 = new THREE.Vector3(topBx - topAx, topBy - topAy, topBz - topAz);
              const edge2 = new THREE.Vector3(botBx - topAx, botBy - topAy, botBz - topAz);
              const norm = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

              for (let v = 0; v < 6; v++) {
                wallNormals.push(norm.x, norm.y, norm.z);
              }
            }

            const wallGeo = new THREE.BufferGeometry();
            wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
            wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wallUVs, 2));
            wallGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wallNormals, 3));

            const wallMesh = new THREE.Mesh(wallGeo, this.materials.chasmCrackedConcrete);
            group.add(wallMesh);

            // 8. PITCH-BLACK ABYSS BOTTOM CAP & INTENSE GLOWING CORE DISC
            const bottomGeo = new THREE.CircleGeometry(ts * 0.44, 8);
            bottomGeo.rotateX(-Math.PI / 2);
            const bottomMesh = new THREE.Mesh(bottomGeo, this.materials.chasmVoidInterior);
            bottomMesh.position.y = -wallH + 1;
            group.add(bottomMesh);

            // Intense Glowing Thermal Magma/Plasma Core at bottom radiating upward light
            const lavaGeo = new THREE.CircleGeometry(ts * 0.38, 8);
            lavaGeo.rotateX(-Math.PI / 2);
            const lavaMesh = new THREE.Mesh(lavaGeo, this.materials.chasmLavaGlowMat);
            lavaMesh.position.y = -wallH + 4;
            lavaMesh.name = 'hazardLavaCore';
            group.add(lavaMesh);

            // 9. TILTED CONCRETE SLABS (Roadway chunks collapsed inward by blast force)
            const numSlabs = 2;
            for (let s = 0; s < numSlabs; s++) {
              const sAngle = (s / numSlabs) * Math.PI * 2 + seed * 3.5;
              const edgeDist = ts * 0.33;
              const sx = Math.cos(sAngle) * edgeDist;
              const sz = Math.sin(sAngle) * edgeDist;

              const slabW = ts * 0.28;
              const slabL = ts * 0.24;
              const slabH = 3.0;

              const slabMesh = new THREE.Mesh(
                new THREE.BoxGeometry(slabW, slabH, slabL),
                this.materials.chasmBrokenSlab
              );
              slabMesh.position.set(sx, -2.0 - s * 1.8, sz);
              slabMesh.rotation.set(
                Math.sin(sAngle) * 0.35 + 0.1,
                sAngle + 0.2,
                -Math.cos(sAngle) * 0.35
              );
              group.add(slabMesh);
            }

            // 10. EXPOSED STEEL REBAR RODS WITH GLOWING HEAT EMBERS
            const numRebars = 2;
            for (let r = 0; r < numRebars; r++) {
              const rAngle = (r / numRebars) * Math.PI + seed * 2.5;
              const rx = Math.cos(rAngle) * (ts * 0.36);
              const rz = Math.sin(rAngle) * (ts * 0.36);

              const rebarLen = 12;
              const rebarGeo = new THREE.CylinderGeometry(0.7, 0.7, rebarLen, 4);
              rebarGeo.translate(0, rebarLen / 2, 0);

              const rebarMesh = new THREE.Mesh(rebarGeo, this.materials.chasmExposedRebar);
              rebarMesh.position.set(rx, -1.8, rz);

              const inwardAngle = Math.atan2(-rz, -rx);
              rebarMesh.rotation.set(0.35, inwardAngle, Math.PI / 2 - 0.2);
              group.add(rebarMesh);

              const tipX = rx + Math.cos(inwardAngle) * (rebarLen * 0.85);
              const tipZ = rz + Math.sin(inwardAngle) * (rebarLen * 0.85);
              const tipMesh = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 4, 4),
                this.materials.chasmRebarTipGlow
              );
              tipMesh.position.set(tipX, -4.0, tipZ);
              group.add(tipMesh);
            }

            // 11. BLAST RUBBLE & CONCRETE DEBRIS SCATTERED AROUND CRATER RIM
            const numRubble = 4;
            for (let b = 0; b < numRubble; b++) {
              const bAngle = (b / numRubble) * Math.PI * 2 + seed * 4.2;
              const bDist = ts * (0.36 + ((b * 0.08 + seed) % 0.14));
              const bx = Math.cos(bAngle) * bDist;
              const bz = Math.sin(bAngle) * bDist;

              const rSize = 2.2 + (b % 3) * 1.2;
              const rubbleMesh = new THREE.Mesh(
                new THREE.BoxGeometry(rSize, rSize * 0.65, rSize),
                this.materials.chasmConcreteRubble
              );
              rubbleMesh.position.set(bx, 0.5, bz);
              rubbleMesh.rotation.set((b * 1.2) % 3, (b * 2.1) % 3, 0.35);
              group.add(rubbleMesh);
            }

            // 12. RISING SMOKE & BLAST DUST PARTICLES (8 lightweight particles)
            const dustCount = 8;
            const dustPositions = new Float32Array(dustCount * 3);
            const dustSpeeds = new Float32Array(dustCount);
            const dustPhases = new Float32Array(dustCount);
            const dustBaseX = new Float32Array(dustCount);
            const dustBaseZ = new Float32Array(dustCount);

            for (let d = 0; d < dustCount; d++) {
              const dAngle = (d / dustCount) * Math.PI * 2 + seed;
              const dRad = (ts * 0.30) * (0.3 + (d % 3) * 0.25);
              const dx = Math.cos(dAngle) * dRad;
              const dz = Math.sin(dAngle) * dRad;
              const dy = -35 + (d * 7);

              dustBaseX[d] = dx;
              dustBaseZ[d] = dz;
              dustSpeeds[d] = 0.4 + (d % 3) * 0.2;
              dustPhases[d] = d * 1.3;

              dustPositions[d * 3] = dx;
              dustPositions[d * 3 + 1] = dy;
              dustPositions[d * 3 + 2] = dz;
            }

            const dustGeo = new THREE.BufferGeometry();
            dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

            const dustPoints = new THREE.Points(dustGeo, this.materials.chasmDustParticleMat);
            group.add(dustPoints);

            group.userData = {
              dustGeo,
              dustPositions,
              dustSpeeds,
              dustPhases,
              dustBaseX,
              dustBaseZ,
              dustCount,
              cornerBeacons,
              rimLineMesh,
              holoMesh,
            };

            this.scene.add(group);
            this.pitMeshMap.set(pitId, group);
          } else {
            // Animate rising smoke, blinking beacon lights, and glowing rim outline
            const distSq = dx * dx + dz * dz;
            if (distSq < 722500) {
              const uData = group.userData;
              if (uData) {
                // 1. Animate Rising Particles
                if (uData.dustPositions && uData.dustGeo) {
                  const pos = uData.dustPositions;
                  const count = uData.dustCount;
                  const speeds = uData.dustSpeeds;
                  const phases = uData.dustPhases;
                  const baseXs = uData.dustBaseX;
                  const baseZs = uData.dustBaseZ;

                  for (let d = 0; d < count; d++) {
                    let y = pos[d * 3 + 1] + speeds[d] * 0.65;
                    if (y > 12) {
                      y = -40;
                    }
                    pos[d * 3 + 1] = y;
                    pos[d * 3] = baseXs[d] + Math.sin(this.animTick * 1.5 + phases[d]) * 2.2;
                    pos[d * 3 + 2] = baseZs[d] + Math.cos(this.animTick * 1.2 + phases[d]) * 2.2;
                  }
                  uData.dustGeo.attributes.position.needsUpdate = true;
                }

                // 2. Animate Pulsating Holographic Sign & Rim Line
                if (uData.holoMesh) {
                  uData.holoMesh.position.y = 16 + Math.sin(this.animTick * 3.5) * 1.2;
                }

                // 3. Animate Corner Warning Beacon Blink
                if (uData.cornerBeacons) {
                  const beaconFlash = Math.sin(this.animTick * 6) > 0 ? 1.0 : 0.4;
                  for (const b of uData.cornerBeacons) {
                    b.scale.setScalar(0.9 + beaconFlash * 0.25);
                  }
                }
              }
            }
          }
        }
      }
    }

    // High-performance cleanup & geometry disposal for culled pits
    for (const [id, group] of this.pitMeshMap.entries()) {
      if (!visibleIds.has(id)) {
        group.traverse((obj) => {
          const m = obj as THREE.Mesh;
          if (m.isMesh || (obj as THREE.Points).isPoints) {
            if (m.geometry) m.geometry.dispose();
          }
        });
        this.scene.remove(group);
        this.pitMeshMap.delete(id);
      }
    }
  }

  // --- 3D ENVIRONMENT PROPS ---
  private update3DProps(props: CyberEnvironmentProp[]) {
    const activeIds = new Set<string>();

    for (const prop of props) {
      if (!prop.active) continue;

      activeIds.add(prop.id);
      let group = this.propMeshMap.get(prop.id);

      if (!group) {
        group = new THREE.Group();

        if (prop.type === 'CYBER_TREE') {
          // 3D Holographic Trunk + Geometric Foliage
          const trunkGeo = new THREE.CylinderGeometry(3, 6, 60, 8);
          trunkGeo.translate(0, 30, 0);
          const trunkMesh = new THREE.Mesh(trunkGeo, this.materials.playerCarbonArmor);
          group.add(trunkMesh);

          const foliageGeo = new THREE.IcosahedronGeometry(30, 1);
          foliageGeo.translate(0, 78, 0);
          const foliageMesh = new THREE.Mesh(foliageGeo, this.materials.shieldHologram);
          group.add(foliageMesh);
        } else if (prop.type === 'STREET_LIGHT') {
          const poleGeo = new THREE.CylinderGeometry(2, 2, 70, 8);
          poleGeo.translate(0, 35, 0);
          const poleMesh = new THREE.Mesh(poleGeo, this.materials.playerCarbonArmor);
          group.add(poleMesh);

          // Volumetric Light Cone
          const coneGeo = new THREE.ConeGeometry(28, 65, 16);
          coneGeo.translate(0, 32, 0);
          const coneMesh = new THREE.Mesh(coneGeo, this.materials.shieldHologram);
          coneMesh.position.set(0, 5, 0);
          group.add(coneMesh);
        } else if (prop.type === 'GOLDEN_BILLBOARD') {
          const bData = prop.goldenBillboardData || {
            brand: 'Burma Batik' as const,
            orientation: 'HORIZONTAL_ROOFTOP' as const,
            scaffolding: true,
            aviationBeacons: true,
            emissivePulseSpeed: 1.0,
            goldHue: '#FFD700' as const,
          };
          const bWidth = prop.width || (bData.orientation === 'VERTICAL_WALL_STRIP' ? 42 : 140);
          const bHeight = prop.height || (bData.orientation === 'VERTICAL_WALL_STRIP' ? 140 : 55);

          group = this.create3DGoldenBillboardMesh(bData.brand, bData.orientation, bWidth, bHeight);
          group.position.set(
            prop.position.x,
            bData.orientation === 'HORIZONTAL_ROOFTOP' ? 38 : 28,
            prop.position.y
          );
          if (prop.rotation) {
            group.rotation.y = prop.rotation;
          }
        } else if (prop.type === 'HOLO_BILLBOARD') {
          // Alternative brand hologram billboard
          const brands: Array<'KKS' | 'Cyber Game' | 'Burma Batik'> = ['KKS', 'Burma Batik', 'Cyber Game'];
          const pickedBrand = brands[Math.abs(Math.floor(prop.position.x * 7)) % 3];
          group = this.create3DGoldenBillboardMesh(pickedBrand, 'HORIZONTAL_ROOFTOP', prop.width || 120, prop.height || 48);
          group.position.set(prop.position.x, 32, prop.position.y);
          if (prop.rotation) group.rotation.y = prop.rotation;
        } else {
          // Default Prop Box
          const boxGeo = new THREE.BoxGeometry(prop.width, 40, prop.height);
          boxGeo.translate(0, 20, 0);
          const boxMesh = new THREE.Mesh(boxGeo, this.materials.labBulkhead);
          group.add(boxMesh);
        }

        if (prop.type !== 'GOLDEN_BILLBOARD' && prop.type !== 'HOLO_BILLBOARD') {
          group.position.set(prop.position.x, 0, prop.position.y);
        }
        this.scene.add(group);
        this.propMeshMap.set(prop.id, group);
      }
    }

    for (const [id, group] of this.propMeshMap.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        this.propMeshMap.delete(id);
      }
    }
  }

  // --- DYNAMIC POINT LIGHTS FOR NEARBY GOLDEN BILLBOARDS ---
  private updateGoldenPointLights(_player: Player, _props: CyberEnvironmentProp[]) {
    // Keep ambient lighting clean and stable
  }

  // --- 3D PORTAL VORTEX ---
  private update3DPortal(entities: WorldEntity[], _player: Player) {
    const portalEntity = entities.find((e) => e.active && e.type === 'CYBER_EXIT_PORTAL');
    if (portalEntity) {
      this.portalGroup.visible = true;
      this.portalGroup.position.set(portalEntity.position.x, 0, portalEntity.position.y);
      this.portalPointLight.position.set(portalEntity.position.x, 60, portalEntity.position.y);
    } else {
      this.portalGroup.visible = true;
    }

    // Animate rings
    for (let r = 0; r < this.portalRings.length; r++) {
      this.portalRings[r].rotation.z += 0.02 * (r % 2 === 0 ? 1 : -1);
      this.portalRings[r].rotation.y += 0.015;
    }
    this.portalVortexMesh.rotation.z += 0.04;
  }

  // --- 3D PARTICLE CLOUD (SPARKS & BLOOD SLLATTERS) ---
  private update3DParticleCloud(particles: Particle[], flyingSplatters: FlyingSplatter[]) {
    let pIdx = 0;

    // 1. Process 2D Game Particles into 3D Space
    for (let i = 0; i < particles.length && pIdx < this.MAX_3D_PARTICLES; i++) {
      const p = particles[i];
      this.particlePositions[pIdx * 3] = p.position.x;
      this.particlePositions[pIdx * 3 + 1] = 14 + Math.sin(this.animTick + i) * 6;
      this.particlePositions[pIdx * 3 + 2] = p.position.y;

      ThreeSceneManager.tmpParticleColor.set(p.color || '#00ffd1');
      this.particleColors[pIdx * 3] = ThreeSceneManager.tmpParticleColor.r;
      this.particleColors[pIdx * 3 + 1] = ThreeSceneManager.tmpParticleColor.g;
      this.particleColors[pIdx * 3 + 2] = ThreeSceneManager.tmpParticleColor.b;

      pIdx++;
    }

    // 2. Process Flying Organic Splatters
    for (let s = 0; s < flyingSplatters.length && pIdx < this.MAX_3D_PARTICLES; s++) {
      const sp = flyingSplatters[s];
      this.particlePositions[pIdx * 3] = sp.x;
      this.particlePositions[pIdx * 3 + 1] = Math.max(2, 22 * (sp.life / sp.maxLife));
      this.particlePositions[pIdx * 3 + 2] = sp.y;

      ThreeSceneManager.tmpParticleColor.set(sp.color || '#39ff14');
      this.particleColors[pIdx * 3] = ThreeSceneManager.tmpParticleColor.r;
      this.particleColors[pIdx * 3 + 1] = ThreeSceneManager.tmpParticleColor.g;
      this.particleColors[pIdx * 3 + 2] = ThreeSceneManager.tmpParticleColor.b;

      pIdx++;
    }

    // Clear unused slots
    for (let u = pIdx; u < this.MAX_3D_PARTICLES; u++) {
      this.particlePositions[u * 3 + 1] = -9999;
    }

    this.particleGeo.attributes.position.needsUpdate = true;
    this.particleGeo.attributes.color.needsUpdate = true;
  }

  // --- 3D ATMOSPHERIC BIO-SPORES SIMULATION ---
  private update3DBioSpores(player: Player) {
    if (!this.sporePositions || !this.sporeGeo) return;
    const px = player.position.x;
    const pz = player.position.y;

    const count = this.isMobileDevice ? 200 : this.MAX_SPORES;
    for (let i = 0; i < count; i++) {
      this.sporePositions[i * 3 + 1] += Math.sin(this.animTick + i) * 0.4 - 0.2;
      this.sporePositions[i * 3] += Math.cos(this.animTick * 0.5 + i) * 0.3;

      if (this.sporePositions[i * 3 + 1] < 5) {
        this.sporePositions[i * 3 + 1] = 400;
        this.sporePositions[i * 3] = px + (Math.random() - 0.5) * 3200;
        this.sporePositions[i * 3 + 2] = pz + (Math.random() - 0.5) * 3200;
      }
    }
    this.sporeGeo.attributes.position.needsUpdate = true;
  }

  // --- 2D OVERLAY RENDERING (DAMAGE TEXTS, FLASH, METRONOME, MINIMAP, CROSSHAIR) ---
  private render2DOverlay(
    player: Player,
    entities: WorldEntity[],
    collectibles: Collectible[],
    floatingTexts: FloatingText[],
    rhythmState: RhythmBeatState,
    speedrunDelta: SpeedrunDeltaInfo,
    flashAlpha: number,
    flashColor: string,
    settings: GameSettings,
    projectiles: Projectile[] = [],
    laserBurnMarks: LaserBurnMark[] = [],
    targetLockedEnemy: WorldEntity | null = null,
    camera2D?: Camera2D,
    remotePlayers: Map<string, RemotePlayerState> = new Map(),
    tacticalPings: TacticalPingMessage[] = []
  ) {
    const ctx = this.overlayCtx;
    const dpr = this.renderer.getPixelRatio() || 1;
    const W = this.overlayCanvas.width / dpr;
    const H = this.overlayCanvas.height / dpr;

    // Clear 2D overlay at native pixel resolution
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    // 0. Render 2D Laser Burn Mark Decals & Scorches
    if (camera2D) {
      this.renderLaserBurnMarks2D(ctx, W, H, laserBurnMarks, camera2D);
      // 0.5 Render Thick Heavy Sci-Fi Plasma Laser Beams (Glow sheath & white-hot core)
      this.renderThickPlasmaLasers2D(ctx, W, H, projectiles, camera2D);
    }

    // --- PRO AI EXECUTIONER VIGNETTE & COGNITIVE PRESSURE OVERLAY ---
    const pressure = proCombatAI.cognitivePressureIntensity;
    if (pressure > 0.02 || proCombatAI.executionerModeActive) {
      ctx.save();
      const outerRad = Math.max(W, H) * 0.75;
      const innerRad = Math.max(W, H) * (0.45 - pressure * 0.15);
      const vigGrad = ctx.createRadialGradient(W / 2, H / 2, Math.max(10, innerRad), W / 2, H / 2, outerRad);
      
      if (proCombatAI.executionerModeActive) {
        vigGrad.addColorStop(0, 'rgba(255, 0, 85, 0)');
        vigGrad.addColorStop(0.7, 'rgba(255, 0, 85, 0.25)');
        vigGrad.addColorStop(1.0, 'rgba(255, 0, 85, 0.65)');
      } else {
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(0.75, `rgba(18, 0, 28, ${pressure * 0.35})`);
        vigGrad.addColorStop(1.0, `rgba(255, 0, 85, ${pressure * 0.55})`);
      }

      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);

      // Warning Banner for Executioner Mode (Throbbing Red Alert)
      if (proCombatAI.executionerModeActive) {
        const throb = 0.7 + Math.sin(Date.now() * 0.009) * 0.3;
        ctx.font = '900 13px "Orbitron", monospace';
        ctx.fillStyle = `rgba(255, 0, 85, ${throb})`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 14 * throb;
        ctx.fillText('⚠️ EXECUTIONER PROTOCOL ACTIVE - BREAK DEFENSE NOW!', W / 2, 32);

        // Tech Brackets around alert
        ctx.strokeStyle = `rgba(255, 0, 85, ${throb * 0.8})`;
        ctx.lineWidth = 1.5;
        const bannerW = Math.min(W - 40, 520);
        ctx.strokeRect(W / 2 - bannerW / 2, 14, bannerW, 26);
      }
      ctx.restore();
    }

    // --- AI MEMORY BUFFER PATTERN SPAM WARNING OVERLAY ---
    if (proCombatAI.repeatedMovePunishRate >= 0.75) {
      ctx.save();
      const flashAlpha = 0.5 + Math.sin(Date.now() * 0.012) * 0.5;
      const bannerW = Math.min(W - 40, 480);
      const bannerY = proCombatAI.executionerModeActive ? 50 : 28;

      ctx.fillStyle = `rgba(20, 10, 0, ${0.75 * flashAlpha})`;
      ctx.strokeStyle = `rgba(255, 153, 0, ${flashAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(W / 2 - bannerW / 2, bannerY - 14, bannerW, 24);
      ctx.strokeRect(W / 2 - bannerW / 2, bannerY - 14, bannerW, 24);

      ctx.font = 'bold 11px "Orbitron", monospace';
      ctx.fillStyle = '#FF9900';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FF9900';
      ctx.shadowBlur = 10 * flashAlpha;
      ctx.fillText('⚡ WARNING: AI PREDICTING PATTERN - VARIATE ATTACKS!', W / 2, bannerY + 2);
      ctx.restore();
    }

    // --- DECOY BLINDED GLITCH STATIC EFFECT ---
    if (player.blindedTimer && player.blindedTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 8; i++) {
        const barY = Math.random() * H;
        const barH = 4 + Math.random() * 12;
        ctx.fillRect(0, barY, W, barH);
      }
      ctx.font = 'bold 14px "Orbitron", monospace';
      ctx.fillStyle = '#FF0055';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ SENSORS BLINDED // SMOKE DETONATION', W / 2, H / 2 - 40);
      ctx.restore();
    }

    // --- PARRY HIT-STUN LOCK INDICATOR ---
    if (player.hitStunTimer && player.hitStunTimer > 0) {
      ctx.save();
      ctx.font = 'bold 16px "Orbitron", monospace';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText(`🛡️ PARRY STUNNED [${player.hitStunTimer}F]`, W / 2, H / 2 + 50);
      ctx.restore();
    }

    // 1. Screen Flash FX
    if (flashAlpha > 0.01) {
      ctx.fillStyle = flashColor;
      ctx.globalAlpha = Math.min(flashAlpha, 0.85);
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1.0;
    }

    // 2. Clean Dynamic Enemy Health Bars Floating Above Heads (Real-Time Neon Pink/Red Drain)
    this.renderEnemyHealthBars2D(ctx, W, H, entities);

    // 3. Render Overdrive Speed Lines
    if (player.overdriveTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 229, 0.3)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 16; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H;
        const len = 40 + Math.random() * 90;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(player.angle) * len, sy + Math.sin(player.angle) * len);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Render Visual Rhythm Metronome & Beat Pulser in Center Bottom
    this.renderRhythmMetronome2D(ctx, W, H, rhythmState);

    // 5. Render Speedrun PB Live Delta Badge in Top Right
    if (speedrunDelta.hasGhost) {
      this.renderSpeedrunDeltaBadge2D(ctx, W, H, speedrunDelta);
    }

    // 6. BOTTOMLESS CHASM VOID FALL ALERT & VORTEX DESCENT
    if (player.isFallingIntoAbyss || player.actionState === 'FALLING_INTO_VOID') {
      ctx.save();
      const maxTimer = player.fallingMaxTimer || 75;
      const fallProg = Math.min(1.0, (maxTimer - (player.fallingTimer || 0)) / maxTimer);

      // Deep pitch-black abyss singularity vortex narrowing down
      const vortexGrad = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.max(5, Math.min(W, H) * (0.02 + (1 - fallProg) * 0.15)),
        W / 2,
        H / 2,
        Math.max(W, H) * (0.2 + fallProg * 0.6)
      );
      vortexGrad.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
      vortexGrad.addColorStop(0.35, `rgba(18, 0, 36, ${0.85 * fallProg + 0.1})`);
      vortexGrad.addColorStop(0.7, `rgba(255, 0, 85, ${0.45 * Math.sin(fallProg * Math.PI)})`);
      vortexGrad.addColorStop(1.0, `rgba(0, 0, 0, ${0.94 * fallProg + 0.05})`);
      ctx.fillStyle = vortexGrad;
      ctx.fillRect(0, 0, W, H);

      // Dynamic High-Speed Vertical Wind Tunnel Streaks (Rushing upwards)
      const streakCount = Math.floor(25 + fallProg * 45);
      ctx.lineWidth = 1.5;
      for (let s = 0; s < streakCount; s++) {
        const seed = (s * 137.5 + this.animTick * 60) % 1000;
        const sx = (seed * 19.3) % W;
        const speed = (20 + (s % 15) * 10) * (1 + fallProg * 2.5);
        const sy = H - ((this.animTick * 1200 + s * 45) % (H + 200));
        const len = 30 + fallProg * 120;
        const streakAlpha = (0.2 + (s % 5) * 0.15) * Math.min(1, fallProg * 2);

        const grad = ctx.createLinearGradient(sx, sy, sx, sy - len);
        grad.addColorStop(0, `rgba(255, 0, 85, ${streakAlpha})`);
        grad.addColorStop(0.7, `rgba(0, 255, 209, ${streakAlpha * 0.8})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - len);
        ctx.stroke();
      }

      // Responsive Dynamic Font Scaling for Mobile & Desktop
      const titleFontSize = Math.max(11, Math.min(17, Math.floor(W * 0.034)));
      const subFontSize = Math.max(9, Math.min(12, Math.floor(W * 0.024)));
      const isCompactMobile = W < 500;

      // Holographic Warning Badge Frame
      const boxW = Math.min(W * 0.9, 520);
      const boxH = isCompactMobile ? 54 : 64;
      const boxX = (W - boxW) / 2;
      const boxY = H / 2 - boxH / 2;

      ctx.fillStyle = 'rgba(6, 2, 14, 0.92)';
      ctx.strokeStyle = '#FF0055';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = 18;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Warning text
      ctx.font = `900 ${titleFontSize}px "Orbitron", monospace`;
      ctx.fillStyle = '#FF0055';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = 16;
      const titleText = isCompactMobile
        ? '⚠️ PITFALL DETECTED // FREEFALLING'
        : '⚠️ CRITICAL PITFALL // BOTTOMLESS CHASM COLLAPSE';
      ctx.fillText(titleText, W / 2, boxY + (isCompactMobile ? 20 : 25));

      // Depth telemetry
      const depthVal = player.fallDepthMeters || Math.floor(Math.pow(fallProg, 1.85) * 2600);
      ctx.font = `bold ${subFontSize}px "Orbitron", monospace`;
      ctx.fillStyle = '#00FFD1';
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 10;
      ctx.fillText(`DEPTH: -${depthVal}M // TERMINAL VELOCITY IMMINENT`, W / 2, boxY + (isCompactMobile ? 40 : 48));
      ctx.restore();
    }

    // 7. ATMOSPHERIC ROUNDED VIEWPORT & CURVED CORNER VIGNETTE
    // Generates a soft rounded CRT/anamorphic lens curve and dark peripheral falloff
    ctx.save();
    const cornerRadius = Math.min(36, Math.min(W, H) * 0.05);
    const borderThickness = 6;
    
    // Ambient dark peripheral vignette
    const ambientVig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    ambientVig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    ambientVig.addColorStop(0.7, 'rgba(4, 2, 10, 0.25)');
    ambientVig.addColorStop(1.0, 'rgba(2, 1, 6, 0.72)');
    ctx.fillStyle = ambientVig;
    ctx.fillRect(0, 0, W, H);

    // Rounded outer screen border with high-tech corner brackets
    ctx.strokeStyle = 'rgba(0, 255, 209, 0.16)';
    ctx.lineWidth = borderThickness;
    ctx.beginPath();
    ctx.roundRect(borderThickness / 2, borderThickness / 2, W - borderThickness, H - borderThickness, cornerRadius);
    ctx.stroke();

    // Curved Corner Tech Accents
    const bracketLen = 28;
    ctx.strokeStyle = '#00FFD1';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 6;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(12, 12 + bracketLen);
    ctx.lineTo(12, 12);
    ctx.lineTo(12 + bracketLen, 12);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(W - 12 - bracketLen, 12);
    ctx.lineTo(W - 12, 12);
    ctx.lineTo(W - 12, 12 + bracketLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(12, H - 12 - bracketLen);
    ctx.lineTo(12, H - 12);
    ctx.lineTo(12 + bracketLen, H - 12);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(W - 12 - bracketLen, H - 12);
    ctx.lineTo(W - 12, H - 12);
    ctx.lineTo(W - 12, H - 12 - bracketLen);
    ctx.stroke();

    // Dynamic Responsive Cyberpunk Crosshair / Reticle at exact center of screen
    this.renderDynamicCrosshair2D(ctx, W, H, targetLockedEnemy, entities, player);

    // Render Multiplayer Remote Player Hologram Badges & Tactical Pings
    this.renderRemotePlayerHUD(ctx, W, H, remotePlayers, tacticalPings);

    ctx.restore();

    // Complete CSS scaling block
    ctx.restore();
  }

  // --- MULTIPLAYER SQUAD HUD & TACTICAL PING OVERLAYS ---
  private renderRemotePlayerHUD(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    remotePlayers: Map<string, RemotePlayerState>,
    tacticalPings: TacticalPingMessage[] = []
  ) {
    if (remotePlayers.size === 0 && tacticalPings.length === 0) return;

    // 1. Render Remote Teammate Name & HP Hologram Bar
    for (const remote of remotePlayers.values()) {
      const pos3D = new THREE.Vector3(
        remote.x * this.WORLD_SCALE,
        36,
        remote.y * this.WORLD_SCALE
      );
      pos3D.project(this.camera);

      // Skip if behind camera lens
      if (pos3D.z > 1.0) continue;

      const sx = ((pos3D.x + 1) * 0.5) * W;
      const sy = ((-pos3D.y + 1) * 0.5) * H;

      // Skip if off screen
      if (sx < -60 || sx > W + 60 || sy < -40 || sy > H + 40) continue;

      ctx.save();
      const boxW = 88;
      const boxH = 24;
      const boxX = sx - boxW / 2;
      const boxY = sy - 34;

      // Hologram Glass Background
      ctx.fillStyle = 'rgba(4, 8, 20, 0.85)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      const hue = remote.characterHue ?? 140;
      ctx.strokeStyle = `hsl(${hue}, 100%, 55%)`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Teammate Call-Sign
      ctx.font = 'bold 9px "Orbitron", monospace';
      ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
      ctx.textAlign = 'center';
      ctx.fillText(remote.name.toUpperCase(), sx, boxY + 10);

      // Mini Health Bar
      const barW = boxW - 8;
      const barH = 3.5;
      const barX = boxX + 4;
      const barY = boxY + 14;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(barX, barY, barW, barH);

      const hpRatio = Math.max(0, Math.min(1, remote.health / (remote.maxHealth || 100)));
      ctx.fillStyle = hpRatio > 0.4 ? '#00FF66' : '#FF0055';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
      ctx.restore();
    }

    // 2. Render Tactical Pings
    const now = Date.now();
    for (let i = tacticalPings.length - 1; i >= 0; i--) {
      const ping = tacticalPings[i];
      const age = now - ping.timestamp;
      if (age > 6000) continue; // expires after 6s

      const pos3D = new THREE.Vector3(
        ping.x * this.WORLD_SCALE,
        15,
        ping.y * this.WORLD_SCALE
      );
      pos3D.project(this.camera);
      if (pos3D.z > 1.0) continue;

      const sx = ((pos3D.x + 1) * 0.5) * W;
      const sy = ((-pos3D.y + 1) * 0.5) * H;

      const pulse = 10 + Math.sin(age * 0.012) * 5;
      ctx.save();
      ctx.strokeStyle = ping.category === 'DANGER' ? '#FF0055' : '#00FFD1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '900 10px "Orbitron", monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = ping.category === 'DANGER' ? '#FF0055' : '#00FFD1';
      ctx.shadowBlur = 10;
      ctx.fillText(`[${ping.senderName}] ${ping.text}`, sx, sy - 16);
      ctx.restore();
    }
  }

  private renderRadarMinimap2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    _H: number,
    player: Player,
    entities: WorldEntity[],
    collectibles: Collectible[]
  ) {
    const mapSize = Math.min(104, Math.max(88, W * 0.12));
    const mapX = 16;
    const mapY = 16;
    const centerX = mapX + mapSize / 2;
    const centerY = mapY + mapSize / 2;
    const radius = mapSize / 2;

    ctx.save();

    // 1. Radar Circular Backing & Outer Glow
    ctx.fillStyle = 'rgba(6, 3, 18, 0.92)';
    ctx.strokeStyle = '#00FFD1';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Concentric Range Rings & Crosshairs
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 255, 209, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, radius * 0.78, 0, Math.PI * 2);
    // Crosshair axes
    ctx.moveTo(centerX - radius + 4, centerY);
    ctx.lineTo(centerX + radius - 4, centerY);
    ctx.moveTo(centerX, centerY - radius + 4);
    ctx.lineTo(centerX, centerY + radius - 4);
    ctx.stroke();

    // 3. Cardinal Compass Ticks (N, S, E, W)
    ctx.font = 'bold 8px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF00E5';
    ctx.fillText('N', centerX, centerY - radius + 9);
    ctx.fillStyle = 'rgba(0, 255, 209, 0.7)';
    ctx.fillText('S', centerX, centerY + radius - 8);
    ctx.fillText('W', centerX - radius + 8, centerY);
    ctx.fillText('E', centerX + radius - 8, centerY);

    // 4. Animated Sweeper Beam with Gradient Trail
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

    // Sweeper trail arc
    const trailGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    trailGrad.addColorStop(0, 'rgba(0, 255, 209, 0.25)');
    trailGrad.addColorStop(1, 'rgba(0, 255, 209, 0.02)');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius - 2, radarAngle - 0.5, radarAngle);
    ctx.closePath();
    ctx.fill();

    // 5. Dynamic Entities & Enemy Blips on Radar
    const radarScale = 0.045;
    for (const ent of entities) {
      if (!ent.active) continue;
      const relX = (ent.position.x - player.position.x) * radarScale;
      const relY = (ent.position.y - player.position.y) * radarScale;
      const distFromCenter = Math.hypot(relX, relY);

      if (distFromCenter < radius - 4) {
        const px = centerX + relX;
        const py = centerY + relY;

        if (ent.type === 'CYBER_EXIT_PORTAL') {
          // Exit Portal
          ctx.fillStyle = '#00FF66';
          ctx.shadowColor = '#00FF66';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.type === 'MUTATED_BACTERIA' && ent.bacteriaData) {
          const bac = ent.bacteriaData;

          // 5a. Surrendered Enemy (White pip)
          if (bac.surrendered || bac.state === 'SURRENDER') {
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#00FFD1';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          // 5b. Apex Boss Organism (Large Pulsing Red Star)
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
          // 5c. Mission Target Elite (Gold/Amber Diamond)
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
          // 5d. Stealth Stalker (Electric Violet)
          else if (bac.variant === 'STEALTH_STALKER') {
            ctx.fillStyle = '#9D00FF';
            ctx.shadowColor = '#9D00FF';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          // 5e. Standard / Variant Enemies
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
          // Data Terminals
          ctx.fillStyle = '#00FF66';
          ctx.fillRect(px - 2, py - 2, 4, 4);
        }
      }
    }

    // 6. Encrypted Bio-Cores on Radar (Pulsing Cyan Diamonds)
    for (const item of collectibles) {
      if (item.collected || item.type !== 'ENCRYPTED_BIO_CORE') continue;
      const relX = (item.position.x - player.position.x) * radarScale;
      const relY = (item.position.y - player.position.y) * radarScale;
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

    // 7. Player Pip at Center with Direction Needle
    ctx.fillStyle = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Facing direction pointer
    const facingAngle = player.angle !== undefined ? player.angle : (player.facingDirection === 'RIGHT' ? 0 : Math.PI);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(facingAngle) * 8, centerY + Math.sin(facingAngle) * 8);
    ctx.stroke();

    // 8. Radar Header Telemetry Tag
    ctx.fillStyle = 'rgba(0, 255, 209, 0.85)';
    ctx.font = '900 7px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR // 360°', centerX, mapY - 4);

    ctx.restore();
  }

  // --- DYNAMIC ENEMY HEALTH BARS FLOATING DIRECTLY ABOVE HEADS ---
  private renderEnemyHealthBars2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    entities: WorldEntity[]
  ) {
    const activeEnemyIds = new Set<string>();

    for (const ent of entities) {
      if (!ent.active || ent.type !== 'MUTATED_BACTERIA' || !ent.bacteriaData) continue;
      const b = ent.bacteriaData;
      if (b.health <= 0) continue;

      activeEnemyIds.add(b.id);

      // Track smooth animated health transitions
      let anim = this.enemyHealthAnimMap.get(b.id);
      if (!anim) {
        anim = {
          currentDisplayHp: b.health,
          ghostHp: b.health,
          ghostTimer: 0,
          lastHp: b.health,
          lastHitTime: 0,
        };
        this.enemyHealthAnimMap.set(b.id, anim);
      }

      // Check if enemy took damage this frame
      if (b.health < anim.lastHp) {
        anim.ghostTimer = 16;
        anim.lastHitTime = performance.now();
        anim.lastHp = b.health;
      } else if (b.health > anim.lastHp) {
        anim.lastHp = b.health;
        anim.ghostHp = b.health;
        anim.currentDisplayHp = b.health;
      }

      // Smooth health drain interpolation
      anim.currentDisplayHp += (b.health - anim.currentDisplayHp) * 0.35;
      if (anim.ghostTimer > 0) {
        anim.ghostTimer--;
      } else {
        anim.ghostHp += (b.health - anim.ghostHp) * 0.12;
      }

      // Calculate 3D World position floating directly above enemy head
      const rad = Math.max(16, b.radius || 20);
      const headY = rad * 1.55 + 16;
      const v3 = new THREE.Vector3(b.position.x, headY, b.position.y);
      v3.project(this.camera);

      // Ensure enemy is in front of camera
      if (v3.z >= 1.0) continue;

      // Screen Coordinates
      const sx = ((v3.x + 1) * W) / 2;
      const sy = ((-v3.y + 1) * H) / 2;

      // Offscreen culling
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue;

      // Size calculation based on enemy archetype
      const maxHp = Math.max(1, b.maxHealth || 100);
      const hpRatio = Math.max(0, Math.min(1, anim.currentDisplayHp / maxHp));
      const ghostRatio = Math.max(0, Math.min(1, anim.ghostHp / maxHp));

      const isBoss = b.variant === 'APEX_BOSS';
      const isElite = b.variant === 'MISSION_TARGET_ELITE' || b.variant === 'CYBER_BRUTE';

      const barW = isBoss ? 76 : isElite ? 58 : 46;
      const barH = isBoss ? 7 : isElite ? 6 : 5;

      const halfW = barW / 2;
      const barX = sx - halfW;
      const barY = sy - barH / 2;

      ctx.save();

      // 1. Dark Background Frame & Border (Clean, high contrast dark frame)
      ctx.fillStyle = 'rgba(6, 10, 18, 0.92)';
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.98)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(255, 0, 85, 0.3)';
      ctx.shadowBlur = 4;

      const radius = 2.5;
      ctx.beginPath();
      ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, radius + 1);
      ctx.fill();
      ctx.stroke();

      // Inner background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, radius);
      ctx.fill();

      // 2. Ghost Damage Catch-Up Bar (Delayed white/pink drain)
      if (ghostRatio > hpRatio) {
        const ghostW = Math.max(0, barW * ghostRatio);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, ghostW, barH, radius);
        ctx.fill();
      }

      // 3. Bright Neon Pink / Red Real-time Health Fill
      if (hpRatio > 0.001) {
        const fillW = Math.max(2, barW * hpRatio);
        const hpGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
        
        if (isBoss) {
          hpGrad.addColorStop(0, '#FF0055');
          hpGrad.addColorStop(0.5, '#FF1744');
          hpGrad.addColorStop(1, '#FF5252');
        } else {
          hpGrad.addColorStop(0, '#FF0055');
          hpGrad.addColorStop(1, '#FF2A6D');
        }

        ctx.fillStyle = hpGrad;
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, radius);
        ctx.fill();

        // 4. Subtle Specular Highlight Stripe across top half
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(barX + 1, barY + 0.5, fillW - 2, Math.max(1, (barH - 2) * 0.4));

        // 5. Damage Impact Edge Flash (when recently hit)
        if (b.hitStaggerTimer > 0 || performance.now() - anim.lastHitTime < 120) {
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 10;
          ctx.fillRect(barX + fillW - 2.5, barY - 0.5, 3.5, barH + 1);
        }
      }

      // 6. Boss / Elite Minimal Indicator Header (Clean, 0 clutter)
      if (isBoss || isElite) {
        ctx.font = 'bold 9px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isBoss ? '#FF0055' : '#FFAA00';
        ctx.shadowColor = isBoss ? '#FF0055' : '#FFAA00';
        ctx.shadowBlur = 6;
        const tag = isBoss ? '👑 APEX LORD' : '★ ELITE';
        ctx.fillText(tag, sx, barY - 4);
      }

      ctx.restore();
    }

    // Clean up inactive health anim entries
    for (const id of this.enemyHealthAnimMap.keys()) {
      if (!activeEnemyIds.has(id)) {
        this.enemyHealthAnimMap.delete(id);
      }
    }
  }

  /** Sleek, responsive cyberpunk neon reticle at screen center with target-lock tracking */
  private renderDynamicCrosshair2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    targetLockedEnemy: WorldEntity | null,
    entities: WorldEntity[],
    player: Player
  ) {
    const cx = W / 2;
    const cy = H / 2;
    const isLocked = !!(
      targetLockedEnemy &&
      targetLockedEnemy.bacteriaData &&
      targetLockedEnemy.bacteriaData.health > 0
    );

    const primaryColor = isLocked ? '#FF0055' : '#00FFD1';
    const secondaryColor = isLocked ? '#FF3366' : '#88FFFF';
    const coreColor = '#FFFFFF';
    const recoilExpand = (player.shootTimer > 0 || (player.muzzleFlashTimer && player.muzzleFlashTimer > 0)) ? 6 : 0;
    const baseR = isLocked ? 22 + recoilExpand : 26 + recoilExpand;
    const animPulse = Math.sin(Date.now() * 0.008) * (isLocked ? 2.5 : 1.2);
    const r = baseR + animPulse;

    ctx.save();

    // 1. Target Tracking Guideline & Target Box if Locked
    if (isLocked && targetLockedEnemy) {
      const v3 = new THREE.Vector3(
        targetLockedEnemy.position.x * this.WORLD_SCALE,
        18,
        targetLockedEnemy.position.y * this.WORLD_SCALE
      );
      v3.project(this.camera);

      if (v3.z < 1.0) {
        const ex = ((v3.x + 1) * W) / 2;
        const ey = ((-v3.y + 1) * H) / 2;

        ctx.save();
        // Laser trajectory dotted targeting beam
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.55)';
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // High-Tech Target Diamond Frame on enemy
        ctx.setLineDash([]);
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2.0;
        const dSize = 20 + Math.sin(Date.now() * 0.012) * 3;
        ctx.beginPath();
        ctx.moveTo(ex, ey - dSize);
        ctx.lineTo(ex + dSize, ey);
        ctx.lineTo(ex, ey + dSize);
        ctx.lineTo(ex - dSize, ey);
        ctx.closePath();
        ctx.stroke();

        // Corner tick marks
        const tickL = 6;
        ctx.beginPath();
        ctx.moveTo(ex - dSize - tickL, ey);
        ctx.lineTo(ex - dSize, ey);
        ctx.moveTo(ex + dSize, ey);
        ctx.lineTo(ex + dSize + tickL, ey);
        ctx.moveTo(ex, ey - dSize - tickL);
        ctx.lineTo(ex, ey - dSize);
        ctx.moveTo(ex, ey + dSize);
        ctx.lineTo(ex, ey + dSize + tickL);
        ctx.stroke();

        // Distance & Target Name Header
        const dist = Math.round(
          Math.hypot(
            targetLockedEnemy.position.x - player.position.x,
            targetLockedEnemy.position.y - player.position.y
          ) * 0.1
        );
        ctx.font = 'bold 9px "Orbitron", monospace';
        ctx.fillStyle = '#FF0055';
        ctx.textAlign = 'center';
        ctx.fillText(`TARGET LOCKED // ${dist}m`, ex, ey - dSize - 8);
        ctx.restore();
      }
    }

    // 2. Center Precision Pip (White-hot core with neon ring)
    ctx.fillStyle = coreColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Four Futuristic Cyberpunk Corner Chevron Brackets [   ]
    ctx.strokeStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = isLocked ? 14 : 9;
    ctx.lineWidth = 2.0;

    const cornerLen = 8;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r + cornerLen);
    ctx.lineTo(cx - r, cy - r);
    ctx.lineTo(cx - r + cornerLen, cy - r);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(cx + r - cornerLen, cy - r);
    ctx.lineTo(cx + r, cy - r);
    ctx.lineTo(cx + r, cy - r + cornerLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r - cornerLen);
    ctx.lineTo(cx - r, cy + r);
    ctx.lineTo(cx - r + cornerLen, cy + r);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(cx + r - cornerLen, cy + r);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx + r, cy + r - cornerLen);
    ctx.stroke();

    // 4. Cardinal Precision Reticle Ticks
    const tickInner = r - 4;
    const tickOuter = r + 8;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = secondaryColor;

    // Top tick
    ctx.beginPath();
    ctx.moveTo(cx, cy - tickInner);
    ctx.lineTo(cx, cy - tickOuter);
    ctx.stroke();

    // Bottom tick
    ctx.beginPath();
    ctx.moveTo(cx, cy + tickInner);
    ctx.lineTo(cx, cy + tickOuter);
    ctx.stroke();

    // Left tick
    ctx.beginPath();
    ctx.moveTo(cx - tickInner, cy);
    ctx.lineTo(cx - tickOuter, cy);
    ctx.stroke();

    // Right tick
    ctx.beginPath();
    ctx.moveTo(cx + tickInner, cy);
    ctx.lineTo(cx + tickOuter, cy);
    ctx.stroke();

    // 5. Segmented Rotating Outer Tech Arc
    const rotSpeed = Date.now() * 0.0018;
    ctx.strokeStyle = isLocked ? 'rgba(255, 0, 85, 0.4)' : 'rgba(0, 255, 209, 0.35)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 12, rotSpeed, rotSpeed + Math.PI * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 12, rotSpeed + Math.PI, rotSpeed + Math.PI * 1.4);
    ctx.stroke();

    // 6. Tactical Telemetry Status Label
    ctx.font = 'bold 8px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryColor;
    ctx.shadowBlur = isLocked ? 10 : 6;
    if (isLocked) {
      const lockPulse = Math.sin(Date.now() * 0.015) > 0 ? '▶ LOCK ACQUIRED ◀' : '▷ LOCK ACQUIRED ◁';
      ctx.fillText(lockPulse, cx, cy + r + 22);
    } else {
      ctx.fillStyle = 'rgba(0, 255, 209, 0.75)';
      ctx.fillText('SYS.READY // AUTO-AIM', cx, cy + r + 20);
    }

    ctx.restore();
  }

  /** Render thick heavy sci-fi plasma laser beams with intense luminous neon bloom on 2D overlay */
  private renderThickPlasmaLasers2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    projectiles: Projectile[],
    camera: Camera2D
  ) {
    if (!projectiles || projectiles.length === 0) return;

    ctx.save();
    for (const bolt of projectiles) {
      const v3 = new THREE.Vector3(bolt.position.x * this.WORLD_SCALE, 16, bolt.position.y * this.WORLD_SCALE);
      v3.project(this.camera);
      if (v3.z >= 1.0) continue;

      const sx = ((v3.x + 1) * W) / 2;
      const sy = ((-v3.y + 1) * H) / 2;
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue;

      const spd = Math.hypot(bolt.velocity.x, bolt.velocity.y);
      if (spd === 0) continue;

      // Project trail back direction
      const v3Prev = new THREE.Vector3(
        (bolt.position.x - bolt.velocity.x * 2.2) * this.WORLD_SCALE,
        16,
        (bolt.position.y - bolt.velocity.y * 2.2) * this.WORLD_SCALE
      );
      v3Prev.project(this.camera);
      const tailX = ((v3Prev.x + 1) * W) / 2;
      const tailY = ((-v3Prev.y + 1) * H) / 2;

      const isCrit = !!bolt.isCriticalFinisher;
      const color = bolt.color;

      // Pass 1: Wide Volumetric Ambient Bloom (Intense neon pink or cyan glow)
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isCrit ? 36 : 24;
      ctx.lineWidth = isCrit ? 22 : 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Pass 2: High-Density Luminous Plasma Sheath
      ctx.strokeStyle = color === '#FF00E5' ? '#FF66F0' : color === '#FFD700' ? '#FFEE55' : '#88FFFF';
      ctx.shadowBlur = isCrit ? 18 : 12;
      ctx.lineWidth = isCrit ? 12 : 7;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Pass 3: White-Hot Superheated Laser Core
      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 6;
      ctx.lineWidth = isCrit ? 4.5 : 3;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Plasma Head Shockwave Cap
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sx, sy, isCrit ? 6.5 : 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Micro Electric Arcs
      for (let a = 0; a < 2; a++) {
        const offset = (Math.random() - 0.5) * 8;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(tailX + offset, tailY + offset);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Render persistent glowing laser burn marks and scorch marks on surfaces */
  private renderLaserBurnMarks2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    burns: LaserBurnMark[],
    camera: Camera2D
  ) {
    if (!burns || burns.length === 0) return;

    ctx.save();
    for (const mark of burns) {
      const v3 = new THREE.Vector3(mark.x * this.WORLD_SCALE, mark.surface === 'WALL' ? 14 : 0.5, mark.y * this.WORLD_SCALE);
      v3.project(this.camera);
      if (v3.z >= 1.0) continue;

      const sx = ((v3.x + 1) * W) / 2;
      const sy = ((-v3.y + 1) * H) / 2;
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1.0, mark.alpha));

      // 1. Radiating Molten Fractures / Spokes
      ctx.strokeStyle = mark.color;
      ctx.shadowColor = mark.color;
      ctx.shadowBlur = 10;
      for (const spoke of mark.spokes) {
        ctx.lineWidth = spoke.width;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(
          sx + Math.cos(spoke.angle) * spoke.length,
          sy + Math.sin(spoke.angle) * spoke.length
        );
        ctx.stroke();
      }

      // 2. Charred Outer Perimeter
      ctx.fillStyle = 'rgba(6, 10, 18, 0.75)';
      ctx.beginPath();
      ctx.arc(sx, sy, mark.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // 3. Molten Glowing Core
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, mark.radius * 0.65);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.35, mark.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = mark.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sx, sy, mark.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  private renderRhythmMetronome2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    beat: RhythmBeatState
  ) {
    const isNear = beat.isNearBeat;
    ctx.save();

    const barWidth = Math.min(Math.max(W * 0.35, 180), 240);
    const barHeight = 15;
    const cx = W / 2;
    const cy = H - Math.max(38, H * 0.08);

    ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
    ctx.strokeStyle = isNear ? '#00FFD1' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = isNear ? 2 : 1;
    ctx.shadowColor = isNear ? '#00FFD1' : 'transparent';
    ctx.shadowBlur = isNear ? 12 : 0;
    ctx.beginPath();
    ctx.roundRect(cx - barWidth / 2, cy - barHeight / 2, barWidth, barHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Center Hit Zone
    ctx.fillStyle = isNear ? 'rgba(0, 255, 209, 0.45)' : 'rgba(255, 0, 229, 0.25)';
    ctx.fillRect(cx - 24, cy - barHeight / 2 + 2, 48, barHeight - 4);

    // Converging Beat Target Pointers
    const phaseOffset = (1 - beat.beatPhase) * (barWidth / 2);
    ctx.fillStyle = isNear ? '#00FFD1' : '#FF00E5';
    ctx.shadowColor = isNear ? '#00FFD1' : '#FF00E5';
    ctx.shadowBlur = 8;
    ctx.fillRect(cx - phaseOffset - 3, cy - barHeight / 2 + 1, 6, barHeight - 2);
    ctx.fillRect(cx + phaseOffset - 3, cy - barHeight / 2 + 1, 6, barHeight - 2);

    // Center Gold Line
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(cx - 1.5, cy - barHeight / 2 - 2, 3, barHeight + 4);

    // Label
    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isNear ? '#00FFD1' : 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = isNear ? 6 : 0;
    const streakStr = beat.streak > 0 ? ` [STREAK x${beat.streak}]` : '';
    ctx.fillText(`⚡ SYNTHWAVE BEAT SYNC (${beat.bpm} BPM)${streakStr}`, cx, cy - 12);

    ctx.restore();
  }

  private renderSpeedrunDeltaBadge2D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    delta: SpeedrunDeltaInfo
  ) {
    ctx.save();
    const x = Math.min(W - 75, W * 0.85);
    const y = Math.max(76, H * 0.12);

    const isAhead = delta.status === 'AHEAD';
    const borderColor = isAhead ? '#00FF66' : delta.status === 'BEHIND' ? '#FF0055' : '#00FFD1';

    ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
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

  public resize(width: number, height: number, dpr: number) {
    const isPortrait = height > width;
    const isMobile =
      this.isMobileDevice ||
      Math.min(width, height) < 600 ||
      width < 900 ||
      ('ontouchstart' in window);
    // Mobile Performance Optimization: Clamp DPR to 1.0 on mobile for 60+ FPS without thermal throttling
    const clampedDpr = isMobile ? Math.min(dpr || 1, 1.0) : Math.min(dpr || 1, 1.5);

    this.renderer.setPixelRatio(clampedDpr);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width * clampedDpr, height * clampedDpr);

    // Fast hardware shadow mapping on mobile for fluid performance
    if (isMobile) {
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    } else {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    const aspect = width / height;
    this.camera.aspect = aspect;

    // Natural human perspective FOV (58° portrait, 60° landscape)
    // Never balloon FOV to 138° which caused fish-eye distortion and graphics overflow
    this.baseAdaptiveFov = isPortrait ? 58 : isMobile ? 60 : 58;
    this.camera.fov = this.baseAdaptiveFov;
    this.camera.updateProjectionMatrix();

    this.overlayCanvas.width = Math.floor(width * dpr);
    this.overlayCanvas.height = Math.floor(height * dpr);
    this.overlayCanvas.style.width = '100%';
    this.overlayCanvas.style.height = '100%';
    this.overlayCanvas.style.position = 'fixed';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none';
  }
}
