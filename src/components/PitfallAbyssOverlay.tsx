import React from 'react';
import { AlertTriangle, TrendingDown, Zap, ShieldAlert, Compass } from 'lucide-react';
import { Language, getTranslation } from '../localization';

interface PitfallAbyssOverlayProps {
  depthMeters: number;
  language?: Language;
}

export const PitfallAbyssOverlay: React.FC<PitfallAbyssOverlayProps> = ({
  depthMeters,
  language = 'MY',
}) => {
  const activeLang: Language = language === 'EN' ? 'EN' : 'MY';
  const t = getTranslation(activeLang);
  const normalizedDepth = Math.max(80, depthMeters);
  const fallSpeed = Math.min(980, Math.floor(140 + normalizedDepth * 0.35));
  const isTerminal = normalizedDepth > 1200;

  return (
    <aside
      aria-label="Pitfall Abyss Warning"
      className="absolute inset-0 pointer-events-none z-35 flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-hidden"
    >
      {/* 1. Deep abyss vignette & flashing warning peripheral strobes */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/95" />
      <div className="absolute inset-0 bg-[#FF0055]/10 animate-pulse pointer-events-none" />

      {/* 2. Top Emergency Alert Header */}
      <header className="relative z-10 w-full max-w-xl flex flex-col items-center text-center mt-2 sm:mt-6 animate-bounce">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#FF0055] text-black font-black font-mono-tech text-[10px] sm:text-xs uppercase tracking-widest shadow-[0_0_20px_#FF0055]">
          <AlertTriangle size={14} className="animate-spin" />
          <span>{t.pitfallWarning}</span>
          <AlertTriangle size={14} className="animate-spin" />
        </div>
        <p className="text-[10px] sm:text-xs font-mono-tech text-[#00FFD1] uppercase tracking-wider mt-1 drop-shadow-[0_0_8px_#00FFD1]">
          {t.pitfallSub}
        </p>
      </header>

      {/* 3. Center Holographic Descent Telemetry Matrix */}
      <main className="relative z-10 w-full max-w-md bg-black/85 border-2 border-[#FF0055] p-4 sm:p-6 shadow-[0_0_40px_rgba(255,0,85,0.6)] backdrop-blur-md font-mono-tech flex flex-col items-center">
        {/* Radar Corner Accents */}
        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#00FFD1]" />
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#00FFD1]" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#00FFD1]" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#00FFD1]" />

        {/* Depth Reading Meter */}
        <div className="flex flex-col items-center mb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[#FF0055] uppercase font-bold tracking-widest">
            <TrendingDown size={14} className="animate-pulse" />
            <span>{t.pitfallDepth}</span>
          </div>
          <span className="text-4xl sm:text-5xl font-black text-[#FF0055] tracking-wider drop-shadow-[0_0_20px_#FF0055]">
            -{normalizedDepth.toLocaleString()} M
          </span>
        </div>

        {/* Fall Velocity Gauge */}
        <div className="w-full bg-[#111] border border-[#00FFD1]/40 p-2.5 flex flex-col gap-1.5 mb-3">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-[#00FFD1]">
            <span className="flex items-center gap-1">
              <Compass size={11} />
              {t.pitfallVelocity}
            </span>
            <span className="font-bold text-white">{fallSpeed} KM/H</span>
          </div>
          <div className="w-full h-2 bg-black border border-[#00FFD1]/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00FFD1] via-[#FFAA00] to-[#FF0055] transition-all duration-75"
              style={{ width: `${Math.min(100, (fallSpeed / 980) * 100)}%` }}
            />
          </div>
        </div>

        {/* Terminal Velocity Warning */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#FF0055]/20 border border-[#FF0055] text-[9px] sm:text-[10px] text-[#FF0055] font-bold uppercase tracking-wider text-center">
          <ShieldAlert size={13} className="shrink-0" />
          <span>{t.pitfallTerminal}</span>
        </div>
      </main>

      {/* 4. Bottom Evasive Action Tip */}
      <footer className="relative z-10 w-full max-w-lg bg-black/90 border border-[#00FFD1]/60 px-3 py-2 text-center text-[10px] sm:text-xs font-mono-tech text-[#00FFD1] shadow-[0_0_15px_rgba(0,255,209,0.3)] mb-2 sm:mb-4">
        <div className="flex items-center justify-center gap-1.5 text-[#00FFD1] font-bold">
          <Zap size={13} className="text-[#00FFD1]" />
          <span>{t.pitfallCauseOfDeathTip}</span>
        </div>
      </footer>
    </aside>
  );
};
