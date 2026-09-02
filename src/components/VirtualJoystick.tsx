import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Zap, Navigation, Sword, Crosshair, Shield, EyeOff, Target } from 'lucide-react';
import { JoystickVelocity } from '../types';

interface VirtualJoystickProps {
  /** Callback passing velocity array [vx, vy], radian angle (-PI to PI), and force intensity (0..1) */
  onMoveVelocity?: (velocityArray: [number, number], angle: number, force: number) => void;
  /** Callback passing velocity vector { x, y }, radian angle, and force intensity */
  onMove?: (velocity: JoystickVelocity, angle: number, force: number) => void;
  /** Callback when touch drag finishes */
  onEnd?: () => void;
  /** Dash trigger */
  onDash?: () => void;
  /** Slash / Stealth Takedown trigger */
  onSlash?: () => void;
  /** Stealth Takedown specific trigger */
  onStealthTakedown?: () => void;
  /** Crouch toggle trigger */
  onCrouch?: () => void;
  /** Cover toggle trigger */
  onCover?: () => void;
  /** Shoot trigger */
  onShoot?: () => void;
  /** Optional Hack trigger */
  onHack?: () => void;
  /** Current combo count for boost indicators */
  comboCount?: number;
  /** Maximum travel radius of knob from base center in pixels */
  maxRadius?: number;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMoveVelocity,
  onMove,
  onEnd,
  onDash,
  onSlash,
  onStealthTakedown,
  onCrouch,
  onCover,
  onShoot,
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
  const [basePos, setBasePos] = useState<{ x: number; y: number }>({ x: 68, y: 68 });
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState<{ angle: number; force: number; vx: number; vy: number }>({
    angle: 0,
    force: 0,
    vx: 0,
    vy: 0,
  });

  const zoneRef = useRef<HTMLDivElement>(null);
  const basePosRef = useRef<{ x: number; y: number }>({ x: 68, y: 68 });

  // Update basePos ref when state changes
  useEffect(() => {
    basePosRef.current = basePos;
  }, [basePos]);

