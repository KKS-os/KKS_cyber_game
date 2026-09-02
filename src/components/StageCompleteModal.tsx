import React from 'react';
import { Trophy, Clock, Skull, Coins, ArrowRight, ShieldCheck, Zap, Ghost, RefreshCw, Home } from 'lucide-react';
import { StageClearSummary } from '../types';

interface StageCompleteModalProps {
  summary: StageClearSummary;
  onNextStage?: () => void;
  onProceedNextStage?: () => void;
  onQuitToMenu?: () => void;
}

export const StageCompleteModal: React.FC<StageCompleteModalProps> = ({
  summary,
  onNextStage,
  onProceedNextStage,
  onQuitToMenu,
}) => {
  const handleProceed = onProceedNextStage || onNextStage || (() => {});

  const {
    stage,
    stageName,
    subtitle,
    timeTakenFormatted,
    bioCoresCollected,
    totalBioCores,
    enemiesKilled,
    goldEarned,
    bonusReward,
    totalGold,
    grade,
    healthRemainingPercent,
  } = summary;

  // Grade styling
  const gradeColors: Record<string, { text: string; shadow: string; border: string }> = {
    S: { text: '#FFE600', shadow: '#FFE600', border: '#FFE600' },
    A: { text: '#00FFD1', shadow: '#00FFD1', border: '#00FFD1' },
    B: { text: '#00FF66', shadow: '#00FF66', border: '#00FF66' },
    C: { text: '#FF00E5', shadow: '#FF00E5', border: '#FF00E5' },
  };

  const currentGradeStyle = gradeColors[grade] || gradeColors.A;

  return (
    <div
      id="stage-complete-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030108]/90 backdrop-blur-lg select-none"
    >
      <div
        id="stage-complete-panel"
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none bg-[#0a0618]/95 border-2 border-[#00FFD1] shadow-[0_0_50px_rgba(0,255,209,0.35)] p-4 sm:p-7 rounded-none relative overflow-hidden flex flex-col gap-4 sm:gap-5 font-mono-tech"
      >
        {/* Holographic Top Banner Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF00E5] via-[#00FFD1] to-[#00FF66] shadow-[0_0_15px_#00FFD1]"></div>

        {/* Header & Stage Identification */}
        <div className="flex justify-between items-start border-b border-[#00FFD1]/30 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/50">
                SECTOR CLEARED // STAGE {stage}
              </span>
              <span className="text-[10px] text-[#00FF66] font-bold tracking-wider animate-pulse">
                EXTRACTION SUCCESSFUL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,255,209,0.8)]">
              {stageName}
            </h1>
            <p className="text-xs text-[#00FFD1]/70 tracking-wider mt-0.5">{subtitle}</p>
          </div>

          {/* Performance Grade Medal */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">RANK</span>
            <div
              className="w-14 h-14 border-2 flex items-center justify-center bg-[#05030e] text-3xl font-black italic"
              style={{
                borderColor: currentGradeStyle.border,
                color: currentGradeStyle.text,
                boxShadow: `0 0 20px ${currentGradeStyle.shadow}`,
              }}
            >
              {grade}
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Bio-Cores Decrypted */}
          <div className="bg-[#120a28]/80 border border-[#00FFD1]/30 p-3 flex flex-col gap-1 relative">
            <div className="flex items-center gap-2 text-[#00FFD1] text-xs font-bold uppercase">
              <Zap size={15} />
              <span>Bio-Cores</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_8px_#00FFD1]">
              {bioCoresCollected} / {totalBioCores}
            </div>
            <span className="text-[9px] text-[#00FFD1]/60 uppercase">Extracted & Decrypted</span>
          </div>

          {/* Bacteria Killed */}
          <div className="bg-[#120a28]/80 border border-[#ff0055]/30 p-3 flex flex-col gap-1 relative">
            <div className="flex items-center gap-2 text-[#ff0055] text-xs font-bold uppercase">
              <Skull size={15} />
              <span>Organisms Slain</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_8px_#ff0055]">
              {enemiesKilled}
            </div>
            <span className="text-[9px] text-[#ff0055]/60 uppercase">Mutants Neutralized</span>
          </div>

          {/* Speedrun Time & Ghost Telemetry */}
          <div className="bg-[#120a28]/80 border border-[#FFE600]/30 p-3 flex flex-col gap-1 relative">
            <div className="flex items-center gap-2 text-[#FFE600] text-xs font-bold uppercase">
              <Clock size={15} />
              <span>Sector Time</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_8px_#FFE600]">
              {timeTakenFormatted}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-[#00FFD1] uppercase">
              <Ghost size={10} />
              <span>Ghost PB Recorded</span>
            </div>
          </div>
        </div>

        {/* Financial & Integrity Ledger */}
        <div className="bg-[#0e0820] border border-[#00FFD1]/20 p-4 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
            <span className="text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins size={14} className="text-[#ffd700]" /> Gold Collected:
            </span>
            <span className="font-bold text-white tracking-wider">+{goldEarned} G</span>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
            <span className="text-[#00FF66] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={14} className="text-[#00FF66]" /> Sector Clear Bonus:
            </span>
            <span className="font-bold text-[#00FF66] tracking-wider">+{bonusReward} G</span>
          </div>

          <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
            <span className="text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#00FFD1]" /> Suit Integrity Remaining:
            </span>
            <span className="font-bold text-[#00FFD1] tracking-wider">{healthRemainingPercent}%</span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
              Total Persistent Bank:
            </span>
            <span className="text-base sm:text-lg font-black text-[#ffd700] drop-shadow-[0_0_10px_#ffd700] tracking-wider">
              {totalGold} G
            </span>
          </div>
        </div>

        {/* Action Buttons: Proceed or Return */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onQuitToMenu && (
            <button
              id="btn-quit-menu"
              type="button"
              onClick={onQuitToMenu}
              className="py-3 px-4 bg-[#120a28] hover:bg-[#1f1042] text-gray-300 hover:text-white border border-[#00FFD1]/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Home size={16} />
              <span>Safehouse</span>
            </button>
          )}

          <button
            id="btn-next-stage"
            type="button"
            onClick={handleProceed}
            className="flex-1 py-3.5 px-6 bg-[#00FFD1] hover:bg-[#00e6bc] text-[#060312] font-black text-sm sm:text-base uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,209,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span>PROCEED TO CHAPTER {stage + 1}</span>
            <ArrowRight size={18} className="animate-bounce-x" />
          </button>
        </div>
      </div>
    </div>
  );
};
