import React from 'react';
import { Settings, LogOut, Play, Globe, Maximize2, Minimize2 } from 'lucide-react';
import { GameSettings } from '../types';
import { Language, getTranslation } from '../localization';

interface PauseModalProps {
  onResume: () => void;
  onOpenSettings: () => void;
  onQuit: () => void;
  settings?: GameSettings;
  onUpdateSettings?: (settings: Partial<GameSettings>) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onOpenSettings,
  onQuit,
  settings,
  onUpdateSettings,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const currentLang: Language = settings?.language || 'MY';
  const t = getTranslation(currentLang);

  const handleToggleLanguage = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const nextLang: Language = currentLang === 'MY' ? 'EN' : 'MY';
    onUpdateSettings?.({ language: nextLang });
  };

  return (
    <div
      id="pause-screen-overlay"
      onClick={onResume}
      onTouchEnd={onResume}
      className="absolute inset-0 bg-[#050505]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-40 text-center select-none cursor-pointer"
    >
      {/* Centered Pause Window Frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none border-2 border-[#00FFD1]/50 bg-[#0A0A0A]/95 p-5 sm:p-10 relative flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,255,209,0.2)] font-mono-tech cursor-default"
      >
        {/* Decorative Skewed Cyber Accents */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#FF00E5] shadow-[0_0_15px_#FF00E5] transform skew-x-12 pointer-events-none"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#00FFD1] shadow-[0_0_15px_#00FFD1] transform -skew-x-12 pointer-events-none"></div>

        {/* System Status Alert & Language Quick Toggle */}
        <div className="flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2 pointer-events-none">
            <div className="w-2 h-2 bg-[#00FF66] shadow-[0_0_6px_#00FF66] animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest text-[#00FF66] font-bold">
              {t.neuralSuspended}
            </span>
          </div>

          {onUpdateSettings && (
            <button
              type="button"
              onClick={handleToggleLanguage}
              onTouchEnd={handleToggleLanguage}
              className="px-2 py-0.5 border border-[#00FFD1]/50 bg-[#00FFD1]/10 text-[#00FFD1] text-[10px] font-bold rounded flex items-center gap-1 hover:bg-[#00FFD1] hover:text-black transition-all cursor-pointer touch-manipulation"
            >
              <Globe size={11} />
              <span>{currentLang === 'MY' ? '🇲🇲 မြန်မာ' : '🇬🇧 EN'}</span>
            </button>
          )}
        </div>

        {/* Large Glowing White PAUSED Header */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 tracking-[0.2em] text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] pointer-events-none">
          {t.paused}
        </h2>

        {/* Subtext under pause header in Neon Pink */}
        <p className="text-[#FF00E5] mb-8 font-bold font-mono-tech tracking-widest text-xs sm:text-sm drop-shadow-[0_0_10px_#FF00E5] animate-pulse pointer-events-none">
          {t.resumeHint}
        </p>

        {/* Resume Button */}
        <button
          id="btn-pause-resume"
          type="button"
          onClick={onResume}
          onTouchEnd={onResume}
          className="w-full max-w-xs py-3 mb-5 border-2 border-[#00FF66] bg-[#00FF66]/10 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-150 shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
        >
          <Play size={15} className="fill-current" />
          <span>{t.resumeRun}</span>
        </button>

        {/* Fullscreen Quick Toggle Button */}
        {onToggleFullscreen && (
          <button
            id="btn-pause-fullscreen"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            className="w-full max-w-xs py-2.5 mb-4 border border-amber-400/60 bg-amber-950/20 hover:bg-amber-400 hover:text-black text-amber-300 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(251,191,36,0.25)] cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'EXIT FULLSCREEN // မျက်နှာပြင်လျှော့မည်' : 'FULLSCREEN // မျက်နှာပြင်အပြည့်'}</span>
          </button>
        )}

        {/* Two Distinct Interactive Retro-Styled Buttons Centered Horizontally */}
        <div className="flex flex-row items-center justify-center gap-4 w-full max-w-xs">
          {/* SETTINGS Button (Glowing Cyan Border) */}
          <button
            id="btn-pause-settings"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="flex-1 py-3 px-3 border-2 border-[#00FFD1] bg-[#050505] hover:bg-[#00FFD1]/20 active:bg-[#00FFD1] text-[#00FFD1] active:text-black font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(0,255,209,0.4)] cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <Settings size={14} />
            <span>{t.settings}</span>
          </button>

          {/* QUIT GAME Button (Glowing Pink Border) */}
          <button
            id="btn-pause-quit"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuit();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onQuit();
            }}
            className="flex-1 py-3 px-3 border-2 border-[#FF00E5] bg-[#050505] hover:bg-[#FF00E5]/20 active:bg-[#FF00E5] text-[#FF00E5] active:text-black font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(255,0,229,0.4)] cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <LogOut size={14} />
            <span>{t.quitGame}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
