import {
  Vector2D,
  BoundingBox,
  CollisionSide,
  CollisionResult,
  LaserHazard,
  LaserState,
  AlleywayDecor,
  CyberObstacle,
  GridMapChunk,
  WorldEntity,
  Collectible,
  Tile,
  TileType,
  CyberEnvironmentProp,
  CyberTreeBranch,
  StageDefinition,
  BiomeType,
  EnemyBacteria,
  BacteriaVariant,
} from './types';

export const STAGE_CONFIGS: Record<number, StageDefinition> = {
  1: {
    stageNumber: 1,
    name: 'NEO-DOWNTOWN',
    sectorName: 'NEO-DOWNTOWN',
    subtitle: 'SECTOR 01: COMMERCIAL MAINFRAME',
    biome: 'DOWNTOWN',
    enemyBaseHealth: 80,
    enemyDamage: 10,
    enemySpeedMultiplier: 1.0,
    bacteriaDensity: 1.0,
    hazardDensity: 0.8,
    stageBonusGold: 1000,
    requiredBioCores: 3,
    requiredMissionTargets: 2,
    isBossStage: false,
  },
  2: {
    stageNumber: 2,
    name: 'NEON SLUMS',
    sectorName: 'NEON SLUMS',
    subtitle: 'SECTOR 02: CONTAMINATED BIO-DISTRICT',
    biome: 'NEON_DISTRICT',
    enemyBaseHealth: 130,
    enemyDamage: 16,
    enemySpeedMultiplier: 1.25,
    bacteriaDensity: 1.5,
    hazardDensity: 1.1,
    stageBonusGold: 2000,
    requiredBioCores: 3,
    requiredMissionTargets: 2,
    isBossStage: false,
  },
  3: {
    stageNumber: 3,
    name: 'INDUSTRIAL REFINERY',
    sectorName: 'INDUSTRIAL REFINERY',
    subtitle: 'SECTOR 03: TOXIN CONDUIT COMPLEX',
    biome: 'INDUSTRIAL',
    enemyBaseHealth: 190,
    enemyDamage: 22,
    enemySpeedMultiplier: 1.45,
    bacteriaDensity: 1.9,
    hazardDensity: 1.4,
    stageBonusGold: 3500,
    requiredBioCores: 3,
    requiredMissionTargets: 3,
    isBossStage: false,
  },
  4: {
    stageNumber: 4,
    name: 'QUANTUM BIO-LABS',
    sectorName: 'QUANTUM BIO-LABS',
    subtitle: 'SECTOR 04: GENETIC SYNTHESIS VAULT',
    biome: 'BIO_LAB',
    enemyBaseHealth: 260,
    enemyDamage: 30,
    enemySpeedMultiplier: 1.65,
    bacteriaDensity: 2.3,
    hazardDensity: 1.7,
    stageBonusGold: 5500,
    requiredBioCores: 3,
    requiredMissionTargets: 3,
    isBossStage: false,
  },
  5: {
    stageNumber: 5,
    name: 'TECH-CORE CITADEL',
    sectorName: 'TECH-CORE CITADEL',
    subtitle: 'FINAL SECTOR: APEX CYBER-LORD TITAN',
    biome: 'TECH_CORE',
    enemyBaseHealth: 350,
    enemyDamage: 40,
    enemySpeedMultiplier: 1.85,
    bacteriaDensity: 2.8,
    hazardDensity: 2.0,
    stageBonusGold: 10000,
    requiredBioCores: 3,
    requiredMissionTargets: 3,
    isBossStage: true,
  },
};

export function getStageConfig(stageNumber: number): StageDefinition {
  if (STAGE_CONFIGS[stageNumber]) {
    return STAGE_CONFIGS[stageNumber];
  }
  // Dynamic formula for endless stages beyond 5
  const biomes: BiomeType[] = ['DOWNTOWN', 'NEON_DISTRICT', 'INDUSTRIAL', 'BIO_LAB', 'TECH_CORE'];
  const biome = biomes[(stageNumber - 1) % biomes.length];
  const mult = 1 + (stageNumber - 1) * 0.3;
  return {
    stageNumber,
    name: `OVERDRIVE SECTOR ${stageNumber.toString().padStart(2, '0')}`,
    sectorName: `OVERDRIVE SECTOR ${stageNumber.toString().padStart(2, '0')}`,
    subtitle: `DEEP CORRUPTION TIER ${stageNumber}`,
    biome,
    enemyBaseHealth: Math.round(80 * mult),
    enemyDamage: Math.round(10 * mult),
    enemySpeedMultiplier: Math.min(2.4, 1.0 + (stageNumber - 1) * 0.18),
    bacteriaDensity: Math.min(3.5, 1.0 + (stageNumber - 1) * 0.35),
    hazardDensity: Math.min(2.5, 0.8 + (stageNumber - 1) * 0.25),
    stageBonusGold: 1000 * stageNumber,
    requiredBioCores: 3,
    requiredMissionTargets: 3,
    isBossStage: stageNumber % 5 === 0,
  };
}

/**
 * Generate Procedural Cyber Tree Branches & Leaf Nodes
 */
function generateCyberTreeBranches(height: number, seed: number): CyberTreeBranch[] {
  const branches: CyberTreeBranch[] = [];
  const trunkH = height * 0.45;

  // Main Trunk
  branches.push({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: -trunkH,
    depth: 0,
    angle: -Math.PI / 2,
    length: trunkH,
    leafNodes: [],
  });

  // Lateral Digital Branches
  const branchCount = 3 + (Math.floor(seed * 3) % 2);
  const angles = [-0.52, -0.12, 0.22, 0.55];

  for (let b = 0; b < branchCount; b++) {
    const angle = -Math.PI / 2 + (angles[b % angles.length] || 0);
    const len = height * (0.36 + (b % 2) * 0.12);
    const endX = Math.cos(angle) * len;
    const endY = -trunkH + Math.sin(angle) * len;

    const leaves = [];
    const leafCount = 4 + (b % 3);
    for (let l = 0; l < leafCount; l++) {
      leaves.push({
        x: Math.sin(seed * 11.3 + b * 4.7 + l) * 18,
        y: Math.cos(seed * 11.3 + b * 4.7 + l) * 18,
        size: 5 + (l % 3) * 2,
        phase: (l * Math.PI) / 3,
      });
    }

    branches.push({
      startX: 0,
      startY: -trunkH,
      endX,
      endY,
      depth: 1,
      angle,
      length: len,
      leafNodes: leaves,
    });
  }

  return branches;
}

/**
 * Generic High-Performance Object Pool
 * Eliminates GC pressure and runtime allocation during continuous 2D exploration
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, resetFn?: (item: T) => void, initialCapacity: number = 30) {
    this.factory = factory;
    this.resetFn = resetFn;
    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push(this.factory());
    }
  }

  public acquire(): T {
    const item = this.pool.length > 0 ? this.pool.pop()! : this.factory();
    if (this.resetFn) this.resetFn(item);
    return item;
  }

  public release(item: T) {
    if (this.resetFn) this.resetFn(item);
    this.pool.push(item);
  }

  public releaseAll(items: T[]) {
    for (const item of items) {
      this.release(item);
    }
  }

  public get size(): number {
    return this.pool.length;
  }
}

/**
 * 2D Infinite Map Procedural Generator & World Manager
 * Manages 1000x1000px chunk grid, dynamic spawning/despawning, object pooling,
 * neon alleyways, hacking terminals, pulsing lasers, and 4-sided AABB collision physics.
 */
export class ProceduralMapManager {
  // World Grid Configuration: 1000x1000px per chunk
  public readonly CHUNK_PIXEL_SIZE: number = 1000;
  public readonly CHUNK_TILE_COUNT: number = 20; // 20x20 tiles
  public readonly TILE_SIZE: number = 50; // 50px per tile (20 * 50 = 1000px)

  // Dynamic Spawning / Despawning Boundaries
  public readonly SPAWN_RADIUS: number = 2; // Active 5x5 chunks around player
  public readonly DESPAWN_RADIUS: number = 3; // Despawn chunks beyond 3 chunk distances (7x7)

  // Stage Progression State
  public currentStage: number = 1;
  public currentStageConfig: StageDefinition = getStageConfig(1);

  // Chunk Registry
  private loadedChunks: Map<string, GridMapChunk> = new Map();
  private discoveredChunkKeys: Set<string> = new Set();

  // Object Pools
  public obstaclePool: ObjectPool<CyberObstacle>;
  public laserPool: ObjectPool<LaserHazard>;
  public terminalPool: ObjectPool<WorldEntity>;
  public collectiblePool: ObjectPool<Collectible>;
  public decorPool: ObjectPool<AlleywayDecor>;
  public propPool: ObjectPool<CyberEnvironmentProp>;

