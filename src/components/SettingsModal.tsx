import React from 'react';
import { Volume2, VolumeX, Music, Monitor, ArrowLeft, Globe, Zap } from 'lucide-react';
import { GameSettings } from '../types';
import { Language, getTranslation } from '../localization';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onBack: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const currentLang: Language = settings.language || 'MY';
  const t = getTranslation(currentLang);

  const handleToggleLanguage = (lang: Language) => {
    onUpdateSettings({ language: lang });
  };

  return (
    <div
      id="settings-modal-overlay"
      className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 text-center select-none"
    >
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none border-2 border-[#00FFD1] bg-[#0A0A0A]/95 p-5 sm:p-8 relative flex flex-col shadow-[0_0_50px_rgba(0,255,209,0.2)] font-mono-tech">
        {/* Decorative Skewed Cyber Accents */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#FF00E5] shadow-[0_0_12px_#FF00E5] transform skew-x-12 pointer-events-none"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#00FFD1] shadow-[0_0_12px_#00FFD1] transform -skew-x-12 pointer-events-none"></div>

        <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-1 tracking-wider drop-shadow-[0_0_12px_rgba(0,255,209,0.5)]">
          {t.systemConfig}
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-[#00FFD1]/70 mb-5">
          {t.neuralInterfaceSettings}
        </p>

        {/* Options List */}
        <div className="flex flex-col gap-3 w-full mb-6">
          {/* Language Switcher Setting */}
          <div className="flex items-center justify-between p-3 border border-[#00FFD1]/40 bg-[#050505] shadow-[0_0_10px_rgba(0,255,209,0.15)]">
            <div className="flex items-center gap-2 text-left">
              <Globe size={16} className="text-[#00FFD1]" />
              <div>
                <div className="text-xs font-bold text-white">{t.languageSelect}</div>
                <div className="text-[9px] text-[#00FFD1]/70">{t.languageSelectDesc}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggleLanguage('MY')}
                className={`px-2 py-1 text-[11px] font-black border transition-all cursor-pointer touch-manipulation ${
                  currentLang === 'MY'
                    ? 'border-[#00FFD1] bg-[#00FFD1] text-black shadow-[0_0_10px_#00FFD1]'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                🇲🇲 မြန်မာ
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('EN')}
                className={`px-2 py-1 text-[11px] font-black border transition-all cursor-pointer touch-manipulation ${
                  currentLang === 'EN'
                    ? 'border-[#00FFD1] bg-[#00FFD1] text-black shadow-[0_0_10px_#00FFD1]'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          {/* SFX Audio */}
          <div className="flex items-center justify-between p-3 border border-[#00FFD1]/20 bg-[#050505]">
            <div className="flex items-center gap-2 text-left">
              {settings.soundEnabled ? <Volume2 size={16} className="text-[#00FFD1]" /> : <VolumeX size={16} className="text-slate-500" />}
              <div>
                <div className="text-xs font-bold text-white">{t.soundSFX}</div>
                <div className="text-[9px] text-[#00FFD1]/60">{t.sfxDesc}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1 text-xs font-black border transition-colors cursor-pointer touch-manipulation ${
                settings.soundEnabled
                  ? 'border-[#00FFD1] bg-[#00FFD1] text-black shadow-[0_0_10px_#00FFD1]'
                  : 'border-slate-700 text-slate-500'
              }`}
            >
              {settings.soundEnabled ? t.enabled : t.muted}
            </button>
          </div>

          {/* Synthwave BGM */}
          <div className="flex items-center justify-between p-3 border border-[#FF00E5]/20 bg-[#050505]">
            <div className="flex items-center gap-2 text-left">
              <Music size={16} className={settings.musicEnabled ? 'text-[#FF00E5]' : 'text-slate-500'} />
              <div>
                <div className="text-xs font-bold text-white">{t.synthBGM}</div>
                <div className="text-[9px] text-[#FF00E5]/60">{t.musicDesc}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`px-3 py-1 text-xs font-black border transition-colors cursor-pointer touch-manipulation ${
                settings.musicEnabled
                  ? 'border-[#FF00E5] bg-[#FF00E5] text-black shadow-[0_0_10px_#FF00E5]'
                  : 'border-slate-700 text-slate-500'
              }`}
            >
              {settings.musicEnabled ? t.enabled : t.muted}
            </button>
          </div>

          {/* CRT Scanline Overlay */}
          <div className="flex items-center justify-between p-3 border border-[#00FF66]/20 bg-[#050505]">
            <div className="flex items-center gap-2 text-left">
              <Monitor size={16} className={settings.crtOverlay ? 'text-[#00FF66]' : 'text-slate-500'} />
              <div>
                <div className="text-xs font-bold text-white">{t.crtScanlines}</div>
                <div className="text-[9px] text-[#00FF66]/60">{t.crtScanlinesDesc}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ crtOverlay: !settings.crtOverlay })}
              className={`px-3 py-1 text-xs font-black border transition-colors cursor-pointer touch-manipulation ${
                settings.crtOverlay
                  ? 'border-[#00FF66] bg-[#00FF66] text-black shadow-[0_0_10px_#00FF66]'
                  : 'border-slate-700 text-slate-500'
              }`}
            >
              {settings.crtOverlay ? t.active : t.off}
            </button>
          </div>

          {/* Graphics Quality & Resolution Scaler */}
          <div className="flex flex-col gap-2 p-3 border border-[#00FFD1]/30 bg-[#050505] shadow-[0_0_10px_rgba(0,255,209,0.1)]">
            <div className="flex items-center gap-2 text-left">
              <Zap size={16} className="text-[#00FFD1]" />
              <div>
                <div className="text-xs font-bold text-white">{t.graphicsQuality}</div>
                <div className="text-[9px] text-[#00FFD1]/70">{t.graphicsQualityDesc}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
              {(['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] as const).map((q) => {
                const isSelected = (settings.graphicsQuality || 'LOW') === q;
                const label =
                  q === 'LOW'
                    ? t.lowGraphicsLabel
                    : q === 'MEDIUM'
                    ? t.mediumGraphicsLabel
                    : q === 'HIGH'
                    ? t.highGraphicsLabel
                    : t.ultraGraphicsLabel;

                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        graphicsQuality: q,
                        lowGraphicsMode: q === 'LOW',
                        resolutionScale: q === 'LOW' ? 0.75 : q === 'MEDIUM' ? 0.85 : q === 'HIGH' ? 1.0 : 1.5,
                      })
                    }
                    className={`py-1.5 px-1 text-[10px] font-black border transition-all cursor-pointer touch-manipulation text-center ${
                      isSelected
                        ? 'border-[#00FFD1] bg-[#00FFD1] text-black shadow-[0_0_10px_#00FFD1]'
                        : 'border-slate-800 bg-black/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          id="btn-settings-back"
          type="button"
          onClick={onBack}
          className="w-full py-3 border-2 border-[#00FFD1] bg-[#00FFD1]/10 hover:bg-[#00FFD1] text-[#00FFD1] hover:text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,209,0.3)] touch-manipulation"
        >
          <ArrowLeft size={14} />
          <span>{t.returnToPause}</span>
        </button>
      </div>
    </div>
  );
};
