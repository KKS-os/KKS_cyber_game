import { Camera2D, CyberEnvironmentProp, Vector2D } from './types';
import { gameAssets } from './assetLoader';

/**
 * High-Performance Procedural Parallax Cyberpunk City & Environment Prop Renderer
 * Renders multi-layer distant skylines, flying traffic, glowing holographic billboards,
 * and high-fidelity cyber-trees, streetlights, and architectural rooftop props.
 */

// Cached skyline seeds for consistent parallax rendering across camera movement
interface Skyscraper {
  x: number;
  width: number;
  height: number;
  color: string;
  windowColor: string;
  hasSpire: boolean;
  spireHeight: number;
  neonSign?: {
    text: string;
    color: string;
    vertical: boolean;
  };
  windows: Array<{ xPct: number; yPct: number; lit: boolean }>;
}

interface SkyTrafficVehicle {
  id: number;
  y: number;
  speed: number;
  length: number;
  color: string;
  headlightColor: string;
  direction: 1 | -1;
  baseX: number;
}

// Generate static procedural skyline layers
const FAR_BUILDINGS: Skyscraper[] = generateSkylineLayer(40, 180, 420, '#0a0618', '#1a0f35', 12345);
const MID_BUILDINGS: Skyscraper[] = generateSkylineLayer(35, 120, 320, '#100a24', '#261447', 67890);
const NEAR_BUILDINGS: Skyscraper[] = generateSkylineLayer(25, 80, 240, '#180f33', '#351c62', 11223);

// Generate flying aerial sky-traffic (spinners)
const SKY_TRAFFIC: SkyTrafficVehicle[] = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  y: 60 + (i * 35) % 300,
  speed: (i % 2 === 0 ? 1 : -1) * (0.8 + (i % 5) * 0.4),
  length: 18 + (i % 4) * 8,
  color: i % 3 === 0 ? '#ff0055' : i % 3 === 1 ? '#00ffd1' : '#ffe600',
  headlightColor: i % 2 === 0 ? '#ffffff' : '#00ffd1',
  direction: i % 2 === 0 ? 1 : -1,
  baseX: (i * 240) % 3000,
}));

function generateSkylineLayer(
  count: number,
  minW: number,
  maxH: number,
  baseCol: string,
  accentCol: string,
  seed: number
): Skyscraper[] {
  const buildings: Skyscraper[] = [];
  let currentX = -1000;

  const neonSigns = [
    { text: 'KKS', color: '#FFD700', vertical: true },
    { text: 'Cyber Game', color: '#FFB900', vertical: false },
    { text: 'Burma Batik', color: '#FFE600', vertical: false },
    { text: 'KKS CORP', color: '#FFD700', vertical: false },
    { text: 'BURMA BATIK', color: '#FFB900', vertical: true },
    { text: 'CYBER GAME', color: '#FFE600', vertical: true },
    { text: 'CYBER', color: '#ff0055', vertical: true },
    { text: 'ARASAKA', color: '#ff3366', vertical: false },
    { text: '新東京', color: '#00ffd1', vertical: true },
    { text: 'SYNTH', color: '#9d00ff', vertical: false },
    { text: 'NEO-TECH', color: '#ffe600', vertical: true },
  ];

  for (let i = 0; i < count; i++) {
    const pseudoRand = Math.abs(Math.sin(seed + i * 37.17));
    const pseudoRand2 = Math.abs(Math.cos(seed + i * 19.83));
    const width = minW + pseudoRand * 160;
    const height = 180 + pseudoRand2 * (maxH - 180);
    const hasSpire = pseudoRand > 0.45;
    const spireHeight = 25 + pseudoRand2 * 50;

    // Generate random window grid
    const windows: Array<{ xPct: number; yPct: number; lit: boolean }> = [];
    const cols = 3 + Math.floor(pseudoRand * 4);
    const rows = 6 + Math.floor(pseudoRand2 * 12);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = (pseudoRand * (r + 1) + pseudoRand2 * (c + 1)) % 1 > 0.42;
        windows.push({
          xPct: (c + 0.5) / cols,
          yPct: (r + 0.5) / rows,
          lit,
        });
      }
    }

    const hasSign = pseudoRand > 0.7;
    const sign = hasSign ? neonSigns[i % neonSigns.length] : undefined;

    buildings.push({
      x: currentX,
      width,
      height,
      color: i % 2 === 0 ? baseCol : accentCol,
      windowColor: i % 3 === 0 ? '#00ffd1' : i % 3 === 1 ? '#ffe600' : '#ff0055',
      hasSpire,
      spireHeight,
      neonSign: sign,
      windows,
    });

    currentX += width + 15 + pseudoRand * 40;
  }

  return buildings;
}

