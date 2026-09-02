import React from 'react';
import { RotateCcw, Trophy, Navigation, Disc, Zap } from 'lucide-react';
import { GameStats } from '../types';
import { DailyMissionCard } from './DailyMissionCard';
import { dailyMissionManager } from '../dailyMissionSystem';

interface GameOverModalProps {
  score: number;
  distance: number;
  highScore: number;
  chipsCollected: number;
  maxCombo: number;
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  distance,
  highScore,
  chipsCollected,
  maxCombo,
  onRestart,
}) => {
  const isNewHighScore = score >= highScore && score > 0;
  const formattedScore = score.toString().padStart(7, '0');
  const formattedHighScore = highScore.toString().padStart(7, '0');

  const handleRestartTrigger = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onRestart();
  };

  return (
    <div
      id="game-over-modal"
      onClick={onRestart}
      onTouchEnd={onRestart}
      className="absolute inset-0 bg-[#050505]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-40 text-center select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none border-2 border-[#FF00E5]/60 bg-[#0A0A0A]/95 p-4 sm:p-8 md:p-10 relative flex flex-col items-center shadow-[0_0_60px_rgba(255,0,229,0.3)] font-mono-tech cursor-default"
      >
        {/* Geometric Skewed Accents */}
        <div className="absolute -top-3 -left-3 w-7 h-7 bg-[#FF00E5] shadow-[0_0_15px_#FF00E5] transform skew-x-12 pointer-events-none"></div>
        <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-[#00FFD1] shadow-[0_0_15px_#00FFD1] transform -skew-x-12 pointer-events-none"></div>

        {/* Header Alert */}
        <div className="flex items-center gap-2 mb-2 pointer-events-none">
          <div className="w-2.5 h-2.5 bg-[#FF00E5] shadow-[0_0_6px_#FF00E5] animate-pulse"></div>
          <span className="text-xs uppercase tracking-widest text-[#FF00E5] font-bold">SYSTEM CRASH // SECTOR BREACHED</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,0,229,0.6)] mb-1 pointer-events-none">
          GAME OVER
        </h2>
        <p className="text-[11px] text-[#00FFD1]/70 uppercase tracking-widest mb-6 pointer-events-none">
          NEURAL RUN TERMINATED • PRESS REBOOT TO INITIALIZE NEW SESSION
        </p>

        {/* New High Score Alert */}
        {isNewHighScore && (
          <div className="border border-[#00FF66] bg-[#00FF66]/10 px-4 py-1.5 flex items-center gap-2 text-[#00FF66] font-bold text-xs uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(0,255,102,0.4)] animate-pulse pointer-events-none">
            <Trophy size={14} className="text-[#00FF66]" />
            <span>NEW ALL-TIME HIGH SCORE!</span>
          </div>
        )}

        {/* Final Score Telemetry */}
        <div className="flex flex-col items-center mb-6 pointer-events-none">
          <span className="text-[10px] text-[#00FF66] uppercase tracking-widest font-bold drop-shadow-[0_0_6px_#00FF66]">CURRENT SESSION SCORE</span>
          <span className="text-4xl sm:text-5xl font-black text-[#00FF66] tracking-wider drop-shadow-[0_0_15px_rgba(0,255,102,0.6)]">
            {formattedScore}
          </span>
          {!isNewHighScore && highScore > 0 && (
            <span className="text-[11px] text-[#FF00E5] mt-1 uppercase tracking-wider font-bold drop-shadow-[0_0_6px_#FF00E5]">
              ALL-TIME HIGH SCORE: {formattedHighScore}
            </span>
          )}
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-3 pointer-events-none">
          <div className="border border-[#00FFD1]/30 bg-[#050505] p-2.5 flex flex-col items-center">
            <Navigation size={14} className="text-[#00FFD1] mb-1" />
            <span className="text-[8px] uppercase tracking-widest text-[#00FFD1]/70 font-bold">Distance</span>
            <span className="text-sm font-bold text-[#00FFD1]">{distance}M</span>
          </div>

          <div className="border border-[#FF00E5]/30 bg-[#050505] p-2.5 flex flex-col items-center">
            <Disc size={14} className="text-[#FF00E5] mb-1" />
            <span className="text-[8px] uppercase tracking-widest text-[#FF00E5]/70 font-bold">Data Cores</span>
            <span className="text-sm font-bold text-[#FF00E5]">+{chipsCollected}</span>
          </div>

          <div className="border border-[#00FF66]/30 bg-[#050505] p-2.5 flex flex-col items-center">
            <Zap size={14} className="text-[#00FF66] mb-1" />
            <span className="text-[8px] uppercase tracking-widest text-[#00FF66]/70 font-bold">Peak Streak</span>
            <span className="text-sm font-bold text-[#00FF66]">{maxCombo}x</span>
          </div>
        </div>

        {/* Daily Mission Directive Status */}
        <div className="w-full max-w-sm mb-5">
          <DailyMissionCard mission={dailyMissionManager.getActiveMission()} compact />
        </div>

        {/* REBOOT Button */}
        <button
          id="btn-retry-game"
          type="button"
          onClick={handleRestartTrigger}
          onTouchEnd={handleRestartTrigger}
          className="w-full max-w-sm py-4 border-2 border-[#FF00E5] bg-[#FF00E5] hover:bg-[#FF00E5]/80 active:bg-white text-black font-black text-base uppercase tracking-widest transition-all duration-150 shadow-[0_0_25px_#FF00E5] active:scale-95 cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
        >
          <RotateCcw size={18} />
          <span>REBOOT [SPACE]</span>
        </button>
      </div>
    </div>
  );
};
