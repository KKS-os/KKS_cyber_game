import React from 'react';
import { Volume2, VolumeX, Music, Monitor, ArrowLeft } from 'lucide-react';
import { GameSettings } from '../types';

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
  return (
    <div
      id="settings-modal-overlay"
      className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 text-center select-none"
    >
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-none border-2 border-[#00FFD1] bg-[#0A0A0A]/95 p-5 sm:p-8 relative flex flex-col shadow-[0_0_50px_rgba(0,255,209,0.2)] font-mono-tech">
        {/* Decorative Skewed Cyber Accents */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#FF00E5] shadow-[0_0_12px_#FF00E5] transform skew-x-12"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#00FFD1] shadow-[0_0_12px_#00FFD1] transform -skew-x-12"></div>

        <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-1 tracking-wider drop-shadow-[0_0_12px_rgba(0,255,209,0.5)]">
          SYSTEM CONFIG
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-[#00FFD1]/70 mb-6">
          NEURAL INTERFACE SETTINGS
        </p>

        {/* Options List */}
        <div className="flex flex-col gap-3 w-full mb-6">
          {/* SFX Audio */}
          <div className="flex items-center justify-between p-3 border border-[#00FFD1]/20 bg-[#050505]">
            <div className="flex items-center gap-2 text-left">
              {settings.soundEnabled ? <Volume2 size={16} className="text-[#00FFD1]" /> : <VolumeX size={16} className="text-slate-500" />}
              <div>
                <div className="text-xs font-bold text-white">SOUND EFFECTS (SFX)</div>
                <div className="text-[9px] text-[#00FFD1]/60">Web Audio dynamic synthesis</div>
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
              {settings.soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Synthwave BGM */}
          <div className="flex items-center justify-between p-3 border border-[#FF00E5]/20 bg-[#050505]">
            <div className="flex items-center gap-2 text-left">
              <Music size={16} className={settings.musicEnabled ? 'text-[#FF00E5]' : 'text-slate-500'} />
              <div>
                <div className="text-xs font-bold text-white">SYNTHWAVE MUSIC</div>
                <div className="text-[9px] text-[#FF00E5]/60">Procedural dual-oscillator BGM</div>
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
              {settings.musicEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* CRT Scanline Overlay */}
          <div className="flex items-center justify-between p-3 border border-[#00FF66]/20 bg-[#050505]">
            <div className="flex items-center gap-2 text-left">
              <Monitor size={16} className={settings.crtOverlay ? 'text-[#00FF66]' : 'text-slate-500'} />
              <div>
                <div className="text-xs font-bold text-white">CRT SCANLINES</div>
                <div className="text-[9px] text-[#00FF66]/60">Retro arcade raster effect</div>
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
              {settings.crtOverlay ? 'ACTIVE' : 'OFF'}
            </button>
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
          <span>RETURN TO PAUSE MENU</span>
        </button>
      </div>
    </div>
  );
};
