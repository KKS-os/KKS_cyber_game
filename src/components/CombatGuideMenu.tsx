import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Swords,
  AlertTriangle,
  Cpu,
  Crosshair,
  Flame,
  CheckCircle2,
  BookOpen,
  Eye,
  Radio,
  Globe,
  Sparkles,
  Users,
  Target,
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
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CONTROLS' | 'COMBAT_LOGIC' | 'WEAPONS_EVASION' | 'BOSS_MULTIPLAYER'
  >('OVERVIEW');
  const [localLang, setLocalLang] = useState<Language>(currentLanguage);

  const activeLang = onLanguageChange ? currentLanguage : localLang;
  const t = getTranslation(activeLang);
  const isMy = activeLang === 'MY';

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
        className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-[#070412]/95 border-2 border-[#00FFD1] shadow-[0_0_50px_rgba(0,255,209,0.35)] rounded-lg flex flex-col relative overflow-hidden text-left"
      >
        {/* Tactical Corner Brackets */}
        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#00FFD1] pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#FF00E5] pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#FF00E5] pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#00FFD1] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3.5 border-b border-cyan-500/30 bg-black/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950/70 border border-[#00FFD1] flex items-center justify-center text-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.4)] shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] text-cyan-400 tracking-[0.2em] uppercase font-bold">
                  {isMy ? 'စစ်ဆင်ရေး လမ်းညွှန်နှင့် LOGIC လက်စွဲ' : 'TACTICAL OPERATION & LOGIC MANUAL'}
                </span>
                <span className="px-1.5 py-0.2 bg-[#FF00E5]/20 border border-[#FF00E5]/60 text-[#FF00E5] text-[7.5px] font-black rounded uppercase">
                  v2.5 PRO
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF00E5] uppercase">
                {isMy ? 'KKS Cyberpunk: Neon Anti-Virus ကစားနည်းစည်းမျဉ်းများ' : 'KKS Cyberpunk: Neon Anti-Virus Game Logic Guide'}
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
              id="guide-close-btn"
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center border border-white/20 bg-black/40 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer touch-manipulation rounded"
              title="Close Guide"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tactical Navigation Tabs */}
        <div className="flex items-center px-3 sm:px-6 bg-black/40 border-b border-white/10 shrink-0 overflow-x-auto scrollbar-none gap-1 sm:gap-2 py-1.5">
          {[
            { id: 'OVERVIEW', label: isMy ? 'အနှစ်ချုပ်' : 'OVERVIEW', icon: Cpu },
            { id: 'CONTROLS', label: isMy ? 'ထိန်းချုပ်မှု' : 'CONTROLS', icon: Crosshair },
            { id: 'COMBAT_LOGIC', label: isMy ? 'တိုက်ခိုက်မှု Logic' : 'COMBAT LOGIC', icon: Swords },
            { id: 'WEAPONS_EVASION', label: isMy ? 'လက်နက်/လျှောင်တိမ်း' : 'WEAPONS & EVASION', icon: Zap },
            { id: 'BOSS_MULTIPLAYER', label: isMy ? 'BOSS & MULTI' : 'BOSS & MULTIPLAYER', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded text-[10.5px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#00FFD1] text-black shadow-[0_0_12px_rgba(0,255,209,0.5)] font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-black' : 'text-[#00FFD1]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-gray-300">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/40 rounded">
                <h3 className="text-white font-black text-sm uppercase flex items-center gap-2 mb-1.5 text-[#00FFD1]">
                  <Sparkles size={16} />
                  {isMy ? 'ဗိုင်းရပ်စ်နှိမ်နင်းရေး မစ်ရှင် ရည်မှန်းချက်' : 'ANTI-VIRUS MISSION OBJECTIVE'}
                </h3>
                <p>
                  {isMy
                    ? 'သင်သည် ဒစ်ဂျစ်တယ်ကွန်ရက်ထဲသို့ ကျူးကျော်ဝင်ရောက်လာသော Mutant Bio-Hazard ဗိုင်းရပ်စ်များကို ချေမှုန်းရမည့် Cyborg Ninja Operative ဖြစ်ပါသည်။ ကွန်ရက်အတွင်း ဝှက်ထားသော Quantum Bio-Cores ၃ ခုကို စုဆောင်းကာ Extraction Portal သို့ အသက်ရှင်လျက် လွတ်မြောက်ရမည် ဖြစ်ပါသည်။'
                    : 'You are an advanced Cyborg Ninja Anti-Virus Operative deployed into a corrupted cybergrid. Your objective is to cleanse mutant swarms, extract 3 Quantum Bio-Cores, and escape through the dimensional Extraction Portal before systemic collapse.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-black/60 border border-cyan-500/30 rounded">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">STEP 1: BIO-CORES</div>
                  <div className="text-white font-black text-xs mb-1">{isMy ? 'Core ၃ ခု စုဆောင်းပါ' : 'Collect 3 Bio-Cores'}</div>
                  <p className="text-[11px] text-gray-400">
                    {isMy ? 'Radar Pointer (Target Arrow) ညွှန်ပြရာသို့ သွား၍ မီးစိမ်းလင်းနေသော Core များကို ကောက်ယူပါ။' : 'Follow the Radar Target Arrow to locate glowing green Bio-Cores in the sector.'}
                  </p>
                </div>

                <div className="p-3 bg-black/60 border border-[#00FF66]/30 rounded">
                  <div className="text-[10px] text-[#00FF66] font-bold uppercase mb-1">STEP 2: PORTAL UNLOCK</div>
                  <div className="text-white font-black text-xs mb-1">{isMy ? 'Portal ပွင့်လာမည်' : 'Portal Ready'}</div>
                  <p className="text-[11px] text-gray-400">
                    {isMy ? 'Core ၃ ခုပြည့်ပါက Extraction Portal အလိုအလျောက် ပွင့်သွားမည်ဖြစ်ပြီး အလင်းတန်းပေါ်လာပါမည်။' : 'Collecting all 3 Cores unlocks the Dimensional Escape Portal.'}
                  </p>
                </div>

                <div className="p-3 bg-black/60 border border-[#FF00E5]/30 rounded">
                  <div className="text-[10px] text-[#FF00E5] font-bold uppercase mb-1">STEP 3: APEX TITAN</div>
                  <div className="text-white font-black text-xs mb-1">{isMy ? 'Apex Boss ရင်ဆိုင်ပါ' : 'Apex Titan Breach'}</div>
                  <p className="text-[11px] text-gray-400">
                    {isMy ? 'အဆင့် ၅ တွင် ဧရာမ Apex Boss Lord ထွက်ပေါ်လာမည်ဖြစ်ပြီး ဒိုင်းကာချိုးကာ ချေမှုန်းရမည်။' : 'On Stage 5, the colossal Apex Cyber-Lord Titan materializes for the ultimate victory.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTROLS */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PC Controls */}
                <div className="p-3.5 bg-black/60 border border-cyan-500/40 rounded space-y-2">
                  <h4 className="text-white font-black text-xs uppercase text-[#00FFD1] border-b border-cyan-500/30 pb-1">
                    💻 {isMy ? 'PC / KEYBOARD ထိန်းချုပ်မှု' : 'PC KEYBOARD & MOUSE'}
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-400">W / A / S / D:</span><span className="text-white font-bold">၃၆၀° လမ်းလျှောက်/ပြေး</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Left Click / J:</span><span className="text-[#00FFD1] font-bold">Plasma Katana ဓားခုတ် (Slash)</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Right Click / K:</span><span className="text-[#FFE600] font-bold">Plasma Blaster သေနတ်ပစ် (Shoot)</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">SPACE / Shift:</span><span className="text-[#FF00E5] font-bold">Phase Dash အမြန်ရှောင်တိမ်း</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">C Key:</span><span className="text-[#00FF66] font-bold">Crouch / Combat Slide လျှောတိုက်</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">F Key:</span><span className="text-[#FF0055] font-bold">Stealth Takedown ချောင်းမြောင်းသတ်</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">1 / 2 / 3 Keys:</span><span className="text-white font-bold">လက်နက် အလှည့်အပြောင်း</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">T Key:</span><span className="text-amber-400 font-bold">Tactical Squad Ping ပို့ရန်</span></div>
                  </div>
                </div>

                {/* Mobile Touch Controls */}
                <div className="p-3.5 bg-black/60 border border-[#FF00E5]/40 rounded space-y-2">
                  <h4 className="text-white font-black text-xs uppercase text-[#FF00E5] border-b border-[#FF00E5]/30 pb-1">
                    📱 {isMy ? 'မိုဘိုင်းလ် TOUCH ထိန်းချုပ်မှု' : 'MOBILE TOUCH ERGONOMICS'}
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-400">ဘယ်ဘက် Joystick:</span><span className="text-white font-bold">ဘယ်လက်မဖြင့် ၃၆၀° ရွှေ့လျား</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">ATTACK ခလုတ် (အကြီး):</span><span className="text-[#00FFD1] font-bold">ဓားခုတ်တိုက်ခိုက်မှု (Katana)</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">BLAST ခလုတ် (အပေါ်):</span><span className="text-[#FFE600] font-bold">စွမ်းအင်သေနတ်ပစ်ခတ်မှု</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">TAKEDOWN (ဘယ်ဘက်):</span><span className="text-[#FF0055] font-bold">ချောင်းမြောင်း အသံတိတ်သတ်</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">DASH ခလုတ် (အောက်):</span><span className="text-[#FF00E5] font-bold">အဝေးသို့ အမြန်ဒက်ရှ်ရှောင်</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">CROUCH / COVER:</span><span className="text-[#00FF66] font-bold">ဝပ်ခြင်းနှင့် အကာအကွယ်ယူခြင်း</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMBAT LOGIC */}
          {activeTab === 'COMBAT_LOGIC' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-black/70 border border-[#00FFD1]/30 rounded">
                <h4 className="text-[#00FFD1] font-black text-xs uppercase mb-1">
                  ⚔️ DAMAGE & HIT-STAGGER LOGIC (ထိခိုက်ဒဏ်ရာ တွက်ချက်ပုံ)
                </h4>
                <p className="text-[11px] mb-2 text-gray-300">
                  {isMy
                    ? 'Plasma Katana သည် ၃ ဆင့် အစီအစဉ်အတိုင်း တိုက်ခိုက်ပါသည် (Slash 1: 35 DMG, Slash 2: 45 DMG, Slash 3 Finisher: 75 DMG)။ ရန်သူကို ထိမှန်တိုင်း ရန်သူ၏ တိုက်ခိုက်မှုကို ၁၆ frames ကြာ ရပ်တန့်စေသည့် Stagger State ဖြစ်သွားစေပါသည်။'
                    : 'Plasma Katana executes a 3-stage combo progression (Slash 1: 35 DMG, Slash 2: 45 DMG, Slash 3 Finisher: 75 DMG with 180° sweep). Landing a hit inflicts a 16-frame Stagger interruption.'}
                </p>
                <div className="bg-black/50 p-2 border border-white/10 text-[10px] font-mono text-[#00FF66]">
                  Damage Formula = BaseDamage × ComboMultiplier × (RhythmBonus ? 1.5 : 1.0)
                </div>
              </div>

              <div className="p-3 bg-black/70 border border-[#FF00E5]/30 rounded">
                <h4 className="text-[#FF00E5] font-black text-xs uppercase mb-1">
                  🔥 5-TIER COMBO STREAK & DECAY TIMER (ကွန်ဘိုအဆင့် ၅ ဆင့်)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-[10px] text-center my-2">
                  <div className="p-1.5 bg-cyan-950/60 border border-cyan-400 rounded">
                    <div className="font-bold text-cyan-400">TIER 1 (1-4x)</div>
                    <div className="text-white text-[9px]">Cyan • 4.0s</div>
                  </div>
                  <div className="p-1.5 bg-yellow-950/60 border border-yellow-400 rounded">
                    <div className="font-bold text-yellow-400">TIER 2 (5-9x)</div>
                    <div className="text-white text-[9px]">Gold • 3.5s</div>
                  </div>
                  <div className="p-1.5 bg-pink-950/60 border border-pink-400 rounded">
                    <div className="font-bold text-pink-400">TIER 3 (10-19x)</div>
                    <div className="text-white text-[9px]">Hyper • 3.0s</div>
                  </div>
                  <div className="p-1.5 bg-purple-950/60 border border-purple-400 rounded">
                    <div className="font-bold text-purple-400">TIER 4 (20-34x)</div>
                    <div className="text-white text-[9px]">Ultra • 2.5s</div>
                  </div>
                  <div className="p-1.5 bg-red-950/60 border border-red-500 rounded">
                    <div className="font-bold text-red-400">TIER 5 (35x+)</div>
                    <div className="text-white text-[9px]">GODLIKE • 2.0s</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  {isMy
                    ? 'ဆက်တိုက်တိုက်ခိုက်မှု မြင့်တက်လာသည်နှင့်အမျှ ရမှတ်ဆတိုး (Multiplier) မြင့်တက်လာပြီး အသံစကေး မြင့်တက်လာပါမည်။ သတ်မှတ်ချိန်အတွင်း မတိုက်ခိုက်နိုင်ပါက Combo Timer ကုန်ဆုံးသွားပါမည်။'
                    : 'Higher combo tiers scale your score multiplier up to x12 with escalating synth pitch. Maintain offensive momentum before the decay timer expires.'}
                </p>
              </div>

              <div className="p-3 bg-black/70 border border-yellow-500/30 rounded">
                <h4 className="text-yellow-400 font-black text-xs uppercase mb-1">
                  🛡️ CRITICAL COUNTER PARRY (ပြန်လှန်ခုခံတိုက်ခိုက်မှု)
                </h4>
                <p className="text-[11px] text-gray-300">
                  {isMy
                    ? 'ရန်သူ တိုက်ခိုက်လာသော အခိုက်အတန့် ၆ frames အတွင်း အချိန်ကိုက် ဓားခုတ်လိုက်ပါက ရွှေရောင် Critical Parry ပေါ်လာပြီး ရန်သူ ဒူးထောက်သွားကာ မိမိမှာ ထိခိုက်မှု လုံးဝမရှိဘဲ ၂ ဆ Damage ပြန်တုံ့ပြန်ပါမည်။'
                    : 'Executing a blade strike within 6 frames of an incoming enemy attack triggers a Golden Counter Parry—granting full damage immunity, staggering the attacker, and dealing 200% counter damage.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: WEAPONS & EVASION */}
          {activeTab === 'WEAPONS_EVASION' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-black/70 border border-cyan-500/30 rounded">
                <h4 className="text-cyan-400 font-black text-xs uppercase mb-1.5">
                  🏃 4 ADAPTIVE EVASION MANEUVERS (လျှောင်တိမ်းနည်း ၄ မျိုး)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white/5 border border-white/10 rounded">
                    <span className="font-bold text-[#FF00E5]">၁။ PHASE DASH:</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      ၁၂ frames ကြာ မည်သည့်တိုက်ခိုက်မှုမှ မထိသော Invulnerability I-Frames ရရှိပြီး ရန်သူများကြား အဝေးသို့ ထိုးဖောက်ရှောင်တိမ်းနိုင်သည်။
                    </p>
                  </div>
                  <div className="p-2 bg-white/5 border border-white/10 rounded">
                    <span className="font-bold text-[#00FF66]">၂။ COMBAT SLIDE (CROUCH):</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      အောက်သို့ လျှောတိုက်ဝင်ရောက်ကာ အပေါ်ယံ လေဆာတန်းများနှင့် အဆိပ်ရည်များကို ငုံ့လျှောင်နိုင်သည်။
                    </p>
                  </div>
                  <div className="p-2 bg-white/5 border border-white/10 rounded">
                    <span className="font-bold text-[#0088FF]">၃။ TACTICAL COVER:</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      အတားအဆီး ဘယ်ရီဂိတ်များနောက်တွင် အကာအကွယ်ယူကာ ထိခိုက်မှုဒဏ်ကို ၈၀% အထိ လျှော့ချနိုင်သည်။
                    </p>
                  </div>
                  <div className="p-2 bg-white/5 border border-white/10 rounded">
                    <span className="font-bold text-[#FFE600]">၄။ DOUBLE-JUMP:</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      မြေပြင် အက်ကွဲကြောင်းများနှင့် Abyss တွင်းနက်များအပေါ်မှ ခုန်ကျော်လွှားနိုင်သည်။
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black/70 border border-[#00FFD1]/30 rounded">
                <h4 className="text-[#00FFD1] font-black text-xs uppercase mb-1.5">
                  🔫 CYBER ARSENAL (လက်နက်စနစ်များ)
                </h4>
                <div className="space-y-1 text-[11px]">
                  <div><span className="text-[#00FFD1] font-bold">Plasma Blaster (PLZ-1):</span> တိကျသော အပြာရောင် လေဆာတန်းများဖြင့် အမြန်ပစ်ခတ်ခြင်း (35 DMG)</div>
                  <div><span className="text-[#FFE600] font-bold">Tri-Spread Scatter Cannon:</span> ပစ်ကွင်းကျယ်ပြန့်သော ကျည်ဆံခွဲ တိုက်ခိုက်မှု (65 DMG)</div>
                  <div><span className="text-[#FF00E5] font-bold">Heavy Plasma Katana:</span> အနီးကပ် ဓားခုတ် အဆင့် ၃ ဆင့် ချေမှုန်းမှု (35 - 75 DMG)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BOSS & MULTIPLAYER */}
          {activeTab === 'BOSS_MULTIPLAYER' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-black/70 border border-red-500/40 rounded">
                <h4 className="text-red-400 font-black text-xs uppercase mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  {isMy ? 'APEX CYBER-LORD TITAN (BOSS တိုက်ခိုက်မှုစည်းမျဉ်း)' : 'APEX CYBER-LORD TITAN (BOSS PROTOCOL)'}
                </h4>
                <div className="space-y-1.5 text-[11px] text-gray-300">
                  <p>
                    <strong className="text-white">အဆင့် ၁ (Energy Shield):</strong> Boss တွင် ပြာလဲ့လဲ့ စွမ်းအင်ဒိုင်းကာ ပါရှိပြီး Plasma Blaster ဖြင့် အဆက်မပြတ် ပစ်ခတ်၍ ဒိုင်းကာကို အရင် ချိုးဖျက်ရမည်။
                  </p>
                  <p>
                    <strong className="text-white">အဆင့် ၂ (Enrage & Swarm):</strong> ကျန်းမာရေး ၅၀% အောက်ရောက်ပါက Berserk ဖြစ်သွားကာ Mutant အကောင်ငယ်များကို ဆင့်ခေါ်ပြီး မျက်နှာပြင်တစ်ခုလုံး လေဆာတိုက်ခိုက်မှု ပြုလုပ်ပါမည်။
                  </p>
                  <p>
                    <strong className="text-white">အဆင့် ၃ (Abyss Shockwaves):</strong> မြေပြင်ကို ရိုက်ခတ်သည့် Shockwave များကို Double Jump ဖြင့် ခုန်ကျော်ပြီး Finisher ခုတ်ချက်ဖြင့် အပြီးသတ်ရမည်။
                  </p>
                </div>
              </div>

              <div className="p-3 bg-black/70 border border-cyan-500/40 rounded">
                <h4 className="text-cyan-400 font-black text-xs uppercase mb-1 flex items-center gap-1.5">
                  <Users size={14} />
                  {isMy ? 'FIREBASE MULTIPLAYER SQUAD CO-OP LOGIC' : 'FIREBASE MULTIPLAYER SQUAD CO-OP'}
                </h4>
                <div className="space-y-1.5 text-[11px] text-gray-300">
                  <p>
                    <strong className="text-[#00FFD1]">Cloud Synchronization:</strong> Firebase Firestore ပေါ်တွင် Room ဖွင့်ကာ မည်သည့်စက်မှမဆို ဝင်ရောက်ကစားနိုင်ပြီး အဖွဲ့သားများ၏ တည်နေရာ၊ လှုပ်ရှားမှု၊ ဓားခုတ်မှုများကို ချက်ချင်း မြင်တွေ့ရပါမည်။
                  </p>
                  <p>
                    <strong className="text-amber-400">Tactical Pings:</strong> [T] ကီး သို့မဟုတ် မိုဘိုင်းလ် Ping ခလုတ်ဖြင့် ရန်သူရှိရာ (Danger), လာရောက်စုစည်းရန် (Regroup) စသည့် Beacon များကို အဖွဲ့သားများ၏ မြေပုံပေါ်သို့ တိုက်ရိုက် ပို့လွှတ်နိုင်ပါသည်။
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-black/70 border-t border-cyan-500/30 flex items-center justify-between shrink-0 text-xs">
          <span className="text-[10px] text-cyan-400/80">
            {isMy ? '🎮 စစ်ဆင်ရေးအောင်မြင်ပါစေ!' : '⚡ Good luck Operative!'}
          </span>
          <button
            id="guide-btn-acknowledge"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00FFD1] hover:bg-[#00FFD1]/85 text-black font-black text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_12px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation"
          >
            {t.acknowledge}
          </button>
        </div>
      </div>
    </div>
  );
};
