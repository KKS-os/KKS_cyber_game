import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Music, Compass, Zap, Crosshair, Shield, Activity, Radio, BookOpen } from 'lucide-react';
import { GameSettings, GameStats } from '../types';
import { assetUrls } from '../assetLoader';
import { CombatGuideMenu } from './CombatGuideMenu';
import { DailyMissionCard } from './DailyMissionCard';
import { dailyMissionManager } from '../dailyMissionSystem';

interface StartScreenProps {
  onStart: () => void;
  stats: GameStats;
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  stats,
  settings,
  onUpdateSettings,
}) => {
  const [showCombatGuide, setShowCombatGuide] = useState<boolean>(false);

  const handleStartTrigger = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onStart();
  };

  const handleOpenGuide = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowCombatGuide(true);
  };

  return (
    <>
      <div
        id="start-screen"
        onClick={onStart}
        onTouchEnd={onStart}
        className="absolute inset-0 bg-[#020108]/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 z-40 text-center select-none cursor-pointer overflow-hidden"
      >
        {/* Background Matte Painting Texture */}
        <img
          src={assetUrls.bgCity}
          alt="Cyber Megacity"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105 transition-transform duration-10000 ease-out pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020108] via-[#020108]/75 to-[#020108]/90 pointer-events-none" />

        {/* Centered Tactical Glassmorphism Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none border border-cyan-500/40 bg-[#070412]/90 backdrop-blur-xl p-3.5 sm:p-7 md:p-8 relative flex flex-col items-center shadow-[0_0_80px_rgba(0,229,201,0.2)] rounded-lg cursor-default font-mono-tech z-10"
        >
          {/* Geometric Corner Tactical Brackets */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00FFD1] pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#FF00E5] pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#FF00E5] pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFD1] pointer-events-none" />

          {/* Tactical Status Pill */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-black/60 border border-cyan-500/30 rounded-full mb-1.5 sm:mb-3 pointer-events-none">
            <Radio size={11} className="text-[#00FFD1] animate-pulse" />
            <span className="text-[8px] sm:text-[10px] tracking-[0.2em] text-[#00FFD1] font-bold uppercase">
              NEURAL DIRECT LINK // SECTOR 01
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF00E5] mb-0.5 sm:mb-1 drop-shadow-[0_0_30px_rgba(0,255,209,0.5)] pointer-events-none">
            NEON CYBER RUNNER
          </h1>
          <div className="text-cyan-400 text-[8.5px] sm:text-xs tracking-[0.25em] uppercase mb-2 sm:mb-3 opacity-90 font-semibold pointer-events-none flex items-center gap-2">
            <span>HIGH-FIDELITY CYBERNETIC COMBAT ENGINE</span>
          </div>

          {/* Tactical Combat Dossier Grid (Operative vs Bio-Hazard vs Objective) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-xl mb-3 pointer-events-none">
            {/* Operative Spec Card */}
            <div className="flex items-center gap-2.5 bg-black/80 border border-cyan-500/40 p-2 sm:p-2.5 rounded shadow-[0_0_15px_rgba(0,255,209,0.15)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-cyan-950/60 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_10px_rgba(0,255,209,0.4)]">
                <Shield size={18} className="text-[#00FFD1]" />
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-[8px] sm:text-[9px] text-cyan-400/80 tracking-widest uppercase font-bold">CYBER OPERATIVE</div>
                <div className="text-xs text-white font-black truncate">CYBORG NINJA</div>
                <div className="text-[8px] sm:text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  PLASMA KATANA READY
                </div>
              </div>
            </div>

            {/* Bio-Hazard Spec Card */}
            <div className="flex items-center gap-2.5 bg-black/80 border border-rose-500/40 p-2 sm:p-2.5 rounded shadow-[0_0_15px_rgba(255,0,85,0.15)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-rose-950/60 border border-rose-400 flex items-center justify-center text-rose-300 shrink-0 shadow-[0_0_10px_rgba(255,0,85,0.4)]">
                <Activity size={18} className="text-rose-400 animate-pulse" />
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-[8px] sm:text-[9px] text-rose-400/80 tracking-widest uppercase font-bold">BIO-HAZARD THREAT</div>
                <div className="text-xs text-white font-black truncate">MUTANT SWARM</div>
                <div className="text-[8px] sm:text-[9px] text-rose-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  ADAPTIVE AI DIRECT
                </div>
              </div>
            </div>

            {/* Mission Objective Spec Card */}
            <div className="flex items-center gap-2.5 bg-black/80 border border-purple-500/40 p-2 sm:p-2.5 rounded shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-purple-950/60 border border-purple-400 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                <Zap size={18} className="text-purple-300 animate-spin-slow" />
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-[8px] sm:text-[9px] text-purple-400/80 tracking-widest uppercase font-bold">SECTOR OBJECTIVE</div>
                <div className="text-xs text-white font-black truncate">QUANTUM EXTRACTION</div>
                <div className="text-[8px] sm:text-[9px] text-purple-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  RETRIEVE 3 BIO-CORES
                </div>
              </div>
            </div>
          </div>

          {/* High Score & Telemetry */}
          {stats.highScore > 0 && (
            <div className="flex items-center justify-around w-full max-w-xl bg-black/50 border border-cyan-500/20 px-3 py-1.5 mb-2.5 rounded pointer-events-none">
              <div className="flex flex-col items-center">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#FF00E5] font-bold">HIGH SCORE</span>
                <span className="text-base sm:text-lg font-black text-[#FF00E5]">
                  {stats.highScore.toString().padStart(7, '0')}
                </span>
              </div>
              <div className="w-[1px] h-5 bg-cyan-500/20" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-emerald-400 font-bold">PEAK STREAK</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {stats.bestCombo > 0 ? `${stats.bestCombo}x COMBO` : '1x COMBO'}
                </span>
              </div>
            </div>
          )}

          {/* Daily Mission Directive Card */}
          <div className="w-full max-w-xl mb-3 pointer-events-auto">
            <DailyMissionCard
              mission={dailyMissionManager.getActiveMission()}
            />
          </div>

          {/* Action Buttons Row (Start + How to Play) */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xl mb-3">
            {/* Primary Start Action Button */}
            <button
              id="btn-start-game"
              type="button"
              onClick={handleStartTrigger}
              onTouchEnd={handleStartTrigger}
              className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-[#00FFD1] to-[#00d0a7] hover:brightness-110 active:scale-[0.98] text-black font-black text-sm sm:text-base tracking-[0.2em] uppercase transition-all duration-150 shadow-[0_0_30px_rgba(0,255,209,0.45)] rounded cursor-pointer flex items-center justify-center gap-2.5 touch-manipulation"
            >
              <Play size={18} className="fill-current" />
              <span>INITIALIZE DEPLOYMENT</span>
            </button>

            {/* How to Play Combat Guide Button */}
            <button
              id="btn-how-to-play"
              type="button"
              onClick={handleOpenGuide}
              onTouchEnd={handleOpenGuide}
              className="px-4 py-3 sm:py-3.5 bg-purple-950/40 hover:bg-purple-900/60 active:scale-[0.98] border border-[#FF00E5]/70 hover:border-[#FF00E5] text-[#FF00E5] hover:text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 shadow-[0_0_20px_rgba(255,0,229,0.3)] rounded cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
            >
              <BookOpen size={16} />
              <span>HOW TO PLAY</span>
            </button>
          </div>

          {/* Control Keys Matrix */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xl mb-3 text-left pointer-events-none text-[9px] sm:text-[10px]">
            <div className="border border-cyan-500/20 bg-black/60 p-1.5 sm:p-2 rounded flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 border border-cyan-500/40 rounded flex items-center justify-center text-[#00FFD1] font-bold text-xs shrink-0">
                <Compass size={13} />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-[#00FFD1] uppercase truncate">W / A / S / D</div>
                <div className="text-cyan-400/60 text-[8px] sm:text-[9px] truncate">360° Move</div>
              </div>
            </div>

            <div className="border border-rose-500/20 bg-black/60 p-1.5 sm:p-2 rounded flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 border border-rose-500/40 rounded flex items-center justify-center text-[#FF00E5] font-bold text-xs shrink-0">
                <Crosshair size={13} />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-[#FF00E5] uppercase truncate">CLICK / J / K</div>
                <div className="text-rose-400/60 text-[8px] sm:text-[9px] truncate">Blade & Gun</div>
              </div>
            </div>

            <div className="border border-purple-500/20 bg-black/60 p-1.5 sm:p-2 rounded flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 border border-purple-500/40 rounded flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">
                <Zap size={13} />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-purple-400 uppercase truncate">SPACE / SHIFT</div>
                <div className="text-purple-400/60 text-[8px] sm:text-[9px] truncate">Phase Dash</div>
              </div>
            </div>
          </div>

          {/* Audio Synthesis & Visual Settings */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono-tech text-[#00FFD1]">
            <button
              id="start-sound-toggle"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ soundEnabled: !settings.soundEnabled });
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onUpdateSettings({ soundEnabled: !settings.soundEnabled });
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 border rounded transition-colors cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                settings.soundEnabled
                  ? 'border-[#00FFD1] text-[#00FFD1] bg-[#00FFD1]/10 shadow-[0_0_12px_rgba(0,255,209,0.3)]'
                  : 'border-slate-800 text-slate-600'
              }`}
            >
              {settings.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>SFX: {settings.soundEnabled ? 'ACTIVE' : 'MUTED'}</span>
            </button>

            <button
              id="start-music-toggle"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ musicEnabled: !settings.musicEnabled });
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onUpdateSettings({ musicEnabled: !settings.musicEnabled });
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 border rounded transition-colors cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                settings.musicEnabled
                  ? 'border-[#FF00E5] text-[#FF00E5] bg-[#FF00E5]/10 shadow-[0_0_12px_rgba(255,0,229,0.3)]'
                  : 'border-slate-800 text-slate-600'
              }`}
            >
              <Music size={13} />
              <span>SYNTH BGM: {settings.musicEnabled ? 'ACTIVE' : 'MUTED'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Combat Guide Modal Popup */}
      <CombatGuideMenu isOpen={showCombatGuide} onClose={() => setShowCombatGuide(false)} />
    </>
  );
};