  // Global active entities synced with engine
  public activeObstacles: CyberObstacle[] = [];
  public activeLasers: LaserHazard[] = [];
  public activeTerminals: WorldEntity[] = [];
  public activeDecor: AlleywayDecor[] = [];
  public activeProps: CyberEnvironmentProp[] = [];
  public activeCollectibles: Collectible[] = [];

  private idCounter: number = 0;

  constructor() {
    this.currentStageConfig = getStageConfig(this.currentStage);
    // 1. Cyber Obstacle Pool
    this.obstaclePool = new ObjectPool<CyberObstacle>(
      () => ({
        id: '',
        chunkKey: '',
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        color: '#161224',
        glowColor: '#00FFD1',
        elevation: 45,
        hasNeonTrim: true,
        active: false,
      }),
      (obs) => {
        obs.active = false;
        obs.chunkKey = '';
      },
      80
    );

    // 2. Laser Hazard Pool
    this.laserPool = new ObjectPool<LaserHazard>(
      () => ({
        id: '',
        chunkKey: '',
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        orientation: 'HORIZONTAL',
        state: 'OFF',
        cycleTimer: 0,
        chargeTime: 45,
        fireTime: 90,
        offTime: 75,
        color: '#FF0055',
        damage: 25,
        active: false,
        disabled: false,
        rotationAngle: 0,
        rotationSpeed: 0,
      }),
      (laser) => {
        laser.active = false;
        laser.disabled = false;
        laser.cycleTimer = 0;
        laser.state = 'OFF';
      },
      40
    );

    // 3. Hacking Terminal / Drone Pool
    this.terminalPool = new ObjectPool<WorldEntity>(
      () => ({
        id: '',
        type: 'DATA_TERMINAL',
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        radius: 28,
        angle: 0,
        active: false,
        glowColor: '#00FF66',
        interactionPrompt: '[E / HACK] BREACH TERMINAL',
        dataReward: 400,
        health: 100,
      }),
      (ent) => {
        ent.active = false;
      },
      30
    );

    // 4. Collectible Pool
    this.collectiblePool = new ObjectPool<Collectible>(
      () => ({
        id: 0,
        type: 'DATA_CHIP',
        position: { x: 0, y: 0 },
        radius: 16,
        collected: false,
        glowColor: '#00FFD1',
        animTimer: 0,
        points: 100,
      }),
      (item) => {
        item.collected = false;
        item.animTimer = 0;
      },
      100
    );

    // 5. Alleyway Decor Pool
    this.decorPool = new ObjectPool<AlleywayDecor>(
      () => ({
        id: '',
        chunkKey: '',
        type: 'NEON_GRAFFITI',
        position: { x: 0, y: 0 },
        width: 40,
        height: 20,
        color: '#FF00E5',
        glowColor: '#FF00E5',
        animTimer: 0,
        active: false,
      }),
      (decor) => {
        decor.active = false;
        decor.animTimer = 0;
      },
      60
    );

    // 6. Cyber Environment Props Pool (Cyber-Trees, Streetlights, Rooftop HVACs, Antennas)
    this.propPool = new ObjectPool<CyberEnvironmentProp>(
      () => ({
        id: '',
        chunkKey: '',
        type: 'CYBER_TREE',
        position: { x: 0, y: 0 },
        width: 40,
        height: 80,
        color: '#00ffd1',
        glowColor: '#00ffd1',
        accentColor: '#ff0055',
        animPhase: 0,
        animSpeed: 1,
        active: false,
      }),
      (prop) => {
        prop.active = false;
        prop.treeData = undefined;
        prop.lightData = undefined;
        prop.billboardData = undefined;
        prop.hvacData = undefined;
        prop.antennaData = undefined;
      },
      120
    );
  }

  /** Reset all map state and pools on new game run */
  public reset() {
    // Despawn and recycle all chunks
    for (const chunk of this.loadedChunks.values()) {
      this.recycleChunk(chunk);
    }
    this.loadedChunks.clear();
    this.discoveredChunkKeys.clear();

    this.activeObstacles = [];
    this.activeLasers = [];
    this.activeTerminals = [];
    this.activeDecor = [];
    this.activeProps = [];
    this.activeCollectibles = [];
  }

  /** Advance to specified stage with fresh procedural distribution */
  public setStage(stageNumber: number) {
    this.currentStage = stageNumber;
    this.currentStageConfig = getStageConfig(stageNumber);
    this.reset();
  }

  public getChunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public getDiscoveredCount(): number {
    return this.discoveredChunkKeys.size;
  }

  public getLoadedChunks(): GridMapChunk[] {
    return Array.from(this.loadedChunks.values());
  }

  public get activeChunks(): GridMapChunk[] {
    return Array.from(this.loadedChunks.values());
  }

  /**
   * Primary Chunk Update: Dynamically Spawns new chunks ahead and Despawns distant chunks behind
   */
  public updateWorld(playerPos: Vector2D): { newChunksCount: number; despawnedCount: number } {
    const currentChunkX = Math.floor(playerPos.x / this.CHUNK_PIXEL_SIZE);
    const currentChunkY = Math.floor(playerPos.y / this.CHUNK_PIXEL_SIZE);

    let newChunksCount = 0;
    let despawnedCount = 0;

    // 1. DYNAMIC SPAWNING: Spawn all chunks within SPAWN_RADIUS ahead of player
    for (let cx = currentChunkX - this.SPAWN_RADIUS; cx <= currentChunkX + this.SPAWN_RADIUS; cx++) {
      for (let cy = currentChunkY - this.SPAWN_RADIUS; cy <= currentChunkY + this.SPAWN_RADIUS; cy++) {
        const key = this.getChunkKey(cx, cy);
        if (!this.loadedChunks.has(key)) {
          const chunk = this.spawnChunk(cx, cy);
          this.loadedChunks.set(key, chunk);

          if (!this.discoveredChunkKeys.has(key)) {
            this.discoveredChunkKeys.add(key);
            newChunksCount++;
          }
        }
      }
    }

    // 2. DYNAMIC DESPAWNING: Despawn chunks that are too far behind (beyond DESPAWN_RADIUS)
    for (const [key, chunk] of this.loadedChunks.entries()) {
      const distChunksX = Math.abs(chunk.chunkX - currentChunkX);
      const distChunksY = Math.abs(chunk.chunkY - currentChunkY);
      const chebyshevDist = Math.max(distChunksX, distChunksY);

      if (chebyshevDist > this.DESPAWN_RADIUS) {
        this.recycleChunk(chunk);
        this.loadedChunks.delete(key);
        despawnedCount++;
      }
    }

    // 3. Re-aggregate active object arrays for lightning-fast physics queries
    this.refreshActiveObjectArrays();

    return { newChunksCount, despawnedCount };
  }

  /** Re-aggregate active objects from loaded chunks */
  private refreshActiveObjectArrays() {
    this.activeObstacles = [];
    this.activeLasers = [];
    this.activeTerminals = [];
    this.activeDecor = [];
    this.activeProps = [];
    this.activeCollectibles = [];

    for (const chunk of this.loadedChunks.values()) {
      for (const obs of chunk.obstacles) {
        if (obs.active) this.activeObstacles.push(obs);
      }
      for (const laser of chunk.lasers) {
        if (laser.active) this.activeLasers.push(laser);
      }
      for (const ent of chunk.entities) {
        if (ent.active) this.activeTerminals.push(ent);
      }
      for (const dec of chunk.decor) {
        if (dec.active) this.activeDecor.push(dec);
      }
      if (chunk.props) {
        for (const prop of chunk.props) {
          if (prop.active) this.activeProps.push(prop);
        }
      }
      for (const col of chunk.collectibles) {
        if (!col.collected) this.activeCollectibles.push(col);
      }
    }
  }

