import React, { useMemo, useState, useEffect } from 'react';
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

  // Dynamic floating random offset and angle generated on each combo hit
  const [floatOffset, setFloatOffset] = useState({
    randX: 0,
    randY: 0,
    rotation: -1.5,
    key: 0,
  });

  useEffect(() => {
    if (comboCount >= 2) {
      // Generate energetic arcade floating jitter (subtle random angle and lateral offset)
      const rX = Math.round((Math.random() - 0.5) * 18); // -9px to +9px
      const rY = Math.round((Math.random() - 0.5) * 12); // -6px to +6px
      const rRot = Math.round(((Math.random() - 0.5) * 8) * 10) / 10; // -4deg to +4deg
      setFloatOffset({
        randX: rX,
        randY: rY,
        rotation: rRot,
        key: comboCount,
      });
    }
  }, [comboCount]);

  // Determine Combo Tier based on streak count (Always called unconditionally - React Hook rules)
  const tier: CombatComboTier = useMemo(() => {
    if (comboCount >= 35) return 'APEX_GODLIKE';
    if (comboCount >= 20) return 'ULTRA';
    if (comboCount >= 10) return 'HYPER';
    if (comboCount >= 5) return 'SUPER';
    return 'NORMAL';
  }, [comboCount]);

  // Visual styling and neon aura tailored to tier (Always called unconditionally)
  const tierConfig = useMemo(() => {
    switch (tier) {
      case 'APEX_GODLIKE':
        return {
          title: t.comboGodlikeTitle,
          color: '#00FFFF',
          textShadow: '0 0 16px #00FFFF, 0 0 32px #FF00E5, 0 0 48px #FFD700',
          icon: <Trophy size={16} className="text-[#FFD700] animate-bounce drop-shadow-[0_0_8px_#FFD700]" />,
          shakeClass: 'animate-combo-shake animate-combo-fire',
          scaleMultiplier: 'scale-110',
        };
      case 'ULTRA':
        return {
          title: t.comboUltraTitle,
          color: '#FF00E5',
          textShadow: '0 0 14px #FF00E5, 0 0 28px #9D00FF',
          icon: <Sparkles size={15} className="text-[#FF00E5] animate-spin drop-shadow-[0_0_8px_#FF00E5]" />,
          shakeClass: 'animate-combo-shake',
          scaleMultiplier: 'scale-105',
        };
      case 'HYPER':
        return {
          title: t.comboHyperTitle,
          color: '#FF5500',
          textShadow: '0 0 12px #FF5500, 0 0 24px #FF0055',
          icon: <Flame size={15} className="text-[#FF5500] animate-pulse drop-shadow-[0_0_8px_#FF5500]" />,
          shakeClass: 'animate-combo-fire',
          scaleMultiplier: 'scale-105',
        };
      case 'SUPER':
        return {
          title: t.comboSuperTitle,
          color: '#FFD700',
          textShadow: '0 0 10px #FFD700, 0 0 20px rgba(255,215,0,0.6)',
          icon: <Flame size={14} className="text-[#FFD700] drop-shadow-[0_0_8px_#FFD700]" />,
          shakeClass: '',
          scaleMultiplier: 'scale-100',
        };
      case 'NORMAL':
      default:
        return {
          title: t.comboStreakTitle,
          color: '#00FFD1',
          textShadow: '0 0 10px #00FFD1, 0 0 20px rgba(0,255,209,0.5)',
          icon: <Zap size={14} className="text-[#00FFD1] drop-shadow-[0_0_8px_#00FFD1]" />,
          shakeClass: '',
          scaleMultiplier: 'scale-100',
        };
    }
  }, [tier, t]);

  // Only display when a combo streak is active (2 or more hits) - placed AFTER all React hooks
  if (comboCount < 2 || comboTimer <= 0) {
    return null;
  }

  // Calculate decay gauge percentage
  const timerRatio = Math.max(0, Math.min(1, comboTimer / Math.max(1, maxComboTimer)));
  const timerPct = Math.round(timerRatio * 100);
  const isTimerLow = timerRatio < 0.28;

  return (
    <aside
      id="combat-combo-counter-hud"
      aria-label="Combat Combo Feedback Counter"
      style={{
        right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
      className={`absolute top-[72px] sm:top-[90px] md:top-[115px] z-30 pointer-events-none select-none transition-transform duration-200 origin-top-right ${tierConfig.scaleMultiplier}`}
    >
      {/* 100% Transparent Floating Container - NO BLACK BACKGROUND BOX */}
      <div
        className={`flex flex-col items-end bg-transparent p-0 ${tierConfig.shakeClass}`}
        style={{
          transform: `translate(${floatOffset.randX}px, ${floatOffset.randY}px)`,
          transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        }}
      >
        {/* Floating Tier Header Title with Dynamic Angle */}
        <div
          className="flex items-center gap-1.5 mb-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
          style={{
            transform: `rotate(${floatOffset.rotation * 0.6}deg)`,
          }}
        >
          {tierConfig.icon}
          <span
            className="text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono-tech italic"
            style={{
              color: tierConfig.color,
              textShadow: `0 0 12px ${tierConfig.color}, 0 0 24px ${tierConfig.color}, 0 2px 4px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000`,
            }}
          >
            {tierConfig.title}
          </span>
        </div>

        {/* Dynamic Punchy Floating Combo Counter with Kinetic Pop & Random Floating Angle */}
        <div
          key={`combo-pop-${floatOffset.key}`}
          className="flex items-baseline gap-1.5 my-0.5 animate-combo-pop"
          style={{
            transform: `rotate(${floatOffset.rotation}deg)`,
          }}
        >
          <span
            className="text-xs sm:text-sm font-mono-tech font-black uppercase tracking-widest text-white/95"
            style={{
              textShadow: '0 0 10px rgba(255,255,255,0.9), 0 2px 4px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            }}
          >
            {isMy ? 'ကွန်ဘို' : 'COMBO'}
          </span>
          <span
            className="text-3xl sm:text-4xl md:text-5xl font-mono-tech font-black tracking-tight"
            style={{
              color: tierConfig.color,
              textShadow: `${tierConfig.textShadow}, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 12px rgba(0,0,0,0.95)`,
              WebkitTextStroke: '1px rgba(0,0,0,0.7)',
            }}
          >
            x{comboCount}
          </span>
        </div>

        {/* Floating Multiplier & Boost Tag - Crystal Clear Transparent */}
        <div
          className="flex items-center gap-1.5 text-[8.5px] sm:text-[9.5px] font-mono-tech mt-0.5"
          style={{
            transform: `rotate(${floatOffset.rotation * -0.4}deg)`,
          }}
        >
          <span
            className="text-white/85 font-bold uppercase tracking-wider"
            style={{
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px #000',
            }}
          >
            {t.comboChain}:
          </span>
          <span
            className="font-black px-1.5 py-0.5 rounded text-black text-[9px] sm:text-[10px] uppercase tracking-wider"
            style={{
              backgroundColor: tierConfig.color,
              boxShadow: `0 0 14px ${tierConfig.color}, 0 2px 6px rgba(0,0,0,0.8)`,
            }}
          >
            x{comboMultiplier} BOOST
          </span>
        </div>

        {/* Floating Thin Decay Gauge Bar (Transparent Minimalist Rail) */}
        <div className="w-24 sm:w-28 h-1 mt-1.5 rounded-full overflow-hidden bg-black/40 border border-white/20 shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          <div
            className={`h-full transition-all duration-75 ease-out rounded-full ${
              isTimerLow ? 'animate-pulse' : ''
            }`}
            style={{
              width: `${timerPct}%`,
              backgroundColor: isTimerLow ? '#FF0055' : tierConfig.color,
              boxShadow: `0 0 8px ${isTimerLow ? '#FF0055' : tierConfig.color}`,
            }}
          />
        </div>
      </div>
    </aside>
  );
};
