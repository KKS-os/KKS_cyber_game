import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './gameEngine';
import { HUD } from './components/HUD';
import { VirtualJoystick } from './components/VirtualJoystick';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { StageCompleteModal } from './components/StageCompleteModal';
import { GameVictoryModal } from './components/GameVictoryModal';
import { CombatGuideMenu } from './components/CombatGuideMenu';
import {
  GameSettings,
  GameStats,
  GameState,
  JoystickVelocity,
  StageClearSummary,
  StageObjectiveState,
  PersistentPlayerProgression,
  RhythmBeatState,
  SpeedrunDeltaInfo,
  WeaponType,
  WeaponInfo,
} from './types';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  particlesLevel: 'HIGH',
  crtOverlay: true,
  touchControls: true,
  characterHue: 0,
};

const DEFAULT_STATS: GameStats = {
  highScore: 0,
  totalRuns: 0,
  totalDistance: 0,
  totalChips: 0,
  bestCombo: 0,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React State for HUD & UI Overlays
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(0);
  const [integrity, setIntegrity] = useState<number>(100);

  // Powerup indicators
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [overdriveTimer, setOverdriveTimer] = useState<number>(0);
  const [chronoTimer, setChronoTimer] = useState<number>(0);
  const [rhythmBeatState, setRhythmBeatState] = useState<RhythmBeatState | null>(null);
  const [speedrunDelta, setSpeedrunDelta] = useState<SpeedrunDeltaInfo | null>(null);

  // Stage Objective & Progression State
  const [objectiveState, setObjectiveState] = useState<StageObjectiveState | null>(null);
  const [stageClearSummary, setStageClearSummary] = useState<StageClearSummary | null>(null);
  const [progression, setProgression] = useState<PersistentPlayerProgression | null>(null);
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('PLASMA_BLASTER');
  const [weaponArsenal, setWeaponArsenal] = useState<Record<WeaponType, WeaponInfo> | null>(null);

  // Settings & Guide Modal State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showCombatGuideModal, setShowCombatGuideModal] = useState<boolean>(false);

  // Settings & Stats from localStorage
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('cyberrunner_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('cyberrunner_stats');
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  // Touch Swipe tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Combat Guide Open / Close Handlers with Pause Management
  const handleOpenCombatGuide = useCallback(() => {
    if (engineRef.current && engineRef.current.state === 'PLAYING') {
      engineRef.current.pauseGame();
    }
    setShowCombatGuideModal(true);
  }, []);

  const handleCloseCombatGuide = useCallback(() => {
    setShowCombatGuideModal(false);
    if (engineRef.current && engineRef.current.state === 'PAUSED') {
      engineRef.current.pauseGame();
    }
  }, []);

  // Update Settings
  const handleUpdateSettings = useCallback((newPartial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem('cyberrunner_settings', JSON.stringify(updated));
      } catch {}
      if (engineRef.current) {
        engineRef.current.updateSettings(updated);
      }
      return updated;
    });
  }, []);

  // Initialize Game Engine on Canvas Mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, settings, stats);
    engineRef.current = engine;

    engine.onStateChange = (newState) => {
      setGameState(newState);
      if (newState === 'GAMEOVER') {
        setStats({ ...engine.stats });
        setHighScore(engine.highScore);
      }
    };

    engine.onScoreUpdate = (currentScore, currentDistance, combo, multiplier, currentIntegrity) => {
      setScore(currentScore);
      setDistance(currentDistance);
      setComboCount(combo);
      setComboMultiplier(multiplier);
      setIntegrity(currentIntegrity);
      setHasShield(engine.player.hasShield);
      setOverdriveTimer(engine.player.overdriveTimer);
      setChronoTimer(engine.player.chronoTimer);
      setRhythmBeatState({ ...engine.rhythmBeatState });
      setSpeedrunDelta({ ...engine.speedrunDelta });
    };

    engine.onStageClear = (summary) => {
      setStageClearSummary(summary);
      setGameState('STAGE_CLEAR');
    };

    engine.onObjectiveUpdate = (objState) => {
      setObjectiveState({ ...objState });
    };

    engine.onProgressionUpdate = (prog) => {
      setProgression({ ...prog });
    };

    engine.onWeaponUpdate = (activeW, arsenal) => {
      setActiveWeapon(activeW);
      setWeaponArsenal({ ...arsenal });
    };

    // Responsive Dynamic Resize Handler with DPR (Device Pixel Ratio)
    const handleResize = () => {
      if (!canvas || !engineRef.current) return;
      engineRef.current.calibrateRetinaDPI();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize();

    engine.startGame();

    return () => {
      engine.stop();
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

    // Global Keyboard Controls (8-way W/A/S/D and Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const eng = engineRef.current;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Start Game on key when in MENU or GAMEOVER
      if (eng.state === 'MENU') {
        if (code === 'Space' || key === ' ' || code === 'Enter' || key === 'w' || code === 'ArrowUp') {
          e.preventDefault();
          eng.startGame();
          return;
        }
      }
      if (eng.state === 'GAMEOVER') {
        if (code === 'KeyR' || key === 'r' || code === 'Space' || key === ' ' || code === 'Enter') {
          e.preventDefault();
          eng.startGame();
          return;
        }
      }

      // 8-Way Directional Movement (W / A / S / D & Arrows)
      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
        e.preventDefault();
        eng.handleMoveUp(true);
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
        e.preventDefault();
        eng.handleMoveDown(true);
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
        e.preventDefault();
        eng.handleMoveLeft(true);
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
        e.preventDefault();
        eng.handleMoveRight(true);
      }

      // Stealth Crouch (C)
      if (code === 'KeyC' || key === 'c') {
        e.preventDefault();
        eng.toggleCrouch();
      }
      // Stealth Cover behind 3D Walls (V)
      else if (code === 'KeyV' || key === 'v') {
        e.preventDefault();
        eng.toggleCover();
      }
      // Stealth Takedown / Assassination (F)
      else if (code === 'KeyF' || key === 'f') {
        e.preventDefault();
        eng.handleStealthTakedown();
      }
      // Slash / Melee Attack (J / Z)
      else if (code === 'KeyJ' || key === 'j' || code === 'KeyZ' || key === 'z') {
        e.preventDefault();
        eng.handleSlash();
      }
      // Shoot / Plasma Blaster (K / X)
      else if (code === 'KeyK' || key === 'k' || code === 'KeyX' || key === 'x') {
        e.preventDefault();
        eng.handleShoot();
      }
      // Dash (Shift / Space if not in menu)
      else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Space' || key === ' ') {
        e.preventDefault();
        if (eng.state === 'PAUSED') {
          eng.pauseGame();
        } else {
          eng.handleDash();
        }
      }
      // Hack / Override (E)
      else if (code === 'KeyE' || key === 'e') {
        e.preventDefault();
        eng.handleHack();
      }
      // Cycle Weapon (Q / Tab)
      else if (code === 'KeyQ' || key === 'q' || code === 'Tab') {
        e.preventDefault();
        eng.cycleWeapon();
      }
      // Direct Weapon Selection (1 - 5)
      else if (code === 'Digit1' || key === '1') {
        e.preventDefault();
        eng.switchWeapon('PLASMA_BLASTER');
      } else if (code === 'Digit2' || key === '2') {
        e.preventDefault();
        eng.switchWeapon('SPREAD_CANNON');
      } else if (code === 'Digit3' || key === '3') {
        e.preventDefault();
        eng.switchWeapon('LIGHTNING_CHAIN');
      } else if (code === 'Digit4' || key === '4') {
        e.preventDefault();
        eng.switchWeapon('HOMING_MISSILES');
      } else if (code === 'Digit5' || key === '5') {
        e.preventDefault();
        eng.switchWeapon('QUANTUM_VORTEX');
      }
      // Combat & Strategy Guide (H / ?)
      if (code === 'KeyH' || key === 'h' || key === '?') {
        e.preventDefault();
        if (showCombatGuideModal) {
          handleCloseCombatGuide();
        } else {
          handleOpenCombatGuide();
        }
        return;
      }

      // Pause (P / Escape)
      else if (code === 'KeyP' || key === 'p' || code === 'Escape') {
        e.preventDefault();
        if (showCombatGuideModal) {
          handleCloseCombatGuide();
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        } else {
          eng.pauseGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const eng = engineRef.current;
      const code = e.code;
      const key = e.key.toLowerCase();

      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') {
        eng.handleMoveUp(false);
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') {
        eng.handleMoveDown(false);
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') {
        eng.handleMoveLeft(false);
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') {
        eng.handleMoveRight(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showSettingsModal]);

  // Pointer movement on canvas for 360-degree aiming
  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.handlePointerAim(e.clientX - rect.left, e.clientY - rect.top);
  };

  // Touch & Swipe Event Handlers on Main Canvas Area
  const handleTouchStartCanvas = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEndCanvas = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !engineRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const eng = engineRef.current;

    if (eng.state === 'MENU') {
      eng.startGame();
      return;
    }

    if (eng.state === 'GAMEOVER') {
      eng.startGame();
      return;
    }

    if (eng.state === 'PAUSED') {
      eng.pauseGame();
      return;
    }

    if (eng.state === 'PLAYING') {
      // Swipe Detection
      if (dt < 500 && (absX > 30 || absY > 30)) {
        if (absY > absX) {
          if (dy < 0) {
            eng.handleJump();
          } else {
            eng.handleSlide();
          }
        } else if (dx > 0) {
          eng.handleDash();
        }
      } else if (dt < 400) {
        if (touch.clientX > window.innerWidth * 0.45) {
          eng.handleJump();
        } else {
          eng.handleSlide();
        }
      }
    }
  };

  // Mouse Click on Canvas Area
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!engineRef.current) return;
    const eng = engineRef.current;

    if (eng.state === 'MENU') {
      eng.startGame();
      return;
    }

    if (eng.state === 'GAMEOVER') {
      eng.startGame();
      return;
    }

    if (eng.state === 'PAUSED') {
      eng.pauseGame();
      return;
    }

    if (eng.state === 'PLAYING') {
      eng.handleSlash();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current && engineRef.current.state === 'PLAYING') {
      engineRef.current.handleShoot();
    }
  };

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handleResumeGame = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleRestartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handleQuitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.state = 'MENU';
      setGameState('MENU');
      engineRef.current.start();
    }
  };

  const handleNextStage = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.nextStage();
      setStageClearSummary(null);
    }
  }, []);

  // 360-Degree Virtual Joystick Input Handlers
  const handleJoystickVelocity = useCallback((velocityArray: [number, number], angle: number, force: number) => {
    if (engineRef.current) {
      engineRef.current.handleJoystickInput(velocityArray, angle, force);
    }
  }, []);

  const handleJoystickMove = useCallback((velocity: JoystickVelocity, angle: number, force: number) => {
    if (engineRef.current) {
      engineRef.current.handleJoystickInput(velocity, angle, force);
    }
  }, []);

  const handleJoystickEnd = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handleJoystickInput(null);
    }
  }, []);

  const handleSlashAction = () => {
    if (engineRef.current) {
      engineRef.current.handleSlash();
    }
  };

  const handleStealthTakedownAction = () => {
    if (engineRef.current) {
      engineRef.current.handleStealthTakedown();
    }
  };

  const handleCrouchAction = () => {
    if (engineRef.current) {
      engineRef.current.toggleCrouch();
    }
  };

  const handleCoverAction = () => {
    if (engineRef.current) {
      engineRef.current.toggleCover();
    }
  };

  const handleShootAction = () => {
    if (engineRef.current) {
      engineRef.current.handleShoot();
    }
  };

  const handleDashAction = () => {
    if (engineRef.current) {
      engineRef.current.handleDash();
    }
  };

  const handleHackAction = () => {
    if (engineRef.current) {
      engineRef.current.handleHack();
    }
  };

  return (
    <main
      id="game-viewport"
      ref={containerRef}
      className={`fixed inset-0 w-full h-full overflow-hidden bg-[#060312] flex items-center justify-center select-none ${
        settings.crtOverlay ? 'crt-overlay' : ''
      }`}
      onClick={handleCanvasClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStartCanvas}
      onTouchEnd={handleTouchEndCanvas}
    >
      {/* Geometric Grid Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none geometric-grid-bg z-0"></div>

      {/* HTML5 Canvas Game Stage */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        onPointerMove={handlePointerMoveCanvas}
        className="absolute inset-0 w-full h-full block bg-[#0a0518] cursor-crosshair z-0"
      />

      {/* In-Game Heads Up Display (HUD) */}
      {(gameState === 'PLAYING' || (gameState === 'PAUSED' && showCombatGuideModal)) && (
        <HUD
          score={score}
          distance={distance}
          highScore={highScore || stats.highScore}
          comboCount={comboCount}
          comboMultiplier={comboMultiplier}
          integrity={integrity}
          isPaused={gameState === 'PAUSED'}
          hasShield={hasShield}
          overdriveTimer={overdriveTimer}
          chronoTimer={chronoTimer}
          settings={settings}
          objectiveState={objectiveState || undefined}
          rhythmBeatState={rhythmBeatState || undefined}
          speedrunDelta={speedrunDelta || undefined}
          activeWeapon={activeWeapon}
          weaponArsenal={weaponArsenal}
          getRadarTelemetry={() => engineRef.current?.getRadarTelemetry() || null}
          onSelectWeapon={(wType) => engineRef.current?.switchWeapon(wType)}
          onToggleSound={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          onToggleMusic={() => handleUpdateSettings({ musicEnabled: !settings.musicEnabled })}
          onTogglePause={handleResumeGame}
          onOpenGuide={handleOpenCombatGuide}
        />
      )}

      {/* 360-Degree Virtual Touch Joystick & Tactical Action Controls */}
      {gameState === 'PLAYING' && settings.touchControls && (
        <VirtualJoystick
          onMoveVelocity={handleJoystickVelocity}
          onMove={handleJoystickMove}
          onEnd={handleJoystickEnd}
          onSlash={handleSlashAction}
          onStealthTakedown={handleStealthTakedownAction}
          onCrouch={handleCrouchAction}
          onCover={handleCoverAction}
          onShoot={handleShootAction}
          onDash={handleDashAction}
          onHack={handleHackAction}
          comboCount={comboCount}
        />
      )}

      {/* Start Menu Overlay */}
      {gameState === 'MENU' && (
        <StartScreen
          onStart={handleStartGame}
          stats={stats}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          score={score}
          distance={distance}
          highScore={stats.highScore}
          chipsCollected={engineRef.current?.chipsCollectedInRun || 0}
          maxCombo={engineRef.current?.maxComboInRun || 0}
          stats={stats}
          onRestart={handleRestartGame}
        />
      )}

      {/* Stage Clear Progression Modal */}
      {gameState === 'STAGE_CLEAR' && stageClearSummary && (
        <StageCompleteModal
          summary={stageClearSummary}
          onProceedNextStage={handleNextStage}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Apex Boss Game Victory Modal */}
      {gameState === 'GAME_VICTORY' && (
        <GameVictoryModal
          summary={stageClearSummary}
          score={score}
          totalKills={engineRef.current?.stats.totalChips || 0}
          onPlayAgain={handleRestartGame}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && !showSettingsModal && !showCombatGuideModal && (
        <PauseModal
          onResume={handleResumeGame}
          onOpenSettings={() => setShowSettingsModal(true)}
          onQuit={handleQuitToMenu}
        />
      )}

      {/* In-Pause Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setShowSettingsModal(false)}
        />
      )}

      {/* In-Game Combat & Tactical Survival Guide Modal */}
      <CombatGuideMenu
        isOpen={showCombatGuideModal}
        onClose={handleCloseCombatGuide}
      />
    </main>
  );
}
