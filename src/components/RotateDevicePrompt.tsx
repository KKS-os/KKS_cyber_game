import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, RotateCw, Play, ShieldAlert, Maximize2 } from 'lucide-react';
import { Language, getTranslation } from '../localization';

interface RotateDevicePromptProps {
  language?: Language;
}

export const RotateDevicePrompt: React.FC<RotateDevicePromptProps> = ({
  language = 'MY',
}) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const activeLang: Language = language === 'EN' ? 'EN' : 'MY';
  const t = getTranslation(activeLang);

  // Check whether device is in portrait orientation on a mobile/tablet touch viewport
  const checkOrientation = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isPortraitAspect = h > w;
    const isSmallScreen = Math.min(w, h) < 1024;

    // Display prompt when the viewport is taller than wide on mobile/tablet devices
    const shouldPrompt = isPortraitAspect && (isTouch || isSmallScreen);
    setIsPortrait(shouldPrompt);

    // If device returns to landscape, reset dismissed status so next portrait triggers correctly
    if (!isPortraitAspect) {
      setIsDismissed(false);
    }
  }, []);

  useEffect(() => {
    checkOrientation();

    // Event listeners for window resize, orientationchange, and modern ScreenOrientation API
    window.addEventListener('resize', checkOrientation, { passive: true });
    window.addEventListener('orientationchange', checkOrientation, { passive: true });

    if (screen.orientation) {
      screen.orientation.addEventListener('change', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', checkOrientation);
      }
    };
  }, [checkOrientation]);

  // Try locking to landscape mode using Screen Orientation API + Fullscreen
  const handleLockLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {}
    checkOrientation();
  };

  // Automatically fade out the banner after 6 seconds so user can enjoy full screen
  useEffect(() => {
    if (isPortrait && !isDismissed) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isPortrait, isDismissed]);

  if (!isPortrait || isDismissed) {
    return null;
  }

  return (
    <aside
      id="rotate-device-hint-banner"
      aria-label="Screen Orientation Recommendation"
      className="fixed top-2 inset-x-0 mx-auto z-40 max-w-sm w-[94vw] pointer-events-auto select-none font-mono-tech transition-all animate-bounce"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#070314]/95 border border-[#00FFD1] rounded-lg shadow-[0_0_20px_rgba(0,255,209,0.35)] backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <RotateCw size={14} className="text-[#00FFD1] animate-spin shrink-0" />
          <p className="text-[10px] text-gray-200 leading-tight truncate">
            {activeLang === 'MY'
              ? '💡 Landscape လှည့်၍လည်းကောင်း၊ ဒေါင်လိုက်ဖြင့်လည်းကောင်း ကစားနိုင်ပါသည်'
              : '💡 Best in Landscape, or enjoy vertical runner!'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-lock-landscape-quick"
            type="button"
            onClick={handleLockLandscape}
            title="Fullscreen / Rotate"
            className="px-2 py-1 bg-[#00FFD1] text-black font-bold text-[9px] uppercase tracking-wider rounded shadow-[0_0_8px_#00FFD1] cursor-pointer touch-manipulation"
          >
            <Maximize2 size={11} className="inline mr-0.5" />
            <span>FULL</span>
          </button>

          <button
            id="btn-dismiss-rotate-quick"
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss hint"
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white text-xs cursor-pointer touch-manipulation"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
};