  /**
   * Procedural Generation of a 1000x1000px Cyberpunk Chunk
   * Generates neon alleyways, buildings, terminals, laser hazards, and collectibles using Object Pooling
   */
  private spawnChunk(cx: number, cy: number): GridMapChunk {
    const pixelSize = this.CHUNK_PIXEL_SIZE;
    const tileCount = this.CHUNK_TILE_COUNT;
    const tileSize = this.TILE_SIZE;
    const worldX = cx * pixelSize;
    const worldY = cy * pixelSize;
    const chunkKey = this.getChunkKey(cx, cy);

    // Is this the origin spawn chunk (0,0)? Keep center wide and open!
    const isSpawnChunk = cx === 0 && cy === 0;

    // Biome determination: Use stage primary biome or local variety
    const stageBiome = this.currentStageConfig?.biome || 'DOWNTOWN';
    const biomes: Array<'DOWNTOWN' | 'NEON_DISTRICT' | 'INDUSTRIAL' | 'TECH_CORE' | 'SLUMS' | 'BIO_LAB'> = [
      stageBiome,
      'NEON_DISTRICT',
      'INDUSTRIAL',
      'TECH_CORE',
      'BIO_LAB',
    ];
    const biomeHash = Math.abs((cx * 73856093) ^ (cy * 19349663));
    const biome = isSpawnChunk ? stageBiome : biomes[biomeHash % biomes.length];

    const tiles: Tile[][] = [];
    const chunkObstacles: CyberObstacle[] = [];
    const chunkLasers: LaserHazard[] = [];
    const chunkTerminals: WorldEntity[] = [];
    const chunkDecor: AlleywayDecor[] = [];
    const chunkProps: CyberEnvironmentProp[] = [];
    const chunkCollectibles: Collectible[] = [];

    // Objective Locations on spatial grid
    const isBioCore1Chunk = cx === -1 && cy === 0;
    const isBioCore2Chunk = cx === 1 && cy === 0;
    const isBioCore3Chunk = cx === 0 && cy === 1 && !this.currentStageConfig.isBossStage;
    const isPortalChunk = cx === 0 && cy === -1;
    const isMissionTarget1Chunk = (cx === -1 && cy === 1) || (cx === -2 && cy === 0);
    const isMissionTarget2Chunk = (cx === 1 && cy === 1) || (cx === 2 && cy === 0);
    const isMissionTarget3Chunk = (cx === 1 && cy === -1) || (cx === -1 && cy === -1);
    const isBossChunk = this.currentStageConfig.isBossStage && (cx === 0 && cy === 1);
    const isObjectiveChunk = isBioCore1Chunk || isBioCore2Chunk || isBioCore3Chunk || isPortalChunk || isMissionTarget1Chunk || isMissionTarget2Chunk || isMissionTarget3Chunk || isBossChunk;

    // --- 1. PROCEDURAL TILE GRID & NEON ALLEYWAY GENERATOR ---
    for (let tx = 0; tx < tileCount; tx++) {
      tiles[tx] = [];
      for (let ty = 0; ty < tileCount; ty++) {
        const absTileX = cx * tileCount + tx;
        const absTileY = cy * tileCount + ty;

        // Main Road Avenues (every 10 tiles on grid)
        const isMainAvenueX = Math.abs(absTileX) % 10 === 0 || Math.abs(absTileX) % 10 === 1;
        const isMainAvenueY = Math.abs(absTileY) % 10 === 0 || Math.abs(absTileY) % 10 === 1;

        // Neon Alleyway Corridors (narrow 1-2 tile alleys slicing through building blocks)
        const isAlleyX = Math.abs(absTileX) % 5 === 2;
        const isAlleyY = Math.abs(absTileY) % 5 === 2;

        // Open area around objective centers (10, 10)
        const isNearObjectiveCenter = isObjectiveChunk && Math.abs(tx - 10) <= 2 && Math.abs(ty - 10) <= 2;

        if (isNearObjectiveCenter) {
          tiles[tx][ty] = {
            type: 'HOLOGRAM_PLAZA',
            walkable: true,
            color: '#120c2b',
            glowColor: isPortalChunk ? '#ff0055' : '#00f0ff',
          };
        } else if (isMainAvenueX || isMainAvenueY) {
          tiles[tx][ty] = {
            type: 'ASPHALT_ROAD',
            walkable: true,
            color: '#0a0a12',
            glowColor: isMainAvenueX && isMainAvenueY ? '#00FFD1' : undefined,
          };
        } else if (isAlleyX || isAlleyY) {
          // Rare & Tactical Alley Breach Check: only ~10-12% of outer alley corridors have a broken floor fissure
          const isChunkEligible = Math.abs(Math.sin(cx * 89.17 + cy * 53.31)) > 0.87;
          const alleyPitNoise = Math.abs(Math.sin(absTileX * 37.11 + absTileY * 83.29)) % 1;
          const nearOrigin = isSpawnChunk && Math.abs(tx - 10) <= 7 && Math.abs(ty - 10) <= 7;
          const nearObj = isObjectiveChunk && Math.abs(tx - 10) <= 5 && Math.abs(ty - 10) <= 5;
          
          if (isChunkEligible && !nearOrigin && !nearObj && !isNearObjectiveCenter && alleyPitNoise > 0.88) {
            // Rare tactical broken floor chasm gap across alleyway!
            tiles[tx][ty] = {
              type: 'BROKEN_FLOOR',
              walkable: true,
              isPitHazard: true,
              color: '#020008',
              glowColor: '#ff0055',
              elevation: -55,
              crackSeed: alleyPitNoise,
            };
          } else {
            // Normal solid clean Neon Alleyway
            tiles[tx][ty] = {
              type: 'ALLEYWAY',
              walkable: true,
              color: '#0e0b1c',
              glowColor: biome === 'NEON_DISTRICT' ? '#FF00E5' : '#00FFD1',
            };
          }
        } else {
          // Building block / tech grid candidate
          const blockSeed = Math.sin(absTileX * 12.9898 + absTileY * 78.233);
          const rand = Math.abs(blockSeed * 43758.5453) % 1;

          // Safe clearance around spawn origin center and objective plazas
          const nearOrigin = isSpawnChunk && Math.abs(tx - 10) <= 7 && Math.abs(ty - 10) <= 7;
          const nearObj = isObjectiveChunk && Math.abs(tx - 10) <= 5 && Math.abs(ty - 10) <= 5;

          // Rare Tactical Chasm Void Breach (only ~10-12% of exploration chunks have an isolated chasm feature)
          const isChasmChunk = Math.abs(Math.sin(cx * 131.73 + cy * 277.31)) > 0.88;
          const isChasmCell = (absTileX % 7 === 3 && absTileY % 7 === 3);

          if (rand < 0.38 && !nearOrigin && !isNearObjectiveCenter && !nearObj) {
            // Cyber Building Solid Obstacle Tile
            tiles[tx][ty] = {
              type: 'CYBER_BUILDING',
              walkable: false,
              color: '#151124',
              glowColor: biome === 'TECH_CORE' ? '#00FF66' : biome === 'NEON_DISTRICT' ? '#FF00E5' : '#00FFD1',
              elevation: 40 + rand * 35,
            };
          } else if (isChasmChunk && isChasmCell && !nearOrigin && !isNearObjectiveCenter && !nearObj) {
            // Rare Isolated Tactical Chasm Void Abyss (Platforming hazard requiring Hyper-Dash)
            tiles[tx][ty] = {
              type: 'CHASM_VOID',
              walkable: true,
              isPitHazard: true,
              color: '#010006',
              glowColor: '#00ffd1',
              elevation: -75,
              crackSeed: Math.abs(rand),
            };
          } else if (rand < 0.62) {
            // Hologram Plaza
            tiles[tx][ty] = {
              type: 'HOLOGRAM_PLAZA',
              walkable: true,
              color: '#120c22',
              glowColor: '#9d00ff',
            };
          } else {
            // Neon Sidewalk
            tiles[tx][ty] = {
              type: 'NEON_SIDEWALK',
              walkable: true,
              color: '#080514',
            };
          }
        }
      }
    }

    // --- 2. MERGE ADJACENT BUILDING TILES INTO LARGE SOLID OBSTACLES ---
    // Scan tiles and allocate pooled obstacles for contiguous building clusters
    const visited = Array.from({ length: tileCount }, () => Array(tileCount).fill(false));

    for (let tx = 0; tx < tileCount; tx++) {
      for (let ty = 0; ty < tileCount; ty++) {
        if (!visited[tx][ty] && !tiles[tx][ty].walkable) {
          // Find rectangular cluster width
          let blockW = 1;
          while (tx + blockW < tileCount && !visited[tx + blockW][ty] && !tiles[tx + blockW][ty].walkable) {
            blockW++;
          }
          // Find rectangular cluster height
          let blockH = 1;
          let canExpand = true;
          while (ty + blockH < tileCount && canExpand) {
            for (let k = 0; k < blockW; k++) {
              if (visited[tx + k][ty + blockH] || tiles[tx + k][ty + blockH].walkable) {
                canExpand = false;
                break;
              }
            }
            if (canExpand) blockH++;
          }

          // Mark cluster as visited
          for (let ix = 0; ix < blockW; ix++) {
            for (let iy = 0; iy < blockH; iy++) {
              visited[tx + ix][ty + iy] = true;
            }
          }

          // Acquire obstacle from pool
          const obs = this.obstaclePool.acquire();
          obs.id = `obs_${cx}_${cy}_${tx}_${ty}`;
          obs.chunkKey = chunkKey;
          obs.bounds = {
            x: worldX + tx * tileSize,
            y: worldY + ty * tileSize,
            width: blockW * tileSize,
            height: blockH * tileSize,
          };
          obs.color = tiles[tx][ty].color;
          obs.glowColor = tiles[tx][ty].glowColor || '#00FFD1';
          obs.elevation = tiles[tx][ty].elevation || 45;
          obs.hasNeonTrim = true;
          obs.active = true;

          chunkObstacles.push(obs);
        }
      }
    }

    // --- 3. POPULATE NEON ALLEYWAY DECORATIONS ---
    const decorSeed = Math.abs(Math.sin(cx * 43.12 + cy * 19.87)) % 1;
    const decorCount = 2 + Math.floor(decorSeed * 4);

    for (let i = 0; i < decorCount; i++) {
      const decX = worldX + (2 + (i * 4.5) % (tileCount - 4)) * tileSize + tileSize * 0.5;
      const decY = worldY + (2 + ((i * 3.7 + 2) % (tileCount - 4))) * tileSize + tileSize * 0.5;

      const dec = this.decorPool.acquire();
      dec.id = `decor_${cx}_${cy}_${i}`;
      dec.chunkKey = chunkKey;
      dec.position = { x: decX, y: decY };
      dec.type = i % 3 === 0 ? 'NEON_PUDDLE' : i % 3 === 1 ? 'STEAM_VENT' : 'NEON_GRAFFITI';
      dec.width = 30 + (i % 3) * 15;
      dec.height = 18 + (i % 2) * 10;
      dec.color = i % 2 === 0 ? '#00FFD1' : '#FF00E5';
      dec.glowColor = dec.color;
      dec.animTimer = (i * Math.PI) / 3;
      dec.active = true;

      chunkDecor.push(dec);
    }

    // --- 3B. POPULATE LIVING CYBERPUNK ENVIRONMENT PROPS (Cyber-Trees, Streetlights, Rooftop Architectures) ---
    // (A) DIGITAL CYBER-TREES: Place on Sidewalk & Plaza tiles
    const treeSeed = Math.abs(Math.sin(cx * 67.89 + cy * 23.45)) % 1;
    const treeCount = 2 + Math.floor(treeSeed * 3);
    for (let t = 0; t < treeCount; t++) {
      const treeTileX = 1 + Math.floor(((t * 5.7 + Math.abs(cx) * 2) % (tileCount - 2)));
      const treeTileY = 1 + Math.floor(((t * 4.3 + Math.abs(cy) * 2) % (tileCount - 2)));
      const tile = tiles[treeTileX]?.[treeTileY];
      if (tile && (tile.type === 'NEON_SIDEWALK' || tile.type === 'HOLOGRAM_PLAZA' || tile.walkable)) {
        const prop = this.propPool.acquire();
        const treeHeight = 65 + Math.floor((treeSeed * 10 + t * 7) % 25);
        prop.id = `tree_${cx}_${cy}_${t}`;
        prop.chunkKey = chunkKey;
        prop.type = 'CYBER_TREE';
        prop.position = {
          x: worldX + treeTileX * tileSize + tileSize * 0.5,
          y: worldY + treeTileY * tileSize + tileSize * 0.9,
        };
        prop.width = 40;
        prop.height = treeHeight;
        prop.glowColor = t % 2 === 0 ? '#00ffd1' : '#ff00aa';
        prop.color = '#00ffd1';
        prop.accentColor = '#ff0055';
        prop.animPhase = t * 1.5;
        prop.animSpeed = 1.0;
        prop.active = true;
        prop.treeData = {
          height: treeHeight,
          branches: generateCyberTreeBranches(treeHeight, treeSeed + t),
          foliageColor: t % 3 === 0 ? '#00ffd1' : t % 3 === 1 ? '#ff00a0' : '#39ff14',
          trunkColor: '#1d1238',
          swaySpeed: 1.2 + (t % 3) * 0.3,
        };
        chunkProps.push(prop);
      }
    }

    // (B) CYBERPUNK STREETLIGHTS: Place along Road & Sidewalk perimeters
    const lightSeed = Math.abs(Math.cos(cx * 34.56 + cy * 89.01)) % 1;
    const lightCount = 3 + Math.floor(lightSeed * 3);
    for (let l = 0; l < lightCount; l++) {
      const lTileX = 1 + Math.floor(((l * 6.1 + Math.abs(cx) * 3) % (tileCount - 2)));
      const lTileY = 1 + Math.floor(((l * 5.2 + Math.abs(cy) * 3) % (tileCount - 2)));
      const tile = tiles[lTileX]?.[lTileY];
      if (tile && (tile.type === 'ASPHALT_ROAD' || tile.type === 'NEON_SIDEWALK' || tile.walkable)) {
        const prop = this.propPool.acquire();
        const lightH = 55 + (l % 3) * 10;
        prop.id = `light_${cx}_${cy}_${l}`;
        prop.chunkKey = chunkKey;
        prop.type = 'STREET_LIGHT';
        prop.position = {
          x: worldX + lTileX * tileSize + tileSize * 0.5,
          y: worldY + lTileY * tileSize + tileSize * 0.85,
        };
        prop.width = 30;
        prop.height = lightH;
        prop.glowColor = l % 3 === 0 ? '#00ffd1' : l % 3 === 1 ? '#ffe600' : '#ff007f';
        prop.color = '#ffffff';
        prop.accentColor = '#00ffd1';
        prop.animPhase = l * 2.1;
        prop.animSpeed = 1.0;
        prop.active = true;
        prop.lightData = {
          height: lightH,
          coneAngle: 0.6,
          coneLength: 120,
          intensity: 0.85,
          flickerTimer: 0,
          armDirection: l % 2 === 0 ? 'LEFT' : 'RIGHT',
        };
        chunkProps.push(prop);
      }
    }

    // (C) ROOFTOP & BUILDING PROPS: HVAC fans, Comms Antennas, Billboards, Coolant Pipes
    for (let oIdx = 0; oIdx < chunkObstacles.length; oIdx++) {
      const obs = chunkObstacles[oIdx];
      const obsSeed = Math.abs(Math.sin(oIdx * 17.31 + cx * 11.2)) % 1;

      // Rooftop HVAC or Comms Antenna
      if (obsSeed > 0.2) {
        const prop = this.propPool.acquire();
        const propX = obs.bounds.x + obs.bounds.width * 0.5;
        const propY = obs.bounds.y + 4; // Top surface of the solid building

        prop.id = `bldg_prop_${cx}_${cy}_${oIdx}`;
        prop.chunkKey = chunkKey;
        prop.position = { x: propX, y: propY };
        prop.animPhase = oIdx * 1.3;
        prop.animSpeed = 1.0;
        prop.active = true;

        if (obsSeed > 0.65) {
          // Comms Tower Spire
          prop.type = 'COMMS_ANTENNA';
          prop.width = 24;
          prop.height = 65;
          prop.glowColor = obs.glowColor || '#00ffd1';
          prop.color = '#1f1636';
          prop.accentColor = '#ff0055';
          prop.antennaData = {
            height: 65,
            dishAngle: 0,
            beaconColor: '#ff0055',
          };
        } else if (obsSeed > 0.4) {
          // Industrial HVAC Ventilation
          prop.type = 'ROOFTOP_HVAC';
          prop.width = 46;
          prop.height = 32;
          prop.glowColor = obs.glowColor || '#00ffd1';
          prop.color = '#140f24';
          prop.accentColor = '#00ffd1';
          prop.hvacData = {
            fanSpeed: 6.0,
            bladeAngle: 0,
            steamInterval: 40,
          };
        } else {
          // Server Stack Cabinet or Coolant Conduit
          prop.type = oIdx % 2 === 0 ? 'SERVER_STACK' : 'COOLANT_PIPES';
          prop.width = 32;
          prop.height = 42;
          prop.glowColor = obs.glowColor || '#00ffd1';
          prop.color = '#0b0816';
          prop.accentColor = '#39ff14';
        }
        chunkProps.push(prop);
      }

      // High-Fidelity 3D Golden Neon Billboards & Holographic Signage on Buildings
      if (obs.bounds.width >= 120 && obsSeed > 0.25) {
        const prop = this.propPool.acquire();
        const goldenBrands: Array<{ brand: 'KKS' | 'Cyber Game' | 'Burma Batik'; tag: string; sub: string; orient: 'HORIZONTAL_ROOFTOP' | 'VERTICAL_WALL_STRIP' | 'WALL_BANNER' }> = [
          { brand: 'KKS', tag: 'QUANTUM PRESTIGE CORP', sub: 'CYBER MAINFRAME // S-TIER', orient: oIdx % 2 === 0 ? 'HORIZONTAL_ROOFTOP' : 'VERTICAL_WALL_STRIP' },
          { brand: 'Cyber Game', tag: 'PLAY THE FUTURE // 2099', sub: 'INSERT COIN TO OVERDRIVE', orient: 'HORIZONTAL_ROOFTOP' },
          { brand: 'Burma Batik', tag: 'HERITAGE WOVEN IN NEON', sub: 'ROYAL GOLD FILIGREE 2099', orient: oIdx % 3 === 0 ? 'VERTICAL_WALL_STRIP' : 'HORIZONTAL_ROOFTOP' },
        ];
        const chosenBrand = goldenBrands[(oIdx + Math.abs(cx) + Math.abs(cy)) % goldenBrands.length];

        prop.id = `golden_billboard_${cx}_${cy}_${oIdx}`;
        prop.chunkKey = chunkKey;
        prop.type = 'GOLDEN_BILLBOARD';
        prop.position = {
          x: obs.bounds.x + obs.bounds.width * 0.5,
          y: obs.bounds.y + obs.bounds.height * 0.5,
        };
        prop.width = chosenBrand.orient === 'VERTICAL_WALL_STRIP' ? 45 : Math.min(160, obs.bounds.width - 15);
        prop.height = chosenBrand.orient === 'VERTICAL_WALL_STRIP' ? Math.min(180, obs.bounds.height + 60) : 56;
        prop.glowColor = '#FFD700'; // Vibrant Glowing Gold
        prop.color = '#FFFFFF';
        prop.accentColor = '#FFB900'; // Amber Gold
        prop.animPhase = oIdx * 0.8;
        prop.animSpeed = 1.0;
        prop.active = true;
        prop.goldenBillboardData = {
          brand: chosenBrand.brand,
          title: chosenBrand.brand,
          subText: chosenBrand.sub,
          tagline: chosenBrand.tag,
          orientation: chosenBrand.orient,
          glowColor: '#FFD700',
          accentGlow: '#FFB900',
          emissiveIntensity: 3.8,
          scrollSpeed: 1.2,
          pulsePhase: oIdx * 1.5,
          glitchTimer: 0,
          hasPointLight: true,
        };
        prop.billboardData = {
          text: chosenBrand.brand,
          subText: chosenBrand.sub,
          hologramType: 'GOLDEN_BRAND',
          glitchTimer: 0,
          goldenData: prop.goldenBillboardData,
        };
        chunkProps.push(prop);
      }
    }

    // --- 4. POPULATE HACKING TERMINALS & OBJECTIVE PORTALS ---
    if (isPortalChunk) {
      // Primary Stage Exit Portal
      const portal = this.terminalPool.acquire();
      portal.id = `stage_portal_${cx}_${cy}`;
      portal.type = 'CYBER_EXIT_PORTAL';
      portal.position = {
        x: worldX + 10 * tileSize + tileSize / 2,
        y: worldY + 10 * tileSize + tileSize / 2,
      };
      portal.velocity = { x: 0, y: 0 };
      portal.radius = 42;
      portal.angle = 0;
      portal.active = true;
      portal.glowColor = '#ff0055';
      portal.interactionPrompt = 'PORTAL LOCKED // 3 BIO-CORES REQUIRED';
      portal.dataReward = this.currentStageConfig.stageBonusGold;
      portal.health = 100;
      chunkTerminals.push(portal);
    }

    const terminalSeed = Math.abs(Math.cos(cx * 88.31 + cy * 42.19)) % 1;
    if (terminalSeed > 0.25 && !isSpawnChunk && !isPortalChunk) {
      // Find a walkable tile in the chunk for terminal
      const termTileX = 4 + Math.floor(terminalSeed * 10);
      const termTileY = 4 + Math.floor((1 - terminalSeed) * 10);

      const term = this.terminalPool.acquire();
      term.id = `terminal_${cx}_${cy}`;
      term.type = 'DATA_TERMINAL';
      term.position = {
        x: worldX + termTileX * tileSize + tileSize / 2,
        y: worldY + termTileY * tileSize + tileSize / 2,
      };
      term.velocity = { x: 0, y: 0 };
      term.radius = 28;
      term.angle = 0;
      term.active = true;
      term.glowColor = '#00FF66';
      term.interactionPrompt = '[E / HACK] BREACH TERMINAL';
      term.dataReward = 500 + (this.currentStage - 1) * 150;
      term.health = 100;

      chunkTerminals.push(term);
    }

    // --- 4B. POPULATE BOSS OR MISSION TARGET OR MUTATED BIO-CYBER BACTERIA ---
    // (A) APEX CYBER-LORD TITAN (STAGE 5 FINAL BOSS)
    if (isBossChunk) {
      const bossRadius = 55;
      const bossHp = 1400;
      const numTentacles = 10;
      const tentacles = [];
      for (let t = 0; t < numTentacles; t++) {
        tentacles.push({
          baseAngle: (t * Math.PI * 2) / numTentacles,
          length: 50 + (t % 3) * 15,
          segments: 8,
          waveSpeed: 5.5,
          waveAmplitude: 14,
          phaseOffset: (t * Math.PI) / 3,
          color: '#FF0055',
        });
      }
      const organelles = [];
      for (let o = 0; o < 8; o++) {
        const oAngle = (o * Math.PI * 2) / 8;
        organelles.push({
          x: Math.cos(oAngle) * 28,
          y: Math.sin(oAngle) * 28,
          r: 7,
          color: o % 2 === 0 ? '#FFE600' : '#00FFD1',
          pulseOffset: o * 0.8,
        });
      }

      const bossEnt = this.terminalPool.acquire();
      bossEnt.id = `boss_titan_${cx}_${cy}`;
      bossEnt.type = 'MUTATED_BACTERIA';
      bossEnt.position = {
        x: worldX + 10 * tileSize + tileSize / 2,
        y: worldY + 10 * tileSize + tileSize / 2,
      };
      bossEnt.velocity = { x: 0, y: 0 };
      bossEnt.radius = bossRadius;
      bossEnt.angle = 0;
      bossEnt.active = true;
      bossEnt.glowColor = '#FF0055';
      bossEnt.health = bossHp;
      bossEnt.maxHealth = bossHp;
      bossEnt.dataReward = 15000;
      bossEnt.bacteriaData = {
        id: bossEnt.id,
        variant: 'APEX_BOSS',
        position: bossEnt.position,
        velocity: bossEnt.velocity,
        radius: bossRadius,
        baseRadius: bossRadius,
        health: bossHp,
        maxHealth: bossHp,
        active: true,
        pulsePhase: 0,
        pulseSpeed: 3.5,
        wobbleAmount: 0.28,
        membraneAlpha: 0.95,
        membraneColor: '#FF0055',
        cytoplasmColor: 'rgba(255, 0, 85, 0.65)',
        nucleusColor: '#FFE600',
        nucleusOffset: { x: 0, y: 0 },
        tentacles,
        organelles,
        toxicBubbleTimer: 0,
        hitStaggerTimer: 0,
        facing: 'LEFT',
        facingAngle: Math.PI,
        visionFov: Math.PI / 2.2,
        visionRange: 380,
        alertness: 0,
        state: 'PATROL',
        detectionRadius: 900,
        jumpCooldown: 0,
        leapTimer: 0,
        patrolTimer: 100,
        patrolDir: 1,
        alertTimer: 0,
        pounceTimer: 0,
        onGround: true,
        losDetected: false,
        isBoss: true,
        bossPhase: 1,
        maxBossPhases: 3,
        shield: 200,
        maxShield: 200,
        enrageTimer: 0,
        summonMinionTimer: 200,
        projectileCooldown: 60,
        surrenderChance: 0,
      };
      chunkTerminals.push(bossEnt);
    }
    // (B) MISSION TARGET ELITE ENEMY (High-Value Camouflaged Target)
    else if (isMissionTarget1Chunk || isMissionTarget2Chunk || isMissionTarget3Chunk) {
      const eliteHp = 280 + (this.currentStage - 1) * 80;
      const targetNum = isMissionTarget1Chunk ? 1 : isMissionTarget2Chunk ? 2 : 3;
      const numTentacles = 6;
      const tentacles = [];
      for (let t = 0; t < numTentacles; t++) {
        tentacles.push({
          baseAngle: (t * Math.PI * 2) / numTentacles,
          length: 32 + (t % 2) * 10,
          segments: 6,
          waveSpeed: 4.5,
          waveAmplitude: 9,
          phaseOffset: (t * Math.PI) / 2,
          color: '#FFE600',
        });
      }
      const organelles = [
        { x: -10, y: -8, r: 5, color: '#FF00E5', pulseOffset: 0.5 },
        { x: 10, y: -8, r: 5, color: '#00FFD1', pulseOffset: 1.2 },
        { x: 0, y: 12, r: 6, color: '#FFE600', pulseOffset: 2.0 },
      ];

      const eliteEnt = this.terminalPool.acquire();
      eliteEnt.id = `mission_elite_${cx}_${cy}_${targetNum}`;
      eliteEnt.type = 'MUTATED_BACTERIA';
      eliteEnt.position = {
        x: worldX + 11 * tileSize + tileSize / 2,
        y: worldY + 11 * tileSize + tileSize / 2,
      };
      eliteEnt.velocity = { x: 0, y: 0 };
      eliteEnt.radius = 34;
      eliteEnt.angle = 0;
      eliteEnt.active = true;
      eliteEnt.glowColor = '#FFE600';
      eliteEnt.health = eliteHp;
      eliteEnt.maxHealth = eliteHp;
      eliteEnt.dataReward = 2000;

      const weaponsPool: Array<'HOMING_MISSILES' | 'SPREAD_CANNON' | 'LIGHTNING_CHAIN' | 'QUANTUM_VORTEX'> = [
        'SPREAD_CANNON',
        'LIGHTNING_CHAIN',
        'HOMING_MISSILES',
        'QUANTUM_VORTEX',
      ];
      const assignedDrop = weaponsPool[(targetNum + this.currentStage) % weaponsPool.length];

      eliteEnt.bacteriaData = {
        id: eliteEnt.id,
        variant: 'MISSION_TARGET_ELITE',
        position: eliteEnt.position,
        velocity: eliteEnt.velocity,
        radius: 34,
        baseRadius: 34,
        health: eliteHp,
        maxHealth: eliteHp,
        active: true,
        pulsePhase: 0,
        pulseSpeed: 3.0,
        wobbleAmount: 0.22,
        membraneAlpha: 0.8,
        membraneColor: '#FFE600',
        cytoplasmColor: 'rgba(255, 230, 0, 0.45)',
        nucleusColor: '#FF0055',
        nucleusOffset: { x: 0, y: 0 },
        tentacles,
        organelles,
        toxicBubbleTimer: 0,
        hitStaggerTimer: 0,
        facing: 'RIGHT',
        facingAngle: 0,
        visionFov: Math.PI / 2.5,
        visionRange: 320,
        alertness: 0,
        state: 'PATROL',
        detectionRadius: 520,
        jumpCooldown: 0,
        leapTimer: 0,
        patrolTimer: 120,
        patrolDir: -1,
        alertTimer: 0,
        pounceTimer: 0,
        onGround: true,
        losDetected: false,
        stealthAlpha: 0.2, // Stealth active camouflage
        isMissionTarget: true,
        dropWeaponType: assignedDrop,
        surrenderChance: 0.4,
      };
      chunkTerminals.push(eliteEnt);
    }

    // (C) STANDARD VARIED MUTATED BIO-CYBER BACTERIA
    const bacteriaSpawnThreshold = 0.22 / Math.max(1, this.currentStageConfig.bacteriaDensity || 1);
    const bacteriaSeed = Math.abs(Math.sin(cx * 53.71 + cy * 79.13)) % 1;
    if (bacteriaSeed > bacteriaSpawnThreshold && !isSpawnChunk && !isBossChunk) {
      const bacteriaCount = Math.min(5, 1 + Math.floor(bacteriaSeed * 3 * (this.currentStageConfig.bacteriaDensity || 1)));
      const baseHp = this.currentStageConfig.enemyBaseHealth || 100;
      const speedMult = this.currentStageConfig.enemySpeedMultiplier || 1.0;

      for (let b = 0; b < bacteriaCount; b++) {
        const bTileX = 2 + Math.floor(((b * 6.7 + Math.abs(cx) * 3) % (tileCount - 4)));
        const bTileY = 2 + Math.floor(((b * 5.3 + Math.abs(cy) * 3) % (tileCount - 4)));
        
        // Variant assignment
        const variantRoll = (b + Math.abs(cx) * 2 + Math.abs(cy)) % 4;
        const variant: EnemyBacteria['variant'] = 
          variantRoll === 0 ? 'MUTATED_ORGANIC' :
          variantRoll === 1 ? 'STEALTH_STALKER' :
          variantRoll === 2 ? 'TOXIC_SPITTER' : 'CYBER_BRUTE';

        const baseRadius = variant === 'CYBER_BRUTE' ? 32 : variant === 'STEALTH_STALKER' ? 20 : 25;
        const enemyHealth = variant === 'CYBER_BRUTE' ? baseHp * 1.6 : variant === 'STEALTH_STALKER' ? baseHp * 0.85 : baseHp;
        
        const numTentacles = variant === 'STEALTH_STALKER' ? 3 : variant === 'CYBER_BRUTE' ? 6 : 4;
        const tentacles = [];
        const tentColor = variant === 'TOXIC_SPITTER' ? '#39FF14' : variant === 'STEALTH_STALKER' ? '#00FFD1' : variant === 'CYBER_BRUTE' ? '#FF0055' : '#FF0077';

        for (let t = 0; t < numTentacles; t++) {
          tentacles.push({
            baseAngle: (t * Math.PI * 2) / numTentacles,
            length: (variant === 'STEALTH_STALKER' ? 18 : 26) + (t % 2) * 6,
            segments: 5,
            waveSpeed: (3.0 + t * 0.5) * speedMult,
            waveAmplitude: 6 + (t % 2) * 3,
            phaseOffset: (t * Math.PI) / 2,
            color: tentColor,
          });
        }

        const organelles = [
          { x: -5, y: -4, r: 4, color: '#00ffd1', pulseOffset: 0.3 },
          { x: 5, y: 4, r: 4, color: '#ffe600', pulseOffset: 1.1 },
        ];

        const bacEnt = this.terminalPool.acquire();
        bacEnt.id = `bacteria_${cx}_${cy}_${b}`;
        bacEnt.type = 'MUTATED_BACTERIA';
        bacEnt.position = {
          x: worldX + bTileX * tileSize + tileSize / 2,
          y: worldY + bTileY * tileSize + tileSize / 2,
        };
        bacEnt.velocity = { x: (Math.random() - 0.5) * 1.8 * speedMult, y: (Math.random() - 0.5) * 1.8 * speedMult };
        bacEnt.radius = baseRadius;
        bacEnt.angle = Math.random() * Math.PI * 2;
        bacEnt.active = true;
        bacEnt.glowColor = tentColor;
        bacEnt.health = enemyHealth;
        bacEnt.maxHealth = enemyHealth;
        bacEnt.dataReward = 300 + (this.currentStage - 1) * 100;
        bacEnt.bacteriaData = {
          id: bacEnt.id,
          variant,
          position: bacEnt.position,
          velocity: bacEnt.velocity,
          radius: baseRadius,
          baseRadius,
          health: enemyHealth,
          maxHealth: enemyHealth,
          active: true,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: (2.2 + Math.random() * 1.2) * speedMult,
          wobbleAmount: 0.16,
          membraneAlpha: variant === 'STEALTH_STALKER' ? 0.25 : 0.7,
          membraneColor: tentColor,
          cytoplasmColor: variant === 'TOXIC_SPITTER' ? 'rgba(57, 255, 20, 0.45)' : 'rgba(255, 0, 127, 0.45)',
          nucleusColor: '#9d00ff',
          nucleusOffset: { x: 0, y: 0 },
          tentacles,
          organelles,
          toxicBubbleTimer: 0,
          hitStaggerTimer: 0,
          facing: 'LEFT',
          facingAngle: Math.PI,
          visionFov: Math.PI / 2.8,
          visionRange: 280,
          alertness: 0,
          state: 'PATROL',
          detectionRadius: 360 + (this.currentStage - 1) * 30,
          jumpCooldown: 0,
          leapTimer: 0,
          patrolTimer: Math.floor(60 + Math.random() * 120),
          patrolDir: Math.random() < 0.5 ? -1 : 1,
          alertTimer: 0,
          pounceTimer: 0,
          onGround: true,
          losDetected: false,
          stealthAlpha: variant === 'STEALTH_STALKER' ? 0.2 : 1.0,
          projectileCooldown: variant === 'TOXIC_SPITTER' ? 40 : 0,
          surrenderChance: 0.35, // 35% chance to surrender when low HP
        };

        chunkTerminals.push(bacEnt);
      }
    }

    // --- 5. POPULATE GRID HAZARDS: PULSING CYBER LASERS ---
    const laserSpawnThreshold = 0.4 / Math.max(1, this.currentStageConfig.hazardDensity || 1);
    const laserSeed = Math.abs(Math.sin(cx * 91.73 + cy * 33.41)) % 1;
    if (laserSeed > laserSpawnThreshold && !isSpawnChunk && !isObjectiveChunk) {
      const numLasers = 1 + (laserSeed > 0.65 ? 1 : 0);

      for (let l = 0; l < numLasers; l++) {
        const isHorizontal = l % 2 === 0;
        const lTileX = 3 + Math.floor(laserSeed * 8) + l * 4;
        const lTileY = 3 + Math.floor((1 - laserSeed) * 8) + l * 3;

        const laser = this.laserPool.acquire();
        laser.id = `laser_${cx}_${cy}_${l}`;
        laser.chunkKey = chunkKey;

        if (isHorizontal) {
          laser.startX = worldX + lTileX * tileSize;
          laser.startY = worldY + lTileY * tileSize + tileSize / 2;
          laser.endX = laser.startX + 4 * tileSize;
          laser.endY = laser.startY;
          laser.orientation = 'HORIZONTAL';
        } else {
          laser.startX = worldX + lTileX * tileSize + tileSize / 2;
          laser.startY = worldY + lTileY * tileSize;
          laser.endX = laser.startX;
          laser.endY = laser.startY + 4 * tileSize;
          laser.orientation = 'VERTICAL';
        }

        laser.state = 'OFF';
        laser.cycleTimer = Math.floor(laserSeed * 120);
        laser.chargeTime = 40;
        laser.fireTime = 80;
        laser.offTime = 70;
        laser.color = biome === 'TECH_CORE' ? '#00FF66' : '#FF0055';
        laser.damage = Math.round(20 * (this.currentStageConfig.hazardDensity || 1.0));
        laser.active = true;
        laser.disabled = false;

        chunkLasers.push(laser);
      }
    }

    // --- 6. POPULATE OBJECTIVE BIO-CORES ---
    if (isBioCore1Chunk || isBioCore2Chunk || isBioCore3Chunk) {
      const coreIdx = isBioCore1Chunk ? 1 : isBioCore2Chunk ? 2 : 3;
      const coreItem = this.collectiblePool.acquire();
      coreItem.id = ++this.idCounter;
      coreItem.type = 'ENCRYPTED_BIO_CORE';
      coreItem.position = {
        x: worldX + 10 * tileSize + tileSize / 2,
        y: worldY + 10 * tileSize + tileSize / 2,
      };
      coreItem.radius = 24;
      coreItem.collected = false;
      coreItem.glowColor = '#00f0ff';
      coreItem.animTimer = coreIdx * 1.5;
      coreItem.points = 1500;
      coreItem.coreIndex = coreIdx;
      coreItem.stackCount = 1;
      coreItem.healAmount = 30;
      chunkCollectibles.push(coreItem);
    }

    // --- 7. POPULATE IMMERSIVE COLLECTIBLES & POWERUPS ---
    const chipCount = 3 + Math.floor(laserSeed * 4);
    for (let c = 0; c < chipCount; c++) {
      const chipTileX = 1 + Math.floor(((c * 5.3 + cx) % (tileCount - 2)));
      const chipTileY = 1 + Math.floor(((c * 4.1 + cy) % (tileCount - 2)));

      const roll = (Math.sin(cx * 10 + cy * 5 + c) + 1) / 2;
      let type: Collectible['type'] = 'METALLIC_GOLD';
      let glow = '#ffd700';
      let pts = 200;
      let stackCount = 1;
      let healAmount = 0;

      if (roll < 0.18) {
        type = 'METALLIC_GOLD';
        glow = '#ffd700';
        pts = 200;
      } else if (roll < 0.32) {
        type = 'CASH_STACK';
        glow = '#00ff66';
        pts = 500;
        stackCount = 4 + Math.floor(((c + cx + cy) % 3));
      } else if (roll < 0.48) {
        type = 'BLOOD_PLASMA_CELL';
        glow = '#ff0033';
        pts = 250;
        healAmount = 25;
      } else if (roll < 0.60) {
        type = 'DATA_CHIP';
        glow = '#00FFD1';
        pts = 100;
      } else if (roll < 0.70) {
        type = 'SHIELD_NODE';
        glow = '#00FFD1';
        pts = 250;
      } else if (roll < 0.80) {
        type = 'OVERDRIVE_CELL';
        glow = '#FF00E5';
        pts = 350;
      } else if (roll < 0.90) {
        type = 'CHRONO_CRYSTAL';
        glow = '#00FF66';
        pts = 250;
      } else {
        type = 'WEAPON_TECH_PART';
        glow = '#FFE600';
        pts = 600;
        stackCount = 1;
      }

      const item = this.collectiblePool.acquire();
      item.id = ++this.idCounter;
      item.type = type;
      item.position = {
        x: worldX + chipTileX * tileSize + tileSize / 2,
        y: worldY + chipTileY * tileSize + tileSize / 2,
      };
      item.radius = type === 'CASH_STACK' ? 18 : type === 'METALLIC_GOLD' ? 15 : 16;
      item.collected = false;
      item.glowColor = glow;
      item.animTimer = (c * Math.PI) / 2;
      item.points = pts;
      item.stackCount = stackCount;
      item.healAmount = healAmount;

      chunkCollectibles.push(item);
    }

    return {
      chunkX: cx,
      chunkY: cy,
      tileSize,
      chunkSize: tileCount,
      pixelSize,
      worldX,
      worldY,
      tiles,
      entities: chunkTerminals,
      obstacles: chunkObstacles,
      lasers: chunkLasers,
      decor: chunkDecor,
      props: chunkProps,
      collectibles: chunkCollectibles,
      discovered: true,
      biome,
    };
  }

