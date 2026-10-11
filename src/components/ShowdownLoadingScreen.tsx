import React, { useState, useEffect, useRef } from 'react';
import { Zap, Shield, Skull, Sword, ArrowRight, Radio, Sparkles, FastForward } from 'lucide-react';
import { assetUrls, gameAssets } from '../assetLoader';
import { Language, getTranslation } from '../localization';
import { sound } from '../audio';

interface ShowdownLoadingScreenProps {
  onComplete: () => void;
  language?: Language;
}

export const ShowdownLoadingScreen: React.FC<ShowdownLoadingScreenProps> = ({
  onComplete,
  language = 'MY',
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('INIT BOOT');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isWarping, setIsWarping] = useState<boolean>(false);
  const t = getTranslation(language);

  // Responsive device orientation detection for pro mobile adaptation
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Progressive tactical loading simulation while validating real assets
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Accelerate if actual game assets are already loaded
      const step = gameAssets.isLoaded ? Math.random() * 8 + 6 : Math.random() * 4 + 3;
      current = Math.min(100, Math.round(current + step));
      setProgress(current);

      if (current < 25) {
        setStatusMessage(
          language === 'MY'
            ? '3D ရုပ်ထွက်နှင့် 60FPS စနစ် စတင်ပြင်ဆင်နေသည်...'
            : 'INITIALIZING THREE.JS 60FPS GRAPHICS CORE...'
        );
      } else if (current < 55) {
        setStatusMessage(
          language === 'MY'
            ? 'သူရဲကောင်းနှင့် ဘော့စ် ကာရိုက်တာများ ချိန်ညှိနေသည်...'
            : 'LOADING CYBER HERO & BIO-TITAN COMBAT ASSETS...'
        );
      } else if (current < 80) {
        setStatusMessage(
          language === 'MY'
            ? 'Multiplayer ကွန်ရက်နှင့် အသံစနစ်များ ချိတ်ဆက်နေသည်...'
            : 'SYNCHRONIZING WEBRTC SQUAD & AUDIO MATRIX...'
        );
      } else if (current < 98) {
        setStatusMessage(
          language === 'MY'
            ? 'မိုဘိုင်းလ် Virtual Joystick နှင့် ထိန်းချုပ်မှုများ အသင့်ပြင်နေသည်...'
            : 'CALIBRATING 360° FLOATING VIRTUAL JOYSTICK...'
        );
      } else {
        setStatusMessage(
          language === 'MY'
            ? 'စနစ်အားလုံး ၁၀၀% အသင့်ဖြစ်ပြီ // စတင်တိုက်ခိုက်ပါ!'
            : 'NEURAL SYNC 100% // ALL SYSTEMS OPERATIONAL'
        );
        setIsReady(true);
        clearInterval(interval);
      }
    }, 85);

    return () => clearInterval(interval);
  }, [language]);

  const handleEnterGame = () => {
    if (isWarping) return;
    setIsWarping(true);

    try {
      sound.init();
      sound.playSlash();
    } catch {}

    // 450ms cinematic cyber warp zoom & flash dissolve
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  const handleSkip = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    handleEnterGame();
  };

  return (
    <div
      id="showdown-loading-screen"
      onClick={isReady ? handleEnterGame : undefined}
      style={{
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
        paddingLeft: 'max(10px, env(safe-area-inset-left, 10px))',
        paddingRight: 'max(10px, env(safe-area-inset-right, 10px))',
      }}
      className={`fixed inset-0 w-full h-[100dvh] max-h-[100dvh] z-50 select-none overflow-hidden bg-[#020108] text-white flex flex-col justify-between box-border transition-all duration-500 ${
        isWarping ? 'scale-110 opacity-0 blur-sm pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Cinematic Background Showdown Art with Animated Pulse */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src={assetUrls.showdown}
          alt="Hero vs Boss Showdown"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-35 mix-blend-screen scale-100 md:scale-105 animate-pulse transition-transform duration-10000 ease-out"
          style={{ animationDuration: '6s' }}
        />
        {/* Cyber Holographic Scanline Grid & Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(2,1,8,0.85)_80%,#020108_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,209,0.03)_1px,transparent_1px)] [background-size:100%_4px] opacity-60" />
      </div>

      {/* 2. Top Header Status Bar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto px-1 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-[#050312]/85 border border-[#00FFD1]/40 rounded-full backdrop-blur-md shadow-[0_0_12px_rgba(0,255,209,0.25)]">
          <Radio size={11} className="text-[#00FFD1] animate-ping" />
          <span className="font-mono-tech text-[8.5px] sm:text-[10px] font-bold text-[#00FFD1] tracking-widest uppercase">
            {t.neuralDirectLink}
          </span>
        </div>

        {/* Quick Skip Button */}
        <button
          id="btn-skip-loading"
          type="button"
          onClick={handleSkip}
          onTouchEnd={handleSkip}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#14061a]/85 hover:bg-[#FF00E5]/25 border border-[#FF00E5]/60 hover:border-[#FF00E5] text-[#FF00E5] rounded-full font-mono-tech text-[8.5px] sm:text-[10px] font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(255,0,229,0.3)] cursor-pointer touch-manipulation active:scale-95"
        >
          <span>{t.loadingSkip}</span>
          <FastForward size={11} />
        </button>
      </div>

      {/* 3. Center Showdown Arena: Responsive Layout for Portrait & Landscape */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto my-auto px-1 py-1 sm:py-2 overflow-hidden">
        {/* Animated Battle Subtitle Badge */}
        <div className="mb-1.5 sm:mb-3 text-center shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-yellow-400/50 bg-black/75 text-yellow-300 font-mono-tech text-[8px] sm:text-[9.5px] uppercase tracking-widest shadow-[0_0_10px_rgba(255,230,0,0.3)] animate-pulse">
            <Sparkles size={10} className="text-yellow-400" />
            <span>{t.loadingHeroVsBoss}</span>
          </div>
        </div>

        {/* --- PORTRAIT MOBILE LAYOUT (Stack with wide horizontal banners for maximum legibility) --- */}
        {isPortrait ? (
          <div className="w-full max-w-sm flex flex-col items-center justify-center gap-1.5 xs:gap-2.5 px-1">
            {/* HERO BANNER CARD (Portrait) */}
            <div className="w-full bg-gradient-to-r from-[#061820]/95 via-[#020914]/90 to-black/95 border-2 border-[#00FFD1] rounded-xl p-2 relative shadow-[0_0_20px_rgba(0,255,209,0.4)] backdrop-blur-md flex items-center gap-2.5">
              {/* Corner Bracket Decor */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#00FFD1]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#00FFD1]" />

              {/* Hero Avatar Image */}
              <div className="relative w-16 h-16 xs:w-20 xs:h-20 shrink-0 rounded-lg overflow-hidden border border-[#00FFD1]/60">
                <img
                  src={assetUrls.hero}
                  alt="Cyber Ninja Hero"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.2 bg-black/85 border border-[#00FFD1] rounded text-[7.5px] font-mono-tech font-bold text-[#00FFD1] flex items-center gap-0.5 shadow-[0_0_6px_#00FFD1]">
                  <Shield size={8} />
                  <span>HERO</span>
                </div>
              </div>

              {/* Hero Details */}
              <div className="flex-1 min-w-0 font-mono-tech text-left">
                <h3 className="text-xs xs:text-sm font-black text-[#00FFD1] uppercase tracking-wide drop-shadow-[0_0_8px_rgba(0,255,209,0.8)] truncate">
                  {t.loadingHeroTitle}
                </h3>
                <p className="text-[9px] xs:text-[10px] text-cyan-200/90 tracking-wide mt-0.5 truncate">
                  ⚔️ {t.loadingHeroWeapon}
                </p>
                <div className="mt-1 flex items-center justify-between text-[8px] xs:text-[9px] text-gray-300 border-t border-[#00FFD1]/30 pt-1">
                  <span className="text-cyan-400 font-bold">SPEED: MAX</span>
                  <span className="text-[#00FFD1] font-bold">ENERGY: 100%</span>
                </div>
              </div>
            </div>

            {/* HOLOGRAPHIC "VS" ENERGY CLASH (Portrait Center Badge) */}
            <div className="relative flex items-center justify-center shrink-0 -my-1 z-20">
              <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-lg bg-gradient-to-br from-[#00FFD1] via-[#050312] to-[#FF0055] p-[1.5px] shadow-[0_0_20px_rgba(255,0,85,0.7)] rotate-45 transform">
                <div className="w-full h-full bg-[#0a0614] rounded-md flex items-center justify-center -rotate-45">
                  <span className="font-mono-tech font-black text-xs xs:text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF0055] drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse">
                    VS
                  </span>
                </div>
              </div>
            </div>

            {/* BOSS BANNER CARD (Portrait) */}
            <div className="w-full bg-gradient-to-l from-[#20060d]/95 via-[#140206]/90 to-black/95 border-2 border-[#FF0055] rounded-xl p-2 relative shadow-[0_0_20px_rgba(255,0,85,0.4)] backdrop-blur-md flex items-center gap-2.5">
              {/* Corner Bracket Decor */}
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#FF0055]" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#FF0055]" />

              {/* Boss Details (Left in banner) */}
              <div className="flex-1 min-w-0 font-mono-tech text-left pl-1">
                <h3 className="text-xs xs:text-sm font-black text-[#FF0055] uppercase tracking-wide drop-shadow-[0_0_8px_rgba(255,0,85,0.8)] truncate">
                  {t.loadingBossTitle}
                </h3>
                <p className="text-[9px] xs:text-[10px] text-pink-200/90 tracking-wide mt-0.5 truncate">
                  ☣️ {t.loadingBossThreat}
                </p>
                <div className="mt-1 flex items-center justify-between text-[8px] xs:text-[9px] text-gray-300 border-t border-[#FF0055]/30 pt-1">
                  <span className="text-pink-400 font-bold">HP: 1,000,000</span>
                  <span className="text-[#FF0055] font-bold">THREAT: SSS</span>
                </div>
              </div>

              {/* Boss Avatar Image (Right in banner) */}
              <div className="relative w-16 h-16 xs:w-20 xs:h-20 shrink-0 rounded-lg overflow-hidden border border-[#FF0055]/60">
                <img
                  src={assetUrls.mutant}
                  alt="Mutant Bacteria Beast Boss"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-1 right-1 px-1.5 py-0.2 bg-black/85 border border-[#FF0055] rounded text-[7.5px] font-mono-tech font-bold text-[#FF0055] flex items-center gap-0.5 shadow-[0_0_6px_#FF0055]">
                  <Skull size={8} />
                  <span>BOSS</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- LANDSCAPE MOBILE & DESKTOP LAYOUT (Side-by-side with proportional height clamping) --- */
          <div className="w-full flex items-center justify-center gap-2 sm:gap-6 md:gap-8 max-w-4xl px-2">
            {/* HERO CARD (Landscape) */}
            <div className="flex-1 max-w-[280px] bg-gradient-to-br from-[#061820]/95 via-[#020914]/90 to-black/95 border-2 border-[#00FFD1] rounded-xl p-2 sm:p-2.5 relative shadow-[0_0_22px_rgba(0,255,209,0.45)] backdrop-blur-md">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#00FFD1]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#00FFD1]" />

              {/* Hero Image Avatar */}
              <div className="relative w-full h-20 sm:h-28 md:h-32 rounded-lg overflow-hidden border border-[#00FFD1]/50 mb-1.5">
                <img
                  src={assetUrls.hero}
                  alt="Cyber Ninja Hero"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020b14] via-transparent to-transparent opacity-80" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/85 border border-[#00FFD1] rounded text-[7.5px] sm:text-[8.5px] font-mono-tech font-bold text-[#00FFD1] flex items-center gap-1 shadow-[0_0_8px_#00FFD1]">
                  <Shield size={9} />
                  <span>HERO</span>
                </div>
              </div>

              {/* Hero Profile Details */}
              <div className="font-mono-tech text-left">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-black text-[#00FFD1] uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,255,209,0.8)] truncate">
                  {t.loadingHeroTitle}
                </h3>
                <p className="text-[7.5px] sm:text-[9px] text-cyan-200/90 tracking-wide mt-0.5 truncate">
                  ⚔️ {t.loadingHeroWeapon}
                </p>
                <div className="mt-1 flex items-center justify-between text-[7px] sm:text-[8px] text-gray-400 border-t border-[#00FFD1]/30 pt-0.5">
                  <span>SPEED: MAX</span>
                  <span className="text-[#00FFD1] font-bold">ENERGY: 100%</span>
                </div>
              </div>
            </div>

            {/* HOLOGRAPHIC "VS" ENERGY CLASH (Landscape Center) */}
            <div className="relative shrink-0 flex flex-col items-center justify-center z-20">
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#00FFD1] via-[#050312] to-[#FF0055] p-[2px] shadow-[0_0_25px_rgba(255,0,85,0.7)] rotate-45 transform">
                <div className="w-full h-full bg-[#0a0614] rounded-lg flex items-center justify-center -rotate-45">
                  <span className="font-mono-tech font-black text-xs sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF0055] drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse">
                    VS
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1 font-mono-tech text-[7.5px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                <Zap size={9} className="text-yellow-400 animate-bounce" />
                <span>CLASH</span>
              </div>
            </div>

            {/* BOSS CARD (Landscape) */}
            <div className="flex-1 max-w-[280px] bg-gradient-to-br from-[#20060d]/95 via-[#140206]/90 to-black/95 border-2 border-[#FF0055] rounded-xl p-2 sm:p-2.5 relative shadow-[0_0_22px_rgba(255,0,85,0.45)] backdrop-blur-md">
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#FF0055]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#FF0055]" />

              {/* Boss Image Avatar */}
              <div className="relative w-full h-20 sm:h-28 md:h-32 rounded-lg overflow-hidden border border-[#FF0055]/50 mb-1.5">
                <img
                  src={assetUrls.mutant}
                  alt="Mutant Bacteria Beast Boss"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140206] via-transparent to-transparent opacity-80" />
                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/85 border border-[#FF0055] rounded text-[7.5px] sm:text-[8.5px] font-mono-tech font-bold text-[#FF0055] flex items-center gap-1 shadow-[0_0_8px_#FF0055]">
                  <Skull size={9} />
                  <span>BOSS</span>
                </div>
              </div>

              {/* Boss Profile Details */}
              <div className="font-mono-tech text-left">
                <h3 className="text-[10px] sm:text-xs md:text-sm font-black text-[#FF0055] uppercase tracking-wider drop-shadow-[0_0_8px_rgba(255,0,85,0.8)] truncate">
                  {t.loadingBossTitle}
                </h3>
                <p className="text-[7.5px] sm:text-[9px] text-pink-200/90 tracking-wide mt-0.5 truncate">
                  ☣️ {t.loadingBossThreat}
                </p>
                <div className="mt-1 flex items-center justify-between text-[7px] sm:text-[8px] text-gray-400 border-t border-[#FF0055]/30 pt-0.5">
                  <span>HP: 1,000,000</span>
                  <span className="text-[#FF0055] font-bold">THREAT: SSS</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Section: Game Title, Progress Bar & Enter Action (Slim, proportional lower-third) */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center shrink-0 font-mono-tech pt-1">
        {/* Animated Main Title */}
        <div className="text-center mb-1 sm:mb-1.5">
          <h1 className="text-lg xs:text-xl sm:text-3xl md:text-4xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF00E5] drop-shadow-[0_0_20px_rgba(0,255,209,0.7)]">
            KKS CYBER GAME
          </h1>
          <div className="text-[8px] xs:text-[9px] sm:text-[10px] text-cyan-300 font-bold tracking-[0.25em] uppercase opacity-90">
            CYBERRUNNER // BIO-CONFRONTATION MATRIX
          </div>
        </div>

        {/* Loading Bar & Status */}
        <div className="w-full bg-[#0a0518]/90 border border-cyan-500/40 rounded-xl p-2 sm:p-2.5 backdrop-blur-md shadow-[0_0_18px_rgba(0,255,209,0.2)]">
          {/* Status readout & Percentage */}
          <div className="flex items-center justify-between text-[8px] xs:text-[9px] sm:text-[10px] font-bold mb-1 px-0.5">
            <span className="text-cyan-300 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFD1] animate-ping shrink-0" />
              <span className="truncate">{statusMessage}</span>
            </span>
            <span className="text-[#00FFD1] font-black shrink-0 ml-2">{progress}%</span>
          </div>

          {/* Segmented Neon Progress Bar */}
          <div className="w-full h-2.5 sm:h-3 bg-black/80 rounded-md overflow-hidden border border-cyan-500/30 p-0.5 relative">
            <div
              className="h-full rounded bg-gradient-to-r from-[#00FFD1] via-[#0088FF] to-[#FF00E5] transition-all duration-150 ease-out shadow-[0_0_15px_#00FFD1]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Enter Game Action Button (Reveals at 100% or clickable anytime ready) */}
          <div className="mt-1.5 sm:mt-2">
            {isReady ? (
              <button
                id="btn-enter-matrix-main"
                type="button"
                onClick={handleEnterGame}
                onTouchEnd={handleEnterGame}
                className="w-full py-2 sm:py-2.5 px-3 bg-gradient-to-r from-[#00FFD1] via-[#00ccaa] to-[#00FFD1] text-black font-black text-xs sm:text-sm uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,209,0.8)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer touch-manipulation animate-pulse"
              >
                <Sword size={16} className="animate-bounce" />
                <span>{t.loadingEnterMatrix}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="text-center text-[7.5px] xs:text-[8.5px] text-gray-400 uppercase tracking-widest py-0.5">
                {t.loading}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
