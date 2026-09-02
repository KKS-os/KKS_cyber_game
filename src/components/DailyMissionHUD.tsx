import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { DailyMission } from '../types';
import { dailyMissionManager } from '../dailyMissionSystem';

interface DailyMissionHUDProps {
  mission?: DailyMission | null;
}

export const DailyMissionHUD: React.FC<DailyMissionHUDProps> = ({ mission: initialMission }) => {
  const [mission, setMission] = useState<DailyMission | null>(() => {
    return initialMission || dailyMissionManager.getActiveMission();
  });
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [justProgressed, setJustProgressed] = useState<boolean>(false);

  useEffect(() => {
    if (initialMission) {
      setMission(initialMission);
    }
  }, [initialMission]);

  useEffect(() => {
    const handleUpdate = (updatedMission: DailyMission) => {
      setMission({ ...updatedMission });
      setJustProgressed(true);
      const timer = setTimeout(() => setJustProgressed(false), 1500);
      return () => clearTimeout(timer);
    };

    dailyMissionManager.onMissionUpdated = handleUpdate;

    return () => {
      if (dailyMissionManager.onMissionUpdated === handleUpdate) {
        dailyMissionManager.onMissionUpdated = undefined;
      }
    };
  }, []);

  if (!mission) return null;

  const progressPct = Math.min(100, Math.round((mission.currentValue / mission.targetValue) * 100));

  return (
    <aside
      id="daily-mission-hud-widget"
      aria-label="Daily Mission Tracker"
      className={`pointer-events-auto font-mono-tech transition-all duration-200 ${
        justProgressed
          ? 'scale-105 shadow-[0_0_20px_rgba(0,255,209,0.6)]'
          : 'shadow-[0_0_15px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="cursor-pointer bg-[#070414]/90 border border-cyan-500/40 hover:border-cyan-400 backdrop-blur-md px-2 sm:px-2.5 py-1 flex items-center justify-between gap-2 select-none"
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Target
            size={12}
            className={`${
              mission.isCompleted
                ? 'text-[#00FF66]'
                : justProgressed
                ? 'text-[#FFE600] animate-spin'
                : 'text-[#00FFD1]'
            }`}
          />
          <span className="text-[8px] sm:text-[9px] font-black text-cyan-300 uppercase tracking-wider truncate max-w-[110px] sm:max-w-[150px]">
            {mission.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[8px] sm:text-[9px] font-black tracking-wider ${
              mission.isCompleted ? 'text-[#00FF66]' : 'text-white'
            }`}
          >
            {mission.currentValue}/{mission.targetValue}
          </span>
          {collapsed ? (
            <ChevronDown size={12} className="text-gray-400" />
          ) : (
            <ChevronUp size={12} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Progress Bar (Always visible) */}
      <div className="w-full h-1 bg-black/80 border-x border-b border-cyan-500/40 overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPct}%`,
            backgroundColor: mission.isCompleted ? '#00FF66' : mission.accentColor || '#00FFD1',
            boxShadow: `0 0 8px ${mission.isCompleted ? '#00FF66' : mission.accentColor || '#00FFD1'}`,
          }}
        />
      </div>

      {/* Expanded Details Drawer */}
      {!collapsed && (
        <div className="bg-[#05030f]/95 border-x border-b border-cyan-500/40 p-2 text-left flex flex-col gap-1 text-[8px] sm:text-[9px]">
          <p className="text-gray-300 leading-snug">{mission.description}</p>
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[#FFD700] font-bold">
            <span>REWARD: +{mission.rewardCredits} CREDITS</span>
            {mission.isCompleted ? (
              <span className="text-[#00FF66] flex items-center gap-0.5">
                <CheckCircle2 size={10} /> DONE
              </span>
            ) : (
              <span className="text-cyan-400">{progressPct}%</span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
