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
  /** Maximum travel radius of joystick knob */
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
  maxRadius = 38,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [touchId, setTouchId] = useState<number | null>(null);

  // Active keyboard WASD states for PC visual feedback
  const [activeKeys, setActiveKeys] = useState<{ w: boolean; a: boolean; s: boolean; d: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  // Joystick Base Position (either floating to touch start or anchored in zone)
  const [basePos, setBasePos] = useState<{ x: number; y: number }>({ x: 62, y: 62 });
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<{ angle: number; force: number; vx: number; vy: number }>({
    angle: 0,
    force: 0,
    vx: 0,
    vy: 0,
  });

  const zoneRef = useRef<HTMLDivElement>(null);
  const basePosRef = useRef<{ x: number; y: number }>({ x: 62, y: 62 });

  useEffect(() => {
    basePosRef.current = basePos;
  }, [basePos]);

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
      let vx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      let vy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

      if (vx === 0 && vy === 0) {
        if (!touchId) {
          setIsActive(false);
          setKnobOffset({ x: 0, y: 0 });
          setTelemetry((prev) => ({ ...prev, force: 0, vx: 0, vy: 0 }));
          if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
          if (onMove) onMove({ x: 0, y: 0 }, 0, 0);
          if (onMoveLeft) onMoveLeft(false);
          if (onMoveRight) onMoveRight(false);
          if (onMoveUp) onMoveUp(false);
          if (onMoveDown) onMoveDown(false);
        }
      } else {
        const len = Math.hypot(vx, vy);
        const normVx = vx / len;
        const normVy = vy / len;
        const angle = Math.atan2(normVy, normVx);
        const force = 1.0;
        const travel = maxRadius * 0.85;
        const knobX = normVx * travel;
        const knobY = normVy * travel;

        setIsActive(true);
        setKnobOffset({ x: knobX, y: knobY });
        setTelemetry({ angle, force, vx: normVx, vy: normVy });

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
  }, [maxRadius, touchId, onMoveVelocity, onMove, onMoveLeft, onMoveRight, onMoveUp, onMoveDown]);

  // Handle Drag calculations
  const processTouch = useCallback(
    (clientX: number, clientY: number) => {
      const origin = basePosRef.current;
      const dx = clientX - origin.x;
      const dy = clientY - origin.y;
      const distance = Math.hypot(dx, dy);

      // Radian angle in range (-PI to PI)
      const angle = Math.atan2(dy, dx);
      // Normalized intensity / force from 0.0 to 1.0
      const force = Math.min(distance / maxRadius, 1.0);

      // Clamp knob movement to max radius
      const clampedDist = Math.min(distance, maxRadius);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      // Calculate directional velocities
      const vx = Math.cos(angle) * force;
      const vy = Math.sin(angle) * force;

      setKnobOffset({ x: knobX, y: knobY });
      setTelemetry({ angle, force, vx, vy });

      // Pass to velocity & move callbacks
      if (onMoveVelocity) onMoveVelocity([vx, vy], angle, force);
      if (onMove) onMove({ x: vx, y: vy }, angle, force);

      // Pass to directional callbacks if registered
      if (onMoveLeft) onMoveLeft(vx < -0.3);
      if (onMoveRight) onMoveRight(vx > 0.3);
      if (onMoveUp) onMoveUp(vy < -0.3);
      if (onMoveDown) onMoveDown(vy > 0.3);
    },
    [maxRadius, onMoveVelocity, onMove, onMoveLeft, onMoveRight, onMoveUp, onMoveDown]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!zoneRef.current) return;
    const rect = zoneRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    // Anchor floating base at touch origin
    const newBase = { x: touchX, y: touchY };
    setBasePos(newBase);
    basePosRef.current = newBase;
    setIsActive(true);
    setTouchId(e.pointerId);

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    processTouch(touchX, touchY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || touchId !== e.pointerId || !zoneRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = zoneRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    processTouch(touchX, touchY);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchId === e.pointerId || !isActive) {
      e.preventDefault();
      e.stopPropagation();

      setIsActive(false);
      setTouchId(null);
      setKnobOffset({ x: 0, y: 0 });
      setTelemetry({ angle: 0, force: 0, vx: 0, vy: 0 });
      setBasePos({ x: 62, y: 62 });

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

  const handleActionClick = (actionFn?: () => void) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionFn) actionFn();
  };

  const degrees = Math.round(((telemetry.angle * 180) / Math.PI + 360) % 360);
  const isAnyWASDActive = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;

  // Resolve action handlers
  const attackHandler = onAttack || onSlash;
  const blastHandler = onBlast || onShoot;
  const takedownHandler = onTakedown || onStealthTakedown;

  return (
    <div
      id="touch-controls-hud-layer"
      style={{
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      className="absolute inset-x-0 bottom-0 w-full min-w-full max-w-none pointer-events-none z-30 select-none flex justify-between items-end"
    >
      {/* 1. Left Section: Ergonomic 360° Joystick closer to bottom-left screen edge */}
      <div className="flex flex-col items-start pointer-events-auto pl-0.5 sm:pl-1 pb-0.5 sm:pb-1">
        {/* Compact Telemetry & Heading Indicator */}
        <div className="mb-0.5 sm:mb-1 px-1.5 py-0.5 bg-[#05030e]/90 border border-[#00FFD1]/30 rounded backdrop-blur-md flex items-center gap-1.5 font-mono-tech text-[7.5px] sm:text-[8.5px] text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.2)]">
          <Navigation
            size={9}
            style={{
              transform: `rotate(${degrees}deg)`,
              transition: 'transform 0.05s linear',
            }}
            className={isAnyWASDActive || isActive ? 'text-[#FF00E5] animate-pulse' : 'text-[#00FFD1]'}
          />
          <span className="font-bold text-white">{degrees}°</span>
          <span className="text-gray-500">|</span>
          <span className={telemetry.force > 0.8 ? 'text-[#FF00E5] font-bold' : 'text-[#00FFD1]'}>
            {Math.round(telemetry.force * 100)}%
          </span>
          {isAnyWASDActive && <span className="text-[#FF00E5] font-black pl-1">WASD</span>}
        </div>

        {/* Joystick Touch Surface Zone */}
        <div
          id="touch-controls-joystick-zone"
          ref={zoneRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onPointerLeave={handlePointerUpOrCancel}
          className={`relative w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 touch-none rounded-2xl border ${
            isActive || isAnyWASDActive
              ? 'border-[#00FFD1]/80 bg-[#00FFD1]/15 shadow-[0_0_20px_rgba(0,255,209,0.35)]'
              : 'border-[#00FFD1]/30 bg-[#05030e]/60 shadow-[0_0_12px_rgba(0,255,209,0.15)]'
          } backdrop-blur-sm transition-colors duration-150 cursor-crosshair overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#00FFD1_1px,transparent_1px)] [background-size:12px_12px]"></div>

          {/* Compass Indicators */}
          <div
            className={`absolute top-1 inset-x-0 mx-auto w-3.5 h-3.5 flex items-center justify-center rounded font-mono-tech font-black text-[8px] transition-all duration-100 ${
              activeKeys.w
                ? 'bg-[#FF00E5] text-black shadow-[0_0_10px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            W
          </div>
          <div
            className={`absolute bottom-1 inset-x-0 mx-auto w-3.5 h-3.5 flex items-center justify-center rounded font-mono-tech font-black text-[8px] transition-all duration-100 ${
              activeKeys.s
                ? 'bg-[#FF00E5] text-black shadow-[0_0_10px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            S
          </div>
          <div
            className={`absolute left-1 inset-y-0 my-auto w-3.5 h-3.5 flex items-center justify-center rounded font-mono-tech font-black text-[8px] transition-all duration-100 ${
              activeKeys.a
                ? 'bg-[#FF00E5] text-black shadow-[0_0_10px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            A
          </div>
          <div
            className={`absolute right-1 inset-y-0 my-auto w-3.5 h-3.5 flex items-center justify-center rounded font-mono-tech font-black text-[8px] transition-all duration-100 ${
              activeKeys.d
                ? 'bg-[#FF00E5] text-black shadow-[0_0_10px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            D
          </div>

          {/* Dynamic Joystick Base */}
          <div
            id="touch-joystick-base"
            style={{
              left: `${basePos.x}px`,
              top: `${basePos.y}px`,
              transform: 'translate(-50%, -50%)',
              width: `${maxRadius * 2}px`,
              height: `${maxRadius * 2}px`,
            }}
            className={`absolute rounded-full border-2 transition-all pointer-events-none flex items-center justify-center ${
              isActive || isAnyWASDActive
                ? 'border-[#00FFD1] bg-[#00FFD1]/15 shadow-[0_0_20px_rgba(0,255,209,0.5)]'
                : 'border-[#00FFD1]/40 bg-[#0A0A0A]/60 shadow-[0_0_8px_rgba(0,255,209,0.15)]'
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="absolute w-full h-[1px] bg-[#00FFD1]"></div>
              <div className="absolute h-full w-[1px] bg-[#00FFD1]"></div>
            </div>

            <div
              style={{ width: `${maxRadius}px`, height: `${maxRadius}px` }}
              className="absolute rounded-full border border-dashed border-[#00FFD1]/40"
            ></div>

            {(isActive || isAnyWASDActive) && (
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <line
                  x1={maxRadius}
                  y1={maxRadius}
                  x2={maxRadius + knobOffset.x}
                  y2={maxRadius + knobOffset.y}
                  stroke="#FF00E5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="3 2"
                  className="drop-shadow-[0_0_6px_#FF00E5]"
                />
              </svg>
            )}

            {/* Draggable Knob */}
            <div
              id="touch-joystick-knob"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
                transition: touchId ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
              }}
              className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shadow-lg pointer-events-none ${
                isActive || isAnyWASDActive
                  ? 'border-[#FF00E5] bg-[#FF00E5]/25 shadow-[0_0_15px_#FF00E5]'
                  : 'border-[#00FFD1] bg-[#0A0A0A] shadow-[0_0_10px_rgba(0,255,209,0.35)]'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isActive || isAnyWASDActive
                    ? 'bg-[#FF00E5] shadow-[0_0_8px_#FF00E5] scale-110'
                    : 'bg-[#00FFD1] shadow-[0_0_5px_#00FFD1]'
                }`}
              ></div>
            </div>
          </div>

          {!isActive && !isAnyWASDActive && (
            <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
              <span className="text-[7px] uppercase font-mono-tech tracking-wider text-[#00FFD1]/70 bg-[#05030e]/80 px-1 py-0.5 border border-[#00FFD1]/20">
                JOYSTICK
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Section: Ergonomic Curved Arc Action Controls (Elevated away from absolute bottom edge) */}
      <div className="flex flex-col items-end mb-1.5 sm:mb-3 md:mb-5 mr-0.5 sm:mr-1.5 pointer-events-auto">
        {/* Upper Tactical Utility Row: CROUCH (Sneak) + COVER + Optional HACK */}
        <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
          {onCrouch && (
            <button
              id="btn-action-crouch"
              type="button"
              onPointerDown={handleActionClick(onCrouch)}
              onTouchStart={handleActionClick(onCrouch)}
              aria-label="Crouch / Sneak"
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-[#00FFD1]/60 bg-[#060312]/90 hover:bg-[#00FFD1]/20 active:bg-[#00FFD1] text-[#00FFD1] active:text-black flex items-center gap-1 transition-transform active:scale-95 cursor-pointer touch-manipulation shadow-[0_0_10px_rgba(0,255,209,0.25)] backdrop-blur-md select-none"
            >
              <EyeOff size={11} className="text-[#00FFD1]" />
              <span className="text-[7.5px] sm:text-[8.5px] font-mono-tech font-bold tracking-wider uppercase">
                CROUCH
              </span>
            </button>
          )}

          {onCover && (
            <button
              id="btn-action-cover"
              type="button"
              onPointerDown={handleActionClick(onCover)}
              onTouchStart={handleActionClick(onCover)}
              aria-label="Take Cover"
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-[#0088FF]/60 bg-[#060312]/90 hover:bg-[#0088FF]/20 active:bg-[#0088FF] text-[#0088FF] active:text-white flex items-center gap-1 transition-transform active:scale-95 cursor-pointer touch-manipulation shadow-[0_0_10px_rgba(0,136,255,0.25)] backdrop-blur-md select-none"
            >
              <Shield size={11} className="text-[#0088FF]" />
              <span className="text-[7.5px] sm:text-[8.5px] font-mono-tech font-bold tracking-wider uppercase">
                COVER
              </span>
            </button>
          )}

          {onHack && (
            <button
              id="btn-action-hack"
              type="button"
              onPointerDown={handleActionClick(onHack)}
              onTouchStart={handleActionClick(onHack)}
              aria-label="Hack Terminal"
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border border-[#00FF66]/60 bg-[#060312]/90 hover:bg-[#00FF66]/20 active:bg-[#00FF66] text-[#00FF66] active:text-black flex items-center gap-1 transition-transform active:scale-95 cursor-pointer touch-manipulation shadow-[0_0_10px_rgba(0,255,102,0.25)] backdrop-blur-md select-none"
            >
              <Terminal size={11} className="text-[#00FF66]" />
              <span className="text-[7.5px] sm:text-[8.5px] font-mono-tech font-bold tracking-wider uppercase">
                HACK
              </span>
            </button>
          )}
        </div>

        {/*
          Natural Curved Thumb Radial Arc:
          - ATTACK: Prominent Primary Action button (Largest, placed at natural thumb apex)
          - BLAST: Upper arc (top-right of arc)
          - TAKEDOWN: Left arc (sweeping outer arc)
          - DASH: Lower-left arc (bottom-left of arc)
          Generous breathing room and elevated away from screen bottom.
        */}
        <div className="relative w-[155px] h-[125px] sm:w-[185px] sm:h-[150px] md:w-[220px] md:h-[180px] select-none pointer-events-auto">
          {/* 1. BLAST BUTTON (Upper Arc) */}
          <button
            id="btn-action-blast"
            type="button"
            onPointerDown={handleActionClick(blastHandler)}
            onTouchStart={handleActionClick(blastHandler)}
            aria-label="Blast"
            className="absolute right-2 sm:right-4 top-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 border-[#FFE600] bg-[#141206]/95 hover:bg-[#FFE600]/25 active:bg-[#FFE600] text-[#FFE600] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_16px_rgba(255,230,0,0.4)] backdrop-blur-md select-none z-10"
          >
            <Crosshair size={15} className="drop-shadow-[0_0_6px_#FFE600]" />
            <span className="text-[6.5px] sm:text-[7.5px] font-mono-tech font-bold uppercase tracking-wider leading-none mt-0.5">
              BLAST
            </span>
          </button>

          {/* 2. TAKEDOWN BUTTON (Left Arc) */}
          <button
            id="btn-action-takedown"
            type="button"
            onPointerDown={handleActionClick(takedownHandler)}
            onTouchStart={handleActionClick(takedownHandler)}
            aria-label="Takedown"
            className="absolute left-0 sm:left-2 top-5 sm:top-7 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 border-[#FF0055] bg-[#18060e]/95 hover:bg-[#FF0055]/25 active:bg-[#FF0055] text-[#FF0055] active:text-white flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_18px_rgba(255,0,85,0.45)] backdrop-blur-md select-none z-10"
          >
            <Target size={15} className="drop-shadow-[0_0_6px_#FF0055]" />
            <span className="text-[6px] sm:text-[7px] font-mono-tech font-black uppercase tracking-tight leading-none mt-0.5 text-center">
              TAKEDOWN
            </span>
          </button>

          {/* 3. DASH BUTTON (Lower-Left Arc) */}
          <button
            id="btn-action-dash"
            type="button"
            onPointerDown={handleActionClick(onDash)}
            onTouchStart={handleActionClick(onDash)}
            aria-label="Dash"
            className="absolute left-0 sm:left-1 bottom-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 border-[#FF00E5] bg-[#14061a]/95 hover:bg-[#FF00E5]/25 active:bg-[#FF00E5] text-[#FF00E5] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_16px_rgba(255,0,229,0.4)] backdrop-blur-md select-none z-10"
          >
            <Zap size={15} className="drop-shadow-[0_0_8px_#FF00E5]" />
            <span className="text-[6.5px] sm:text-[7.5px] font-mono-tech font-bold uppercase tracking-wider leading-none mt-0.5">
              DASH
            </span>
          </button>

          {/* 4. PRIMARY 'ATTACK' BUTTON (Largest, Natural Resting Thumb Apex) */}
          <button
            id="btn-action-attack"
            type="button"
            onPointerDown={handleActionClick(attackHandler)}
            onTouchStart={handleActionClick(attackHandler)}
            aria-label="Attack"
            className="absolute right-0 bottom-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-[#00FFD1] bg-[#06141a]/95 hover:bg-[#00FFD1]/25 active:bg-[#00FFD1] text-[#00FFD1] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_24px_rgba(0,255,209,0.6)] backdrop-blur-md select-none z-20"
          >
            <Sword size={21} className="sm:w-6 sm:h-6 drop-shadow-[0_0_8px_#00FFD1]" />
            <span className="text-[7.5px] sm:text-[8.5px] font-mono-tech font-black tracking-widest uppercase leading-none mt-0.5 drop-shadow-[0_0_4px_#00FFD1]">
              ATTACK
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
