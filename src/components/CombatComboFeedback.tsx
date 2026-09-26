import React, { useMemo } from 'react';
import { Zap, Flame, Sparkles, Trophy } from 'lucide-react';
import { Language, getTranslation } from '../localization';

export type CombatComboTier = 'NORMAL' | 'SUPER' | 'HYPER' | 'ULTRA' | 'APEX_GODLIKE';

interface CombatComboFeedbackProps {
  comboCount: number;
  comboMultiplier: number;
  comboTimer?: number;
  maxComboTimer?: number;
  language?: Language;
  lastHitTime?: number;
}

export const CombatComboFeedback: React.FC<CombatComboFeedbackProps> = ({
  comboCount,
  comboMultiplier,
  comboTimer = 0,
  maxComboTimer = 240,
  language = 'MY',
}) => {
  const activeLang: Language = language === 'EN' ? 'EN' : 'MY';
  const t = getTranslation(activeLang);
  const isMy = activeLang === 'MY';

  // Only display when a combo streak is active (2 or more hits)
  if (comboCount < 2 || comboTimer <= 0) {
    return null;
  }

  // Determine Combo Tier based on streak count
  const tier: CombatComboTier = useMemo(() => {
    if (comboCount >= 35) return 'APEX_GODLIKE';
    if (comboCount >= 20) return 'ULTRA';
    if (comboCount >= 10) return 'HYPER';
    if (comboCount >= 5) return 'SUPER';
    return 'NORMAL';
  }, [comboCount]);

  // Visual styling and animations tailored to tier
  const tierConfig = useMemo(() => {
    switch (tier) {
      case 'APEX_GODLIKE':
        return {
          title: t.comboGodlikeTitle,
          color: '#00FFFF',
          borderColor: 'border-[#00FFFF]',
          bgGlow: 'shadow-[0_0_35px_rgba(0,255,255,0.7)]',
          textShadow: '0 0 16px #00FFFF, 0 0 32px #FF00E5, 0 0 48px #FFD700',
          badgeBg: 'bg-gradient-to-r from-[#FF00E5]/40 via-[#00FFFF]/30 to-[#FFD700]/40',
          icon: <Trophy size={14} className="text-[#FFD700] animate-bounce" />,
          shakeClass: 'animate-combo-shake animate-combo-fire',
          scaleMultiplier: 'scale-110',
        };
      case 'ULTRA':
        return {
          title: t.comboUltraTitle,
          color: '#FF00E5',
          borderColor: 'border-[#FF00E5]',
          bgGlow: 'shadow-[0_0_25px_rgba(255,0,229,0.55)]',
          textShadow: '0 0 14px #FF00E5, 0 0 28px #9D00FF',
          badgeBg: 'bg-[#FF00E5]/20',
          icon: <Sparkles size={13} className="text-[#FF00E5] animate-spin" />,
          shakeClass: 'animate-combo-shake',
          scaleMultiplier: 'scale-105',
        };
      case 'HYPER':
        return {
          title: t.comboHyperTitle,
          color: '#FF5500',
          borderColor: 'border-[#FF5500]',
          bgGlow: 'shadow-[0_0_22px_rgba(255,85,0,0.5)]',
          textShadow: '0 0 12px #FF5500, 0 0 24px #FF0055',
          badgeBg: 'bg-[#FF5500]/20',
          icon: <Flame size={13} className="text-[#FF5500] animate-pulse" />,
          shakeClass: 'animate-combo-fire',
          scaleMultiplier: 'scale-105',
        };
      case 'SUPER':
        return {
          title: t.comboSuperTitle,
          color: '#FFD700',
          borderColor: 'border-[#FFD700]',
          bgGlow: 'shadow-[0_0_18px_rgba(255,215,0,0.4)]',
          textShadow: '0 0 10px #FFD700, 0 0 18px rgba(255,215,0,0.6)',
          badgeBg: 'bg-[#FFD700]/15',
          icon: <Flame size={12} className="text-[#FFD700]" />,
          shakeClass: '',
          scaleMultiplier: 'scale-100',
        };
      case 'NORMAL':
      default:
        return {
          title: t.comboStreakTitle,
          color: '#00FFD1',
          borderColor: 'border-[#00FFD1]/60',
          bgGlow: 'shadow-[0_0_14px_rgba(0,255,209,0.3)]',
          textShadow: '0 0 8px #00FFD1',
          badgeBg: 'bg-[#00FFD1]/10',
          icon: <Zap size={12} className="text-[#00FFD1]" />,
          shakeClass: '',
          scaleMultiplier: 'scale-100',
        };
    }
  }, [tier, t]);

  // Calculate decay gauge percentage
  const timerRatio = Math.max(0, Math.min(1, comboTimer / Math.max(1, maxComboTimer)));
  const timerPct = Math.round(timerRatio * 100);
  const isTimerLow = timerRatio < 0.28;

  return (
    <div
      id="combat-combo-counter-hud"
      aria-label="Combat Combo Feedback Counter"
      style={{
        right: 'max(0.5rem, env(safe-area-inset-right, 0px))',
      }}
      className={`absolute top-[76px] sm:top-[94px] md:top-[124px] z-30 pointer-events-none select-none transition-transform duration-150 origin-top-right ${tierConfig.scaleMultiplier}`}
    >
      <div
        className={`flex flex-col items-end border bg-[#020108]/92 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 min-w-[105px] sm:min-w-[135px] ${tierConfig.borderColor} ${tierConfig.bgGlow} ${tierConfig.shakeClass}`}
      >
        {/* Tier Header Badge */}
        <div className={`flex items-center gap-1.5 px-1.5 py-0.5 mb-1 ${tierConfig.badgeBg} border-b ${tierConfig.borderColor}`}>
          {tierConfig.icon}
          <span
            className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider font-mono-tech"
            style={{ color: tierConfig.color }}
          >
            {tierConfig.title}
          </span>
        </div>

        {/* Dynamic Punchy Combo Counter with Re-trigger Pop Animation */}
        <div
          key={`combo-hit-${comboCount}`}
          className="flex items-baseline gap-1.5 my-0.5 animate-combo-pop"
        >
          <span className="text-[10px] sm:text-xs font-mono-tech font-bold uppercase tracking-widest text-white/70">
            {isMy ? 'ကွန်ဘို' : 'COMBO'}
          </span>
          <span
            className="text-2xl sm:text-3xl md:text-4xl font-mono-tech font-black tracking-tighter"
            style={{
              color: tierConfig.color,
              textShadow: tierConfig.textShadow,
            }}
          >
            x{comboCount}
          </span>
        </div>

        {/* Multiplier & Chain Status Bar */}
        <div className="flex items-center justify-between w-full text-[8px] sm:text-[9px] font-mono-tech mt-0.5 pt-1 border-t border-white/10">
          <span className="text-gray-400 uppercase tracking-wider">
            {t.comboChain}:
          </span>
          <span
            className="font-black px-1 bg-black/60 border border-white/15"
            style={{ color: tierConfig.color }}
          >
            x{comboMultiplier} BOOST
          </span>
        </div>

        {/* Adrenaline Combo Decay Timer Gauge Bar */}
        <div className="w-full mt-1.5">
          <div className="w-full h-1 bg-[#050505] border border-white/15 p-0 relative overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ease-out ${
                isTimerLow ? 'bg-[#FF0055] animate-pulse shadow-[0_0_8px_#FF0055]' : ''
              }`}
              style={{
                width: `${timerPct}%`,
                backgroundColor: isTimerLow ? '#FF0055' : tierConfig.color,
                boxShadow: `0 0 6px ${isTimerLow ? '#FF0055' : tierConfig.color}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
