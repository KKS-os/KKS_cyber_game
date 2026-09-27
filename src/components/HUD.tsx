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
  Globe,
  Users,
  AlertTriangle,
  Maximize2,
  Minimize2,
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
import { CombatComboFeedback } from './CombatComboFeedback';
import { Language, getTranslation } from '../localization';

interface HUDProps {
  score: number;
  distance: number;
  highScore: number;
  comboCount: number;
  comboMultiplier: number;
  comboTimer?: number;
  maxComboTimer?: number;
  lastCombatHitTime?: number;
  integrity: number;
  isPaused: boolean;
  hasShield: boolean;
  overdriveTimer: number;
  chronoTimer: number;
  settings: GameSettings;
  isFallingIntoAbyss?: boolean;
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
  onToggleLanguage?: () => void;
  onOpenTacticalPing?: () => void;
  onOpenMultiplayer?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  highScore,
  comboCount,
  comboMultiplier,
  comboTimer = 0,
  maxComboTimer = 240,
  lastCombatHitTime = 0,
  integrity,
  isPaused,
  hasShield,
  overdriveTimer,
  chronoTimer,
  settings,
  isFallingIntoAbyss = false,
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
  onToggleLanguage,
  onOpenTacticalPing,
  onOpenMultiplayer,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const currentLang: Language = settings.language || 'MY';
  const t = getTranslation(currentLang);

  // Format score with leading zeros for retro arcade telemetry (e.g., 0042850)
  const formattedScore = score.toString().padStart(7, '0');

  // Integrity health color calculation
  const integrityColor = isFallingIntoAbyss
    ? '#FF0055'
    : integrity > 50 ? '#00FF66' : integrity > 25 ? '#FFE600' : '#FF0055';

  const collected = objectiveState?.collectedBioCores ?? 0;
  const totalCores = objectiveState?.totalBioCores ?? 3;
  const isPortalUnlocked = objectiveState?.portalUnlocked ?? false;
  const stageNum = objectiveState?.currentStage ?? 1;
  const stageName = objectiveState?.stageName ?? 'NEO-KYOTO CORRIDORS';
  const nearest = objectiveState?.nearestObjective;

  // Objective arrow rotation angle
  const arrowAngleDeg = nearest ? Math.round((nearest.angle * 180) / Math.PI) + 90 : 0;
  const nearestDistMeters = nearest ? Math.round(nearest.distance / 10) : 0;