  /**
   * Recycle chunk items back into their respective object pools upon despawning
   */
  private recycleChunk(chunk: GridMapChunk) {
    this.obstaclePool.releaseAll(chunk.obstacles);
    this.laserPool.releaseAll(chunk.lasers);
    this.terminalPool.releaseAll(chunk.entities);
    this.decorPool.releaseAll(chunk.decor);
    if (chunk.props) {
      this.propPool.releaseAll(chunk.props);
      chunk.props = [];
    }
    this.collectiblePool.releaseAll(chunk.collectibles);

    chunk.obstacles = [];
    chunk.lasers = [];
    chunk.entities = [];
    chunk.decor = [];
    chunk.collectibles = [];
  }

  /**
   * Update Laser Hazard states and cycles
   */
  public updateLasers(
    playerBounds: BoundingBox,
    onPlayerHit: (damage: number, laserColor: string) => void
  ) {
    for (const laser of this.activeLasers) {
      if (!laser.active || laser.disabled) continue;

      laser.cycleTimer++;
      const totalCycle = laser.offTime + laser.chargeTime + laser.fireTime;
      const currentTick = laser.cycleTimer % totalCycle;

      if (currentTick < laser.offTime) {
        laser.state = 'OFF';
      } else if (currentTick < laser.offTime + laser.chargeTime) {
        laser.state = 'CHARGING';
      } else {
        laser.state = 'FIRING';

        // Check intersection with player bounding box during active laser beam firing
        const hit = this.checkLaserAABBIntersection(laser, playerBounds);
        if (hit) {
          onPlayerHit(laser.damage, laser.color);
        }
      }
    }
  }

