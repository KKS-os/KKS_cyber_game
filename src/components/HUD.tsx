import React from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Pause,
  Play,
  Shield,
  Zap,
  Clock,
  Activity,
  Target,
  Lock,
  Unlock,
  Ghost,
  Radio,
  Crosshair,
  Flame,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  GameSettings,
  StageObjectiveState,
  RhythmBeatState,
  SpeedrunDeltaInfo,
  WeaponType,
  WeaponInfo,
  RadarTelemetryData,
} from '../types';
import { RadarMinimap } from './RadarMinimap';
import { DailyMissionHUD } from './DailyMissionHUD';

interface HUDProps {
  score: number;
  distance: number;
  highScore: number;
  comboCount: number;
  comboMultiplier: number;
  integrity: number;
  isPaused: boolean;
  hasShield: boolean;
  overdriveTimer: number;
  chronoTimer: number;
  settings: GameSettings;
  objectiveState?: StageObjectiveState;
  rhythmBeatState?: RhythmBeatState;
  speedrunDelta?: SpeedrunDeltaInfo;
  activeWeapon?: WeaponType;
  weaponArsenal?: Record<WeaponType, WeaponInfo> | null;
  getRadarTelemetry?: () => RadarTelemetryData | null;
  onSelectWeapon?: (type: WeaponType) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onTogglePause: () => void;
  onOpenGuide: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  highScore,
  comboCount,
  comboMultiplier,
  integrity,
  isPaused,
  hasShield,
  overdriveTimer,
  chronoTimer,
  settings,
  objectiveState,
  rhythmBeatState,
  speedrunDelta,
  activeWeapon = 'PLASMA_BLASTER',
  weaponArsenal,
  getRadarTelemetry,
  onSelectWeapon,
  onToggleSound,
  onToggleMusic,
  onTogglePause,
  onOpenGuide,
}) => {
  // Format score with leading zeros for retro arcade telemetry (e.g., 0042850)
  const formattedScore = score.toString().padStart(7, '0');

  // Integrity health color calculation
  const integrityColor =
    integrity > 50 ? '#00FF66' : integrity > 25 ? '#FFE600' : '#FF0055';

  const collected = objectiveState?.collectedBioCores ?? 0;
  const totalCores = objectiveState?.totalBioCores ?? 3;
  const isPortalUnlocked = objectiveState?.portalUnlocked ?? false;
  const stageNum = objectiveState?.currentStage ?? 1;
  const stageName = objectiveState?.stageName ?? 'NEO-KYOTO CORRIDORS';
  const nearest = objectiveState?.nearestObjective;

  // Objective arrow rotation angle
  const arrowAngleDeg = nearest ? Math.round((nearest.angle * 180) / Math.PI) + 90 : 0;
  const nearestDistMeters = nearest ? Math.round(nearest.distance / 10) : 0;

  const isRhythmNear = rhythmBeatState?.isNearBeat ?? false;
  const bpm = rhythmBeatState?.bpm ?? 128;
  const beatStreak = rhythmBeatState?.streak ?? 0;

  const isDeltaAhead = speedrunDelta?.status === 'AHEAD';
  const deltaColor = isDeltaAhead ? '#00FF66' : speedrunDelta?.status === 'BEHIND' ? '#FF0055' : '#00FFD1';

  return (
    <header
      id="game-hud"
      style={{
        paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))',
      }}
      className="absolute inset-x-0 top-0 flex flex-col pointer-events-none z-20 select-none"
    >
      {/* Cyber Visor Corner Holographic Telemetry Brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00FFD1]/60 pointer-events-none"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00FFD1]/60 pointer-events-none"></div>

      {/* Top HUD Bar */}
      <div className="flex justify-between items-center px-2 sm:px-6 md:px-10 py-1 sm:py-1.5 border-b border-[#00FFD1]/20 bg-[#0A0A0A]/85 backdrop-blur-md min-h-[46px] sm:min-h-[50px]">
        {/* Left: Glowing Green SYSTEM INTEGRITY Health/Energy Bar */}
        <div className="flex flex-col items-start gap-0.5 sm:gap-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <Activity size={12} className="animate-pulse" style={{ color: integrityColor }} />
            <span
              className="text-[8px] sm:text-xs font-mono-tech font-black tracking-widest uppercase drop-shadow-[0_0_8px_#00FF66]"
              style={{ color: integrityColor }}
            >
              INTEGRITY
            </span>
            <span className="text-[8px] sm:text-xs font-mono-tech font-bold" style={{ color: integrityColor }}>
              {integrity}%
            </span>
          </div>

          {/* Health Bar Container */}
          <div className="w-20 xs:w-28 sm:w-40 md:w-52 h-1.5 sm:h-2 bg-[#111111] border border-[#00FF66]/40 p-0.5 relative overflow-hidden shadow-[0_0_10px_rgba(0,255,102,0.3)]">
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${Math.max(0, Math.min(100, integrity))}%`,
                backgroundColor: integrityColor,
                boxShadow: `0 0 10px ${integrityColor}`,
              }}
            ></div>
          </div>
        </div>

        {/* Center: OBJECTIVE HUD - BIO-CORES COLLECTED & SPEEDRUN TELEMETRY */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 font-mono-tech">
          {/* Stage Name Badge & Rhythm BPM */}
          <div className="hidden xs:flex items-center gap-1.5 sm:gap-2">
            <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/40 shadow-[0_0_8px_rgba(0,255,209,0.3)]">
              STAGE {stageNum}: {stageName}
            </span>
            <div
              className={`flex items-center gap-1 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-mono-tech border transition-all ${
                isRhythmNear
                  ? 'bg-[#00FFD1]/20 text-[#00FFD1] border-[#00FFD1] shadow-[0_0_10px_#00FFD1]'
                  : 'bg-[#120a28]/60 text-gray-400 border-white/20'
              }`}
            >
              <Radio size={9} className={isRhythmNear ? 'animate-pulse text-[#00FFD1]' : ''} />
              <span>{bpm} BPM</span>
            </div>
          </div>

          {/* Primary Objective Pod */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#060312]/90 px-2 sm:px-3 py-0.5 sm:py-1 border border-[#00FFD1]/50 shadow-[0_0_15px_rgba(0,255,209,0.25)]">
            <div className="flex items-center gap-1 text-[9px] sm:text-xs font-black tracking-wide text-white">
              <Target size={12} className="text-[#00FFD1] animate-spin-slow shrink-0" />
              <span className="text-[#00FFD1] text-[8.5px] sm:text-[10px] uppercase font-bold">Cores:</span>
              <span className="text-white drop-shadow-[0_0_8px_#00FFD1]">{collected}/{totalCores}</span>
            </div>

            {/* 3 Core Status Pills */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {[0, 1, 2].map((idx) => {
                const isCollected = idx < collected;
                return (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-none border transition-all duration-300 ${
                      isCollected
                        ? 'bg-[#00FFD1] border-[#ffffff] shadow-[0_0_10px_#00FFD1]'
                        : 'bg-[#180a24] border-[#FF0055]/50 animate-pulse'
                    }`}
                  />
                );
              })}
            </div>

            {/* Objective Tracker Arrow / Indicator */}
            {nearest && (
              <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/20 text-[10px] uppercase">
                <div
                  className="w-4 h-4 flex items-center justify-center text-[#00FFD1] transition-transform duration-100"
                  style={{ transform: `rotate(${arrowAngleDeg}deg)` }}
                >
                  ▲
                </div>
                <span className={isPortalUnlocked ? 'text-[#00FF66] font-bold animate-pulse' : 'text-[#FFE600] font-bold'}>
                  {isPortalUnlocked ? 'PORTAL' : 'CORE'}: {nearestDistMeters}m
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Scores, Ghost Speedrun Delta & Audio/Pause */}
        <div className="flex items-center gap-1.5 sm:gap-3 font-mono-tech">
          {/* Ghost Delta Pill (If Active) */}
          {speedrunDelta?.hasGhost && (
            <div
              className="hidden lg:flex items-center gap-1 px-2 py-1 bg-[#05030e]/90 border text-[9px] font-mono-tech font-bold uppercase tracking-wider"
              style={{
                borderColor: deltaColor,
                color: deltaColor,
                boxShadow: `0 0 10px ${deltaColor}40`,
              }}
            >
              <Ghost size={11} />
              <span>{speedrunDelta.formattedDelta}</span>
            </div>
          )}

          {/* Current Score */}
          <div className="flex flex-col items-end">
            <span className="text-[#00FF66] opacity-90 text-[7.5px] sm:text-[9px] uppercase font-bold tracking-wider drop-shadow-[0_0_6px_rgba(0,255,102,0.5)]">
              SCORE
            </span>
            <span className="text-[11px] sm:text-sm md:text-base font-black text-[#00FF66] drop-shadow-[0_0_12px_#00FF66] tracking-wider">
              {formattedScore}
            </span>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            {/* Tactical Combat Guide / How to Play Button */}
            <button
              id="hud-guide-btn"
              type="button"
              onClick={onOpenGuide}
              aria-label="Combat & Strategy Guide (?)"
              title="Combat & Strategy Guide (?)"
              className="h-6 sm:h-7 px-1.5 sm:px-2 flex items-center gap-1 border border-[#00FFD1] bg-[#00FFD1]/20 hover:bg-[#00FFD1] hover:text-black text-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.5)] transition-all cursor-pointer touch-manipulation font-mono-tech text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider"
            >
              <HelpCircle size={12} className="text-[#00FFD1] animate-pulse shrink-0" />
              <span className="hidden xs:inline sm:inline">GUIDE</span>
            </button>

            <button
              id="hud-sound-toggle"
              type="button"
              onClick={onToggleSound}
              aria-label="Toggle SFX"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border border-[#00FFD1]/40 hover:border-[#00FFD1] hover:bg-[#00FFD1] hover:text-black text-[#00FFD1] bg-[#050505] transition-colors cursor-pointer touch-manipulation"
            >
              {settings.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} className="opacity-40" />}
            </button>

            <button
              id="hud-music-toggle"
              type="button"
              onClick={onToggleMusic}
              aria-label="Toggle Synth BGM"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border border-[#FF00E5]/40 hover:border-[#FF00E5] hover:bg-[#FF00E5] hover:text-black text-[#FF00E5] bg-[#050505] transition-colors cursor-pointer touch-manipulation"
            >
              <Music size={12} className={settings.musicEnabled ? 'opacity-100' : 'opacity-40'} />
            </button>

            <button
              id="hud-pause-btn"
              type="button"
              onClick={onTogglePause}
              aria-label="Pause Game (P)"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border border-[#00FF66]/40 hover:border-[#00FF66] hover:bg-[#00FF66] hover:text-black text-[#00FF66] bg-[#050505] transition-colors cursor-pointer touch-manipulation"
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Top-Left Floating Tactical Radar Mini-Map */}
      {settings.minimapEnabled !== false && (
        <div
          id="hud-minimap-anchor"
          className="absolute top-[50px] sm:top-[56px] left-2 sm:left-4 md:left-8 z-30 pointer-events-auto flex flex-col items-start"
        >
          <RadarMinimap
            getTelemetry={getRadarTelemetry}
            size={88}
          />
        </div>
      )}

      {/* Top-Right Floating Daily Mission Directive Tracker */}
      <div
        id="hud-daily-mission-anchor"
        className="absolute top-[50px] sm:top-[56px] right-2 sm:right-4 md:right-8 z-30 pointer-events-auto flex flex-col items-end max-w-[150px] sm:max-w-xs"
      >
        <DailyMissionHUD />
      </div>

      {/* Sub-Header: Active Buffs, Multiplier & Rhythm Streak */}
      <div className="flex items-center justify-between pl-26 sm:pl-32 md:pl-36 pr-26 sm:pr-32 md:pr-36 py-1 pointer-events-none flex-wrap gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {comboCount > 0 && (
            <div className="border border-[#FF00E5] bg-[#0A0A0A]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#FF00E5] flex items-center gap-1 shadow-[0_0_12px_rgba(255,0,229,0.4)] animate-pulse">
              <span className="w-1.5 h-1.5 bg-[#FF00E5]"></span>
              <span className="font-bold">x{comboMultiplier} COMBO ({comboCount})</span>
            </div>
          )}

          {beatStreak > 0 && (
            <div className="border border-[#00FFD1] bg-[#00FFD1]/10 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#00FFD1] flex items-center gap-1 shadow-[0_0_12px_rgba(0,255,209,0.4)]">
              <Zap size={9} className="text-[#00FFD1]" />
              <span className="font-bold">⚡ x{beatStreak}</span>
            </div>
          )}

          {/* Portal Activation Banner in Sub-Header */}
          {isPortalUnlocked ? (
            <div className="border border-[#00FF66] bg-[#00FF66]/15 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#00FF66] uppercase font-black tracking-widest animate-pulse shadow-[0_0_12px_#00FF66] flex items-center gap-1">
              <Unlock size={10} />
              <span>PORTAL READY // ESCAPE NOW</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 border border-[#FF0055]/40 bg-[#0A0A0A]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#FF0055] uppercase">
              <Lock size={9} />
              <span>PORTAL LOCKED // {3 - collected} CORES</span>
            </div>
          )}
        </div>

        {/* Active Powerups */}
        <div className="flex items-center gap-1.5 font-mono-tech flex-wrap">
          {hasShield && (
            <div className="border border-[#00FFD1] bg-[#050505]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] text-[#00FFD1] flex items-center gap-1 shadow-[0_0_10px_#00FFD1]">
              <Shield size={9} className="text-[#00FFD1]" />
              <span className="uppercase font-bold">SHIELD</span>
            </div>
          )}

          {overdriveTimer > 0 && (
            <div className="border border-[#FF00E5] bg-[#050505]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] text-[#FF00E5] flex items-center gap-1 shadow-[0_0_12px_#FF00E5]">
              <Zap size={9} className="text-[#FF00E5] animate-bounce" />
              <span className="uppercase font-bold">OVERDRIVE ({Math.ceil(overdriveTimer / 60)}s)</span>
            </div>
          )}

          {chronoTimer > 0 && (
            <div className="border border-[#00FF66] bg-[#050505]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] text-[#00FF66] flex items-center gap-1 shadow-[0_0_10px_#00FF66]">
              <Clock size={9} className="text-[#00FF66]" />
              <span className="uppercase font-bold">SLOW ({Math.ceil(chronoTimer / 60)}s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Cyberpunk Weapon Arsenal Quick-Bar (Bottom Center, Responsive & Thumb-Safe) */}
      {weaponArsenal && (
        <aside
          id="weapon-arsenal-dock"
          aria-label="Weapon Arsenal Quick-Bar"
          style={{
            bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
          }}
          className="fixed left-1/2 -translate-x-1/2 max-w-[calc(100vw-250px)] sm:max-w-none flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 bg-[#060312]/95 border border-[#00FFD1]/40 shadow-[0_0_20px_rgba(0,255,209,0.25)] pointer-events-auto z-30 font-mono-tech select-none backdrop-blur-md overflow-x-auto scrollbar-none"
        >
          {(Object.entries(weaponArsenal) as [WeaponType, WeaponInfo][]).map(([key, w], idx) => {
            const wType = key;
            const isEquipped = activeWeapon === wType;
            const isUnlocked = w.unlocked;

            return (
              <button
                key={wType}
                id={`weapon-slot-${idx + 1}`}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectWeapon?.(wType)}
                className={`relative px-1.5 sm:px-2 py-0.5 sm:py-1 shrink-0 flex items-center gap-1 sm:gap-1.5 border transition-all text-left ${
                  isEquipped
                    ? 'bg-[#180a2c] border-[#FF00E5] shadow-[0_0_15px_rgba(255,0,229,0.5)] scale-105'
                    : isUnlocked
                    ? 'bg-[#0a0518]/90 border-white/20 hover:border-[#00FFD1] hover:bg-[#120a22]'
                    : 'bg-[#05030a]/80 border-white/5 opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Hotkey Number Badge */}
                <span
                  className={`text-[8px] sm:text-[9px] font-bold px-1 ${
                    isEquipped ? 'bg-[#FF00E5] text-black' : isUnlocked ? 'bg-[#00FFD1]/20 text-[#00FFD1]' : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Weapon Icon & Name */}
                <span className="text-[10px] sm:text-xs">{w.icon}</span>
                <div className="flex flex-col">
                  <span
                    className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-none ${
                      isEquipped ? 'text-[#FF00E5] drop-shadow-[0_0_6px_#FF00E5]' : isUnlocked ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {w.shortName}
                  </span>
                  {isUnlocked && (
                    <span className="text-[7px] text-[#00FFD1] leading-none mt-0.5 font-bold">
                      LV.{w.level}
                    </span>
                  )}
                </div>

                {!isUnlocked && (
                  <Lock size={8} className="text-gray-600 ml-0.5" />
                )}
              </button>
            );
          })}
        </aside>
      )}
    </header>
  );
};