/**
 * 1. PARALLAX CYBER BACKGROUND RENDERER
 * Renders multiple depth layers moving at fractional camera scroll speeds
 */
export function renderParallaxCyberBackground(
  ctx: CanvasRenderingContext2D,
  camera: Camera2D,
  viewW: number,
  viewH: number
) {
  const time = performance.now() * 0.001;

  ctx.save();

  // 1A. Deep Night Sky Gradient with Cyberpunk Smog Pollution
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  skyGrad.addColorStop(0, '#020108');
  skyGrad.addColorStop(0.35, '#070314');
  skyGrad.addColorStop(0.7, '#120726');
  skyGrad.addColorStop(0.9, '#1d0833');
  skyGrad.addColorStop(1, '#0c031c');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // 1A-2. Photorealistic Megacity Backdrop Layer (Ultra-realistic matte painting with slow parallax)
  if (gameAssets.bgCity.complete && gameAssets.bgCity.naturalWidth > 0) {
    ctx.save();
    const bgImg = gameAssets.bgCity;
    const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
    const targetH = viewH * 1.05;
    const targetW = targetH * imgAspect;
    const scrollOffset = ((camera.position.x * 0.03) % targetW);
    const startX = -scrollOffset;

    ctx.globalAlpha = 0.85;
    for (let x = startX - targetW; x < viewW + targetW; x += targetW) {
      ctx.drawImage(bgImg, x, 0, targetW, targetH);
    }

    // Atmospheric dark volumetric fog overlay over base painting
    const fogOverlay = ctx.createLinearGradient(0, 0, 0, viewH);
    fogOverlay.addColorStop(0, 'rgba(2, 1, 8, 0.45)');
    fogOverlay.addColorStop(0.5, 'rgba(10, 3, 22, 0.2)');
    fogOverlay.addColorStop(1, 'rgba(12, 3, 28, 0.85)');
    ctx.fillStyle = fogOverlay;
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.restore();
  }

  // 1B. Distant City Atmospheric Horizon Neon Dome Haze
  const hazeGrad = ctx.createRadialGradient(
    viewW * 0.5,
    viewH * 0.95,
    viewW * 0.1,
    viewW * 0.5,
    viewH * 0.95,
    viewW * 0.75
  );
  hazeGrad.addColorStop(0, 'rgba(255, 0, 128, 0.16)');
  hazeGrad.addColorStop(0.5, 'rgba(0, 255, 209, 0.08)');
  hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // 1C. Distant Holographic Celestial Moon / Megacity Orbital Ring
  renderDistantHoloMoon(ctx, viewW, viewH, time);

  // 1D. LAYER 1: Ultra-Distant Monolithic Megastructure Skyline (0.05x scroll)
  renderSkylineLayer(ctx, FAR_BUILDINGS, camera.position.x * 0.04, camera.position.y * 0.02, viewW, viewH, 0.4, time);

  // 1E. Distant Flying Aerial Spinner Highways (0.1x scroll)
  renderSkyTraffic(ctx, SKY_TRAFFIC, camera.position.x * 0.08, viewW, viewH, time);

  // 1F. LAYER 2: Mid-Distance High-Rise Towers & Skybridges (0.15x scroll)
  renderSkylineLayer(ctx, MID_BUILDINGS, camera.position.x * 0.14, camera.position.y * 0.05, viewW, viewH, 0.7, time);

  // 1G. LAYER 3: Near-Distance Megatower Spindles & Neon Billboards (0.30x scroll)
  renderSkylineLayer(ctx, NEAR_BUILDINGS, camera.position.x * 0.28, camera.position.y * 0.1, viewW, viewH, 0.95, time);

  // 1H. Distant High-Speed Maglev Rail Line (0.35x scroll)
  renderMaglevTransit(ctx, camera.position.x * 0.35, camera.position.y * 0.12, viewW, viewH, time);

  ctx.restore();
}