  /**
   * Disable all lasers linked to a hacked terminal's chunk
   */
  public disableChunkLasers(chunkKey: string): number {
    let disabledCount = 0;
    for (const laser of this.activeLasers) {
      if (laser.chunkKey === chunkKey && !laser.disabled) {
        laser.disabled = true;
        laser.state = 'OFF';
        disabledCount++;
      }
    }
    return disabledCount;
  }

  /** Line segment vs AABB intersection test for Lasers */
  private checkLaserAABBIntersection(laser: LaserHazard, box: BoundingBox): boolean {
    const minX = Math.min(laser.startX, laser.endX) - 6;
    const maxX = Math.max(laser.startX, laser.endX) + 6;
    const minY = Math.min(laser.startY, laser.endY) - 6;
    const maxY = Math.max(laser.startY, laser.endY) + 6;

    // Fast bounding box reject
    if (
      box.x + box.width < minX ||
      box.x > maxX ||
      box.y + box.height < minY ||
      box.y > maxY
    ) {
      return false;
    }

    if (laser.orientation === 'HORIZONTAL') {
      const beamY = laser.startY;
      return (
        beamY >= box.y &&
        beamY <= box.y + box.height &&
        laser.endX >= box.x &&
        laser.startX <= box.x + box.width
      );
    } else {
      const beamX = laser.startX;
      return (
        beamX >= box.x &&
        beamX <= box.x + box.width &&
        laser.endY >= box.y &&
        laser.startY <= box.y + box.height
      );
    }
  }

