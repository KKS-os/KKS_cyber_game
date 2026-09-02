import React, { useState } from 'react';
import {
  X,
  Shield,
  Zap,
  Swords,
  AlertTriangle,
  Cpu,
  Crosshair,
  Activity,
  Flame,
  CheckCircle2,
  BookOpen,
  Eye,
  Radio,
  Globe,
} from 'lucide-react';
import { Language, getTranslation } from '../localization';

interface CombatGuideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const CombatGuideMenu: React.FC<CombatGuideMenuProps> = ({
  isOpen,
  onClose,
  currentLanguage = 'MY',
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONTROLS' | 'AI_RULES' | 'PRO_TIPS'>('OVERVIEW');
  const [localLang, setLocalLang] = useState<Language>(currentLanguage);

  // Sync if prop updates
  const activeLang = onLanguageChange ? currentLanguage : localLang;
  const t = getTranslation(activeLang);

  const toggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLang: Language = activeLang === 'MY' ? 'EN' : 'MY';
    setLocalLang(nextLang);
    onLanguageChange?.(nextLang);
  };

  if (!isOpen) return null;

  return (
    <div
      id="combat-guide-modal"
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 z-50 select-none overflow-y-auto font-mono-tech"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-[#070412]/95 border border-cyan-500/50 shadow-[0_0_50px_rgba(0,255,209,0.25)] rounded-lg flex flex-col relative overflow-hidden text-left"
      >
        {/* Tactical Corner Brackets */}
        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#00FFD1] pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#FF00E5] pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#FF00E5] pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#00FFD1] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4 border-b border-cyan-500/30 bg-black/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950/70 border border-[#00FFD1] flex items-center justify-center text-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.4)]">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400/80 tracking-[0.25em] uppercase font-bold">
                  {t.guideProtocol}
                </span>
                <span className="px-1.5 py-0.2 bg-[#FF00E5]/20 border border-[#FF00E5]/60 text-[#FF00E5] text-[8px] font-black rounded uppercase">
                  PRO MANUAL
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF00E5] uppercase">
                {t.guideTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher Pill */}
            <button
              id="guide-lang-toggle"
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 bg-cyan-950/80 border border-[#00FFD1] text-[#00FFD1] hover:bg-[#00FFD1] hover:text-black transition-all rounded text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,209,0.3)] cursor-pointer touch-manipulation"
              title="Switch Language / ဘာသာစကားပြောင်းမည်"
            >
              <Globe size={13} />
              <span>{activeLang === 'MY' ? '🇲🇲 မြန်မာ' : '🇬🇧 EN'}</span>
            </button>

            {/* Close Button */}
            <button
              id="close-guide-btn"
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-900/60 hover:border-rose-400 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tactical Navigation Tabs */}
        <div className="flex items-center border-b border-cyan-500/20 bg-black/40 px-3 py-1.5 gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'OVERVIEW'
                ? 'bg-cyan-500/20 text-[#00FFD1] border border-cyan-400 shadow-[0_0_12px_rgba(0,255,209,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-300 border border-transparent'
            }`}
          >
            <Activity size={13} />
            <span>{t.tabOverview}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CONTROLS')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'CONTROLS'
                ? 'bg-cyan-500/20 text-[#00FFD1] border border-cyan-400 shadow-[0_0_12px_rgba(0,255,209,0.3)]'
                : 'text-cyan-400/60 hover:text-cyan-300 border border-transparent'
            }`}
          >
            <Crosshair size={13} />
            <span>{t.tabControls}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AI_RULES')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'AI_RULES'
                ? 'bg-rose-500/20 text-[#FF0055] border border-rose-500 shadow-[0_0_12px_rgba(255,0,85,0.3)]'
                : 'text-rose-400/60 hover:text-rose-300 border border-transparent'
            }`}
          >
            <AlertTriangle size={13} />
            <span>{t.tabAIRules}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRO_TIPS')}
            className={`px-3 py-1 text-xs font-bold uppercase rounded tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'PRO_TIPS'
                ? 'bg-purple-500/20 text-[#FF00E5] border border-[#FF00E5] shadow-[0_0_12px_rgba(255,0,229,0.3)]'
                : 'text-purple-400/60 hover:text-purple-300 border border-transparent'
            }`}
          >
            <Zap size={13} />
            <span>{t.tabProTips}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-cyan-100/90 leading-relaxed max-h-[60vh] sm:max-h-[64vh]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#00FFD1] font-bold text-sm mb-1.5">
                  <Radio size={16} className="text-[#00FFD1] animate-pulse" />
                  <span>{t.guideOverviewTitle}</span>
                </div>
                <p className="text-cyan-200/90 leading-normal">
                  {t.guideOverviewText}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-black/60 border border-purple-500/30 p-3 rounded">
                  <div className="flex items-center gap-2 text-[#FF00E5] font-bold text-xs mb-1">
                    <Cpu size={14} />
                    <span>{t.guideAINeuralTitle}</span>
                  </div>
                  <p className="text-cyan-200/80 text-[11px] leading-relaxed">
                    {t.guideAINeuralDesc}
                  </p>
                </div>

                <div className="bg-black/60 border border-emerald-500/30 p-3 rounded">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <Activity size={14} />
                    <span>{t.guideRhythmTitle}</span>
                  </div>
                  <p className="text-cyan-200/80 text-[11px] leading-relaxed">
                    {t.guideRhythmDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTROLS & ARSENAL */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-3">
              <div className="bg-black/70 border border-cyan-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-[#00FFD1] font-bold">
                    <Swords size={15} />
                    <span>{t.guideKatanaTitle}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                    {t.guideKatanaKeys}
                  </span>
                </div>
                <p className="text-cyan-200/85 text-xs">
                  {t.guideKatanaDesc}
                </p>
              </div>

              <div className="bg-black/70 border border-rose-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-[#FF0055] font-bold">
                    <Crosshair size={15} />
                    <span>{t.guideBlasterTitle}</span>
                  </div>
                  <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                    {t.guideBlasterKeys}
                  </span>
                </div>
                <p className="text-cyan-200/85 text-xs">
                  {t.guideBlasterDesc}
                </p>
              </div>

              <div className="bg-black/70 border border-purple-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-[#FF00E5] font-bold">
                    <Zap size={15} />
                    <span>{t.guideDashTitle}</span>
                  </div>
                  <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/40">
                    {t.guideDashKeys}
                  </span>
                </div>
                <p className="text-cyan-200/85 text-xs">
                  {t.guideDashDesc}
                </p>
              </div>

              <div className="bg-black/70 border border-amber-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Eye size={15} />
                    <span>{t.guideStealthTitle}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                    {t.guideStealthKeys}
                  </span>
                </div>
                <p className="text-cyan-200/85 text-xs">
                  {t.guideStealthDesc}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: HARDCORE AI RULES & PIT HAZARDS */}
          {activeTab === 'AI_RULES' && (
            <div className="space-y-3">
              {/* Rule 1: Dynamic Combo Input System & Anti-Mash Penalty */}
              <div className="bg-rose-950/30 border border-rose-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#FF0055] font-bold text-sm mb-1">
                  <AlertTriangle size={16} />
                  <span>{t.guideRule1Title}</span>
                </div>
                <p className="text-rose-200/90 text-xs">
                  {t.guideRule1Desc}
                </p>
                <div className="mt-2 text-[11px] text-[#00FFD1] font-semibold bg-black/60 p-2.5 rounded border border-[#00FFD1]/40">
                  ⚡ {t.guideRule1Tip}
                </div>
              </div>

              {/* Rule 2: 75% Tactical AI Combo Prediction */}
              <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#FFE600] font-bold text-sm mb-1">
                  <Cpu size={16} className="text-[#FFE600]" />
                  <span>{t.guideRule2Title}</span>
                </div>
                <p className="text-amber-200/90 text-xs">
                  {t.guideRule2Desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px]">
                  <div className="border border-cyan-500/30 p-2 rounded bg-cyan-950/30">
                    <span className="text-[#00FFD1] font-bold block mb-0.5">{t.guideRule2Evade}</span>
                    <p className="text-cyan-200/80">
                      {t.guideRule2EvadeDesc}
                    </p>
                  </div>
                  <div className="border border-amber-500/30 p-2 rounded bg-amber-950/30">
                    <span className="text-[#FFE600] font-bold block mb-0.5">{t.guideRule2Block}</span>
                    <p className="text-amber-200/80">
                      {t.guideRule2BlockDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rule 3: Pit Hazard & Crater Edge Navigation */}
              <div className="bg-cyan-950/30 border border-cyan-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#00FFD1] font-bold text-sm mb-1">
                  <Shield size={16} />
                  <span>{t.guideRule3Title}</span>
                </div>
                <p className="text-cyan-200/90 text-xs">
                  {t.guideRule3Desc}
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-cyan-200/80 text-[11px]">
                  <li>{t.guideRule3P1}</li>
                  <li>{t.guideRule3P2}</li>
                </ul>
              </div>

              {/* Rule 4: Executioner Protocol */}
              <div className="bg-purple-950/30 border border-purple-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#FF00E5] font-bold text-sm mb-1">
                  <Flame size={16} />
                  <span>{t.guideRule4Title}</span>
                </div>
                <p className="text-purple-200/90 text-xs">
                  {t.guideRule4Desc}
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-purple-200/80 text-[11px]">
                  <li>{t.guideRule4P1}</li>
                  <li>{t.guideRule4P2}</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: PRO TIPS */}
          {activeTab === 'PRO_TIPS' && (
            <div className="space-y-3">
              <div className="bg-black/70 border border-emerald-500/40 p-3.5 rounded flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0 font-black text-sm">
                  01
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold text-xs uppercase mb-1">
                    {t.guideTip1Title}
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    {t.guideTip1Desc}
                  </p>
                </div>
              </div>

              <div className="bg-black/70 border border-amber-500/40 p-3.5 rounded flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-amber-950/60 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 font-black text-sm">
                  02
                </div>
                <div>
                  <h4 className="text-amber-400 font-bold text-xs uppercase mb-1">
                    {t.guideTip2Title}
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    {t.guideTip2Desc}
                  </p>
                </div>
              </div>

              <div className="bg-black/70 border border-cyan-500/40 p-3.5 rounded flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 font-black text-sm">
                  03
                </div>
                <div>
                  <h4 className="text-[#00FFD1] font-bold text-xs uppercase mb-1">
                    {t.guideTip3Title}
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    {t.guideTip3Desc}
                  </p>
                </div>
              </div>

              <div className="bg-black/70 border border-purple-500/40 p-3.5 rounded flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-purple-950/60 border border-purple-400 flex items-center justify-center text-purple-300 shrink-0 font-black text-sm">
                  04
                </div>
                <div>
                  <h4 className="text-[#FF00E5] font-bold text-xs uppercase mb-1">
                    {t.guideTip4Title}
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    {t.guideTip4Desc}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-cyan-500/30 bg-black/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-cyan-400/70">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>NEURAL MANUAL // {activeLang === 'MY' ? 'မြန်မာဘာသာ အသင့်ရှိသည်' : 'READY'}</span>
          </div>

          <button
            id="guide-ack-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#00FFD1] to-[#00d0a7] text-black font-black text-xs uppercase tracking-wider rounded transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation"
          >
            {t.acknowledge}
          </button>
        </div>
      </div>
    </div>
  );
};
