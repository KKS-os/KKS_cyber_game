import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Zap, Navigation, Sword, Crosshair, Shield, EyeOff, Target, Terminal } from 'lucide-react';
import { JoystickVelocity } from '../types';

export interface TouchControlsProps {
  /** 360° Joystick Velocity Callback [vx, vy], radian angle, force (0..1) */
  onMoveVelocity?: (velocityArray: [number, number], angle: number, force: number) => void;
  /** Joystick Velocity Object { x, y } */
  onMove?: (velocity: JoystickVelocity, angle: number, force: number) => void;
  /** Callback when touch drag finishes */
  onEnd?: () => void;

  /** Legacy / Digital directional movement callbacks */
  onMoveUp?: (active: boolean) => void;
  onMoveDown?: (active: boolean) => void;
  onMoveLeft?: (active: boolean) => void;
  onMoveRight?: (active: boolean) => void;
  onJump?: () => void;
  onSlide?: () => void;

  /** Combat Action Callbacks */
  onAttack?: () => void;
  onSlash?: () => void;
  onBlast?: () => void;
  onShoot?: () => void;
  onTakedown?: () => void;
  onStealthTakedown?: () => void;
  onDash?: () => void;
  onCrouch?: () => void;
  onCover?: () => void;
  onHack?: () => void;

