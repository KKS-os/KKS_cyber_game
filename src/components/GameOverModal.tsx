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
      className="absolute inset-0 bg-[#05020c]/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] z-40 text-center select-none cursor-pointer overflow-hidden box-border"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`w-full max-w-[94vw] sm:max-w-md md:max-w-lg max-h-[96vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-none rounded-xl sm:rounded-2xl border-2 ${
          isAbyssDeath
            ? 'border-[#FF0055] shadow-[0_0_70px_rgba(255,0,85,0.45)]'
            : 'border-[#FF00E5]/60 shadow-[0_0_50px_rgba(255,0,229,0.35)]'
        } bg-[#080410]/95 backdrop-blur-xl p-3.5 sm:p-6 md:p-8 relative flex flex-col items-center font-mono-tech cursor-default`}
      >
        {/* Geometric Corner Chamfers */}
        <div
          className={`absolute -top-2.5 -left-2.5 w-6 h-6 rounded-sm ${
            isAbyssDeath ? 'bg-[#FF0055] shadow-[0_0_15px_#FF0055]' : 'bg-[#FF00E5] shadow-[0_0_15px_#FF00E5]'
          } transform skew-x-12 pointer-events-none`}
        ></div>
        <div className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-sm bg-[#00FFD1] shadow-[0_0_15px_#00FFD1] transform -skew-x-12 pointer-events-none"></div>

        {/* Top Holographic Edge Accent */}
        <div
          className={`absolute top-0 left-6 right-6 h-[2px] ${
            isAbyssDeath ? 'bg-gradient-to-r from-transparent via-[#FF0055] to-transparent' : 'bg-gradient-to-r from-transparent via-[#FF00E5] to-transparent'
          } pointer-events-none`}
        />

        {/* Header Alert */}
        <div className="flex items-center gap-2 mb-1 sm:mb-2 pointer-events-none">
          <div
            className={`w-2 h-2 rounded-full ${
              isAbyssDeath ? 'bg-[#FF0055] shadow-[0_0_8px_#FF0055]' : 'bg-[#FF00E5] shadow-[0_0_8px_#FF00E5]'
            } animate-pulse`}
          ></div>
          <span
            className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold ${
              isAbyssDeath ? 'text-[#FF0055]' : 'text-[#FF00E5]'
            }`}
          >
            {isAbyssDeath ? '⚠️ STRUCTURAL COLLAPSE // PITFALL FATALITY' : t.systemCrash}
          </span>
        </div>

        <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,0,229,0.6)] mb-0.5 sm:mb-1 pointer-events-none">
          {t.gameOver}
        </h2>
        <p className="text-[9.5px] sm:text-[11px] text-[#00FFD1]/80 uppercase tracking-widest mb-2.5 sm:mb-4 pointer-events-none">
          {t.runTerminated}
        </p>

        {/* Specific Pitfall Cause of Death Banner if fallen into abyss */}
        {isAbyssDeath && (
          <div className="w-full bg-[#FF0055]/15 border-2 border-[#FF0055] p-2.5 sm:p-3 mb-3 sm:mb-4 rounded-lg flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(255,0,85,0.3)]">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#FF0055] font-black text-[11px] sm:text-xs uppercase tracking-widest">
              <AlertTriangle size={15} className="animate-pulse" />
              <span>{t.pitfallCauseOfDeathTitle}</span>
              <AlertTriangle size={15} className="animate-pulse" />
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/90 text-center font-bold">
              {t.pitfallCauseOfDeathDesc}
            </p>
            {fallDepth > 0 && (
              <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-[#00FFD1] mt-0.5 font-bold">
                <TrendingDown size={12} />
                <span>TERMINAL DEPTH: -{Math.max(120, fallDepth).toLocaleString()}M</span>
              </div>
            )}
            <div className="text-[9px] sm:text-[10px] text-[#FFAA00] bg-black/70 px-2 py-0.5 border border-[#FFAA00]/40 mt-1 w-full text-center font-bold rounded">
              {t.pitfallCauseOfDeathTip}
            </div>
          </div>
        )}

        {/* New High Score Alert */}
        {isNewHighScore && (
          <div className="border border-[#00FF66] bg-[#00FF66]/15 px-3 py-1 sm:px-4 sm:py-1.5 rounded flex items-center gap-2 text-[#00FF66] font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2.5 sm:mb-3.5 shadow-[0_0_15px_rgba(0,255,102,0.4)] animate-pulse pointer-events-none">
            <Trophy size={14} className="text-[#00FF66]" />
            <span>{t.newHighScore}</span>
          </div>
        )}

        {/* Final Score Telemetry */}
        <div className="flex flex-col items-center mb-3 sm:mb-5 pointer-events-none">
          <span className="text-[9px] sm:text-[10px] text-[#00FF66] uppercase tracking-widest font-bold drop-shadow-[0_0_6px_#00FF66]">
            {t.currentSessionScore}
          </span>
          <span className="text-3xl xs:text-4xl sm:text-5xl font-black text-[#00FF66] tracking-wider drop-shadow-[0_0_15px_rgba(0,255,102,0.6)]">
            {formattedScore}
          </span>
          {!isNewHighScore && highScore > 0 && (
            <span className="text-[10px] sm:text-[11px] text-[#FF00E5] mt-0.5 uppercase tracking-wider font-bold drop-shadow-[0_0_6px_#FF00E5]">
              {t.allTimeHighScore}: {formattedHighScore}
            </span>
          )}

          {/* Combat Evaluation Performance Badge */}
          <div className={`mt-2 sm:mt-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 border ${combatRank.border} ${combatRank.bg} ${combatRank.glow} flex items-center gap-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest`}>
            <span className={`px-1.5 py-0.5 bg-black/80 ${combatRank.text} font-black text-[9px] sm:text-[10px] rounded border border-current`}>
              {combatRank.rank}
            </span>
            <span className="text-white text-[10px] sm:text-[11px]">
              {combatRank.title}
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full max-w-sm mb-2.5 sm:mb-3 pointer-events-none">
          <div className="border border-[#00FFD1]/30 bg-[#04010a]/80 rounded-lg p-2 sm:p-2.5 flex flex-col items-center">
            <Navigation size={13} className="text-[#00FFD1] mb-0.5 sm:mb-1" />
            <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-[#00FFD1]/70 font-bold">{t.distance}</span>
            <span className="text-xs sm:text-sm font-black text-[#00FFD1]">{distance}M</span>
          </div>

          <div className="border border-[#FF00E5]/30 bg-[#04010a]/80 rounded-lg p-2 sm:p-2.5 flex flex-col items-center">
            <Disc size={13} className="text-[#FF00E5] mb-0.5 sm:mb-1" />
            <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-[#FF00E5]/70 font-bold">{t.dataCores}</span>
            <span className="text-xs sm:text-sm font-black text-[#FF00E5]">+{chipsCollected}</span>
          </div>

          <div className="border border-[#00FF66]/30 bg-[#04010a]/80 rounded-lg p-2 sm:p-2.5 flex flex-col items-center">
            <Zap size={13} className="text-[#00FF66] mb-0.5 sm:mb-1" />
            <span className="text-[7.5px] sm:text-[8px] uppercase tracking-widest text-[#00FF66]/70 font-bold">{t.peakStreak}</span>
            <span className="text-xs sm:text-sm font-black text-[#00FF66]">{maxCombo}x</span>
          </div>
        </div>

        {/* Daily Mission Directive Status */}
        <div className="w-full max-w-sm mb-3 sm:mb-4">
          <DailyMissionCard mission={dailyMissionManager.getActiveMission()} compact />
        </div>

        {/* REBOOT Button */}
        <button
          id="btn-retry-game"
          type="button"
          onClick={handleRestartTrigger}
          onTouchEnd={handleRestartTrigger}
          className="w-full max-w-sm py-3 sm:py-3.5 md:py-4 border-2 border-[#FF00E5] bg-gradient-to-r from-[#FF00E5] to-[#D900C4] hover:brightness-110 active:brightness-90 text-black font-black text-xs sm:text-sm md:text-base uppercase tracking-widest rounded-lg sm:rounded-xl transition-all duration-150 shadow-[0_0_25px_#FF00E5] active:scale-95 cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
        >
          <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>{t.rebootSession}</span>
        </button>
      </div>
    </div>
  );
};