  // --- PC KEYBOARD WASD VISUAL OVERLAY LISTENER ---
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [maxRadius, touchId]);

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

      // Pass directly to consumer callbacks
      if (onMoveVelocity) {
        onMoveVelocity([vx, vy], angle, force);
      }
      if (onMove) {
        onMove({ x: vx, y: vy }, angle, force);
      }
    },
    [maxRadius, onMoveVelocity, onMove]
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

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
      setBasePos({ x: 68, y: 68 });

      if (onEnd) onEnd();
      if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
      if (onMove) onMove({ x: 0, y: 0 }, 0, 0);

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

  return (
    <div
      id="virtual-joystick-hud-layer"
      style={{
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      className="fixed inset-x-0 bottom-0 pointer-events-none z-30 select-none flex justify-between items-end gap-2"
    >
      {/* 1. Left Section: 360° Tactical Joystick for Walking, Sneaking & Dynamic WASD Feedback */}
      <div className="flex flex-col items-start pointer-events-auto">
        <div className="mb-1 px-1.5 sm:px-2 py-0.5 bg-[#05030e]/90 border border-[#00FFD1]/40 rounded backdrop-blur-md flex items-center gap-1.5 sm:gap-2 font-mono-tech text-[8px] sm:text-[9px] text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.2)]">
          <div className="flex items-center gap-1">
            <Navigation
              size={10}
              style={{
                transform: `rotate(${degrees}deg)`,
                transition: 'transform 0.05s linear',
              }}
              className={isAnyWASDActive || isActive ? 'text-[#FF00E5] animate-pulse' : 'text-[#00FFD1]'}
            />
            <span className="font-bold text-white">{degrees}°</span>
          </div>
          <div className="w-[1px] h-2.5 bg-[#00FFD1]/30"></div>
          <div>
            <span className={`font-bold ${telemetry.force > 0.8 ? 'text-[#FF00E5]' : 'text-[#00FFD1]'}`}>
              {Math.round(telemetry.force * 100)}%
            </span>
          </div>
          {isAnyWASDActive && (
            <div className="flex items-center gap-0.5 text-[8px] font-mono-tech font-black text-[#FF00E5] tracking-widest pl-1 border-l border-[#00FFD1]/30">
              <span>WASD</span>
            </div>
          )}
        </div>

        <div
          id="virtual-joystick-touch-zone"
          ref={zoneRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onPointerLeave={handlePointerUpOrCancel}
          className={`relative w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 touch-none rounded-2xl border ${
            isActive || isAnyWASDActive
              ? 'border-[#00FFD1]/80 bg-[#00FFD1]/15 shadow-[0_0_20px_rgba(0,255,209,0.35)]'
              : 'border-[#00FFD1]/25 bg-[#05030e]/50 shadow-[0_0_15px_rgba(0,255,209,0.15)]'
          } backdrop-blur-sm transition-colors duration-150 cursor-crosshair overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#00FFD1_1px,transparent_1px)] [background-size:12px_12px]"></div>

          {/* Cardinal WASD Compass Indicator Badges */}
          <div
            id="wasd-indicator-w"
            className={`absolute top-1 inset-x-0 mx-auto w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded font-mono-tech font-black text-[8px] sm:text-[9px] transition-all duration-100 ${
              activeKeys.w
                ? 'bg-[#FF00E5] text-black shadow-[0_0_12px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            W
          </div>
          <div
            id="wasd-indicator-s"
            className={`absolute bottom-1 inset-x-0 mx-auto w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded font-mono-tech font-black text-[8px] sm:text-[9px] transition-all duration-100 ${
              activeKeys.s
                ? 'bg-[#FF00E5] text-black shadow-[0_0_12px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            S
          </div>
          <div
            id="wasd-indicator-a"
            className={`absolute left-1 inset-y-0 my-auto w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded font-mono-tech font-black text-[8px] sm:text-[9px] transition-all duration-100 ${
              activeKeys.a
                ? 'bg-[#FF00E5] text-black shadow-[0_0_12px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            A
          </div>
          <div
            id="wasd-indicator-d"
            className={`absolute right-1 inset-y-0 my-auto w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded font-mono-tech font-black text-[8px] sm:text-[9px] transition-all duration-100 ${
              activeKeys.d
                ? 'bg-[#FF00E5] text-black shadow-[0_0_12px_#FF00E5] scale-110'
                : 'bg-[#060312]/80 text-[#00FFD1]/60 border border-[#00FFD1]/30'
            }`}
          >
            D
          </div>

          <div
            id="joystick-base"
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

            <div
              id="joystick-knob"
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

              {(isActive || isAnyWASDActive) && (
                <div
                  style={{
                    transform: `rotate(${degrees}deg) translateY(-11px)`,
                  }}
                  className="absolute w-1.5 h-1.5 border-t-2 border-r-2 border-[#00FFD1] rotate-45"
                ></div>
              )}
            </div>
          </div>

          {!isActive && !isAnyWASDActive && (
            <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
              <span className="text-[7px] uppercase font-mono-tech tracking-wider text-[#00FFD1]/70 bg-[#05030e]/80 px-1 py-0.5 border border-[#00FFD1]/20">
                TACTICAL MOVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Section: Clean, Ergonomic Tactical Stealth Control Cluster */}
      <div className="flex flex-col items-end gap-1 sm:gap-1.5 pointer-events-auto">
        {/* Upper Action Row: CROUCH (Sneak) + COVER (Hide) */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
          {/* CROUCH / SNEAK BUTTON */}
          <button
            id="btn-action-crouch"
            type="button"
            onPointerDown={handleActionClick(onCrouch)}
            onTouchStart={handleActionClick(onCrouch)}
            aria-label="Crouch"
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#00FFD1]/60 bg-[#060312]/90 hover:bg-[#00FFD1]/20 active:bg-[#00FFD1] text-[#00FFD1] active:text-black flex items-center gap-1 sm:gap-1.5 transition-transform active:scale-95 cursor-pointer touch-manipulation shadow-[0_0_12px_rgba(0,255,209,0.3)] backdrop-blur-md select-none"
          >
            <EyeOff size={13} className="text-[#00FFD1]" />
            <span className="text-[8.5px] sm:text-[9px] font-mono-tech font-bold tracking-wider uppercase">
              CROUCH
            </span>
          </button>

          {/* TAKE COVER BUTTON */}
          <button
            id="btn-action-cover"
            type="button"
            onPointerDown={handleActionClick(onCover)}
            onTouchStart={handleActionClick(onCover)}
            aria-label="Take Cover"
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#0088FF]/60 bg-[#060312]/90 hover:bg-[#0088FF]/20 active:bg-[#0088FF] text-[#0088FF] active:text-white flex items-center gap-1 sm:gap-1.5 transition-transform active:scale-95 cursor-pointer touch-manipulation shadow-[0_0_12px_rgba(0,136,255,0.3)] backdrop-blur-md select-none"
          >
            <Shield size={13} className="text-[#0088FF]" />
            <span className="text-[8.5px] sm:text-[9px] font-mono-tech font-bold tracking-wider uppercase">
              COVER
            </span>
          </button>
        </div>

        {/* Lower Main Tactical Grid: BLAST, STEALTH KILL / SLASH, DASH */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. BLAST (Plasma Blaster) */}
          <button
            id="btn-action-blast"
            type="button"
            onPointerDown={handleActionClick(onShoot)}
            onTouchStart={handleActionClick(onShoot)}
            aria-label="Blast"
            className="w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-[#FFE600] bg-[#090614]/95 hover:bg-[#FFE600]/20 active:bg-[#FFE600] text-[#FFE600] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_16px_rgba(255,230,0,0.35)] backdrop-blur-md select-none"
          >
            <Crosshair size={16} className="drop-shadow-[0_0_6px_#FFE600]" />
            <span className="text-[7px] sm:text-[8px] font-mono-tech font-bold uppercase tracking-wider leading-none mt-0.5">
              BLAST
            </span>
          </button>

          {/* 2. STEALTH TAKEDOWN / KATANA SLASH (Primary Action) */}
          <button
            id="btn-action-slash"
            type="button"
            onPointerDown={handleActionClick(onStealthTakedown || onSlash)}
            onTouchStart={handleActionClick(onStealthTakedown || onSlash)}
            aria-label="Stealth Takedown / Slash"
            className="w-14 h-14 xs:w-15 xs:h-15 sm:w-17 sm:h-17 rounded-2xl border-2 border-[#00FFD1] bg-[#061018]/95 hover:bg-[#00FFD1]/20 active:bg-[#00FFD1] text-[#00FFD1] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_24px_rgba(0,255,209,0.5)] backdrop-blur-md select-none"
          >
            <div className="flex items-center gap-0.5">
              <Sword size={20} className="drop-shadow-[0_0_8px_#00FFD1]" />
              <Target size={12} className="text-[#FF00E5] drop-shadow-[0_0_6px_#FF00E5]" />
            </div>
            <span className="text-[7.5px] sm:text-[8.5px] font-mono-tech font-black uppercase tracking-wider leading-none mt-0.5 text-center">
              TAKEDOWN
            </span>
          </button>

          {/* 3. HYPER DASH (Thruster Evasion) */}
          <button
            id="btn-action-dash"
            type="button"
            onPointerDown={handleActionClick(onDash)}
            onTouchStart={handleActionClick(onDash)}
            aria-label="Hyper Dash"
            className="w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-[#FF00E5] bg-[#120520]/95 hover:bg-[#FF00E5]/20 active:bg-[#FF00E5] text-[#FF00E5] active:text-black flex flex-col items-center justify-center transition-transform active:scale-90 cursor-pointer touch-manipulation shadow-[0_0_18px_rgba(255,0,229,0.45)] backdrop-blur-md select-none"
          >
            <Zap size={18} className="drop-shadow-[0_0_8px_#FF00E5]" />
            <span className="text-[7px] sm:text-[8px] font-mono-tech font-bold tracking-wider uppercase leading-none mt-0.5">
              DASH
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};


