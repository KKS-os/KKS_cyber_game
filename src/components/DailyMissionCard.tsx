import React, { useState, useEffect } from 'react';
import { Target, Gift, Clock, CheckCircle2, Award, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { DailyMission } from '../types';
import { dailyMissionManager, DailyMissionManager } from '../dailyMissionSystem';
import { sound } from '../audio';

interface DailyMissionCardProps {
  mission: DailyMission;
  onClaimReward?: (reward: { credits: number; xp: number; badge: string }) => void;
  compact?: boolean;
}

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({
  mission: initialMission,
  onClaimReward,
  compact = false,
}) => {
  const [mission, setMission] = useState<DailyMission>(initialMission);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [claimedJustNow, setClaimedJustNow] = useState<boolean>(false);

  // Sync when prop updates or manager updates
  useEffect(() => {
    setMission(initialMission);
  }, [initialMission]);

  useEffect(() => {
    const updateCountdown = () => {
      const secs = DailyMissionManager.getSecondsUntilMidnight();
      setTimeRemaining(DailyMissionManager.formatCountdown(secs));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    const handleUpdate = (updatedMission: DailyMission) => {
      setMission({ ...updatedMission });
    };

    dailyMissionManager.onMissionUpdated = handleUpdate;

    return () => {
      clearInterval(interval);
      if (dailyMissionManager.onMissionUpdated === handleUpdate) {
        dailyMissionManager.onMissionUpdated = undefined;
      }
    };
  }, []);

  const progressPercent = Math.min(
    100,
    Math.round((mission.currentValue / mission.targetValue) * 100)
  );

  const handleClaim = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!mission.isCompleted || mission.isClaimed) return;

    const reward = dailyMissionManager.claimReward();
    if (reward) {
      setClaimedJustNow(true);
      setMission(dailyMissionManager.getActiveMission());
      onClaimReward?.(reward);
    }
  };

  const getDifficultyBadge = () => {
    switch (mission.difficulty) {
      case 'APEX_ELITE':
        return (
          <span className="px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-purple-950/80 text-purple-300 border border-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
            APEX ELITE
          </span>
        );
      case 'HARD':
        return (
          <span className="px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
            HARD TIER
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(0,255,209,0.4)]">
            DAILY PRIORITY
          </span>
        );
    }
  };

  if (compact) {
    return (
      <div className="w-full bg-[#080516]/95 border border-cyan-500/30 p-2.5 rounded shadow-[0_0_15px_rgba(0,255,209,0.15)] font-mono-tech flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target size={13} className="text-[#00FFD1] animate-spin-slow" />
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              {mission.title}
            </span>
          </div>
          <span className="text-[9px] text-[#00FFD1] font-bold">
            {mission.currentValue} / {mission.targetValue}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-1.5 bg-black/60 border border-cyan-500/30 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#00FFD1] to-[#FF00E5] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id="daily-mission-dossier"
      className="w-full max-w-xl bg-gradient-to-br from-[#0b061e]/95 via-[#060312]/95 to-[#04020a]/95 border border-cyan-500/50 p-3 sm:p-4 rounded-lg relative shadow-[0_0_30px_rgba(0,255,209,0.2)] font-mono-tech text-left overflow-hidden select-none"
    >
      {/* Background Decorative Tech Lines */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Directive Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.3)] shrink-0">
            <Target size={15} className="animate-spin-slow text-[#00FFD1]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] sm:text-[9px] text-[#00FFD1] font-black uppercase tracking-widest">
                DAILY TACTICAL DIRECTIVE
              </span>
              {getDifficultyBadge()}
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider leading-none mt-0.5 flex items-center gap-2">
              <span>{mission.title}</span>
              <span className="text-[9px] font-normal text-cyan-400/70 hidden sm:inline">
                [{mission.codeName}]
              </span>
            </h3>
          </div>
        </div>

        {/* Midnight Reset Countdown */}
        <div className="flex flex-col items-end shrink-0 pl-2">
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider">
            <Clock size={10} className="text-cyan-400" />
            <span>RESETS IN</span>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-cyan-300 tracking-wider">
            {timeRemaining || '00:00:00'}
          </span>
        </div>
      </div>

      {/* Mission Description */}
      <p className="text-[10px] sm:text-xs text-cyan-100/80 mb-3 leading-relaxed">
        {mission.description}
      </p>

      {/* Progress Bar & Counter */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold mb-1">
          <span className="text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <span>DIRECTIVE PROGRESS</span>
            {mission.isCompleted && (
              <span className="text-[#00FF66] flex items-center gap-0.5">
                <CheckCircle2 size={11} className="inline" /> 100% COMPLETE
              </span>
            )}
          </span>
          <span className="text-white font-black tracking-wider">
            <span style={{ color: mission.accentColor || '#00FFD1' }}>
              {mission.currentValue}
            </span>
            <span className="text-gray-500"> / </span>
            <span className="text-cyan-300">{mission.targetValue}</span>
          </span>
        </div>

        <div className="w-full h-2.5 bg-black/80 border border-cyan-500/40 p-0.5 rounded-none relative overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
          <div
            className="h-full transition-all duration-500 ease-out relative"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: mission.accentColor || '#00FFD1',
              boxShadow: `0 0 12px ${mission.accentColor || '#00FFD1'}`,
            }}
          >
            {/* Scanline light sheen */}
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom Rewards & Interactive Claim Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cyan-500/20 bg-black/40 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4 p-2.5 sm:p-3 rounded-b-lg">
        {/* Rewards Spec Tags */}
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]">
          <div className="flex items-center gap-1 text-[#FFD700] font-black">
            <Award size={12} className="text-[#FFD700]" />
            <span>+{mission.rewardCredits} CREDITS</span>
          </div>

          <div className="flex items-center gap-1 text-[#00FFD1] font-black">
            <Zap size={12} className="text-[#00FFD1]" />
            <span>+{mission.rewardXp} XP</span>
          </div>

          <div className="hidden xs:flex sm:flex items-center gap-1 text-purple-300 font-black">
            <Sparkles size={12} className="text-purple-400" />
            <span>{mission.rewardBadge}</span>
          </div>
        </div>

        {/* Claim Action Button / Status Badge */}
        <div>
          {mission.isClaimed ? (
            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-950/60 border border-[#00FF66]/60 text-[#00FF66] text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,102,0.2)]">
              <CheckCircle2 size={12} />
              <span>REWARD SECURED</span>
            </div>
          ) : mission.isCompleted ? (
            <button
              id="btn-claim-daily-mission"
              type="button"
              onClick={handleClaim}
              onTouchEnd={handleClaim}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-[#00FF66] to-[#00FFD1] hover:brightness-110 active:scale-95 text-black font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-150 shadow-[0_0_20px_rgba(0,255,102,0.6)] cursor-pointer animate-pulse"
            >
              <Gift size={13} className="fill-current" />
              <span>CLAIM REWARD</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-gray-400 text-[9px] font-semibold uppercase tracking-wider">
              <span>IN PROGRESS</span>
              <ChevronRight size={12} className="text-cyan-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