  /** Current combo count */
  comboCount?: number;
  /** Maximum travel radius of joystick knob (default 46px) */
  maxRadius?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveVelocity,
  onMove,
  onEnd,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onAttack,
  onSlash,
  onBlast,
  onShoot,
  onTakedown,
  onStealthTakedown,
  onDash,
  onCrouch,
  onCover,
  onHack,
  comboCount = 0,
  maxRadius = 46,
}) => {
  // Mobile touch state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [touchActiveId, setTouchActiveId] = useState<number | null>(null);

  // Active keyboard WASD states for PC visual feedback
  const [activeKeys, setActiveKeys] = useState<{ w: boolean; a: boolean; s: boolean; d: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  // DOM element references for 0ms Direct GPU Transform (Bypassing React re-renders on drag)
  const zoneRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const telemetryDegreeRef = useRef<HTMLSpanElement>(null);
  const telemetryForceRef = useRef<HTMLSpanElement>(null);

  // Mutable positions without triggering React reconciler at 120Hz
  const basePosRef = useRef<{ x: number; y: number }>({ x: 70, y: 70 });
  const touchIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Default resting position inside the lower-left corner
  const defaultPos = { x: 76, y: 76 };

  // Trigger light haptic vibration for tactile feedback
  const triggerHaptic = useCallback((pattern: number = 10) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }, []);

  // --- PC KEYBOARD WASD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      let isW = code === 'KeyW' || key === 'w' || code === 'ArrowUp';
      let isA = code === 'KeyA' || key === 'a' || code === 'ArrowLeft';
      let isS = code === 'KeyS' || key === 's' || code === 'ArrowDown';
      let isD = code === 'KeyD' || key === 'd' || code === 'ArrowRight';

      if (isW || isA || isS || isD) {
        setActiveKeys((prev) => {
          const next = {
            w: isW ? true : prev.w,
            a: isA ? true : prev.a,
            s: isS ? true : prev.s,
            d: isD ? true : prev.d,
          };
          updateKeyboardJoystick(next);
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();

      let isW = code === 'KeyW' || key === 'w' || code === 'ArrowUp';
      let isA = code === 'KeyA' || key === 'a' || code === 'ArrowLeft';
      let isS = code === 'KeyS' || key === 's' || code === 'ArrowDown';
      let isD = code === 'KeyD' || key === 'd' || code === 'ArrowRight';

      if (isW || isA || isS || isD) {
        setActiveKeys((prev) => {
          const next = {
            w: isW ? false : prev.w,
            a: isA ? false : prev.a,
            s: isS ? false : prev.s,
            d: isD ? false : prev.d,
          };
          updateKeyboardJoystick(next);
          return next;
        });
      }
    };

    const updateKeyboardJoystick = (keys: { w: boolean; a: boolean; s: boolean; d: boolean }) => {
      if (isDraggingRef.current) return; // Touch takes priority over keyboard

      let vx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      let vy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

      if (vx === 0 && vy === 0) {
        setIsActive(false);
        if (knobRef.current) {
          knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
          knobRef.current.style.transition = 'transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        }
        if (lineRef.current) {
          lineRef.current.setAttribute('x2', `${maxRadius}`);
          lineRef.current.setAttribute('y2', `${maxRadius}`);
        }
        if (telemetryDegreeRef.current) telemetryDegreeRef.current.textContent = '0°';
        if (telemetryForceRef.current) telemetryForceRef.current.textContent = '0%';

        if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
        if (onMove) onMove({ x: 0, y: 0 }, 0, 0);
        if (onMoveLeft) onMoveLeft(false);
        if (onMoveRight) onMoveRight(false);
        if (onMoveUp) onMoveUp(false);
        if (onMoveDown) onMoveDown(false);
      } else {
        const len = Math.hypot(vx, vy);
        const normVx = vx / len;
        const normVy = vy / len;
        const angle = Math.atan2(normVy, normVx);
        const force = 1.0;
        const travel = maxRadius * 0.9;
        const knobX = normVx * travel;
        const knobY = normVy * travel;

        setIsActive(true);
        if (knobRef.current) {
          knobRef.current.style.transition = 'none';
          knobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0px)`;
        }
        if (lineRef.current) {
          lineRef.current.setAttribute('x2', `${maxRadius + knobX}`);
          lineRef.current.setAttribute('y2', `${maxRadius + knobY}`);
        }
        const deg = Math.round(((angle * 180) / Math.PI + 360) % 360);
        if (arrowRef.current) arrowRef.current.style.transform = `rotate(${deg}deg)`;
        if (telemetryDegreeRef.current) telemetryDegreeRef.current.textContent = `${deg}°`;
        if (telemetryForceRef.current) telemetryForceRef.current.textContent = '100%';

        if (onMoveVelocity) onMoveVelocity([normVx, normVy], angle, force);
        if (onMove) onMove({ x: normVx, y: normVy }, angle, force);
        if (onMoveLeft) onMoveLeft(normVx < -0.3);
        if (onMoveRight) onMoveRight(normVx > 0.3);
        if (onMoveUp) onMoveUp(normVy < -0.3);
        if (onMoveDown) onMoveDown(normVy > 0.3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [maxRadius, onMoveVelocity, onMove, onMoveLeft, onMoveRight, onMoveUp, onMoveDown]);

  // --- PROFESSIONAL 0ms DIRECT TOUCH PIPELINE ---
  const processDirectTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!zoneRef.current) return;
      const rect = zoneRef.current.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      let origin = basePosRef.current;
      let dx = currentX - origin.x;
      let dy = currentY - origin.y;
      let distance = Math.hypot(dx, dy);

      // Mobile Legends / Wild Rift Dynamic Follow:
      // If the thumb moves further than 1.25x maxRadius, smoothly drag the base along
      if (distance > maxRadius * 1.25) {
        const excess = distance - maxRadius * 1.25;
        const angleFollow = Math.atan2(dy, dx);
        origin.x += Math.cos(angleFollow) * excess;
        origin.y += Math.sin(angleFollow) * excess;

        // Keep base inside padded screen bounds
        origin.x = Math.max(maxRadius + 10, Math.min(rect.width - maxRadius - 10, origin.x));
        origin.y = Math.max(maxRadius + 10, Math.min(rect.height - maxRadius - 10, origin.y));
        basePosRef.current = origin;

        if (baseRef.current) {
          baseRef.current.style.left = `${origin.x}px`;
          baseRef.current.style.top = `${origin.y}px`;
        }

        dx = currentX - origin.x;
        dy = currentY - origin.y;
        distance = Math.hypot(dx, dy);
      }

      // 8% Deadzone filtering for buttery smooth stillness when resting thumb
      const deadzone = maxRadius * 0.08;
      if (distance < deadzone) {
        if (knobRef.current) knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
        if (lineRef.current) {
          lineRef.current.setAttribute('x2', `${maxRadius}`);
          lineRef.current.setAttribute('y2', `${maxRadius}`);
        }
        if (telemetryForceRef.current) telemetryForceRef.current.textContent = '0%';
        if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
        if (onMove) onMove({ x: 0, y: 0 }, 0, 0);
        if (onMoveLeft) onMoveLeft(false);
        if (onMoveRight) onMoveRight(false);
        if (onMoveUp) onMoveUp(false);
        if (onMoveDown) onMoveDown(false);
        return;
      }

      // Radian angle in range (-PI to PI)
      const angle = Math.atan2(dy, dx);

      // Normalized non-linear response curve for fine stealth walking + fast sprinting
      const rawForce = Math.min((distance - deadzone) / (maxRadius - deadzone), 1.0);
      const curvedForce = Math.pow(rawForce, 1.15); // Slight curve for tactical precision

      // Clamp knob visual travel
      const clampedDist = Math.min(distance, maxRadius);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      // Velocities
      const vx = Math.cos(angle) * curvedForce;
      const vy = Math.sin(angle) * curvedForce;

      // Instant hardware transform update (Zero React setState overhead)
      if (knobRef.current) {
        knobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0px)`;
      }
      if (lineRef.current) {
        lineRef.current.setAttribute('x2', `${maxRadius + knobX}`);
        lineRef.current.setAttribute('y2', `${maxRadius + knobY}`);
      }

      const deg = Math.round(((angle * 180) / Math.PI + 360) % 360);
      if (arrowRef.current) arrowRef.current.style.transform = `rotate(${deg}deg)`;
      if (telemetryDegreeRef.current) telemetryDegreeRef.current.textContent = `${deg}°`;
      if (telemetryForceRef.current) telemetryForceRef.current.textContent = `${Math.round(curvedForce * 100)}%`;

      // Callbacks to game engine
      if (onMoveVelocity) onMoveVelocity([vx, vy], angle, curvedForce);
      if (onMove) onMove({ x: vx, y: vy }, angle, curvedForce);
      if (onMoveLeft) onMoveLeft(vx < -0.3);
      if (onMoveRight) onMoveRight(vx > 0.3);
      if (onMoveUp) onMoveUp(vy < -0.3);
      if (onMoveDown) onMoveDown(vy > 0.3);
    },
    [maxRadius, onMoveVelocity, onMove, onMoveLeft, onMoveRight, onMoveUp, onMoveDown]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only capture primary touch in the left zone
    if (isDraggingRef.current && touchIdRef.current !== null) return;
    e.preventDefault();
    e.stopPropagation();

    if (!zoneRef.current) return;
    const rect = zoneRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    // Anchor floating joystick base dynamically under the thumb
    // Clamped inside safe boundary padding
    const clampedX = Math.max(maxRadius + 8, Math.min(rect.width - maxRadius - 8, touchX));
    const clampedY = Math.max(maxRadius + 8, Math.min(rect.height - maxRadius - 8, touchY));
    const newBase = { x: clampedX, y: clampedY };

    basePosRef.current = newBase;
    touchIdRef.current = e.pointerId;
    isDraggingRef.current = true;
    setIsActive(true);
    setTouchActiveId(e.pointerId);

    if (baseRef.current) {
      baseRef.current.style.left = `${newBase.x}px`;
      baseRef.current.style.top = `${newBase.y}px`;
      baseRef.current.style.transition = 'none';
    }
    if (knobRef.current) {
      knobRef.current.style.transition = 'none';
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    triggerHaptic(8);
    processDirectTouch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    processDirectTouch(e.clientX, e.clientY);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchIdRef.current === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = false;
      touchIdRef.current = null;
      setIsActive(false);
      setTouchActiveId(null);

      // Spring-back animation on release
      if (knobRef.current) {
        knobRef.current.style.transition = 'transform 0.16s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
      if (lineRef.current) {
        lineRef.current.setAttribute('x2', `${maxRadius}`);
        lineRef.current.setAttribute('y2', `${maxRadius}`);
      }

      // Smoothly drift base back towards comfortable resting anchor after a short delay
      setTimeout(() => {
        if (!isDraggingRef.current && baseRef.current && zoneRef.current) {
          const rect = zoneRef.current.getBoundingClientRect();
          const targetX = Math.min(defaultPos.x, rect.width / 2);
          const targetY = Math.max(defaultPos.y, rect.height - 75);
          basePosRef.current = { x: targetX, y: targetY };
          baseRef.current.style.transition = 'left 0.25s ease-out, top 0.25s ease-out';
          baseRef.current.style.left = `${targetX}px`;
          baseRef.current.style.top = `${targetY}px`;
        }
      }, 400);

      if (telemetryDegreeRef.current) telemetryDegreeRef.current.textContent = '0°';
      if (telemetryForceRef.current) telemetryForceRef.current.textContent = '0%';

      if (onEnd) onEnd();
      if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
      if (onMove) onMove({ x: 0, y: 0 }, 0, 0);
      if (onMoveLeft) onMoveLeft(false);
      if (onMoveRight) onMoveRight(false);
      if (onMoveUp) onMoveUp(false);
      if (onMoveDown) onMoveDown(false);

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Instant action button trigger (fires immediately on pointerdown, 0ms latency)
  const handleActionInstant = (actionFn?: () => void, hapticMs: number = 12) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(hapticMs);
    if (actionFn) actionFn();
  };

  const isAnyWASDActive = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;
  const attackHandler = onAttack || onSlash;
  const blastHandler = onBlast || onShoot;
  const takedownHandler = onTakedown || onStealthTakedown;

  return (
    <div
      id="touch-controls-hud-layer"
      style={{
        paddingLeft: 'max(0.4rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.4rem, env(safe-area-inset-right, 0px))',
        paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0px))',
      }}
      className="absolute inset-0 w-full h-full pointer-events-none z-30 select-none flex justify-between items-end overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. LEFT ZONE: BROAD 46vw x 60vh DYNAMIC FLOATING JOYSTICK SURFACE AREA   */}
      {/* (Mobile Legends standard: touch anywhere in the lower-left to steer)     */}
      {/* ========================================================================= */}
      <div
        id="touch-controls-left-quadrant"
        ref={zoneRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className="w-[48vw] max-w-[340px] h-[58vh] max-h-[360px] pointer-events-auto touch-none relative cursor-crosshair"
      >
        {/* Compact Telemetry & Heading Indicator HUD Pill */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#05030e]/90 border border-[#00FFD1]/30 rounded backdrop-blur-md flex items-center gap-1.5 font-mono-tech text-[8px] text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.2)] pointer-events-none">
          <Navigation
            ref={arrowRef}
            size={10}
            className={isAnyWASDActive || isActive ? 'text-[#FF00E5] animate-pulse' : 'text-[#00FFD1]'}
          />
          <span ref={telemetryDegreeRef} className="font-bold text-white">0°</span>
          <span className="text-gray-500">|</span>
          <span ref={telemetryForceRef} className="text-[#00FFD1] font-bold">0%</span>
          {isAnyWASDActive && <span className="text-[#FF00E5] font-black pl-1">WASD</span>}
        </div>

        {/* Dynamic Floating Joystick Base */}
        <div
          ref={baseRef}
          id="touch-joystick-base"
          style={{
            left: `${defaultPos.x}px`,
            top: `calc(100% - ${defaultPos.y}px)`,
            transform: 'translate(-50%, -50%)',
            width: `${maxRadius * 2}px`,
            height: `${maxRadius * 2}px`,
          }}
          className={`absolute rounded-full border-2 pointer-events-none flex items-center justify-center will-change-transform ${
            isActive || isAnyWASDActive
              ? 'border-[#00FFD1] bg-[#00FFD1]/18 shadow-[0_0_24px_rgba(0,255,209,0.5)] scale-105'
              : 'border-[#00FFD1]/35 bg-[#070512]/65 shadow-[0_0_12px_rgba(0,255,209,0.15)] opacity-85'
          } backdrop-blur-sm transition-all duration-100`}
        >
          {/* Subtle Cyber Grid Reticle */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="absolute w-full h-[1px] bg-[#00FFD1]"></div>
            <div className="absolute h-full w-[1px] bg-[#00FFD1]"></div>
          </div>

          <div
            style={{ width: `${maxRadius}px`, height: `${maxRadius}px` }}
            className="absolute rounded-full border border-dashed border-[#00FFD1]/45"
          ></div>

          {/* Directional Vector Laser Beam */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <line
              ref={lineRef}
              x1={maxRadius}
              y1={maxRadius}
              x2={maxRadius}
              y2={maxRadius}
              stroke="#FF00E5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 2"
              className={isActive || isAnyWASDActive ? 'drop-shadow-[0_0_8px_#FF00E5]' : 'opacity-0'}
            />
          </svg>

          {/* Draggable High-Response Joystick Knob with Neon Core */}
          <div
            ref={knobRef}
            id="touch-joystick-knob"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-lg pointer-events-none will-change-transform ${
              isActive || isAnyWASDActive
                ? 'border-[#FF00E5] bg-[#FF00E5]/30 shadow-[0_0_18px_#FF00E5]'
                : 'border-[#00FFD1] bg-[#0c0818]/90 shadow-[0_0_10px_rgba(0,255,209,0.3)]'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                isActive || isAnyWASDActive
                  ? 'bg-[#FF00E5] shadow-[0_0_10px_#FF00E5] scale-110'
                  : 'bg-[#00FFD1] shadow-[0_0_6px_#00FFD1]'
              }`}
            ></div>
          </div>
        </div>

        {/* Ambient Subtle Instructions when idle */}
        {!isActive && !isAnyWASDActive && (
          <div className="absolute left-6 bottom-3 pointer-events-none">
            <span className="text-[7.5px] uppercase font-mono-tech tracking-wider text-[#00FFD1]/70 bg-[#05030e]/85 px-1.5 py-0.5 border border-[#00FFD1]/20 rounded">
              360° JOYSTICK
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT ZONE: MOBILE LEGENDS RADIAL ARC ACTION BUTTONS (0ms TOUCH DELAY) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-end mb-2 sm:mb-4 mr-1 sm:mr-2 pointer-events-auto select-none touch-none">
        {/* Upper Tactical Stealth & Terminal Row */}
        <div className="flex items-center gap-1.5 mb-2">
          {onCrouch && (
            <button
              id="btn-action-crouch"
              type="button"
              onPointerDown={handleActionInstant(onCrouch, 8)}
              onTouchStart={handleActionInstant(onCrouch, 8)}
              aria-label="Crouch / Sneak"
              className="px-2.5 py-1 rounded-lg border border-[#00FFD1]/60 bg-[#060312]/90 hover:bg-[#00FFD1]/20 active:bg-[#00FFD1] text-[#00FFD1] active:text-black flex items-center gap-1 transition-transform active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(0,255,209,0.25)] backdrop-blur-md select-none touch-none"
            >
              <EyeOff size={12} className="text-[#00FFD1]" />
              <span className="text-[8px] sm:text-[9px] font-mono-tech font-bold tracking-wider uppercase">
                CROUCH
              </span>
            </button>
          )}

          {onCover && (
            <button
              id="btn-action-cover"
              type="button"
              onPointerDown={handleActionInstant(onCover, 8)}
              onTouchStart={handleActionInstant(onCover, 8)}
              aria-label="Take Cover"
              className="px-2.5 py-1 rounded-lg border border-[#0088FF]/60 bg-[#060312]/90 hover:bg-[#0088FF]/20 active:bg-[#0088FF] text-[#0088FF] active:text-white flex items-center gap-1 transition-transform active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(0,136,255,0.25)] backdrop-blur-md select-none touch-none"
            >
              <Shield size={12} className="text-[#0088FF]" />
              <span className="text-[8px] sm:text-[9px] font-mono-tech font-bold tracking-wider uppercase">
                COVER
              </span>
            </button>
          )}

          {onHack && (
            <button
              id="btn-action-hack"
              type="button"
              onPointerDown={handleActionInstant(onHack, 12)}
              onTouchStart={handleActionInstant(onHack, 12)}
              aria-label="Hack Terminal"
              className="px-2.5 py-1 rounded-lg border border-[#00FF66]/60 bg-[#060312]/90 hover:bg-[#00FF66]/20 active:bg-[#00FF66] text-[#00FF66] active:text-black flex items-center gap-1 transition-transform active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.25)] backdrop-blur-md select-none touch-none"
            >
              <Terminal size={12} className="text-[#00FF66]" />
              <span className="text-[8px] sm:text-[9px] font-mono-tech font-bold tracking-wider uppercase">
                HACK
              </span>
            </button>
          )}
        </div>

        {/*
          Professional Mobile Thumb Radial Arc Layout:
          - ATTACK: Large 68px Primary Button (Apex of right thumb arc)
          - BLAST: Satellite Top-Right
          - TAKEDOWN: Satellite Top-Left
          - DASH: Satellite Bottom-Left (Cyan/Pink Neon Turbo Blink)
        */}
        <div className="relative w-[170px] h-[135px] sm:w-[195px] sm:h-[155px] select-none pointer-events-auto touch-none">
          {/* 1. BLAST BUTTON (Upper Satellite) */}
          <button
            id="btn-action-blast"
            type="button"
            onPointerDown={handleActionInstant(blastHandler, 15)}
            onTouchStart={handleActionInstant(blastHandler, 15)}
            aria-label="Blast"
            className="absolute right-3 top-0 w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-[#FFE600] bg-[#161204]/95 active:bg-[#FFE600] text-[#FFE600] active:text-black flex flex-col items-center justify-center transition-transform active:scale-85 cursor-pointer shadow-[0_0_16px_rgba(255,230,0,0.45)] backdrop-blur-md select-none touch-none z-10"
          >
            <Crosshair size={16} className="drop-shadow-[0_0_6px_#FFE600]" />
            <span className="text-[7px] sm:text-[8px] font-mono-tech font-bold uppercase tracking-wider leading-none mt-0.5">
              BLAST
            </span>
          </button>

          {/* 2. TAKEDOWN BUTTON (Left Satellite) */}
          <button
            id="btn-action-takedown"
            type="button"
            onPointerDown={handleActionInstant(takedownHandler, 20)}
            onTouchStart={handleActionInstant(takedownHandler, 20)}
            aria-label="Takedown"
            className="absolute left-1 top-6 w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-[#FF0055] bg-[#1a040d]/95 active:bg-[#FF0055] text-[#FF0055] active:text-white flex flex-col items-center justify-center transition-transform active:scale-85 cursor-pointer shadow-[0_0_18px_rgba(255,0,85,0.5)] backdrop-blur-md select-none touch-none z-10"
          >
            <Target size={16} className="drop-shadow-[0_0_6px_#FF0055]" />
            <span className="text-[6.5px] sm:text-[7.5px] font-mono-tech font-black uppercase tracking-tight leading-none mt-0.5 text-center">
              TAKEDOWN
            </span>
          </button>

          {/* 3. DASH / BLINK BUTTON (Lower-Left Satellite) */}
          <button
            id="btn-action-dash"
            type="button"
            onPointerDown={handleActionInstant(onDash, 12)}
            onTouchStart={handleActionInstant(onDash, 12)}
            aria-label="Dash"
            className="absolute left-1 bottom-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#FF00E5] bg-[#18051e]/95 active:bg-[#FF00E5] text-[#FF00E5] active:text-black flex flex-col items-center justify-center transition-transform active:scale-85 cursor-pointer shadow-[0_0_18px_rgba(255,0,229,0.45)] backdrop-blur-md select-none touch-none z-10"
          >
            <Zap size={17} className="drop-shadow-[0_0_8px_#FF00E5]" />
            <span className="text-[7px] sm:text-[8px] font-mono-tech font-bold uppercase tracking-wider leading-none mt-0.5">
              DASH
            </span>
          </button>

          {/* 4. PRIMARY 'ATTACK' BUTTON (Largest Apex Button, Natural Resting Thumb) */}
          <button
            id="btn-action-attack"
            type="button"
            onPointerDown={handleActionInstant(attackHandler, 14)}
            onTouchStart={handleActionInstant(attackHandler, 14)}
            aria-label="Attack"
            className="absolute right-0 bottom-0 w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-[#00FFD1] bg-[#04141a]/95 active:bg-[#00FFD1] text-[#00FFD1] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-[0_0_24px_rgba(0,255,209,0.65)] backdrop-blur-md select-none touch-none z-20"
          >
            <Sword size={24} className="sm:w-7 sm:h-7 drop-shadow-[0_0_8px_#00FFD1]" />
            <span className="text-[8px] sm:text-[9.5px] font-mono-tech font-black tracking-widest uppercase leading-none mt-0.5 drop-shadow-[0_0_4px_#00FFD1]">
              ATTACK
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