  // =========================================================================
  // 4-SIDED AABB COLLISION RESOLUTION ENGINE
  // Handles approach collisions from all 4 sides: TOP, BOTTOM, LEFT, RIGHT
  // =========================================================================

  /**
   * Resolves player movement against all solid obstacles in active chunks
   * Accurately detects approach side (TOP, BOTTOM, LEFT, RIGHT) and prevents tunneling
   */
  public resolvePlayerCollision(
    currentPos: Vector2D,
    velocity: Vector2D,
    playerWidth: number,
    playerHeight: number
  ): {
    resolvedPos: Vector2D;
    resolvedVel: Vector2D;
    collisions: CollisionResult[];
  } {
    let resolvedX = currentPos.x + velocity.x;
    let resolvedY = currentPos.y + velocity.y;
    let finalVx = velocity.x;
    let finalVy = velocity.y;

    const collisions: CollisionResult[] = [];

    const halfW = playerWidth / 2;
    const halfH = playerHeight / 2;

    // Filter obstacles near player to avoid unnecessary calculations
    const broadPhaseMargin = 120;
    const nearbyObstacles = this.activeObstacles.filter((obs) => {
      return (
        obs.bounds.x + obs.bounds.width >= currentPos.x - broadPhaseMargin &&
        obs.bounds.x <= currentPos.x + broadPhaseMargin &&
        obs.bounds.y + obs.bounds.height >= currentPos.y - broadPhaseMargin &&
        obs.bounds.y <= currentPos.y + broadPhaseMargin
      );
    });

    // --- STEP 1: RESOLVE HORIZONTAL AXIS (X) ---
    // Test player's proposed X position against obstacle bounding boxes
    const playerBoxX: BoundingBox = {
      x: resolvedX - halfW,
      y: currentPos.y - halfH,
      width: playerWidth,
      height: playerHeight,
    };

    for (const obs of nearbyObstacles) {
      const b = obs.bounds;
      if (
        playerBoxX.x < b.x + b.width &&
        playerBoxX.x + playerBoxX.width > b.x &&
        playerBoxX.y < b.y + b.height &&
        playerBoxX.y + playerBoxX.height > b.y
      ) {
        if (velocity.x > 0) {
          // Approaching from LEFT side into obstacle's left boundary
          resolvedX = b.x - halfW;
          finalVx = 0;
          collisions.push({
            collided: true,
            side: 'LEFT',
            penetration: playerBoxX.x + playerBoxX.width - b.x,
            resolvedPosition: { x: resolvedX, y: currentPos.y },
            obstacleId: obs.id,
          });
        } else if (velocity.x < 0) {
          // Approaching from RIGHT side into obstacle's right boundary
          resolvedX = b.x + b.width + halfW;
          finalVx = 0;
          collisions.push({
            collided: true,
            side: 'RIGHT',
            penetration: b.x + b.width - playerBoxX.x,
            resolvedPosition: { x: resolvedX, y: currentPos.y },
            obstacleId: obs.id,
          });
        }
        playerBoxX.x = resolvedX - halfW;
      }
    }

    // --- STEP 2: RESOLVE VERTICAL AXIS (Y) ---
    // Test player's proposed Y position against obstacle bounding boxes
    const playerBoxY: BoundingBox = {
      x: resolvedX - halfW,
      y: resolvedY - halfH,
      width: playerWidth,
      height: playerHeight,
    };

    for (const obs of nearbyObstacles) {
      const b = obs.bounds;
      if (
        playerBoxY.x < b.x + b.width &&
        playerBoxY.x + playerBoxY.width > b.x &&
        playerBoxY.y < b.y + b.height &&
        playerBoxY.y + playerBoxY.height > b.y
      ) {
        if (velocity.y > 0) {
          // Approaching from TOP side into obstacle's top boundary
          resolvedY = b.y - halfH;
          finalVy = 0;
          collisions.push({
            collided: true,
            side: 'TOP',
            penetration: playerBoxY.y + playerBoxY.height - b.y,
            resolvedPosition: { x: resolvedX, y: resolvedY },
            obstacleId: obs.id,
          });
        } else if (velocity.y < 0) {
          // Approaching from BOTTOM side into obstacle's bottom boundary
          resolvedY = b.y + b.height + halfH;
          finalVy = 0;
          collisions.push({
            collided: true,
            side: 'BOTTOM',
            penetration: b.y + b.height - playerBoxY.y,
            resolvedPosition: { x: resolvedX, y: resolvedY },
            obstacleId: obs.id,
          });
        }
        playerBoxY.y = resolvedY - halfH;
      }
    }

    return {
      resolvedPos: { x: resolvedX, y: resolvedY },
      resolvedVel: { x: finalVx, y: finalVy },
      collisions,
    };
  }

