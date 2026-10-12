import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Zap,
  Navigation,
  Sword,
  Crosshair,
  Shield,
  EyeOff,
  Target,
  Terminal,
  Gamepad2,
  Vibrate,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import { JoystickVelocity, TouchControlStyle } from '../types';
import { Language, getTranslation } from '../localization';

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

  /** Twin-Stick Aim Direction */
  onAimDirection?: (angle: number, force: number) => void;

  /** Current combo count */
  comboCount?: number;
  /** Maximum travel radius of joystick knob (default 46px) */
  maxRadius?: number;

  /** Active control style: 'FLOATING' | 'FIXED_DPAD' */
  controlStyle?: TouchControlStyle;
  onToggleControlStyle?: (style: TouchControlStyle) => void;

  /** Haptic feedback active */
  hapticsEnabled?: boolean;
  onToggleHaptics?: () => void;

  /** Twin stick aim enabled */
  twinStickAimEnabled?: boolean;
  onToggleTwinStick?: () => void;

  /** Performance mode: Low 60FPS vs Ultra HD */
  isLowGraphicsMode?: boolean;
  onTogglePerformanceMode?: () => void;

  /** Language */
  language?: Language;
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
  onAimDirection,
  comboCount = 0,
  maxRadius = 46,
  controlStyle = 'FLOATING',
  onToggleControlStyle,
  hapticsEnabled = true,
  onToggleHaptics,
  twinStickAimEnabled = true,
  onToggleTwinStick,
  isLowGraphicsMode = false,
  onTogglePerformanceMode,
  language = 'MY',
}) => {
  const t = getTranslation(language);

  // Local control style state if no external controller passed
  const [internalStyle, setInternalStyle] = useState<TouchControlStyle>(controlStyle);
  const activeStyle = controlStyle || internalStyle;

  // Active keyboard WASD states for PC visual feedback
  const [activeKeys, setActiveKeys] = useState<{ w: boolean; a: boolean; s: boolean; d: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  // Active D-pad states
  const [dpadActive, setDpadActive] = useState<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Mobile touch joystick active state
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);

  // Twin stick aiming visual state
  const [aimingState, setAimingState] = useState<{
    active: boolean;
    button: 'ATTACK' | 'BLAST' | null;
    angle: number;
    distance: number;
  }>({
    active: false,
    button: null,
    angle: 0,
    distance: 0,
  });

  // DOM element references for 0ms Direct GPU Transform
  const zoneRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const telemetryDegreeRef = useRef<HTMLSpanElement>(null);
  const telemetryForceRef = useRef<HTMLSpanElement>(null);

  // D-Pad zone ref
  const dpadZoneRef = useRef<HTMLDivElement>(null);
  const dpadTouchIdRef = useRef<number | null>(null);

  // Aiming button drag tracking refs
  const aimTouchIdRef = useRef<number | null>(null);
  const aimOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const aimButtonTypeRef = useRef<'ATTACK' | 'BLAST' | null>(null);

  // Mutable positions for joystick without triggering React reconciler at 120Hz
  const basePosRef = useRef<{ x: number; y: number }>({ x: 70, y: 70 });
  const touchIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Default resting position inside the lower-left corner
  const defaultPos = { x: 74, y: 74 };

  // Trigger light haptic vibration for tactile feedback
  const triggerHaptic = useCallback(
    (pattern: number | number[] = 10) => {
      if (!hapticsEnabled) return;
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(pattern);
        }
      } catch {}
    },
    [hapticsEnabled]
  );

  // Handle switching control style with haptic feedback
  const handleSwitchControlStyle = (newStyle: TouchControlStyle) => {
    triggerHaptic(12);
    setInternalStyle(newStyle);
    if (onToggleControlStyle) {
      onToggleControlStyle(newStyle);
    }
  };

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
      if (isDraggingRef.current) return;

      let vx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      let vy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

      if (vx === 0 && vy === 0) {
        setIsJoystickActive(false);
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

        setIsJoystickActive(true);
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

  // --- 1. PROFESSIONAL 0ms DIRECT TOUCH PIPELINE (DYNAMIC FLOATING JOYSTICK) ---
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

      // Mobile Legends / Wild Rift Dynamic Follow
      if (distance > maxRadius * 1.25) {
        const excess = distance - maxRadius * 1.25;
        const angleFollow = Math.atan2(dy, dx);
        origin.x += Math.cos(angleFollow) * excess;
        origin.y += Math.sin(angleFollow) * excess;

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

      // 8% Deadzone filtering for buttery smooth stillness
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

      const angle = Math.atan2(dy, dx);
      const rawForce = Math.min((distance - deadzone) / (maxRadius - deadzone), 1.0);
      const curvedForce = Math.pow(rawForce, 1.15);

      const clampedDist = Math.min(distance, maxRadius);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      const vx = Math.cos(angle) * curvedForce;
      const vy = Math.sin(angle) * curvedForce;

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
    if (isDraggingRef.current && touchIdRef.current !== null) return;
    e.preventDefault();
    e.stopPropagation();

    if (!zoneRef.current) return;
    const rect = zoneRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    const clampedX = Math.max(maxRadius + 8, Math.min(rect.width - maxRadius - 8, touchX));
    const clampedY = Math.max(maxRadius + 8, Math.min(rect.height - maxRadius - 8, touchY));
    const newBase = { x: clampedX, y: clampedY };

    basePosRef.current = newBase;
    touchIdRef.current = e.pointerId;
    isDraggingRef.current = true;
    setIsJoystickActive(true);

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
      setIsJoystickActive(false);

      if (knobRef.current) {
        knobRef.current.style.transition = 'transform 0.16s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        knobRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
      if (lineRef.current) {
        lineRef.current.setAttribute('x2', `${maxRadius}`);
        lineRef.current.setAttribute('y2', `${maxRadius}`);
      }

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

  // --- 2. FIXED CLASSIC CYBER D-PAD CONTROLLER (CARDINAL + 8-WAY CONTINUOUS DRAG) ---
  const processDpadTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!dpadZoneRef.current) return;
      const rect = dpadZoneRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Deadzone inside center hub (radius < 18px)
      if (dist < 18) {
        setDpadActive({ up: false, down: false, left: false, right: false });
        if (onMoveUp) onMoveUp(false);
        if (onMoveDown) onMoveDown(false);
        if (onMoveLeft) onMoveLeft(false);
        if (onMoveRight) onMoveRight(false);
        if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
        return;
      }

      const angle = Math.atan2(dy, dx);
      const deg = ((angle * 180) / Math.PI + 360) % 360;

      // 8-Way directional sector evaluation:
      // Right: 337.5° - 22.5°
      // Down-Right: 22.5° - 67.5°
      // Down: 67.5° - 112.5°
      // Down-Left: 112.5° - 157.5°
      // Left: 157.5° - 202.5°
      // Up-Left: 202.5° - 247.5°
      // Up: 247.5° - 292.5°
      // Up-Right: 292.5° - 337.5°

      const isRight = (deg >= 337.5 || deg < 22.5) || (deg >= 22.5 && deg < 67.5) || (deg >= 292.5 && deg < 337.5);
      const isLeft = (deg >= 157.5 && deg < 202.5) || (deg >= 112.5 && deg < 157.5) || (deg >= 202.5 && deg < 247.5);
      const isUp = (deg >= 247.5 && deg < 292.5) || (deg >= 202.5 && deg < 247.5) || (deg >= 292.5 && deg < 337.5);
      const isDown = (deg >= 67.5 && deg < 112.5) || (deg >= 22.5 && deg < 67.5) || (deg >= 112.5 && deg < 157.5);

      const vx = isRight ? 1 : isLeft ? -1 : 0;
      const vy = isDown ? 1 : isUp ? -1 : 0;
      const len = Math.hypot(vx, vy) || 1;
      const normVx = vx / len;
      const normVy = vy / len;

      setDpadActive({ up: isUp, down: isDown, left: isLeft, right: isRight });

      if (onMoveUp) onMoveUp(isUp);
      if (onMoveDown) onMoveDown(isDown);
      if (onMoveLeft) onMoveLeft(isLeft);
      if (onMoveRight) onMoveRight(isRight);
      if (onMoveVelocity) onMoveVelocity([normVx, normVy], angle, 1.0);
    },
    [onMoveUp, onMoveDown, onMoveLeft, onMoveRight, onMoveVelocity]
  );

  const handleDpadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dpadTouchIdRef.current = e.pointerId;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    triggerHaptic(8);
    processDpadTouch(e.clientX, e.clientY);
  };

  const handleDpadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dpadTouchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    processDpadTouch(e.clientX, e.clientY);
  };

  const handleDpadPointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dpadTouchIdRef.current === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();
      dpadTouchIdRef.current = null;
      setDpadActive({ up: false, down: false, left: false, right: false });

      if (onMoveUp) onMoveUp(false);
      if (onMoveDown) onMoveDown(false);
      if (onMoveLeft) onMoveLeft(false);
      if (onMoveRight) onMoveRight(false);
      if (onMoveVelocity) onMoveVelocity([0, 0], 0, 0);
      if (onEnd) onEnd();

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // --- 3. TWIN-STICK DIRECTIONAL AIMING & INSTANT ACTION HANDLERS ---
  const handleActionInstant = (actionFn?: () => void, hapticMs: number = 12) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(hapticMs);
    if (actionFn) actionFn();
  };

  // Pointer drag for Twin-Stick Aiming on Attack or Blast
  const handleAimPointerDown = (buttonType: 'ATTACK' | 'BLAST', baseAction?: () => void) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    aimTouchIdRef.current = e.pointerId;
    aimOriginRef.current = { x: e.clientX, y: e.clientY };
    aimButtonTypeRef.current = buttonType;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    triggerHaptic(12);

    if (!twinStickAimEnabled && baseAction) {
      baseAction();
    }
  };

  const handleAimPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (aimTouchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    if (!twinStickAimEnabled) return;

    const dx = e.clientX - aimOriginRef.current.x;
    const dy = e.clientY - aimOriginRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 14) {
      const angle = Math.atan2(dy, dx);
      setAimingState({
        active: true,
        button: aimButtonTypeRef.current,
        angle,
        distance: Math.min(dist, 70),
      });

      if (onAimDirection) {
        onAimDirection(angle, Math.min(dist / 50, 1.0));
      }
    }
  };

  const handleAimPointerUp = (buttonType: 'ATTACK' | 'BLAST', baseAction?: () => void) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (aimTouchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - aimOriginRef.current.x;
    const dy = e.clientY - aimOriginRef.current.y;
    const dist = Math.hypot(dx, dy);

    aimTouchIdRef.current = null;
    aimButtonTypeRef.current = null;

    setAimingState({
      active: false,
      button: null,
      angle: 0,
      distance: 0,
    });

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // If dragged into outer radius, fire toward that aim angle
    if (dist > 14 && twinStickAimEnabled) {
      const angle = Math.atan2(dy, dx);
      if (onAimDirection) {
        onAimDirection(angle, 1.0);
      }
      triggerHaptic(buttonType === 'BLAST' ? [20, 30, 20] : 18);
      if (baseAction) baseAction();
    } else {
      // Quick tap without drag: Execute instant action
      triggerHaptic(buttonType === 'BLAST' ? 18 : 14);
      if (baseAction) baseAction();
    }
  };

  const isAnyWASDActive = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;
  const attackHandler = onAttack || onSlash;
  const blastHandler = onBlast || onShoot;
  const takedownHandler = onTakedown || onStealthTakedown;

  return (
    <div
      id="touch-controls-hud-layer"
      style={{
        paddingLeft: 'max(0.35rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.35rem, env(safe-area-inset-right, 0px))',
        paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
      }}
      className="absolute inset-0 w-full h-full pointer-events-none z-30 select-none flex flex-col justify-between overflow-hidden touch-none"
    >
      {/* ========================================================================= */}
      {/* TOP FLOATING CYBER TOOLBAR: QUICK DUAL SCHEME & PERFORMANCE TOGGLES       */}
      {/* ========================================================================= */}
      <div className="w-full flex items-center justify-between pt-1 px-2 pointer-events-none">
        {/* Left: Dual Control Scheme Switcher Pill [ 🕹️ JOYSTICK | 🎮 D-PAD ] */}
        <div className="pointer-events-auto flex items-center bg-[#060312]/90 border border-[#00FFD1]/40 rounded-full p-0.5 backdrop-blur-md shadow-[0_0_12px_rgba(0,255,209,0.25)]">
          <button
            type="button"
            onClick={() => handleSwitchControlStyle('FLOATING')}
            aria-label="360° Floating Joystick"
            className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono-tech font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeStyle === 'FLOATING'
                ? 'bg-[#00FFD1] text-black shadow-[0_0_8px_#00FFD1]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🕹️</span>
            <span className="hidden sm:inline">JOYSTICK</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchControlStyle('FIXED_DPAD')}
            aria-label="Fixed Classic D-Pad"
            className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono-tech font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeStyle === 'FIXED_DPAD'
                ? 'bg-[#FF00E5] text-black shadow-[0_0_8px_#FF00E5]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🎮</span>
            <span className="hidden sm:inline">D-PAD</span>
          </button>
        </div>

        {/* Center / Right: Performance 60FPS + Haptics Quick Badges */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#060312]/90 border border-slate-700/60 rounded-full px-2 py-0.5 backdrop-blur-md shadow-md">
          {onTogglePerformanceMode && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onTogglePerformanceMode();
              }}
              title="Toggle Performance 60FPS / Ultra HD"
              className={`text-[8px] font-mono-tech font-black tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all ${
                isLowGraphicsMode
                  ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/50 shadow-[0_0_6px_rgba(0,255,102,0.3)]'
                  : 'bg-[#FF00E5]/20 text-[#FF00E5] border border-[#FF00E5]/50'
              }`}
            >
              <Zap size={10} className={isLowGraphicsMode ? 'text-[#00FF66]' : 'text-[#FF00E5]'} />
              <span>{isLowGraphicsMode ? '60 FPS' : 'HD'}</span>
            </button>
          )}

          {onToggleHaptics && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onToggleHaptics();
              }}
              title="Toggle Haptic Feedback"
              className={`p-1 rounded-full cursor-pointer transition-all ${
                hapticsEnabled ? 'text-[#00FFD1] bg-[#00FFD1]/15' : 'text-gray-600 bg-transparent'
              }`}
            >
              <Vibrate size={11} />
            </button>
          )}

          {onToggleTwinStick && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onToggleTwinStick();
              }}
              title="Toggle Twin-Stick Aiming Assist"
              className={`p-1 rounded-full cursor-pointer transition-all ${
                twinStickAimEnabled ? 'text-[#FFE600] bg-[#FFE600]/15' : 'text-gray-600 bg-transparent'
              }`}
            >
              <Crosshair size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOWER CONTROLS ROW: LEFT (STEERING) & RIGHT (RADIAL ARC COMBAT)           */}
      {/* ========================================================================= */}
      <div className="w-full flex justify-between items-end pb-1 overflow-hidden pointer-events-none">
        {/* ======================================================================= */}
        {/* OPTION A: 360° FLOATING DYNAMIC JOYSTICK                                */}
        {/* ======================================================================= */}
        {activeStyle === 'FLOATING' ? (
          <div
            id="touch-controls-left-quadrant"
            ref={zoneRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            className="w-[46vw] max-w-[320px] h-[55vh] max-h-[340px] pointer-events-auto touch-none relative cursor-crosshair"
          >
            {/* Compact Telemetry & Heading Indicator HUD Pill */}
            <div className="absolute top-1 left-1 px-2 py-0.5 bg-[#05030e]/90 border border-[#00FFD1]/30 rounded backdrop-blur-md flex items-center gap-1.5 font-mono-tech text-[8px] text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.2)] pointer-events-none">
              <Navigation
                ref={arrowRef}
                size={10}
                className={isAnyWASDActive || isJoystickActive ? 'text-[#FF00E5] animate-pulse' : 'text-[#00FFD1]'}
              />
              <span ref={telemetryDegreeRef} className="font-bold text-white">
                0°
              </span>
              <span className="text-gray-500">|</span>
              <span ref={telemetryForceRef} className="text-[#00FFD1] font-bold">
                0%
              </span>
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
                isJoystickActive || isAnyWASDActive
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
                  className={isJoystickActive || isAnyWASDActive ? 'drop-shadow-[0_0_8px_#FF00E5]' : 'opacity-0'}
                />
              </svg>

              {/* Draggable High-Response Joystick Knob with Neon Core */}
              <div
                ref={knobRef}
                id="touch-joystick-knob"
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-lg pointer-events-none will-change-transform ${
                  isJoystickActive || isAnyWASDActive
                    ? 'border-[#FF00E5] bg-[#FF00E5]/30 shadow-[0_0_18px_#FF00E5]'
                    : 'border-[#00FFD1] bg-[#0c0818]/90 shadow-[0_0_10px_rgba(0,255,209,0.3)]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    isJoystickActive || isAnyWASDActive
                      ? 'bg-[#FF00E5] shadow-[0_0_10px_#FF00E5] scale-110'
                      : 'bg-[#00FFD1] shadow-[0_0_6px_#00FFD1]'
                  }`}
                ></div>
              </div>
            </div>

            {/* Ambient Label when idle */}
            {!isJoystickActive && !isAnyWASDActive && (
              <div className="absolute left-4 bottom-2 pointer-events-none">
                <span className="text-[7.5px] uppercase font-mono-tech tracking-wider text-[#00FFD1]/70 bg-[#05030e]/85 px-1.5 py-0.5 border border-[#00FFD1]/20 rounded">
                  360° JOYSTICK
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================================= */
          /* OPTION B: CLASSIC FIXED CYBER D-PAD (8-WAY CROSS-PAD CONTROLLER)        */
          /* ======================================================================= */
          <div className="p-2 pointer-events-auto touch-none select-none">
            <div
              ref={dpadZoneRef}
              id="touch-fixed-dpad-container"
              onPointerDown={handleDpadPointerDown}
              onPointerMove={handleDpadPointerMove}
              onPointerUp={handleDpadPointerUpOrCancel}
              onPointerCancel={handleDpadPointerUpOrCancel}
              className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-[#070414]/90 border border-[#00FFD1]/40 shadow-[0_0_20px_rgba(0,255,209,0.25)] backdrop-blur-md flex items-center justify-center cursor-pointer"
            >
              {/* UP BUTTON */}
              <div
                className={`absolute top-1.5 w-11 h-11 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center transition-all ${
                  dpadActive.up || activeKeys.w
                    ? 'border-[#00FFD1] bg-[#00FFD1]/40 text-black shadow-[0_0_14px_#00FFD1] scale-105'
                    : 'border-[#00FFD1]/40 bg-[#0c0818]/90 text-[#00FFD1]'
                }`}
              >
                <ChevronUp size={22} className="stroke-[2.5]" />
              </div>

              {/* DOWN BUTTON */}
              <div
                className={`absolute bottom-1.5 w-11 h-11 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center transition-all ${
                  dpadActive.down || activeKeys.s
                    ? 'border-[#00FFD1] bg-[#00FFD1]/40 text-black shadow-[0_0_14px_#00FFD1] scale-105'
                    : 'border-[#00FFD1]/40 bg-[#0c0818]/90 text-[#00FFD1]'
                }`}
              >
                <ChevronDown size={22} className="stroke-[2.5]" />
              </div>

              {/* LEFT BUTTON */}
              <div
                className={`absolute left-1.5 w-11 h-11 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center transition-all ${
                  dpadActive.left || activeKeys.a
                    ? 'border-[#00FFD1] bg-[#00FFD1]/40 text-black shadow-[0_0_14px_#00FFD1] scale-105'
                    : 'border-[#00FFD1]/40 bg-[#0c0818]/90 text-[#00FFD1]'
                }`}
              >
                <ChevronLeft size={22} className="stroke-[2.5]" />
              </div>

              {/* RIGHT BUTTON */}
              <div
                className={`absolute right-1.5 w-11 h-11 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center transition-all ${
                  dpadActive.right || activeKeys.d
                    ? 'border-[#00FFD1] bg-[#00FFD1]/40 text-black shadow-[0_0_14px_#00FFD1] scale-105'
                    : 'border-[#00FFD1]/40 bg-[#0c0818]/90 text-[#00FFD1]'
                }`}
              >
                <ChevronRight size={22} className="stroke-[2.5]" />
              </div>

              {/* CENTRAL RETICLE HUB */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#FF00E5]/60 bg-[#120520] flex items-center justify-center shadow-[0_0_8px_rgba(255,0,229,0.3)] pointer-events-none">
                <Gamepad2 size={16} className="text-[#FF00E5]" />
              </div>

              {/* Diagonal Indicator Badges */}
              <div className="absolute top-2 left-2 text-[6.5px] font-mono-tech text-cyan-400/40 pointer-events-none">
                ◤
              </div>
              <div className="absolute top-2 right-2 text-[6.5px] font-mono-tech text-cyan-400/40 pointer-events-none">
                ◥
              </div>
              <div className="absolute bottom-2 left-2 text-[6.5px] font-mono-tech text-cyan-400/40 pointer-events-none">
                ◣
              </div>
              <div className="absolute bottom-2 right-2 text-[6.5px] font-mono-tech text-cyan-400/40 pointer-events-none">
                ◢
              </div>
            </div>
            <div className="mt-1 text-center">
              <span className="text-[7.5px] uppercase font-mono-tech tracking-wider text-[#FF00E5]/80 bg-[#05030e]/85 px-1.5 py-0.5 border border-[#FF00E5]/20 rounded">
                CLASSIC D-PAD
              </span>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* RIGHT ZONE: MOBILE RADIAL ARC ACTION BUTTONS (WITH TWIN-STICK AIM)      */}
        {/* ======================================================================= */}
        <div className="flex flex-col items-end mb-1 sm:mb-2 mr-1 sm:mr-2 pointer-events-auto select-none touch-none">
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
            Mobile Thumb Radial Arc Layout:
            - ATTACK: Large 68px Primary Button (Apex of right thumb arc)
            - BLAST: Satellite Top-Right
            - TAKEDOWN: Satellite Top-Left
            - DASH: Satellite Bottom-Left (Cyan/Pink Neon Turbo Blink)
          */}
          <div className="relative w-[172px] h-[138px] sm:w-[198px] sm:h-[158px] select-none pointer-events-auto touch-none">
            {/* Visual Aim Trajectory Laser when dragging */}
            {aimingState.active && (
              <div
                style={{
                  transform: `rotate(${aimingState.angle}rad)`,
                  transformOrigin: '0 50%',
                  right: aimingState.button === 'ATTACK' ? '34px' : '20px',
                  bottom: aimingState.button === 'ATTACK' ? '34px' : '90px',
                }}
                className="absolute w-28 h-1 z-30 pointer-events-none flex items-center"
              >
                <div
                  className={`w-full h-0.5 ${
                    aimingState.button === 'BLAST' ? 'bg-[#FFE600]' : 'bg-[#00FFD1]'
                  } shadow-[0_0_8px_currentColor] animate-pulse`}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    aimingState.button === 'BLAST' ? 'border-[#FFE600]' : 'border-[#00FFD1]'
                  } shadow-[0_0_8px_currentColor] shrink-0 -ml-1`}
                ></div>
              </div>
            )}

            {/* 1. BLAST BUTTON (Upper Satellite with Twin-Stick Aim) */}
            <button
              id="btn-action-blast"
              type="button"
              onPointerDown={handleAimPointerDown('BLAST', blastHandler)}
              onPointerMove={handleAimPointerMove}
              onPointerUp={handleAimPointerUp('BLAST', blastHandler)}
              onPointerCancel={handleAimPointerUp('BLAST', blastHandler)}
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

            {/* 4. PRIMARY 'ATTACK' BUTTON (Largest Apex Button with Twin-Stick Aim) */}
            <button
              id="btn-action-attack"
              type="button"
              onPointerDown={handleAimPointerDown('ATTACK', attackHandler)}
              onPointerMove={handleAimPointerMove}
              onPointerUp={handleAimPointerUp('ATTACK', attackHandler)}
              onPointerCancel={handleAimPointerUp('ATTACK', attackHandler)}
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
    </div>
  );
};
