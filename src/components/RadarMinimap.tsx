import React, { useEffect, useRef } from 'react';
import { RadarTelemetryData } from '../types';

interface RadarMinimapProps {
  getTelemetry?: () => RadarTelemetryData | null;
  className?: string;
  size?: number;
}

export const RadarMinimap: React.FC<RadarMinimapProps> = ({
  getTelemetry,
  className = '',
  size = 104,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let sweepAngle = 0;

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);

      const W = size;
      const H = size;
      const centerX = W / 2;
      const centerY = H / 2;
      const radius = W / 2 - 3;

      // 1. Clear Canvas
      ctx.clearRect(0, 0, W, H);

      // 2. Circular Dark Cyber Base Layer
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 3, 18, 0.94)';
      ctx.fill();

      // Outer Neon Cyan Ring & Glow
      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Clip all internal rendering to the circular radar zone
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
      ctx.clip();

      // 3. Concentric Range Rings & Crosshairs
      ctx.strokeStyle = 'rgba(0, 255, 209, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, radius * 0.78, 0, Math.PI * 2);
      // Crosshair lines
      ctx.moveTo(centerX - radius + 4, centerY);
      ctx.lineTo(centerX + radius - 4, centerY);
      ctx.moveTo(centerX, centerY - radius + 4);
      ctx.lineTo(centerX, centerY + radius - 4);
      ctx.stroke();

      // 4. Cardinal Compass Points
      ctx.font = 'bold 8px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF00E5';
      ctx.fillText('N', centerX, centerY - radius + 9);
      ctx.fillStyle = 'rgba(0, 255, 209, 0.7)';
      ctx.fillText('S', centerX, centerY + radius - 8);
      ctx.fillText('W', centerX - radius + 8, centerY);
      ctx.fillText('E', centerX + radius - 8, centerY);

      // 5. Animated 360° Radar Sweeper Beam & Fading Arc Trail
      sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2);

      // Sweeper Arc Gradient Trail
      const trailGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      trailGrad.addColorStop(0, 'rgba(0, 255, 209, 0.28)');
      trailGrad.addColorStop(1, 'rgba(0, 255, 209, 0.03)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 1, sweepAngle - 0.55, sweepAngle);
      ctx.closePath();
      ctx.fill();

      // Sweeper Beam Line
      ctx.strokeStyle = '#00FFD1';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00FFD1';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * (radius - 1),
        centerY + Math.sin(sweepAngle) * (radius - 1)
      );
      ctx.stroke();
      ctx.shadowBlur = 0;

      const data = getTelemetry ? getTelemetry() : null;
      const isJammed = !!(data?.player?.flashlightJammedTimer && data.player.flashlightJammedTimer > 0);

      if (isJammed) {
        // Red EMP static scanlines & warning ring
        ctx.fillStyle = 'rgba(255, 0, 85, 0.12)';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
        ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 6) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        // EMP Jammed Text Indicator
        ctx.font = '900 7px "Orbitron", monospace';
        ctx.fillStyle = Math.sin(Date.now() * 0.02) > 0 ? '#FF0055' : '#FFAA00';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ EMP ACTIVE', centerX, centerY - radius * 0.55);
      }

      if (data && data.player) {
        const playerX = data.player.x;
        const playerY = data.player.y;
        const radarScale = 0.045;

        // 6a. Encrypted Bio-Cores (Glowing Cyan Diamonds)
        if (data.collectibles) {
          for (const item of data.collectibles) {
            if (item.collected) continue;
            const relX = (item.x - playerX) * radarScale;
            const relY = (item.y - playerY) * radarScale;
            if (Math.hypot(relX, relY) < radius - 4) {
              const cx = centerX + relX;
              const cy = centerY + relY;
              ctx.fillStyle = '#00FFD1';
              ctx.shadowColor = '#00FFD1';
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.moveTo(cx, cy - 4);
              ctx.lineTo(cx + 4, cy);
              ctx.lineTo(cx, cy + 4);
              ctx.lineTo(cx - 4, cy);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // 6b. Cover Obstacles & Wall Geometry
        if (data.obstacles) {
          ctx.strokeStyle = 'rgba(0, 255, 209, 0.35)';
          ctx.fillStyle = 'rgba(0, 50, 80, 0.3)';
          ctx.lineWidth = 1;
          for (const obs of data.obstacles) {
            const relX = (obs.x - playerX) * radarScale;
            const relY = (obs.y - playerY) * radarScale;
            const w = obs.width * radarScale;
            const h = obs.height * radarScale;
            if (Math.hypot(relX, relY) < radius + 15) {
              ctx.fillRect(centerX + relX - w / 2, centerY + relY - h / 2, w, h);
              ctx.strokeRect(centerX + relX - w / 2, centerY + relY - h / 2, w, h);
            }
          }
        }

        // 6c. Entities & Enemy Sight-Cones (Tactical Stealth AI)
        if (data.entities) {
          for (const ent of data.entities) {
            const relX = (ent.x - playerX) * radarScale;
            const relY = (ent.y - playerY) * radarScale;
            const dist = Math.hypot(relX, relY);

            if (dist < radius + 20) {
              const px = centerX + relX;
              const py = centerY + relY;

              if (ent.type === 'CYBER_EXIT_PORTAL') {
                // Exit Portal
                const isUnlocked = data.portalUnlocked;
                ctx.fillStyle = isUnlocked ? '#00FF66' : '#FF0055';
                ctx.shadowColor = isUnlocked ? '#00FF66' : '#FF0055';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.stroke();
              } else if (ent.type === 'MUTATED_BACTERIA') {
                const facingAngle = ent.facingAngle !== undefined ? ent.facingAngle : 0;
                const fov = ent.visionFov || (Math.PI / 2.8);
                const coneRadius = Math.min((ent.visionRange || 280) * radarScale, radius * 0.9);

                // --- Draw Enemy Vision Sight Cone on Mini-Map ---
                if (!ent.surrendered && ent.state !== 'SURRENDER') {
                  let coneFill = 'rgba(0, 255, 209, 0.22)';
                  let coneStroke = 'rgba(0, 255, 209, 0.55)';

                  if (ent.state === 'ALERT' || ent.state === 'CHASE') {
                    coneFill = 'rgba(255, 0, 85, 0.42)';
                    coneStroke = 'rgba(255, 0, 85, 0.85)';
                  } else if (ent.state === 'SUSPICIOUS' || (ent.alertness && ent.alertness > 15)) {
                    coneFill = 'rgba(255, 170, 0, 0.35)';
                    coneStroke = 'rgba(255, 170, 0, 0.75)';
                  }

                  ctx.save();
                  ctx.beginPath();
                  ctx.moveTo(px, py);
                  ctx.arc(px, py, coneRadius, facingAngle - fov / 2, facingAngle + fov / 2);
                  ctx.closePath();
                  ctx.fillStyle = coneFill;
                  ctx.fill();
                  ctx.strokeStyle = coneStroke;
                  ctx.lineWidth = 1;
                  ctx.stroke();
                  ctx.restore();
                }

                // 1. Stealth Takedown Available Indicator (Assassination Reticle)
                if (ent.canStealthKill) {
                  const pulse = 6 + Math.sin(Date.now() * 0.015) * 2;
                  ctx.strokeStyle = '#FF00E5';
                  ctx.lineWidth = 1.8;
                  ctx.shadowColor = '#FF00E5';
                  ctx.shadowBlur = 8;
                  ctx.beginPath();
                  ctx.arc(px, py, pulse, 0, Math.PI * 2);
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                }

                // 2. Surrendered Enemy (White Pip)
                if (ent.surrendered) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.shadowColor = '#00FFD1';
                  ctx.shadowBlur = 8;
                  ctx.beginPath();
                  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                  ctx.fill();
                }
                // 3. Apex Boss Organism (Pulsing Crimson Star)
                else if (ent.isBoss) {
                  const pulse = 5.5 + Math.sin(Date.now() * 0.012) * 1.5;
                  ctx.fillStyle = '#FF0055';
                  ctx.shadowColor = '#FF0055';
                  ctx.shadowBlur = 14;
                  ctx.beginPath();
                  ctx.arc(px, py, pulse, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = '#FFD700';
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                }
                // 4. Mission Target Elite (Amber/Gold Diamond)
                else if (ent.variant === 'MISSION_TARGET_ELITE') {
                  ctx.fillStyle = '#FFAA00';
                  ctx.shadowColor = '#FFAA00';
                  ctx.shadowBlur = 10;
                  ctx.beginPath();
                  ctx.moveTo(px, py - 4.5);
                  ctx.lineTo(px + 4.5, py);
                  ctx.lineTo(px, py + 4.5);
                  ctx.lineTo(px - 4.5, py);
                  ctx.closePath();
                  ctx.fill();
                  ctx.strokeStyle = '#FFE600';
                  ctx.lineWidth = 1;
                  ctx.stroke();
                }
                // 5. Standard Enemies (Color-Coded by Alertness & Variant)
                else {
                  let color = '#39FF14';
                  if (ent.state === 'ALERT' || ent.state === 'CHASE') color = '#FF0055';
                  else if (ent.state === 'SUSPICIOUS') color = '#FFAA00';
                  else if (ent.variant === 'TOXIC_SPITTER') color = '#FFE600';
                  else if (ent.variant === 'CYBER_BRUTE') color = '#FF0055';
                  else if (ent.variant === 'STEALTH_STALKER') color = '#9D00FF';

                  ctx.fillStyle = color;
                  ctx.shadowColor = color;
                  ctx.shadowBlur = 6;
                  ctx.beginPath();
                  ctx.arc(px, py, 3, 0, Math.PI * 2);
                  ctx.fill();

                  // Directional facing tick on enemy
                  ctx.strokeStyle = '#FFFFFF';
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(px, py);
                  ctx.lineTo(px + Math.cos(facingAngle) * 5, py + Math.sin(facingAngle) * 5);
                  ctx.stroke();
                }
              }
            }
          }
        }

        // 6c. Bright Player Pip at Center with Heading Direction Indicator
        ctx.fillStyle = '#00FFD1';
        ctx.shadowColor = '#00FFD1';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Player Core Bright White Center
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Direction Heading Vector Arrow
        const facing = data.player.facingAngle;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00FFD1';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(facing) * 9,
          centerY + Math.sin(facing) * 9
        );
        ctx.stroke();
      } else {
        // Fallback Default Player Pip
        ctx.fillStyle = '#00FFD1';
        ctx.shadowColor = '#00FFD1';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // Restore clip
      ctx.restore(); // Restore scale

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [getTelemetry, size]);

  return (
    <div
      id="radar-minimap-container"
      className={`relative flex flex-col items-center select-none ${className}`}
    >
      {/* Top Cyber Telemetry Label */}
      <div className="mb-1 px-1.5 py-0.5 bg-[#060312]/90 border border-[#00FFD1]/40 rounded-sm flex items-center gap-1 font-mono-tech text-[8px] sm:text-[9px] text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.25)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FFD1] animate-ping"></span>
        <span className="font-bold tracking-wider">RADAR // 360°</span>
      </div>

      {/* Circular Canvas Frame with Neon Glow */}
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className="relative rounded-full border-2 border-[#00FFD1] bg-[#060312]/95 shadow-[0_0_20px_rgba(0,255,209,0.45)] overflow-hidden flex items-center justify-center backdrop-blur-md"
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="block rounded-full pointer-events-none"
        />
      </div>
    </div>
  );
};