  /**
   * Retrieves the Tile descriptor at the given 2D continuous world coordinates
   */
  public getTileAtWorldPosition(worldX: number, worldY: number): Tile | null {
    const cx = Math.floor(worldX / this.CHUNK_PIXEL_SIZE);
    const cy = Math.floor(worldY / this.CHUNK_PIXEL_SIZE);
    const chunkKey = this.getChunkKey(cx, cy);
    const chunk = this.loadedChunks.get(chunkKey);
    if (!chunk) return null;

    const relX = worldX - chunk.worldX;
    const relY = worldY - chunk.worldY;
    const tx = Math.floor(relX / this.TILE_SIZE);
    const ty = Math.floor(relY / this.TILE_SIZE);

    if (tx >= 0 && tx < this.CHUNK_TILE_COUNT && ty >= 0 && ty < this.CHUNK_TILE_COUNT) {
      return chunk.tiles[tx]?.[ty] || null;
    }
    return null;
  }

  /**
   * Checks if a continuous 2D world position lies directly inside a broken floor or chasm void hazard.
   * Dynamically aligns trigger collision bounds with the radial circular geometry of the 3D blast crater
   * and floor opening, applying an organic safe-ledge margin so moving along or grazing tile edges
   * on mobile analog joysticks never triggers a false fall.
   */
  public isPitHazardAt(worldX: number, worldY: number): boolean {
    const cx = Math.floor(worldX / this.CHUNK_PIXEL_SIZE);
    const cy = Math.floor(worldY / this.CHUNK_PIXEL_SIZE);
    const chunkKey = this.getChunkKey(cx, cy);
    const chunk = this.loadedChunks.get(chunkKey);
    if (!chunk) return false;

    const relX = worldX - chunk.worldX;
    const relY = worldY - chunk.worldY;
    const tx = Math.floor(relX / this.TILE_SIZE);
    const ty = Math.floor(relY / this.TILE_SIZE);

    if (tx >= 0 && tx < this.CHUNK_TILE_COUNT && ty >= 0 && ty < this.CHUNK_TILE_COUNT) {
      const tile = chunk.tiles[tx]?.[ty];
      if (!tile) return false;
      const isHazard = !!(tile.isPitHazard || tile.type === 'BROKEN_FLOOR' || tile.type === 'CHASM_VOID');
      if (!isHazard) return false;

      // Calculate center of this hazard tile
      const tileCenterX = chunk.worldX + tx * this.TILE_SIZE + this.TILE_SIZE / 2;
      const tileCenterY = chunk.worldY + ty * this.TILE_SIZE + this.TILE_SIZE / 2;

      // The 3D crater visual opening has a radius of ~0.38 - 0.42 * TILE_SIZE.
      // Active trigger boundary uses 0.35 * TILE_SIZE (17.5px on 50px tile) to guarantee
      // that only stepping directly into the open crater abyss triggers a fall.
      const dx = worldX - tileCenterX;
      const dy = worldY - tileCenterY;
      const distFromCenter = Math.hypot(dx, dy);

      // Check if neighboring tiles are also pit hazards (forming an extended chasm fissure)
      const hasNeighborPit = (nx: number, ny: number) => {
        if (nx >= 0 && nx < this.CHUNK_TILE_COUNT && ny >= 0 && ny < this.CHUNK_TILE_COUNT) {
          const nTile = chunk.tiles[nx]?.[ny];
          return !!(nTile && (nTile.isPitHazard || nTile.type === 'BROKEN_FLOOR' || nTile.type === 'CHASM_VOID'));
        }
        return false;
      };

      const hasWest = hasNeighborPit(tx - 1, ty);
      const hasEast = hasNeighborPit(tx + 1, ty);
      const hasNorth = hasNeighborPit(tx, ty - 1);
      const hasSouth = hasNeighborPit(tx, ty + 1);

      // If isolated pit crater, check radial distance from center
      if (!hasWest && !hasEast && !hasNorth && !hasSouth) {
        return distFromCenter <= this.TILE_SIZE * 0.35;
      }

      // If part of a continuous fissure corridor, allow passage between connected pit cells with edge margin
      const margin = 8; // 8px safe perimeter margin from solid asphalt edges
      const insideX = (hasWest || dx >= -this.TILE_SIZE / 2 + margin) && (hasEast || dx <= this.TILE_SIZE / 2 - margin);
      const insideY = (hasNorth || dy >= -this.TILE_SIZE / 2 + margin) && (hasSouth || dy <= this.TILE_SIZE / 2 - margin);

      return insideX && insideY;
    }
    return false;
  }
}