  return (
    <header
      id="game-hud"
      aria-label="Tactical Game Overlay"
      style={{
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px))',
        paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))',
      }}
      className="absolute inset-x-0 top-0 w-full min-w-full max-w-none pointer-events-none z-30 select-none font-mono-tech"
    >
      {/* Top Banner Grid */}
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-8 py-1.5 sm:py-2 bg-gradient-to-b from-[#020108]/95 via-[#020108]/85 to-transparent border-b border-[#00FFD1]/20">
        
        {/* Left Section: Health / Integrity Bar */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[7.5px] sm:text-[9px] uppercase tracking-wider text-[#00FFD1] font-bold">
              <Activity size={10} className={isFallingIntoAbyss ? 'text-[#FF0055] animate-spin' : 'text-[#00FFD1]'} />
              <span className={isFallingIntoAbyss ? 'text-[#FF0055] font-black animate-pulse' : ''}>
                {isFallingIntoAbyss ? '⚠️ PITFALL ABYSS' : t.integrity}
              </span>
              <span className={`font-mono text-[9px] sm:text-[10px] ml-1 ${isFallingIntoAbyss ? 'text-[#FF0055] font-black' : 'text-white'}`}>
                {isFallingIntoAbyss ? 'CRITICAL' : `${Math.max(0, Math.round(integrity))}%`}
              </span>
            </div>

            {/* Segmented HP Gauge */}
            <div className="w-20 xs:w-24 sm:w-36 md:w-44 h-2 sm:h-2.5 bg-[#050505] border border-[#00FFD1]/40 p-0.5 relative overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${Math.max(0, Math.min(100, integrity))}%`,
                  backgroundColor: integrityColor,
                  boxShadow: `0 0 10px ${integrityColor}`,
                }}
              />
            </div>
          </div>

          {/* Bio-Core Objectives Tracker */}
          <div className="hidden xs:flex items-center gap-1 bg-[#060312]/90 border border-[#00FFD1]/30 px-1.5 sm:px-2 py-0.5 sm:py-1">
            <span className="text-[7.5px] sm:text-[8.5px] text-[#00FFD1]/70 font-bold uppercase mr-0.5">
              {t.cores}:
            </span>
            {[...Array(totalCores)].map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border transition-all ${
                  i < collected
                    ? 'bg-[#00FFD1] border-[#00FFD1] shadow-[0_0_8px_#00FFD1] animate-pulse'
                    : 'bg-transparent border-[#00FFD1]/30'
                }`}
              />
            ))}
          </div>

          {/* Rhythm Combat Metronome Indicator */}
          {rhythmBeatState && settings.rhythmCombatEnabled !== false && (
            <div
              className={`hidden md:flex items-center gap-1 px-2 py-0.5 border text-[9px] font-bold transition-all ${
                rhythmBeatState.inBeatWindow
                  ? 'border-[#00FFD1] bg-[#00FFD1]/20 text-[#00FFD1] shadow-[0_0_12px_#00FFD1] scale-105'
                  : 'border-white/10 bg-black/40 text-gray-400'
              }`}
            >
              <Sparkles size={11} className={rhythmBeatState.inBeatWindow ? 'text-[#00FFD1] animate-spin' : 'text-gray-500'} />
              <span>{Math.round(rhythmBeatState.bpm)} BPM</span>
              {rhythmBeatState.inBeatWindow && (
                <span className="text-[8px] px-1 bg-[#00FFD1] text-black font-black uppercase">
                  BEAT
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: Stage Name / Objective Telemetry */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-[8px] sm:text-[9.5px] text-cyan-300 font-bold tracking-widest uppercase">
            <span>{t.stage} 0{stageNum}</span>
            <span className="text-cyan-500">//</span>
            <span className="truncate max-w-[100px] sm:max-w-xs">{stageName}</span>
          </div>

          {/* Objective Navigation Radar Pointer */}
          {nearest && (
            <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold mt-0.5">
              <div
                className="transition-transform duration-100 ease-out"
                style={{ transform: `rotate(${arrowAngleDeg}deg)` }}
              >
                <Target
                  size={11}
                  className={isPortalUnlocked ? 'text-[#00FF66] animate-bounce' : 'text-[#00FFD1]'}
                />
              </div>
              <span className={isPortalUnlocked ? 'text-[#00FF66] font-black' : 'text-cyan-200'}>
                {isPortalUnlocked ? 'PORTAL' : 'CORE'}: {nearestDistMeters}M
              </span>
            </div>
          )}
        </div>

        {/* Right: Score, Language & Tactical Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Current Score */}
          <div className="flex flex-col items-end">
            <span className="text-[#00FF66] opacity-90 text-[7.5px] sm:text-[9px] uppercase font-bold tracking-wider drop-shadow-[0_0_6px_rgba(0,255,102,0.5)]">
              {t.score}
            </span>
            <span className="text-[11px] sm:text-sm md:text-base font-black text-[#00FF66] drop-shadow-[0_0_12px_#00FF66] tracking-wider">
              {formattedScore}
            </span>
          </div>

          {/* Interactive Controls Bar: Full Bar on Desktop, Compact Core Controls on Mobile */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            {/* Desktop Only Auxiliary Controls */}
            {onToggleLanguage && (
              <button
                id="hud-language-toggle"
                type="button"
                onClick={onToggleLanguage}
                aria-label="Switch Language (မြန်မာ / English)"
                title="Switch Language (မြန်မာ / English)"
                className="hidden sm:flex h-6 sm:h-7 px-1.5 sm:px-2 items-center gap-1 border border-cyan-400/40 bg-[#050505] hover:bg-cyan-500/20 text-[#00FFD1] transition-all cursor-pointer touch-manipulation font-mono-tech text-[8px] sm:text-[9px] font-bold uppercase"
              >
                <Globe size={11} />
                <span>{currentLang === 'MY' ? '🇲🇲 MY' : '🇬🇧 EN'}</span>
              </button>
            )}

            {/* Tactical Ping Quick Button */}
            {onOpenTacticalPing && (
              <button
                id="hud-tactical-ping-btn"
                type="button"
                onClick={onOpenTacticalPing}
                aria-label="Tactical Ping (T)"
                title="Tactical Squad Ping (T)"
                className="hidden md:flex h-6 sm:h-7 px-1.5 sm:px-2 items-center gap-1 border border-amber-400/60 bg-amber-950/30 hover:bg-amber-400 hover:text-black text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-all cursor-pointer touch-manipulation font-mono-tech text-[8px] sm:text-[9px] font-bold uppercase"
              >
                <Radio size={11} className="text-amber-400 animate-pulse shrink-0" />
                <span>{t.tacticalPing}</span>
              </button>
            )}

            {/* Multiplayer Squad Button */}
            {onOpenMultiplayer && (
              <button
                id="hud-multiplayer-btn"
                type="button"
                onClick={onOpenMultiplayer}
                aria-label="Multiplayer Squad"
                title="Multiplayer Squad"
                className="hidden md:flex h-6 sm:h-7 px-1.5 sm:px-2 items-center gap-1 border border-cyan-400/60 bg-cyan-950/30 hover:bg-[#00FFD1] hover:text-black text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.3)] transition-all cursor-pointer touch-manipulation font-mono-tech text-[8px] sm:text-[9px] font-bold uppercase"
              >
                <Users size={11} className="text-[#00FFD1] shrink-0" />
                <span>{t.multiplayerSquad}</span>
              </button>
            )}

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
              <span className="hidden sm:inline">{t.guideBtn}</span>
            </button>

            {/* Quick Audio Controls (Mobile & Desktop Instant Toggle) */}
            <button
              id="hud-sound-toggle"
              type="button"
              onClick={onToggleSound}
              aria-label="Toggle SFX"
              title={settings.soundEnabled ? 'Mute SFX' : 'Enable SFX'}
              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border transition-all cursor-pointer touch-manipulation rounded-sm ${
                settings.soundEnabled
                  ? 'border-[#00FFD1] bg-[#00FFD1]/20 text-[#00FFD1] shadow-[0_0_8px_rgba(0,255,209,0.4)]'
                  : 'border-white/20 bg-black/60 text-gray-500'
              }`}
            >
              {settings.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} className="opacity-60" />}
            </button>

            <button
              id="hud-music-toggle"
              type="button"
              onClick={onToggleMusic}
              aria-label="Toggle Synth BGM"
              title={settings.musicEnabled ? 'Mute Synth BGM' : 'Enable Synth BGM'}
              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border transition-all cursor-pointer touch-manipulation rounded-sm ${
                settings.musicEnabled
                  ? 'border-[#FF00E5] bg-[#FF00E5]/20 text-[#FF00E5] shadow-[0_0_8px_rgba(255,0,229,0.4)]'
                  : 'border-white/20 bg-black/60 text-gray-500'
              }`}
            >
              <Music size={12} className={settings.musicEnabled ? 'opacity-100 animate-pulse' : 'opacity-50'} />
            </button>

            {/* Mobile Quick Language Toggle */}
            {onToggleLanguage && (
              <button
                id="hud-mobile-lang-btn"
                type="button"
                onClick={onToggleLanguage}
                aria-label="Toggle Language"
                className="flex sm:hidden w-6 h-6 items-center justify-center border border-cyan-400/40 text-[9px] font-bold text-[#00FFD1] bg-[#050505] cursor-pointer touch-manipulation"
              >
                {currentLang === 'MY' ? '🇲🇲' : 'EN'}
              </button>
            )}

            {/* Full Screen Quick Toggle Button */}
            {onToggleFullscreen && (
              <button
                id="hud-fullscreen-btn"
                type="button"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                title={isFullscreen ? 'Exit Full Screen (မျက်နှာပြင်လျှော့မည်)' : 'Full Screen (မျက်နှာပြင်အပြည့်)'}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border transition-all cursor-pointer touch-manipulation rounded-sm ${
                  isFullscreen
                    ? 'border-[#FFE600] bg-[#FFE600]/25 text-[#FFE600] shadow-[0_0_10px_rgba(255,230,0,0.5)]'
                    : 'border-amber-400/50 bg-[#050505] text-amber-300 hover:border-amber-300 hover:bg-amber-400/20 shadow-[0_0_6px_rgba(251,191,36,0.2)]'
                }`}
              >
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            )}

            {/* Pause Button - Always Visible on All Viewports */}
            <button
              id="hud-pause-btn"
              type="button"
              onClick={onTogglePause}
              aria-label="Pause Game (P)"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border border-[#00FF66]/50 hover:border-[#00FF66] hover:bg-[#00FF66] hover:text-black text-[#00FF66] bg-[#050505] transition-colors cursor-pointer touch-manipulation"
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
          style={{
            left: 'max(0.5rem, env(safe-area-inset-left, 0px))',
          }}
          className="absolute top-[32px] sm:top-[42px] md:top-[50px] z-30 pointer-events-auto flex flex-col items-start"
        >
          <RadarMinimap
            getTelemetry={getRadarTelemetry}
            size={typeof window !== 'undefined' && (window.innerHeight < 600 || window.innerWidth < 640) ? 50 : 76}
          />
        </div>
      )}

      {/* Top-Right Floating Daily Mission Directive Tracker */}
      <div
        id="hud-daily-mission-anchor"
        style={{
          right: 'max(0.5rem, env(safe-area-inset-right, 0px))',
        }}
        className="absolute top-[32px] sm:top-[42px] md:top-[50px] z-30 pointer-events-auto hidden xs:flex flex-col items-end max-w-[120px] sm:max-w-xs"
      >
        <DailyMissionHUD />
      </div>

      {/* Dynamic Animated Combat Combo Feedback Counter */}
      <CombatComboFeedback
        comboCount={comboCount}
        comboMultiplier={comboMultiplier}
        comboTimer={comboTimer}
        maxComboTimer={maxComboTimer}
        language={currentLang}
        lastHitTime={lastCombatHitTime}
      />

      {/* Sub-Header: Active Buffs, Multiplier & Rhythm Streak */}
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-8 py-0.5 pointer-events-none flex-wrap gap-1 max-w-full overflow-hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          {comboCount > 0 && (
            <div className="border border-[#FF00E5] bg-[#0A0A0A]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#FF00E5] flex items-center gap-1 shadow-[0_0_12px_rgba(255,0,229,0.4)] animate-pulse">
              <span className="w-1.5 h-1.5 bg-[#FF00E5]"></span>
              <span className="font-bold">x{comboMultiplier} {t.combo} ({comboCount})</span>
            </div>
          )}

          {/* Portal Activation Banner in Sub-Header */}
          {isPortalUnlocked ? (
            <div className="border border-[#00FF66] bg-[#00FF66]/15 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#00FF66] uppercase font-black tracking-widest animate-pulse shadow-[0_0_12px_#00FF66] flex items-center gap-1">
              <Unlock size={10} />
              <span>{t.portalReadyEscape}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 border border-[#FF0055]/40 bg-[#0A0A0A]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tech text-[#FF0055] uppercase">
              <Lock size={9} />
              <span>{t.portalLocked} ({totalCores - collected})</span>
            </div>
          )}
        </div>

        {/* Active Powerups */}
        <div className="flex items-center gap-1.5 font-mono-tech flex-wrap">
          {hasShield && (
            <div className="border border-[#00FFD1] bg-[#050505]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] text-[#00FFD1] flex items-center gap-1 shadow-[0_0_10px_#00FFD1]">
              <Shield size={9} className="text-[#00FFD1]" />
              <span className="uppercase font-bold">{t.shield}</span>
            </div>
          )}

          {overdriveTimer > 0 && (
            <div className="border border-[#FF00E5] bg-[#050505]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] text-[#FF00E5] flex items-center gap-1 shadow-[0_0_12px_#FF00E5]">
              <Zap size={9} className="text-[#FF00E5] animate-bounce" />
              <span className="uppercase font-bold">{t.overdrive} ({Math.ceil(overdriveTimer / 60)}s)</span>
            </div>
          )}

          {chronoTimer > 0 && (
            <div className="border border-[#00FF66] bg-[#050505]/90 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] text-[#00FF66] flex items-center gap-1 shadow-[0_0_10px_#00FF66]">
              <Clock size={9} className="text-[#00FF66]" />
              <span className="uppercase font-bold">{t.slow} ({Math.ceil(chronoTimer / 60)}s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Boss Emergence & Obstruction Warning Banner */}
      {objectiveState?.bossSpawnStatus && (
        <div
          id="boss-spawn-warning-hud"
          role="alert"
          aria-live="assertive"
          className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] sm:max-w-lg w-full pointer-events-none transition-all duration-300"
        >
          {objectiveState.bossSpawnStatus.isObstructed ? (
            <div className="bg-[#140309]/95 border-2 border-[#FF0055] p-2.5 sm:p-3 shadow-[0_0_30px_rgba(255,0,85,0.6)] backdrop-blur-md animate-pulse pointer-events-auto">
              <div className="flex items-center gap-2 mb-1.5 border-b border-[#FF0055]/40 pb-1.5">
                <AlertTriangle className="text-[#FF0055] shrink-0 animate-bounce" size={20} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-[#FF0055] uppercase tracking-wider font-mono-tech">
                    {t.bossSpawnBlockedTitle}
                  </div>
                  <div className="text-[9px] text-[#FFE600] font-mono-tech font-bold">
                    CLEARANCE RADIUS: 110px // PROXIMITY: {Math.round(objectiveState.bossSpawnStatus.distanceToPlayer)}px
                  </div>
                </div>
              </div>

              <div className="text-[10px] sm:text-[11px] text-white/95 leading-snug mb-1.5 font-sans">
                <span className="text-[#FF0055] font-bold">⚠️ {currentLang === 'MY' ? 'ရှင်းပြချက်: ' : 'CAUSE: '}</span>
                {t.bossSpawnBlockedReason}
              </div>

              <div className="text-[9px] sm:text-[10px] text-[#00FFD1] bg-[#00FFD1]/10 px-2 py-1 border border-[#00FFD1]/30 font-mono-tech flex items-center justify-between">
                <span>{t.bossSpawnBlockedAction}</span>
                <span className="text-[#FF0055] font-bold tracking-widest uppercase text-[8px] animate-ping ml-2 shrink-0">
                  {currentLang === 'MY' ? 'ရပ်ဆိုင်းထားသည်' : 'HALTED'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#041212]/90 border border-[#00FFD1] p-2 sm:p-2.5 shadow-[0_0_20px_rgba(0,255,209,0.4)] backdrop-blur-md flex items-center justify-between gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="text-[#00FFD1] shrink-0 animate-spin" size={16} />
                <div>
                  <div className="text-[10px] sm:text-xs font-black text-[#00FFD1] uppercase tracking-wide font-mono-tech">
                    {t.bossSpawnImminent}
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-white/80 font-mono-tech">
                    {t.bossWarpStabilizing} // {Math.round(objectiveState.bossSpawnStatus.distanceToPlayer)}px
                  </div>
                </div>
              </div>
              <div className="shrink-0 bg-[#00FFD1]/20 border border-[#00FFD1] px-2 py-0.5 font-mono-tech text-xs sm:text-sm font-black text-[#00FFD1]">
                {Math.ceil(objectiveState.bossSpawnStatus.countdown / 30)}s
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cyberpunk Weapon Arsenal Quick-Bar (Bottom Center, Responsive & Thumb-Safe) */}
      {weaponArsenal && (
        <aside
          id="weapon-arsenal-dock"
          aria-label="Weapon Arsenal Quick-Bar"
          style={{
            bottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
          }}
          className="absolute left-1/2 -translate-x-1/2 max-w-[calc(100vw-250px)] sm:max-w-none flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 bg-[#060312]/95 border border-[#00FFD1]/40 shadow-[0_0_20px_rgba(0,255,209,0.25)] pointer-events-auto z-30 font-mono-tech select-none backdrop-blur-md overflow-x-auto scrollbar-none"
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
                className={`relative px-1.5 sm:px-2 py-0.5 sm:py-1 shrink-0 flex items-center gap-1 sm:gap-1.5 border transition-all text-left cursor-pointer ${
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