/**
 * Render Distant Holographic Megacity Orbital Moon
 */
function renderDistantHoloMoon(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, time: number) {
  const moonX = viewW * 0.75;
  const moonY = viewH * 0.22;
  const radius = 65;

  ctx.save();
  // Moon Core
  const moonGrad = ctx.createRadialGradient(moonX, moonY, radius * 0.2, moonX, moonY, radius);
  moonGrad.addColorStop(0, 'rgba(0, 255, 209, 0.22)');
  moonGrad.addColorStop(0.7, 'rgba(157, 0, 255, 0.12)');
  moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Hologram Grid Scanlines
  ctx.strokeStyle = 'rgba(0, 255, 209, 0.15)';
  ctx.lineWidth = 1;
  for (let i = -radius + 10; i < radius; i += 12) {
    const halfChord = Math.sqrt(radius * radius - i * i);
    ctx.beginPath();
    ctx.moveTo(moonX - halfChord, moonY + i);
    ctx.lineTo(moonX + halfChord, moonY + i);
    ctx.stroke();
  }

  // Orbital Ring
  ctx.strokeStyle = 'rgba(255, 0, 128, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(moonX, moonY, radius * 1.5, radius * 0.35, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render a Parallax Skyline Layer with dynamic windows and neon billboards
 */
function renderSkylineLayer(
  ctx: CanvasRenderingContext2D,
  buildings: Skyscraper[],
  scrollX: number,
  scrollY: number,
  viewW: number,
  viewH: number,
  alpha: number,
  time: number
) {
  const totalWidth = 3500;
  const baselineY = viewH * 0.95 - scrollY;

  ctx.save();
  ctx.globalAlpha = alpha;

  for (const b of buildings) {
    // Wrap around for infinite scrolling
    let renderX = ((b.x - scrollX) % totalWidth);
    if (renderX < -b.width - 200) renderX += totalWidth;
    if (renderX > viewW + 200) continue;

    const bTop = baselineY - b.height;

    // Building Body
    ctx.fillStyle = b.color;
    ctx.fillRect(renderX, bTop, b.width, b.height + 300);

    // Neon Roof Trim
    ctx.strokeStyle = b.windowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(renderX, bTop);
    ctx.lineTo(renderX + b.width, bTop);
    ctx.stroke();

    // Rooftop Spire
    if (b.hasSpire) {
      const spireX = renderX + b.width * 0.5;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(spireX, bTop);
      ctx.lineTo(spireX, bTop - b.spireHeight);
      ctx.stroke();

      // Blinking Warning Beacon
      const blink = Math.sin(time * 4 + b.x) > 0.1;
      if (blink) {
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(spireX, bTop - b.spireHeight, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Windows Matrix
    ctx.fillStyle = b.windowColor;
    for (const win of b.windows) {
      if (!win.lit) continue;
      const wx = renderX + win.xPct * (b.width - 12) + 6;
      const wy = bTop + win.yPct * (b.height - 30) + 15;
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillRect(wx, wy, 3, 5);
    }
    ctx.globalAlpha = alpha;

    // Glowing Neon Signs on Facades
    if (b.neonSign) {
      const sign = b.neonSign;
      const flicker = Math.sin(time * 6 + b.x * 2) > -0.7 ? 1 : 0.2;
      ctx.save();
      ctx.fillStyle = sign.color;
      ctx.shadowColor = sign.color;
      ctx.shadowBlur = 12 * flicker;
      ctx.globalAlpha = alpha * flicker;
      ctx.font = 'bold 11px "Orbitron", monospace';
      ctx.textAlign = 'center';

      if (sign.vertical) {
        const signX = renderX + b.width - 16;
        for (let c = 0; c < sign.text.length; c++) {
          ctx.fillText(sign.text[c], signX, bTop + 30 + c * 14);
        }
      } else {
        ctx.fillText(sign.text, renderX + b.width * 0.5, bTop + 24);
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Render Distant Flying Air Traffic (Spinners)
 */
function renderSkyTraffic(
  ctx: CanvasRenderingContext2D,
  traffic: SkyTrafficVehicle[],
  scrollX: number,
  viewW: number,
  viewH: number,
  time: number
) {
  const totalW = 3200;
  ctx.save();

  for (const car of traffic) {
    const currentPos = (car.baseX + car.speed * time * 90 - scrollX) % totalW;
    const x = currentPos < -100 ? currentPos + totalW : currentPos;
    if (x > viewW + 100) continue;

    const y = car.y;

    // Red Tail-light Streak
    ctx.strokeStyle = car.color;
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - car.direction * car.length, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Headlight Point
    ctx.fillStyle = car.headlightColor;
    ctx.shadowColor = car.headlightColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render Distant High-Speed Maglev Monorail Transit
 */
function renderMaglevTransit(
  ctx: CanvasRenderingContext2D,
  scrollX: number,
  scrollY: number,
  viewW: number,
  viewH: number,
  time: number
) {
  const railY = viewH * 0.82 - scrollY;
  ctx.save();

  // Maglev Track Beam
  ctx.strokeStyle = 'rgba(0, 255, 209, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, railY);
  ctx.lineTo(viewW, railY);
  ctx.stroke();

  // Support Pillars
  const pillarDist = 300;
  const pillarOffset = ((-scrollX) % pillarDist + pillarDist) % pillarDist;
  ctx.strokeStyle = 'rgba(15, 9, 32, 0.8)';
  ctx.lineWidth = 6;
  for (let px = pillarOffset; px < viewW; px += pillarDist) {
    ctx.beginPath();
    ctx.moveTo(px, railY);
    ctx.lineTo(px, viewH);
    ctx.stroke();
  }

  // Maglev Train Bullet
  const trainLoop = 4000;
  const trainSpeed = 380;
  const trainPos = ((time * trainSpeed - scrollX) % trainLoop + trainLoop) % trainLoop;
  const trainX = trainPos - 400;

  if (trainX > -300 && trainX < viewW + 300) {
    const trainLen = 220;
    // Glow streak
    const trainGrad = ctx.createLinearGradient(trainX, railY, trainX + trainLen, railY);
    trainGrad.addColorStop(0, 'rgba(0, 255, 209, 0)');
    trainGrad.addColorStop(0.2, '#00ffd1');
    trainGrad.addColorStop(0.8, '#ffffff');
    trainGrad.addColorStop(1, '#00ffd1');

    ctx.strokeStyle = trainGrad;
    ctx.shadowColor = '#00ffd1';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(trainX, railY - 2);
    ctx.lineTo(trainX + trainLen, railY - 2);
    ctx.stroke();

    // Passenger Window Dots
    ctx.fillStyle = '#ffffff';
    for (let w = 20; w < trainLen - 20; w += 16) {
      ctx.fillRect(trainX + w, railY - 5, 8, 2);
    }
  }

  ctx.restore();
}

/**
 * 2. PROCEDURAL ENVIRONMENT PROPS RENDERER
 * Renders Holographic Cyber-Trees, Modern Streetlights, Hologram Billboards,
 * Rooftop HVAC units, Comms Spindles & Server Cabinets.
 */
export function renderCyberEnvironmentProps(
  ctx: CanvasRenderingContext2D,
  props: CyberEnvironmentProp[],
  cameraX: number,
  cameraY: number,
  viewW: number,
  viewH: number
) {
  const time = performance.now() * 0.001;
  const halfW = viewW * 0.5 + 200;
  const halfH = viewH * 0.5 + 200;

  for (const prop of props) {
    if (!prop.active) continue;

    // Viewport Frustum Culling
    if (
      prop.position.x < cameraX - halfW ||
      prop.position.x > cameraX + halfW ||
      prop.position.y < cameraY - halfH ||
      prop.position.y > cameraY + halfH
    ) {
      continue;
    }

    ctx.save();
    ctx.translate(prop.position.x, prop.position.y);

    switch (prop.type) {
      case 'CYBER_TREE':
        renderCyberTree(ctx, prop, time);
        break;
      case 'STREET_LIGHT':
        renderStreetLight(ctx, prop, time);
        break;
      case 'HOLO_BILLBOARD':
        renderHoloBillboard(ctx, prop, time);
        break;
      case 'ROOFTOP_HVAC':
        renderRooftopHVAC(ctx, prop, time);
        break;
      case 'COMMS_ANTENNA':
        renderCommsAntenna(ctx, prop, time);
        break;
      case 'COOLANT_PIPES':
        renderCoolantPipes(ctx, prop, time);
        break;
      case 'SERVER_STACK':
        renderServerStack(ctx, prop, time);
        break;
    }

    ctx.restore();
  }
}

/**
 * Render Digital Holographic Cyber-Tree
 * Features geometric wireframe digital trunks and floating pulsing data leaves
 */
function renderCyberTree(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const data = prop.treeData;
  if (!data) return;

  const sway = Math.sin(time * data.swaySpeed + prop.animPhase) * 0.04;

  ctx.save();

  // 1. Digital Root Planter Base / Cybernetic Socket
  ctx.fillStyle = '#0e0a1e';
  ctx.strokeStyle = prop.glowColor;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = prop.glowColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.lineTo(12, 8);
  ctx.lineTo(-12, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Ground Hologram Pulse Ring
  const pulse = (time * 1.5 + prop.animPhase) % 1;
  ctx.strokeStyle = `rgba(0, 255, 209, ${0.4 * (1 - pulse)})`;
  ctx.beginPath();
  ctx.ellipse(0, 2, 28 * pulse, 8 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Trunk & Geometric Hologram Branches
  ctx.rotate(sway);
  for (const branch of data.branches) {
    const branchGrad = ctx.createLinearGradient(branch.startX, branch.startY, branch.endX, branch.endY);
    branchGrad.addColorStop(0, data.trunkColor);
    branchGrad.addColorStop(1, data.foliageColor);

    ctx.strokeStyle = branchGrad;
    ctx.lineWidth = Math.max(1, 4 - branch.depth * 0.8);
    ctx.beginPath();
    ctx.moveTo(branch.startX, branch.startY);
    ctx.lineTo(branch.endX, branch.endY);
    ctx.stroke();

    // Data Intersection Node
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = prop.glowColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(branch.endX, branch.endY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Floating Hologram Leaves / Hexagon Blossom Clusters
    for (const leaf of branch.leafNodes) {
      const leafSwayX = Math.sin(time * 2.5 + leaf.phase) * 3;
      const leafSwayY = Math.cos(time * 2.0 + leaf.phase) * 3;
      const lx = branch.endX + leaf.x + leafSwayX;
      const ly = branch.endY + leaf.y + leafSwayY;

      // Hexagon Data Petal
      ctx.fillStyle = data.foliageColor;
      ctx.shadowColor = data.foliageColor;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.75 + Math.sin(time * 3 + leaf.phase) * 0.25;

      ctx.beginPath();
      const r = leaf.size;
      for (let a = 0; a < 6; a++) {
        const angle = (a * Math.PI) / 3;
        const hx = lx + Math.cos(angle) * r;
        const hy = ly + Math.sin(angle) * r;
        if (a === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();

      // Bright Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx - 1, ly - 1, 2, 2);
    }
  }

  ctx.restore();
}

/**
 * Render Sleek Cyberpunk Streetlight & Volumetric Light Cone
 */
function renderStreetLight(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const data = prop.lightData;
  if (!data) return;

  const h = data.height;
  const isLeft = data.armDirection === 'LEFT';
  const armSign = isLeft ? -1 : 1;
  const lampHeadX = armSign * 28;
  const lampHeadY = -h;

  ctx.save();

  // 1. Sleek Carbon Post
  ctx.strokeStyle = '#1d1733';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -h + 12);
  ctx.lineTo(lampHeadX, lampHeadY);
  ctx.stroke();

  // Post Neon Accent Line
  ctx.strokeStyle = prop.accentColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -h + 10);
  ctx.lineTo(lampHeadX, lampHeadY);
  ctx.stroke();

  // Base Junction Box
  ctx.fillStyle = '#0c0818';
  ctx.strokeStyle = prop.glowColor;
  ctx.lineWidth = 1;
  ctx.fillRect(-5, -8, 10, 8);
  ctx.strokeRect(-5, -8, 10, 8);

  // Status LED Indicator
  const blink = Math.sin(time * 3) > 0;
  ctx.fillStyle = blink ? prop.glowColor : '#333333';
  ctx.fillRect(-2, -6, 4, 3);

  // 2. Luminaire Lamp Head Emitter
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = prop.glowColor;
  ctx.shadowBlur = 8;
  ctx.fillRect(lampHeadX - 4, lampHeadY - 2, 8, 3);
  ctx.shadowBlur = 0;

  // Subtle Ground Pool Accent (Non-intrusive)
  const coneH = data.coneLength || 100;
  const poolGrad = ctx.createRadialGradient(
    lampHeadX + armSign * 10,
    lampHeadY + coneH,
    2,
    lampHeadX + armSign * 10,
    lampHeadY + coneH,
    24
  );
  poolGrad.addColorStop(0, `rgba(0, 255, 209, ${0.15 * data.intensity})`);
  poolGrad.addColorStop(1, 'rgba(0, 255, 209, 0)');
  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.ellipse(lampHeadX + armSign * 10, lampHeadY + coneH, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Render Floating Hologram Billboard & Cyber Signage
 */
function renderHoloBillboard(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const data = prop.billboardData;
  if (!data) return;

  const w = prop.width || 90;
  const h = prop.height || 45;
  const flicker = Math.sin(time * 8 + prop.animPhase) > -0.85 ? 1 : 0.3;

  ctx.save();
  ctx.globalAlpha = 0.85 * flicker;

  // Projector Mount
  ctx.fillStyle = '#16102a';
  ctx.strokeStyle = prop.glowColor;
  ctx.lineWidth = 1;
  ctx.fillRect(-10, 0, 20, 6);
  ctx.strokeRect(-10, 0, 20, 6);

  // Hologram Frame
  const frameY = -h - 15;
  ctx.fillStyle = 'rgba(10, 5, 25, 0.75)';
  ctx.strokeStyle = prop.glowColor;
  ctx.shadowColor = prop.glowColor;
  ctx.shadowBlur = 12 * flicker;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-w * 0.5, frameY, w, h);
  ctx.strokeRect(-w * 0.5, frameY, w, h);

  // Scanlines
  ctx.strokeStyle = `rgba(0, 255, 209, 0.15)`;
  ctx.lineWidth = 1;
  for (let y = frameY + 4; y < frameY + h - 2; y += 5) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5 + 4, y);
    ctx.lineTo(w * 0.5 - 4, y);
    ctx.stroke();
  }

  // Billboard Text
  ctx.fillStyle = prop.glowColor;
  ctx.font = '900 13px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.text, 0, frameY + h * 0.5 + (data.subText ? -2 : 4));

  if (data.subText) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px "Orbitron", monospace';
    ctx.fillText(data.subText, 0, frameY + h * 0.5 + 12);
  }

  ctx.restore();
}

/**
 * Render Rooftop Industrial HVAC Ventilation with Spinning Cyber Fan
 */
function renderRooftopHVAC(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const w = prop.width || 50;
  const h = prop.height || 36;
  const fanAngle = time * 6 + prop.animPhase;

  ctx.save();

  // Metal Casing
  ctx.fillStyle = '#140f24';
  ctx.strokeStyle = '#2d1f4d';
  ctx.lineWidth = 2;
  ctx.fillRect(-w * 0.5, -h, w, h);
  ctx.strokeRect(-w * 0.5, -h, w, h);

  // Neon Trim
  ctx.strokeStyle = prop.glowColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(-w * 0.5 + 3, -h + 3, w - 6, h - 6);

  // Fan Grille Circle
  const fanX = 0;
  const fanY = -h * 0.5;
  const fanRadius = 14;

  ctx.fillStyle = '#080511';
  ctx.beginPath();
  ctx.arc(fanX, fanY, fanRadius, 0, Math.PI * 2);
  ctx.fill();

  // Spinning Blades
  ctx.strokeStyle = prop.glowColor;
  ctx.lineWidth = 2;
  for (let b = 0; b < 4; b++) {
    const angle = fanAngle + (b * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(fanX, fanY);
    ctx.lineTo(fanX + Math.cos(angle) * fanRadius, fanY + Math.sin(angle) * fanRadius);
    ctx.stroke();
  }

  // Steam Puff Emission
  const steamPuff = Math.sin(time * 3 + prop.animPhase);
  if (steamPuff > 0) {
    ctx.fillStyle = `rgba(0, 240, 255, ${0.25 * steamPuff})`;
    ctx.beginPath();
    ctx.arc(fanX, -h - 8 * steamPuff, 8 + steamPuff * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render Communications Tower / Radar Antenna
 */
function renderCommsAntenna(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const data = prop.antennaData;
  const h = data?.height || 75;

  ctx.save();

  // Lattice Spire
  ctx.strokeStyle = '#1f1636';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(0, -h);
  ctx.lineTo(10, 0);
  ctx.stroke();

  // Cross Bracing
  ctx.strokeStyle = '#2d2050';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 15) {
    const t = y / h;
    const w = 10 * (1 - t);
    ctx.beginPath();
    ctx.moveTo(-w, -y);
    ctx.lineTo(w, -y);
    ctx.stroke();
  }

  // Rotating Radar Dish / Transmitter Ring
  const dishAngle = time * 2 + prop.animPhase;
  const dishW = Math.cos(dishAngle) * 16;
  ctx.strokeStyle = prop.glowColor;
  ctx.shadowColor = prop.glowColor;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -h + 18, Math.abs(dishW), 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Pinnacle Beacon Light
  const beaconBlink = Math.sin(time * 5 + prop.animPhase) > 0;
  ctx.fillStyle = beaconBlink ? (data?.beaconColor || '#ff0055') : '#330011';
  ctx.shadowColor = data?.beaconColor || '#ff0055';
  ctx.shadowBlur = beaconBlink ? 12 : 0;
  ctx.beginPath();
  ctx.arc(0, -h, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Render Glowing Coolant Pipe Systems
 */
function renderCoolantPipes(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const w = prop.width || 70;
  const h = prop.height || 14;

  ctx.save();

  // Outer Pipe Conduit
  ctx.fillStyle = '#100b20';
  ctx.strokeStyle = '#261b40';
  ctx.lineWidth = 2;
  ctx.fillRect(-w * 0.5, -h, w, h);
  ctx.strokeRect(-w * 0.5, -h, w, h);

  // Glowing Plasma Coolant Core
  const pulse = Math.sin(time * 4 + prop.animPhase) * 0.2 + 0.8;
  ctx.strokeStyle = prop.glowColor;
  ctx.shadowColor = prop.glowColor;
  ctx.shadowBlur = 10 * pulse;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5 + 4, -h * 0.5);
  ctx.lineTo(w * 0.5 - 4, -h * 0.5);
  ctx.stroke();

  // Pipe Couplings / Mounting Brackets
  ctx.fillStyle = '#2c1e4c';
  for (let x = -w * 0.5 + 10; x < w * 0.5; x += 22) {
    ctx.fillRect(x - 3, -h - 2, 6, h + 4);
  }

  ctx.restore();
}

/**
 * Render Server Cabinet Stack with Flickering Activity LEDs
 */
function renderServerStack(ctx: CanvasRenderingContext2D, prop: CyberEnvironmentProp, time: number) {
  const w = prop.width || 28;
  const h = prop.height || 48;

  ctx.save();

  // Rack Casing
  ctx.fillStyle = '#0b0816';
  ctx.strokeStyle = '#1e1438';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-w * 0.5, -h, w, h);
  ctx.strokeRect(-w * 0.5, -h, w, h);

  // Status LED Grid
  const rows = 6;
  const ledsPerRow = 3;
  for (let r = 0; r < rows; r++) {
    const unitY = -h + 6 + r * 7;
    // Server Blade Divider
    ctx.strokeStyle = '#180f30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5 + 2, unitY + 5);
    ctx.lineTo(w * 0.5 - 2, unitY + 5);
    ctx.stroke();

    for (let l = 0; l < ledsPerRow; l++) {
      const ledX = -w * 0.5 + 5 + l * 6;
      const ledLit = Math.sin(time * (10 + l * 4) + r * 1.7 + prop.animPhase) > 0.1;
      ctx.fillStyle = ledLit ? (l === 0 ? '#39ff14' : l === 1 ? '#00ffd1' : '#ff0055') : '#111111';
      ctx.fillRect(ledX, unitY, 2.5, 2.5);
    }
  }

  ctx.restore();
}
