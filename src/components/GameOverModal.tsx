import React from 'react';
import { RotateCcw, Trophy, Navigation, Disc, Zap, AlertTriangle, TrendingDown } from 'lucide-react';
import { GameStats, GameSettings, DeathCause } from '../types';
import { DailyMissionCard } from './DailyMissionCard';
import { dailyMissionManager } from '../dailyMissionSystem';
import { Language, getTranslation } from '../localization';
import { multiplayer } from '../multiplayerManager';

interface GameOverModalProps {
  score: number;
  distance: number;
  highScore: number;
  chipsCollected: number;
  maxCombo: number;
  stats: GameStats;
  settings?: GameSettings;
  deathCause?: DeathCause;
  fallDepth?: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  distance,
  highScore,
  chipsCollected,
  maxCombo,
  settings,
  deathCause = 'COMBAT',
  fallDepth = 0,
  onRestart,
}) => {
  const currentLang: Language = settings?.language || 'MY';
  const t = getTranslation(currentLang);
  const isAbyssDeath = deathCause === 'PITFALL_ABYSS';

  const isNewHighScore = score >= highScore && score > 0;
  const formattedScore = score.toString().padStart(7, '0');
  const formattedHighScore = highScore.toString().padStart(7, '0');
  const [submittedToFirebase, setSubmittedToFirebase] = React.useState(false);

  // Dynamic Combat Performance Evaluation
  const combatRank = React.useMemo(() => {
    if (maxCombo >= 15 || score >= 15000) {
      return {
        rank: 'S-RANK',
        title: currentLang === 'MY' ? 'CYBER GOD (ဆိုက်ဘာ နတ်ဘုရား)' : 'CYBER GOD (SUPREME)',
        border: 'border-[#FFE600]',
        bg: 'bg-[#FFE600]/15',
        text: 'text-[#FFE600]',
        glow: 'shadow-[0_0_20px_rgba(255,230,0,0.5)]',
      };
    } else if (maxCombo >= 10 || score >= 8000) {
      return {
        rank: 'A-RANK',
        title: currentLang === 'MY' ? 'HYPER SLICER (ထိပ်တန်း တိုက်ခိုက်ရေးမှူး)' : 'HYPER SLICER',
        border: 'border-[#FF00E5]',
        bg: 'bg-[#FF00E5]/15',
        text: 'text-[#FF00E5]',
        glow: 'shadow-[0_0_15px_rgba(255,0,229,0.4)]',
      };
    } else if (maxCombo >= 5 || score >= 3000) {
      return {
        rank: 'B-RANK',
        title: currentLang === 'MY' ? 'NEON VETERAN (စစ်ပြန် အော်ပရေတာ)' : 'NEON VETERAN',
        border: 'border-[#00FFD1]',
        bg: 'bg-[#00FFD1]/15',
        text: 'text-[#00FFD1]',
        glow: 'shadow-[0_0_15px_rgba(0,255,209,0.35)]',
      };
    } else {
      return {
        rank: 'C-RANK',
        title: currentLang === 'MY' ? 'CYBER AGENT (အစပြု စစ်ဆင်ရေးသား)' : 'CYBER AGENT',
        border: 'border-cyan-500/40',
        bg: 'bg-black/60',
        text: 'text-cyan-300',
        glow: 'shadow-[0_0_10px_rgba(0,255,209,0.2)]',
      };
    }
  }, [maxCombo, score, currentLang]);

  React.useEffect(() => {
    if (score > 0 && !submittedToFirebase) {
      multiplayer.submitHighScore('CyberOperative', score, distance, 1, maxCombo).then(() => {
        setSubmittedToFirebase(true);
      });
    }
  }, [score, distance, maxCombo, submittedToFirebase]);

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
        className={`w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none border-2 ${
          isAbyssDeath ? 'border-[#FF0055] shadow-[0_0_70px_rgba(255,0,85,0.45)]' : 'border-[#FF00E5]/60 shadow-[0_0_60px_rgba(255,0,229,0.3)]'
        } bg-[#0A0A0A]/95 p-4 sm:p-8 md:p-10 relative flex flex-col items-center font-mono-tech cursor-default`}
      >
        {/* Geometric Skewed Accents */}
        <div
          className={`absolute -top-3 -left-3 w-7 h-7 ${
            isAbyssDeath ? 'bg-[#FF0055] shadow-[0_0_15px_#FF0055]' : 'bg-[#FF00E5] shadow-[0_0_15px_#FF00E5]'
          } transform skew-x-12 pointer-events-none`}
        ></div>
        <div className="absolute -bottom-3 -right-3 w-7 h-7 bg-[#00FFD1] shadow-[0_0_15px_#00FFD1] transform -skew-x-12 pointer-events-none"></div>

        {/* Header Alert */}
        <div className="flex items-center gap-2 mb-2 pointer-events-none">
          <div
            className={`w-2.5 h-2.5 ${
              isAbyssDeath ? 'bg-[#FF0055] shadow-[0_0_6px_#FF0055]' : 'bg-[#FF00E5] shadow-[0_0_6px_#FF00E5]'
            } animate-pulse`}
          ></div>
          <span
            className={`text-xs uppercase tracking-widest font-bold ${
              isAbyssDeath ? 'text-[#FF0055]' : 'text-[#FF00E5]'
            }`}
          >
            {isAbyssDeath ? '⚠️ STRUCTURAL COLLAPSE // PITFALL FATALITY' : t.systemCrash}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,0,229,0.6)] mb-1 pointer-events-none">
          {t.gameOver}
        </h2>
        <p className="text-[11px] text-[#00FFD1]/70 uppercase tracking-widest mb-4 pointer-events-none">
          {t.runTerminated}
        </p>

        {/* Specific Pitfall Cause of Death Banner if fallen into abyss */}
        {isAbyssDeath && (
          <div className="w-full bg-[#FF0055]/15 border-2 border-[#FF0055] p-3 mb-5 flex flex-col items-center gap-1.5 shadow-[0_0_25px_rgba(255,0,85,0.35)]">
            <div className="flex items-center gap-2 text-[#FF0055] font-black text-xs uppercase tracking-widest">
              <AlertTriangle size={16} className="animate-pulse" />
              <span>{t.pitfallCauseOfDeathTitle}</span>
              <AlertTriangle size={16} className="animate-pulse" />
            </div>
            <p className="text-[11px] text-white/90 text-center font-bold">
              {t.pitfallCauseOfDeathDesc}
            </p>
            {fallDepth > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-[#00FFD1] mt-1 font-bold">
                <TrendingDown size={13} />
                <span>TERMINAL DEPTH: -{Math.max(120, fallDepth).toLocaleString()}M</span>
              </div>
            )}
            <div className="text-[10px] text-[#FFAA00] bg-black/60 px-2.5 py-1 border border-[#FFAA00]/40 mt-1 w-full text-center font-bold">
              {t.pitfallCauseOfDeathTip}
            </div>
          </div>
        )}

        {/* New High Score Alert */}
        {isNewHighScore && (
          <div className="border border-[#00FF66] bg-[#00FF66]/10 px-4 py-1.5 flex items-center gap-2 text-[#00FF66] font-bold text-xs uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(0,255,102,0.4)] animate-pulse pointer-events-none">
            <Trophy size={14} className="text-[#00FF66]" />
            <span>{t.newHighScore}</span>
          </div>
        )}

        {/* Final Score Telemetry */}
        <div className="flex flex-col items-center mb-6 pointer-events-none">
          <span className="text-[10px] text-[#00FF66] uppercase tracking-widest font-bold drop-shadow-[0_0_6px_#00FF66]">
            {t.currentSessionScore}
          </span>
          <span className="text-4xl sm:text-5xl font-black text-[#00FF66] tracking-wider drop-shadow-[0_0_15px_rgba(0,255,102,0.6)]">
            {formattedScore}
          </span>
          {!isNewHighScore && highScore > 0 && (
            <span className="text-[11px] text-[#FF00E5] mt-1 uppercase tracking-wider font-bold drop-shadow-[0_0_6px_#FF00E5]">
              {t.allTimeHighScore}: {formattedHighScore}
            </span>
          )}

          {/* Combat Evaluation Performance Badge */}
          <div className={`mt-3 px-3 py-1.5 border ${combatRank.border} ${combatRank.bg} ${combatRank.glow} flex items-center gap-2 rounded text-xs font-black uppercase tracking-widest`}>
            <span className={`px-1.5 py-0.5 bg-black/80 ${combatRank.text} font-black text-[10px] rounded border border-current`}>
              {combatRank.rank}
            </span>
            <span className="text-white text-[11px]">
              {combatRank.title}
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-3 pointer-events-none">
          <div className="border border-[#00FFD1]/30 bg-[#050505] p-2.5 flex flex-col items-center">
            <Navigation size={14} className="text-[#00FFD1] mb-1" />
            <span className="text-[8px] uppercase tracking-widest text-[#00FFD1]/70 font-bold">{t.distance}</span>
            <span className="text-sm font-bold text-[#00FFD1]">{distance}M</span>
          </div>

          <div className="border border-[#FF00E5]/30 bg-[#050505] p-2.5 flex flex-col items-center">
            <Disc size={14} className="text-[#FF00E5] mb-1" />
            <span className="text-[8px] uppercase tracking-widest text-[#FF00E5]/70 font-bold">{t.dataCores}</span>
            <span className="text-sm font-bold text-[#FF00E5]">+{chipsCollected}</span>
          </div>

          <div className="border border-[#00FF66]/30 bg-[#050505] p-2.5 flex flex-col items-center">
            <Zap size={14} className="text-[#00FF66] mb-1" />
            <span className="text-[8px] uppercase tracking-widest text-[#00FF66]/70 font-bold">{t.peakStreak}</span>
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
          className="w-full max-w-sm py-4 border-2 border-[#FF00E5] bg-[#FF00E5] hover:bg-[#FF00E5]/80 active:bg-white text-black font-black text-sm sm:text-base uppercase tracking-widest transition-all duration-150 shadow-[0_0_25px_#FF00E5] active:scale-95 cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
        >
          <RotateCcw size={18} />
          <span>{t.rebootSession}</span>
        </button>
      </div>
    </div>
  );
};
