import React from 'react';
import { Trophy, Crown, Skull, Coins, ArrowRight, ShieldCheck, Zap, RefreshCw, Home } from 'lucide-react';
import { StageClearSummary } from '../types';

interface GameVictoryModalProps {
  summary?: StageClearSummary | null;
  score: number;
  totalKills: number;
  onPlayAgain: () => void;
  onQuitToMenu: () => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = ({
  summary,
  score,
  totalKills,
  onPlayAgain,
  onQuitToMenu,
}) => {
  const formattedScore = score.toLocaleString();

  return (
    <div
      id="game-victory-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030108]/95 backdrop-blur-xl select-none animate-fade-in"
    >
      <div
        id="game-victory-panel"
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none bg-[#0e071e]/95 border-2 border-[#FFD700] shadow-[0_0_60px_rgba(255,215,0,0.4)] p-4 sm:p-7 rounded-none relative overflow-hidden flex flex-col gap-4 sm:gap-5 font-mono-tech"
      >
        {/* Holographic Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF00E5] via-[#FFD700] to-[#00FFD1] shadow-[0_0_20px_#FFD700]"></div>

        {/* Victory Header */}
        <div className="flex justify-between items-start border-b border-[#FFD700]/30 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50 shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                ★ APEX THREAT ELIMINATED ★
              </span>
              <span className="text-[10px] text-[#00FF66] font-bold tracking-wider animate-pulse">
                CITY LIBERATED
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.9)]">
              VICTORY ACHIEVED!
            </h1>
            <p className="text-xs text-[#00FFD1] tracking-wider mt-1">
              THE MUTATED BIO-ORGANISM OVERLORD HAS BEEN ERADICATED.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-2 border-[#FFD700] flex items-center justify-center bg-[#05030e] text-[#FFD700] shadow-[0_0_25px_#FFD700]">
              <Crown size={36} className="animate-bounce" />
            </div>
          </div>
        </div>

        {/* Victory Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Final Score */}
          <div className="bg-[#180e30]/80 border border-[#FFD700]/40 p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold uppercase">
              <Trophy size={15} />
              <span>Final Score</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_8px_#FFD700]">
              {formattedScore}
            </div>
          </div>

          {/* Mutants Purged */}
          <div className="bg-[#180e30]/80 border border-[#FF0055]/40 p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#FF0055] text-xs font-bold uppercase">
              <Skull size={15} />
              <span>Organisms Purged</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_8px_#FF0055]">
              {totalKills || summary?.enemiesKilled || 12}
            </div>
          </div>

          {/* Bounty Gold */}
          <div className="bg-[#180e30]/80 border border-[#00FF66]/40 p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold uppercase">
              <Coins size={15} />
              <span>Apex Bounty</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#00FF66] drop-shadow-[0_0_8px_#00FF66]">
              +5,000 $
            </div>
          </div>
        </div>

        {/* Victory Lore Callout */}
        <div className="p-3.5 bg-[#05030e]/90 border border-[#00FFD1]/40 flex items-start gap-3">
          <ShieldCheck size={24} className="text-[#00FFD1] shrink-0 mt-0.5" />
          <div className="text-[11px] text-gray-300 leading-relaxed">
            <span className="text-[#00FFD1] font-bold uppercase">MISSION DEBRIEF:</span> By neutralizing the Apex Organism and gathering the classified Bio-Cores, you secured the city grid and unlocked all prototype cyber-weapon technologies.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            id="victory-play-again-btn"
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-5 bg-[#FFD700] hover:bg-[#ffe135] text-black font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_#FFD700] transition-all cursor-pointer hover:scale-[1.02]"
          >
            <RefreshCw size={18} />
            <span>PLAY AGAIN // NEW RUN</span>
          </button>

          <button
            id="victory-menu-btn"
            type="button"
            onClick={onQuitToMenu}
            className="py-3 px-6 bg-[#180a28] hover:bg-[#251040] border border-[#00FFD1]/50 text-[#00FFD1] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Home size={16} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
