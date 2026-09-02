import { Collectible, Vector2D } from './types';
import { gameAssets } from './assetLoader';

/**
 * High-Fidelity Interactive Item & Collectible Render Modules
 * Specialized canvas pipelines for:
 * 1. True Metallic Gold ($): Multi-layered angular gold gradients with player proximity light reflection
 * 2. Physical Cash Stacks: Layered banknote packs with micro-shadowing lines & multi-phase cosine displacement
 * 3. Visceral Blood/Plasma Cell Recovery: Organic crimson bio-cells with glowing cores & composite illumination
 */

// ============================================================================
// 1. TRUE METALLIC GOLD ($) COIN RENDERER
// ============================================================================

/**
 * Renders a shiny 2D metallic gold coin with multi-layered angular gradients
 * and dynamic light reflection calculated from player coordinate proximity.
 */
export function renderMetallicGoldCoin(
  ctx: CanvasRenderingContext2D,
  item: Collectible,
  playerPos: Vector2D
) {
  ctx.save();
  ctx.translate(item.position.x, item.position.y);

  // Time-based animations
  const t = item.animTimer;
  // Multi-phase floating bob
  const floatBob = Math.sin(t * 2.0) * 3.5 + Math.sin(t * 4.2) * 1.0;
  ctx.translate(0, floatBob);

  // 3D spin perspective: Horizontal scale oscillation simulating coin rotation
  const spinFactor = Math.cos(t * 1.8);
  const absSpin = Math.max(0.12, Math.abs(spinFactor));
  const isBackFacing = spinFactor < 0;

  // Calculate dynamic light angle & intensity relative to player coordinate proximity
  const dx = playerPos.x - item.position.x;
  const dy = playerPos.y - (item.position.y + floatBob);
  const distToPlayer = Math.hypot(dx, dy);
  const proximityFactor = Math.max(0, Math.min(1, 1 - distToPlayer / 450)); // [0, 1]
  const playerAngle = Math.atan2(dy, dx);

  // Light source angle shifts smoothly between ambient light (upper-left) and dynamic player flash
  const ambientLightAngle = -Math.PI / 4 + t * 0.4;
  const dynamicLightAngle = playerAngle + Math.PI; // Light reflected back towards player
  const lightAngle = ambientLightAngle * (1 - proximityFactor * 0.6) + dynamicLightAngle * (proximityFactor * 0.6);

  const radius = item.radius || 15;
  const coinWidth = radius * absSpin;
  const coinHeight = radius;

  // --- Dynamic Ambient & Proximity Glow ---
  ctx.save();
  const auraGlow = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 2.2);
  const glowAlpha = 0.25 + proximityFactor * 0.4 + Math.sin(t * 3.5) * 0.1;
  auraGlow.addColorStop(0, `rgba(255, 215, 0, ${glowAlpha})`);
  auraGlow.addColorStop(0.5, `rgba(255, 170, 0, ${glowAlpha * 0.4})`);
  auraGlow.addColorStop(1, 'rgba(255, 140, 0, 0)');
  ctx.fillStyle = auraGlow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 1. Coin 3D Extruded Edge / Rim Depth ---
  const edgeThickness = 3.5 * (1 - absSpin * 0.5);
  const edgeSide = spinFactor >= 0 ? 1 : -1;
  if (absSpin < 0.95) {
    ctx.save();
    const edgeGrad = ctx.createLinearGradient(-coinWidth, -coinHeight, coinWidth, coinHeight);
    edgeGrad.addColorStop(0, '#5a3d00');
    edgeGrad.addColorStop(0.3, '#b8860b');
    edgeGrad.addColorStop(0.5, '#ffd700');
    edgeGrad.addColorStop(0.7, '#8b6508');
    edgeGrad.addColorStop(1, '#3b2800');
    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.ellipse(edgeSide * edgeThickness * 0.5, 0, coinWidth, coinHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- 2. Outer Beveled Metallic Rim (Multi-Layered Angular Gold Gradient) ---
  ctx.save();
  const lx = Math.cos(lightAngle) * radius;
  const ly = Math.sin(lightAngle) * radius;
  const rimGrad = ctx.createLinearGradient(-lx, -ly, lx, ly);
  rimGrad.addColorStop(0, '#4a3000');
  rimGrad.addColorStop(0.18, '#8c5b05');
  rimGrad.addColorStop(0.35, '#d4af37');
  rimGrad.addColorStop(0.48, '#fff3b0');
  rimGrad.addColorStop(0.52, '#ffffff'); // Specular highlight peak
  rimGrad.addColorStop(0.58, '#fff3b0');
  rimGrad.addColorStop(0.75, '#d4af37');
  rimGrad.addColorStop(0.9, '#8c5b05');
  rimGrad.addColorStop(1, '#3d2500');

  ctx.fillStyle = rimGrad;
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 10 + proximityFactor * 16;
  ctx.beginPath();
  ctx.ellipse(0, 0, coinWidth, coinHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 3. Micro-Milled Edge Notches (Concentric Coin Ridges) ---
  if (absSpin > 0.4) {
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 48, 0, 0.4)';
    ctx.lineWidth = 1;
    const notchCount = 16;
    for (let i = 0; i < notchCount; i++) {
      const a = (i / notchCount) * Math.PI * 2;
      const nx = Math.cos(a) * (coinWidth - 1);
      const ny = Math.sin(a) * (coinHeight - 1);
      const inX = Math.cos(a) * (coinWidth - 3);
      const inY = Math.sin(a) * (coinHeight - 3);
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(inX, inY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- 4. Inner Recessed Mirror Coin Disc ---
  ctx.save();
  const innerW = Math.max(1, coinWidth * 0.78);
  const innerH = coinHeight * 0.78;
  // Recessed disc has opposing gradient to simulate pressed bevel depth
  const innerGrad = ctx.createLinearGradient(lx * 0.8, ly * 0.8, -lx * 0.8, -ly * 0.8);
  innerGrad.addColorStop(0, '#5a3800');
  innerGrad.addColorStop(0.2, '#aa7c11');
  innerGrad.addColorStop(0.5, '#eec55c');
  innerGrad.addColorStop(0.75, '#fffae0');
  innerGrad.addColorStop(0.85, '#d4af37');
  innerGrad.addColorStop(1, '#4a2c00');

  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, innerW, innerH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner beveled stroke line
  ctx.strokeStyle = 'rgba(255, 245, 180, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // --- 5. Embossed High-Relief Currency Emblem ($ / Cyber Hex) ---
  if (absSpin > 0.25) {
    ctx.save();
    ctx.scale(spinFactor, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = Math.floor(radius * 1.05);
    ctx.font = `900 ${fontSize}px "Orbitron", "Courier New", monospace`;

    // Drop shadow for embossed relief
    ctx.fillStyle = '#2d1800';
    ctx.fillText('$', 0.8, 1.2);

    // Front high-luster metallic relief gradient
    const textGrad = ctx.createLinearGradient(0, -innerH * 0.5, 0, innerH * 0.5);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(0.3, '#fff4a3');
    textGrad.addColorStop(0.6, '#d4af37');
    textGrad.addColorStop(1, '#855800');

    ctx.fillStyle = textGrad;
    ctx.shadowColor = '#fff59d';
    ctx.shadowBlur = 4 + proximityFactor * 8;
    ctx.fillText('$', 0, 0);

    ctx.restore();
  }

  // --- 6. Dynamic Specular Light Glint & Lens Flare ---
  // Flare fires at the specular reflection highlight on coin perimeter
  const glintPulse = Math.pow(Math.max(0, Math.sin(t * 3.0 + proximityFactor * 2)), 3);
  if (glintPulse > 0.05 && absSpin > 0.3) {
    ctx.save();
    const glintX = Math.cos(lightAngle) * (coinWidth * 0.75);
    const glintY = Math.sin(lightAngle) * (coinHeight * 0.75);
    ctx.translate(glintX, glintY);

    const glintSize = (4 + glintPulse * 8) * (1 + proximityFactor * 0.8);
    const glintGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glintSize);
    glintGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glintGrad.addColorStop(0.3, 'rgba(255, 245, 180, 0.8)');
    glintGrad.addColorStop(0.7, 'rgba(255, 215, 0, 0.3)');
    glintGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = glintGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glintSize, 0, Math.PI * 2);
    ctx.fill();

    // 4-Point Specular Star Spikes
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * glintPulse})`;
    ctx.lineWidth = 1.5;
    const spikeLen = glintSize * 1.5;
    ctx.beginPath();
    ctx.moveTo(-spikeLen, 0);
    ctx.lineTo(spikeLen, 0);
    ctx.moveTo(0, -spikeLen);
    ctx.lineTo(0, spikeLen);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 2. PHYSICAL CASH STACKS RENDERER
// ============================================================================

/**
 * Draws stackable cash banknote packs with micro-shadowing lines that float elegantly
 * using a multi-phase cosine displacement calculation.
 */
export function renderPhysicalCashStack(
  ctx: CanvasRenderingContext2D,
  item: Collectible,
  playerPos: Vector2D
) {
  ctx.save();
  ctx.translate(item.position.x, item.position.y);

  const t = item.animTimer;

  // --- Multi-Phase Cosine Displacement Calculation ---
  // Harmonic superposition creates an organic, buoyant, zero-gravity floating curve
  const cosY =
    5.0 * Math.cos(t * 1.6) +
    2.4 * Math.cos(t * 3.1 + 0.9) +
    1.1 * Math.cos(t * 4.7 + 2.1);
  const cosX = 1.8 * Math.cos(t * 0.9 + 0.4);
  const tiltAngle = 0.07 * Math.cos(t * 1.4 + 0.6) + 0.03 * Math.cos(t * 2.8);

  ctx.translate(cosX, cosY);
  ctx.rotate(tiltAngle);

  // Proximity to player for subtle lighting intensity
  const dist = Math.hypot(playerPos.x - item.position.x, playerPos.y - (item.position.y + cosY));
  const proximity = Math.max(0, Math.min(1, 1 - dist / 400));

  const stackLayers = item.stackCount || 5; // Stack of 5 bundled currency bricks
  const packW = 34;
  const packH = 18;
  const layerThickness = 2.4;
  const isoOffsetX = 2.5;
  const isoOffsetY = 1.8;

  // --- Ambient Cash Green Neon Glow ---
  ctx.save();
  const aura = ctx.createRadialGradient(0, 0, packW * 0.3, 0, 0, packW * 1.6);
  const auraAlpha = 0.2 + proximity * 0.35 + Math.sin(t * 3) * 0.08;
  aura.addColorStop(0, `rgba(0, 255, 102, ${auraAlpha})`);
  aura.addColorStop(0.6, `rgba(0, 180, 80, ${auraAlpha * 0.3})`);
  aura.addColorStop(1, 'rgba(0, 50, 20, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, packW * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- Draw Stacked Banknote Layers with Micro-Shadowing ---
  for (let layer = 0; layer < stackLayers; layer++) {
    const isTopLayer = layer === stackLayers - 1;
    const lx = (layer - (stackLayers - 1) / 2) * isoOffsetX;
    const ly = (layer - (stackLayers - 1) / 2) * -layerThickness;

    ctx.save();
    ctx.translate(lx, ly);

    // 1. Drop shadow under each banknote tier (micro-shadowing)
    if (!isTopLayer) {
      ctx.fillStyle = 'rgba(2, 12, 6, 0.75)';
      ctx.fillRect(-packW / 2 + 1, -packH / 2 + layerThickness, packW + 2, packH);
    }

    // 2. Paper Edge Side Cut (Isometric thickness profile)
    ctx.fillStyle = layer % 2 === 0 ? '#0b3820' : '#072b18';
    ctx.beginPath();
    ctx.moveTo(-packW / 2, packH / 2);
    ctx.lineTo(-packW / 2 + isoOffsetX, packH / 2 + isoOffsetY);
    ctx.lineTo(packW / 2 + isoOffsetX, packH / 2 + isoOffsetY);
    ctx.lineTo(packW / 2, packH / 2);
    ctx.closePath();
    ctx.fill();

    // 3. Micro-shadowing line separating stacked bills
    ctx.strokeStyle = 'rgba(0, 18, 8, 0.85)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-packW / 2, packH / 2);
    ctx.lineTo(packW / 2, packH / 2);
    ctx.stroke();

    // 4. Banknote Front Paper Face
    const billGrad = ctx.createLinearGradient(-packW / 2, -packH / 2, packW / 2, packH / 2);
    if (isTopLayer) {
      billGrad.addColorStop(0, '#1a5c38');
      billGrad.addColorStop(0.3, '#2a8553');
      billGrad.addColorStop(0.5, '#39b56f');
      billGrad.addColorStop(0.7, '#2a8553');
      billGrad.addColorStop(1, '#114427');
    } else {
      billGrad.addColorStop(0, '#0f3d24');
      billGrad.addColorStop(0.5, '#195433');
      billGrad.addColorStop(1, '#0b2e1b');
    }

    ctx.fillStyle = billGrad;
    ctx.fillRect(-packW / 2, -packH / 2, packW, packH);

    // 5. Guilloche Border & Micro Currency Engravings (on top layer)
    if (isTopLayer) {
      // Outer crisp banknote border
      ctx.strokeStyle = 'rgba(210, 255, 225, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-packW / 2 + 1.5, -packH / 2 + 1.5, packW - 3, packH - 3);

      // Inner ornate corner ticks
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 0.75;
      const cw = 4;
      // Top-Left
      ctx.strokeRect(-packW / 2 + 3, -packH / 2 + 3, cw, cw);
      // Top-Right
      ctx.strokeRect(packW / 2 - 3 - cw, -packH / 2 + 3, cw, cw);
      // Bottom-Left
      ctx.strokeRect(-packW / 2 + 3, packH / 2 - 3 - cw, cw, cw);
      // Bottom-Right
      ctx.strokeRect(packW / 2 - 3 - cw, packH / 2 - 3 - cw, cw, cw);

      // Center Oval Portrait Medallion
      ctx.fillStyle = 'rgba(5, 30, 16, 0.6)';
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Denomination text: "$10K"
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 6.5px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('10K', 0, 0);
    }

    ctx.restore();
  }

  // --- Top-Level Holographic Currency Band / Security Ribbon ---
  // Strapped across center of cash stack
  ctx.save();
  const bandW = 8.5;
  const bandH = packH + 4;
  const bandX = 0;
  const bandY = -1;

  // Band drop shadow
  ctx.fillStyle = 'rgba(0, 10, 4, 0.8)';
  ctx.fillRect(bandX - bandW / 2 - 1, bandY - bandH / 2, bandW + 2, bandH);

  // Holographic Iridescent Ribbon Gradient
  const holoPhase = t * 2.5;
  const bandGrad = ctx.createLinearGradient(
    bandX - bandW / 2,
    bandY - bandH / 2,
    bandX + bandW / 2,
    bandY + bandH / 2
  );
  bandGrad.addColorStop(0, '#ffd700');
  bandGrad.addColorStop(0.3, '#ff00e5');
  bandGrad.addColorStop(0.6, '#00ffd1');
  bandGrad.addColorStop(0.85, '#ffe600');
  bandGrad.addColorStop(1, '#ff0055');

  ctx.fillStyle = bandGrad;
  ctx.shadowColor = '#00ffd1';
  ctx.shadowBlur = 8 + proximity * 10;
  ctx.fillRect(bandX - bandW / 2, bandY - bandH / 2, bandW, bandH);

  // Security Foil Seal Track
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bandX - bandW / 2, bandY - bandH / 2, bandW, bandH);

  // Micro Security Barcode / Hash Lines
  ctx.fillStyle = '#000000';
  for (let b = -4; b <= 4; b += 2) {
    ctx.fillRect(bandX - 2.5, bandY + b, 5, 0.8);
  }

  ctx.restore();

  // --- Micro Cash Flakes / Floating Paper Dust ---
  ctx.save();
  for (let p = 0; p < 3; p++) {
    const flakeTime = t * 1.5 + p * 2.1;
    const flakeX = Math.sin(flakeTime) * (packW * 0.7);
    const flakeY = -12 - Math.abs(Math.cos(flakeTime * 1.3)) * 14;
    const flakeAlpha = 0.3 + 0.4 * Math.sin(flakeTime * 2);

    ctx.fillStyle = `rgba(0, 255, 136, ${flakeAlpha})`;
    ctx.fillRect(flakeX - 1.5, flakeY - 1, 3, 2);
  }
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// 3. VISCERAL BLOOD/PLASMA CELL RECOVERY RENDERER
// ============================================================================

/**
 * Creates organic, deep crimson blood drops and bio-cells with glowing cores.
 * Uses specialized composition operations (ctx.globalCompositeOperation = 'source-over')
 * to generate realistic light illumination and visceral refraction over the blood collectibles.
 */
export function renderBloodPlasmaCell(
  ctx: CanvasRenderingContext2D,
  item: Collectible,
  playerPos: Vector2D
) {
  ctx.save();
  // Guarantee clean canvas state
  ctx.globalCompositeOperation = 'source-over';
  ctx.translate(item.position.x, item.position.y);

  const t = item.animTimer;

  // Organic fluid buoyancy & wobble
  const floatBob = Math.sin(t * 2.4) * 4.0 + Math.sin(t * 4.8) * 1.2;
  const wobbleX = 1 + 0.08 * Math.sin(t * 3.6);
  const wobbleY = 1 - 0.08 * Math.cos(t * 3.6);
  ctx.translate(0, floatBob);
  ctx.scale(wobbleX, wobbleY);

  const radius = item.radius || 16;

  // Proximity to player for accelerated bio-pulse
  const dist = Math.hypot(playerPos.x - item.position.x, playerPos.y - (item.position.y + floatBob));
  const proximity = Math.max(0, Math.min(1, 1 - dist / 380));
  const heartBeatRate = 3.5 + proximity * 4.5;
  const systolicPulse = Math.pow(Math.max(0, Math.sin(t * heartBeatRate)), 4);

  // --- 1. Ambient Bio-Luminescent Crimson Halo (Illumination Field) ---
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const haloR = radius * (2.0 + systolicPulse * 0.6);
  const haloGrad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, haloR);
  const haloAlpha = 0.28 + proximity * 0.35 + systolicPulse * 0.25;
  haloGrad.addColorStop(0, `rgba(255, 0, 55, ${haloAlpha})`);
  haloGrad.addColorStop(0.4, `rgba(180, 0, 35, ${haloAlpha * 0.5})`);
  haloGrad.addColorStop(0.8, `rgba(100, 0, 20, ${haloAlpha * 0.15})`);
  haloGrad.addColorStop(1, 'rgba(40, 0, 8, 0)');

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 2. Visceral Blood Teardrop / Undulating Membrane ---
  // 12-Point dynamic harmonic perimeter simulating liquid surface tension
  const numPoints = 14;
  ctx.save();
  ctx.shadowColor = '#ff0033';
  ctx.shadowBlur = 14 + systolicPulse * 18;

  // Deep Crimson Multi-Layered Plasma Gradient
  const bodyGrad = ctx.createRadialGradient(
    -radius * 0.3,
    -radius * 0.35,
    radius * 0.1,
    0,
    0,
    radius * 1.15
  );
  bodyGrad.addColorStop(0, '#ff4d6d'); // Visceral oxygenated core
  bodyGrad.addColorStop(0.25, '#c9002b'); // Crimson plasma
  bodyGrad.addColorStop(0.65, '#800015'); // Deep venous blood
  bodyGrad.addColorStop(0.9, '#45000b'); // Dense cellular boundary
  bodyGrad.addColorStop(1, '#1f0005');

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Harmonic wave on liquid surface + teardrop apex pull at top (angle ~ -PI/2)
    const teardropPull = Math.max(0, -Math.sin(angle)) * (radius * 0.35);
    const liquidNoise =
      Math.sin(angle * 3 + t * 4) * (radius * 0.08) +
      Math.cos(angle * 5 - t * 3) * (radius * 0.05);
    const r = radius + teardropPull + liquidNoise + systolicPulse * 2.5;

    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.closePath();
  ctx.fill();

  // Outer cellular lipid membrane stroke
  ctx.strokeStyle = `rgba(255, 50, 90, ${0.75 + systolicPulse * 0.25})`;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // --- 3. Internal Glowing Bio-Core & Mitochondria ---
  // Glowing hyper-oxygenated recovery nucleus
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const coreR = radius * (0.38 + systolicPulse * 0.2);
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  coreGrad.addColorStop(0, '#ffffff'); // Intense white-hot energetic heart
  coreGrad.addColorStop(0.35, '#ff8095');
  coreGrad.addColorStop(0.7, '#ff003c');
  coreGrad.addColorStop(1, 'rgba(160, 0, 30, 0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 1, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Micro Mitochondria & Organelle Granules
  const organelleCount = 4;
  for (let o = 0; o < organelleCount; o++) {
    const oAngle = (o / organelleCount) * Math.PI * 2 + t * 1.5;
    const oDist = radius * 0.45 + Math.sin(t * 3 + o) * 2;
    const ox = Math.cos(oAngle) * oDist;
    const oy = Math.sin(oAngle) * oDist;

    ctx.fillStyle = '#ff8fa3';
    ctx.shadowColor = '#ff4d6d';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(ox, oy, 1.8 + Math.sin(t * 4 + o) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- 4. Visceral Glassy Surface Refraction & Specular Highlights ---
  // Creates photorealistic wet, liquid meniscus specular sheen
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  // Primary Upper-Left Glint (Convex liquid highlight)
  const specGrad1 = ctx.createRadialGradient(
    -radius * 0.4,
    -radius * 0.45,
    0,
    -radius * 0.4,
    -radius * 0.45,
    radius * 0.55
  );
  specGrad1.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  specGrad1.addColorStop(0.35, 'rgba(255, 200, 215, 0.7)');
  specGrad1.addColorStop(0.7, 'rgba(255, 100, 130, 0.2)');
  specGrad1.addColorStop(1, 'rgba(255, 50, 90, 0)');

  ctx.fillStyle = specGrad1;
  ctx.beginPath();
  ctx.ellipse(
    -radius * 0.38,
    -radius * 0.42,
    radius * 0.42,
    radius * 0.25,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Secondary Bottom-Right Rim Refraction (Subsurface scattering bounce light)
  const specGrad2 = ctx.createRadialGradient(
    radius * 0.35,
    radius * 0.35,
    0,
    radius * 0.35,
    radius * 0.35,
    radius * 0.4
  );
  specGrad2.addColorStop(0, 'rgba(255, 120, 150, 0.55)');
  specGrad2.addColorStop(0.6, 'rgba(200, 0, 50, 0.2)');
  specGrad2.addColorStop(1, 'rgba(100, 0, 20, 0)');

  ctx.fillStyle = specGrad2;
  ctx.beginPath();
  ctx.ellipse(
    radius * 0.32,
    radius * 0.32,
    radius * 0.35,
    radius * 0.18,
    Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // --- 5. Micro Organic Plasma Droplets / Exosomes Floating Around ---
  ctx.save();
  for (let d = 0; d < 3; d++) {
    const dropTime = t * 1.8 + d * 2.2;
    const dropAngle = dropTime + d;
    const dropDist = radius * 1.35 + Math.sin(dropTime * 2.5) * 4;
    const dropX = Math.cos(dropAngle) * dropDist;
    const dropY = Math.sin(dropAngle) * dropDist;
    const dropAlpha = 0.4 + 0.4 * Math.sin(dropTime * 3);

    ctx.fillStyle = `rgba(255, 30, 75, ${dropAlpha})`;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(dropX, dropY, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// 4. RARE ENCRYPTED BIO-CORE CANISTER RENDERER
// ============================================================================

/**
 * Renders a rare 3D holographic quantum bio-core canister with:
 * - Sealed chrome cylindrical containment vessel
 * - Glowing green liquid suspension chamber
 * - Rotating DNA double-helix crystalline matrix
 * - Orbiting holographic security rings and floating telemetry
 */
export function renderEncryptedBioCore(
  ctx: CanvasRenderingContext2D,
  item: Collectible,
  playerPos: Vector2D
) {
  ctx.save();
  ctx.translate(item.position.x, item.position.y);

  const t = item.animTimer;
  // Multi-frequency levitation bob
  const floatBob = Math.sin(t * 2.5) * 5.0 + Math.cos(t * 1.3) * 2.0;
  ctx.translate(0, floatBob);

  const dx = playerPos.x - item.position.x;
  const dy = playerPos.y - (item.position.y + floatBob);
  const dist = Math.hypot(dx, dy);
  const proximity = Math.max(0, Math.min(1, 1 - dist / 500));

  const coreRadius = item.radius || 20;
  const coreWidth = 24;
  const coreHeight = 36;

  // --- 1. Ambient Volumetric Aura ---
  ctx.save();
  const aura = ctx.createRadialGradient(0, 0, coreRadius * 0.3, 0, 0, coreRadius * 3.0);
  const auraAlpha = 0.35 + 0.3 * Math.sin(t * 3.0) + proximity * 0.3;
  aura.addColorStop(0, `rgba(0, 255, 209, ${auraAlpha})`);
  aura.addColorStop(0.5, `rgba(57, 255, 20, ${auraAlpha * 0.5})`);
  aura.addColorStop(1, 'rgba(0, 255, 209, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius * 3.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 2. Orbiting Holographic Security Bands ---
  ctx.save();
  const ringAngles = [t * 1.5, -t * 1.8 + Math.PI / 3];
  ringAngles.forEach((ang, idx) => {
    ctx.save();
    ctx.rotate(ang);
    ctx.strokeStyle = idx === 0 ? '#00FFD1' : '#39FF14';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = idx === 0 ? '#00FFD1' : '#39FF14';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, coreWidth + 8, (coreHeight + 8) * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Security orbital node pip
    const pipX = Math.cos(t * 4 + idx * Math.PI) * (coreWidth + 8);
    const pipY = Math.sin(t * 4 + idx * Math.PI) * ((coreHeight + 8) * 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pipX, pipY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();

  // --- 3. Glass Cylinder Chamber (Liquid Suspension & Particle Bubbles) ---
  ctx.save();
  const glassGrad = ctx.createLinearGradient(-coreWidth / 2, 0, coreWidth / 2, 0);
  glassGrad.addColorStop(0, 'rgba(0, 40, 35, 0.75)');
  glassGrad.addColorStop(0.25, 'rgba(0, 255, 209, 0.45)');
  glassGrad.addColorStop(0.5, 'rgba(57, 255, 20, 0.65)');
  glassGrad.addColorStop(0.75, 'rgba(0, 255, 209, 0.45)');
  glassGrad.addColorStop(1, 'rgba(0, 40, 35, 0.75)');

  ctx.fillStyle = glassGrad;
  ctx.shadowColor = '#00FFD1';
  ctx.shadowBlur = 16;
  ctx.fillRect(-coreWidth / 2, -coreHeight / 2, coreWidth, coreHeight);

  // Micro bubbling particles rising in chamber
  for (let b = 0; b < 4; b++) {
    const bubblePhase = ((t * 2 + b * 0.25) % 1);
    const bX = Math.sin(t * 3 + b) * (coreWidth * 0.3);
    const bY = coreHeight / 2 - bubblePhase * coreHeight;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bX, bY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 4. Rotating DNA Double-Helix Matrix Inside ---
  const helixPoints = 7;
  for (let i = 0; i < helixPoints; i++) {
    const pY = -coreHeight / 2 + 6 + (i / (helixPoints - 1)) * (coreHeight - 12);
    const phase = t * 3.2 + (i / helixPoints) * Math.PI * 2;
    const strand1X = Math.sin(phase) * (coreWidth * 0.35);
    const strand2X = -strand1X;

    // Hydrogen bond rung
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(strand1X, pY);
    ctx.lineTo(strand2X, pY);
    ctx.stroke();

    // Node 1 (Cyan)
    ctx.fillStyle = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(strand1X, pY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Node 2 (Lime)
    ctx.fillStyle = '#39FF14';
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(strand2X, pY, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 5. Chrome Top & Bottom Reinforced Endcaps ---
  const capHeight = 6;
  const capGrad = ctx.createLinearGradient(-coreWidth / 2, 0, coreWidth / 2, 0);
  capGrad.addColorStop(0, '#1e293b');
  capGrad.addColorStop(0.3, '#94a3b8');
  capGrad.addColorStop(0.5, '#ffffff');
  capGrad.addColorStop(0.7, '#94a3b8');
  capGrad.addColorStop(1, '#0f172a');

  // Top Cap
  ctx.fillStyle = capGrad;
  ctx.strokeStyle = '#00FFD1';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-coreWidth / 2 - 2, -coreHeight / 2 - capHeight, coreWidth + 4, capHeight);
  ctx.strokeRect(-coreWidth / 2 - 2, -coreHeight / 2 - capHeight, coreWidth + 4, capHeight);

  // Bottom Cap
  ctx.fillRect(-coreWidth / 2 - 2, coreHeight / 2, coreWidth + 4, capHeight);
  ctx.strokeRect(-coreWidth / 2 - 2, coreHeight / 2, coreWidth + 4, capHeight);

  // Glass Specular Vertical Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillRect(-coreWidth / 2 + 3, -coreHeight / 2 + 2, 2.5, coreHeight - 4);
  ctx.restore();

  // --- 6. Holographic Objective Badge Above ---
  ctx.save();
  ctx.font = '900 10px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00FFD1';
  ctx.shadowColor = '#00FFD1';
  ctx.shadowBlur = 12;
  const coreNum = item.coreIndex ? `#${item.coreIndex}` : '';
  ctx.fillText(`BIO-CORE ${coreNum}`, 0, -coreHeight / 2 - 14);

  // Downward pulsing indicator pip
  const arrowY = -coreHeight / 2 - 8 + Math.sin(t * 5) * 2;
  ctx.fillStyle = '#39FF14';
  ctx.beginPath();
  ctx.moveTo(-4, arrowY - 4);
  ctx.lineTo(4, arrowY - 4);
  ctx.lineTo(0, arrowY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// 5. CYBER EXIT PORTAL RENDERER
// ============================================================================

/**
 * Renders the massive Cyber Exit Portal Gate with:
 * - Dual reinforced obsidian pillars with glowing conduits
 * - Locked mode: Red laser grid security barrier with missing core indicators
 * - Unlocked mode: Roaring hyperspace vortex, skyward particle beacon, and holographic extraction banner
 */
export function renderCyberExitPortal(
  ctx: CanvasRenderingContext2D,
  portal: any,
  playerPos: Vector2D,
  isUnlocked: boolean,
  collectedCores: number = 0,
  totalCores: number = 3
) {
  ctx.save();
  ctx.translate(portal.position.x, portal.position.y);

  const time = Date.now() * 0.003;
  const portalWidth = 84;
  const portalHeight = 110;
  const gateRadius = 42;

  // --- 1. Ground Energy Octagon Platform ---
  ctx.save();
  const platRadius = 55;
  ctx.fillStyle = '#060312';
  ctx.strokeStyle = isUnlocked ? '#00FFD1' : '#FF0055';
  ctx.shadowColor = isUnlocked ? '#00FFD1' : '#FF0055';
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + (isUnlocked ? time * 0.2 : 0);
    const px = Math.cos(a) * platRadius;
    const py = Math.sin(a) * (platRadius * 0.45);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (isUnlocked) {
    // --- 2. ACTIVE HYPERSPACE VORTEX (3D Swirling Rings & Light Rays) ---
    ctx.save();
    // Skyward Energy Beacon
    const beaconGrad = ctx.createLinearGradient(0, 0, 0, -350);
    beaconGrad.addColorStop(0, 'rgba(0, 255, 209, 0.7)');
    beaconGrad.addColorStop(0.4, 'rgba(255, 0, 229, 0.35)');
    beaconGrad.addColorStop(1, 'rgba(0, 255, 209, 0)');

    ctx.fillStyle = beaconGrad;
    ctx.beginPath();
    ctx.moveTo(-gateRadius * 0.8, 0);
    ctx.lineTo(-gateRadius * 1.5, -350);
    ctx.lineTo(gateRadius * 1.5, -350);
    ctx.lineTo(gateRadius * 0.8, 0);
    ctx.closePath();
    ctx.fill();

    // Multi-layered vortex rings
    const ringCount = 4;
    for (let r = 0; r < ringCount; r++) {
      const ringPhase = time * (3.0 - r * 0.5) + (r * Math.PI) / ringCount;
      const ringR = gateRadius * (0.3 + 0.65 * ((r + (time * 0.8) % 1) / ringCount));
      const ringAlpha = Math.sin(((r + (time * 0.8) % 1) / ringCount) * Math.PI);

      ctx.save();
      ctx.rotate(ringPhase * 0.3);
      ctx.strokeStyle = r % 2 === 0 ? '#00FFD1' : '#FF00E5';
      ctx.shadowColor = r % 2 === 0 ? '#00FFD1' : '#FF00E5';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.globalAlpha = ringAlpha;

      ctx.beginPath();
      ctx.ellipse(0, -portalHeight * 0.45, ringR, ringR * 1.15, ringPhase, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Core Event Horizon (Singularity Center & Quantum Vortex)
    const singGrad = ctx.createRadialGradient(
      0,
      -portalHeight * 0.45,
      0,
      0,
      -portalHeight * 0.45,
      gateRadius * 0.95
    );
    singGrad.addColorStop(0, '#ffffff');
    singGrad.addColorStop(0.25, '#00FFD1');
    singGrad.addColorStop(0.65, '#FF00E5');
    singGrad.addColorStop(1, 'rgba(15, 5, 30, 0.9)');

    ctx.fillStyle = singGrad;
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 32;
    ctx.beginPath();
    ctx.arc(0, -portalHeight * 0.45, gateRadius * 0.75 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
    ctx.fill();

    // Electrical plasma lightning discharge arcs jumping across emitters
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 12;
    for (let l = 0; l < 3; l++) {
      const startA = (l * Math.PI * 2) / 3 + time * 2;
      const endA = startA + Math.PI * 0.6;
      const r = gateRadius * 0.7;
      const sx = Math.cos(startA) * r;
      const sy = -portalHeight * 0.45 + Math.sin(startA) * r;
      const ex = Math.cos(endA) * r;
      const ey = -portalHeight * 0.45 + Math.sin(endA) * r;
      const midX = (sx + ex) / 2 + (Math.random() - 0.5) * 8;
      const midY = (sy + ey) / 2 + (Math.random() - 0.5) * 8;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(midX, midY);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // --- 2. LOCKED MODE: CRIMSON LASER FORCEFIELD GRID ---
    ctx.save();
    const lockGrad = ctx.createRadialGradient(
      0,
      -portalHeight * 0.45,
      0,
      0,
      -portalHeight * 0.45,
      gateRadius
    );
    lockGrad.addColorStop(0, 'rgba(255, 0, 85, 0.4)');
    lockGrad.addColorStop(0.8, 'rgba(100, 0, 30, 0.6)');
    lockGrad.addColorStop(1, 'rgba(10, 0, 15, 0.85)');

    ctx.fillStyle = lockGrad;
    ctx.fillRect(-gateRadius * 0.8, -portalHeight + 10, gateRadius * 1.6, portalHeight - 15);

    // Diagonal Laser Hazard Lattice
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
    ctx.shadowColor = '#FF0055';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;

    const latticeSpacing = 16;
    for (let x = -gateRadius * 0.8; x <= gateRadius * 0.8; x += latticeSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, -portalHeight + 10);
      ctx.lineTo(x + 25, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 25, -portalHeight + 10);
      ctx.lineTo(x, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- 3. REINFORCED PORTAL PYLONS (Left & Right Gate Posts) ---
  ctx.save();
  const pylonW = 16;
  const pylonH = portalHeight;

  // Left Post
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = isUnlocked ? '#00FFD1' : '#FF0055';
  ctx.lineWidth = 2;
  ctx.fillRect(-portalWidth / 2, -pylonH, pylonW, pylonH);
  ctx.strokeRect(-portalWidth / 2, -pylonH, pylonW, pylonH);

  // Right Post
  ctx.fillRect(portalWidth / 2 - pylonW, -pylonH, pylonW, pylonH);
  ctx.strokeRect(portalWidth / 2 - pylonW, -pylonH, pylonW, pylonH);

  // Top Archway Crossbeam
  ctx.fillRect(-portalWidth / 2, -pylonH - 12, portalWidth, 14);
  ctx.strokeRect(-portalWidth / 2, -pylonH - 12, portalWidth, 14);

  // Neon Conduits on Posts
  ctx.strokeStyle = isUnlocked ? '#00FFD1' : '#FF0055';
  ctx.shadowColor = isUnlocked ? '#00FFD1' : '#FF0055';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(-portalWidth / 2 + pylonW / 2, -pylonH + 8);
  ctx.lineTo(-portalWidth / 2 + pylonW / 2, -10);
  ctx.moveTo(portalWidth / 2 - pylonW / 2, -pylonH + 8);
  ctx.lineTo(portalWidth / 2 - pylonW / 2, -10);
  ctx.stroke();
  ctx.restore();

  // --- 4. 3x BIO-LOCK INDICATOR NODES ON ARCHWAY ---
  ctx.save();
  const nodeY = -portalHeight - 5;
  for (let i = 0; i < totalCores; i++) {
    const nodeX = -20 + i * 20;
    const isCollected = i < collectedCores;

    ctx.save();
    ctx.translate(nodeX, nodeY);

    if (isCollected) {
      // Unlocked Core Node (Glowing Bright Cyan/Green)
      ctx.fillStyle = '#00FFD1';
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // White hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Missing Core Node (Dim Red with Warning Pulse)
      const blink = Math.sin(time * 4 + i) > 0;
      ctx.fillStyle = blink ? '#FF0055' : '#3a0014';
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = blink ? 10 : 0;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // --- 5. HOLOGRAPHIC STATUS BANNERS ---
  ctx.save();
  ctx.font = '900 11px "Orbitron", monospace';
  ctx.textAlign = 'center';

  if (isUnlocked) {
    // Stage Exit Ready Banner
    ctx.fillStyle = '#00FFD1';
    ctx.shadowColor = '#00FFD1';
    ctx.shadowBlur = 16;
    ctx.fillText('CYBER EXIT PORTAL READY', 0, -portalHeight - 24);

    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.fillStyle = '#FF00E5';
    ctx.shadowColor = '#FF00E5';
    ctx.fillText('[ENTER TO CLEAR STAGE]', 0, -portalHeight - 12);
  } else {
    // Locked Status Banner
    ctx.fillStyle = '#FF0055';
    ctx.shadowColor = '#FF0055';
    ctx.shadowBlur = 12;
    ctx.fillText('PORTAL LOCKED', 0, -portalHeight - 24);

    ctx.font = 'bold 9px "Orbitron", monospace';
    ctx.fillStyle = '#FFE600';
    ctx.shadowColor = '#FFE600';
    ctx.fillText(`BIO-CORES: ${collectedCores} / ${totalCores}`, 0, -portalHeight - 12);
  }
  ctx.restore();

  ctx.restore();
}
