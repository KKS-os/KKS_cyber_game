import React from 'react';
import { Settings, LogOut, Play } from 'lucide-react';
import { GameSettings } from '../types';

interface PauseModalProps {
  onResume: () => void;
  onOpenSettings: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onOpenSettings,
  onQuit,
}) => {
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

        {/* System Status Alert */}
        <div className="flex items-center gap-2 mb-3 pointer-events-none">
          <div className="w-2 h-2 bg-[#00FF66] shadow-[0_0_6px_#00FF66] animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-widest text-[#00FF66] font-bold">
            NEURAL RUNNER SUSPENDED
          </span>
        </div>

        {/* Large Glowing White PAUSED Header */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 tracking-[0.25em] text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] pointer-events-none">
          PAUSED
        </h2>

        {/* Subtext under pause header in Neon Pink */}
        <p className="text-[#FF00E5] mb-8 font-bold font-mono-tech tracking-widest text-xs sm:text-sm drop-shadow-[0_0_10px_#FF00E5] animate-pulse pointer-events-none">
          PRESS [SPACE] OR TOUCH TO RESUME
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
          <span>RESUME RUN</span>
        </button>

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
            <span>SETTINGS</span>
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
            <span>QUIT GAME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
