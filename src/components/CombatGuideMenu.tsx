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
} from 'lucide-react';

interface CombatGuideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CombatGuideMenu: React.FC<CombatGuideMenuProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONTROLS' | 'AI_RULES' | 'PRO_TIPS'>('OVERVIEW');

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
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-cyan-500/30 bg-black/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950/70 border border-[#00FFD1] flex items-center justify-center text-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.4)]">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400/80 tracking-[0.25em] uppercase font-bold">
                  TACTICAL PROTOCOL
                </span>
                <span className="px-1.5 py-0.2 bg-[#FF00E5]/20 border border-[#FF00E5]/60 text-[#FF00E5] text-[8px] font-black rounded uppercase">
                  PRO DIFFICULTY
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-white to-[#FF00E5] uppercase">
                COMBAT & SURVIVAL GUIDE
              </h2>
            </div>
          </div>

          <button
            id="close-guide-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-900/60 hover:border-rose-400 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
          >
            <X size={18} />
          </button>
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
            <span>1. OVERVIEW</span>
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
            <span>2. CONTROLS</span>
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
            <span>3. HARDCORE AI RULES</span>
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
            <span>4. PRO-TIPS</span>
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
                  <span>THE NEON QUARANTINE PROTOCOL</span>
                </div>
                <p className="text-cyan-200/80 leading-normal">
                  In <strong className="text-white">Remix Neon Cyber Runner 2</strong>, you are a cyber-operative deployed into procedurally generated quarantine megacity sectors overrun by mutating rogue viral entities. Your mission is to infiltrate, eliminate hostiles, hack data terminals, and reach the extraction portals alive.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-black/60 border border-purple-500/30 p-3 rounded">
                  <div className="flex items-center gap-2 text-[#FF00E5] font-bold text-xs mb-1">
                    <Cpu size={14} />
                    <span>ADAPTIVE NEURAL AI DIRECTOR</span>
                  </div>
                  <p className="text-cyan-200/70 text-[11px]">
                    Unlike traditional arcade runners, enemies here are governed by a real-time behavioral neural system that monitors your combat patterns, punishes button-mashing, and cancels attack frames to flank you.
                  </p>
                </div>

                <div className="bg-black/60 border border-emerald-500/30 p-3 rounded">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <Activity size={14} />
                    <span>SYNTHWAVE RHYTHM COMBAT</span>
                  </div>
                  <p className="text-cyan-200/70 text-[11px]">
                    All slashes, dashes, and abilities synchronize with the pulsating 120-140 BPM synthwave soundtrack. Striking exactly on the beat unlocks up to <strong className="text-white">3.5x Critical Burst Multipliers</strong>.
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
                    <span>CHOP // CYBER PLASMA KATANA</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
                    CLICK / J / KEYBOARD
                  </span>
                </div>
                <p className="text-cyan-200/80 text-xs">
                  A blistering 3-stage combo melee slash. Deals massive damage in a 180° arc in front of the operative. High rhythm synchronization yields instant burst decimation against standard mutated entities.
                </p>
              </div>

              <div className="bg-black/70 border border-rose-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-[#FF0055] font-bold">
                    <Crosshair size={15} />
                    <span>BLAST // EXOTIC WEAPON ARSENAL</span>
                  </div>
                  <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                    RIGHT-CLICK / K
                  </span>
                </div>
                <p className="text-cyan-200/80 text-xs">
                  Discharges your currently equipped exotic weapon: <strong className="text-white">Plasma Blaster</strong> (rapid beam), <strong className="text-white">Spread Cannon</strong> (shotgun burst), <strong className="text-white">Chain Lightning</strong>, <strong className="text-white">Homing Missiles</strong>, or <strong className="text-white">Gravity Vortex</strong>. Consumes energy cells.
                </p>
              </div>

              <div className="bg-black/70 border border-purple-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-[#FF00E5] font-bold">
                    <Zap size={15} />
                    <span>DASH // HYPERSONIC PHASE EVASION</span>
                  </div>
                  <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/40">
                    SPACE / SHIFT
                  </span>
                </div>
                <p className="text-cyan-200/80 text-xs">
                  Propels your operative forward with full <strong className="text-white">Invulnerability Frames (i-Frames)</strong>. Pierce directly through enemy projectile barrages and reposition behind aggressive enemies.
                </p>
              </div>

              <div className="bg-black/70 border border-amber-500/30 p-3 rounded">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Eye size={15} />
                    <span>STEALTH, CROUCH & TAKEDOWNS</span>
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                    C / SNEAK BUTTON
                  </span>
                </div>
                <p className="text-cyan-200/80 text-xs">
                  Drop into crouch mode to halve footstep sound telemetry and reduce visibility. Sneak behind enemies to execute silent <strong className="text-white">Cyber Takedowns</strong> before they can alert the hive.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: HARDCORE AI RULES */}
          {activeTab === 'AI_RULES' && (
            <div className="space-y-3">
              {/* Rule 1: Dynamic Combo Input System & Anti-Mash Penalty */}
              <div className="bg-rose-950/30 border border-rose-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#FF0055] font-bold text-sm mb-1">
                  <AlertTriangle size={16} />
                  <span>1. DYNAMIC COMBO INPUTS & ANTI-MASH PENALTY</span>
                </div>
                <p className="text-rose-200/90 text-xs">
                  Single-button spamming (e.g., Left Click ➔ Left Click ➔ Left Click) is heavily penalized: your attack damage drops to <strong className="text-rose-400">25%-40%</strong> and triggers blunt hit sound feedback.
                </p>
                <div className="mt-2 text-[11px] text-[#00FFD1] font-semibold bg-black/60 p-2.5 rounded border border-[#00FFD1]/40">
                  ⚡ <strong className="text-white">To unleash Maximum 2.5x Critical Damage:</strong> Rotate your inputs in dynamic sequences:
                  <div className="mt-1 font-mono-tech text-xs text-[#FFE600] flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500/50 rounded text-cyan-300">⚔️ Left Click (Slash)</span>
                    <span>➔</span>
                    <span className="px-1.5 py-0.5 bg-purple-950 border border-purple-500/50 rounded text-purple-300">🔫 Right Click (Shoot)</span>
                    <span>➔</span>
                    <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-500/50 rounded text-amber-300">⚡ Action/Key (Dash / Crouch / Hack)</span>
                    <span>=</span>
                    <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-400 text-yellow-300 font-black rounded shadow-[0_0_10px_#FFE600]">💥 2.5x CRITICAL FINISHER</span>
                  </div>
                </div>
              </div>

              {/* Rule 2: 75% Tactical AI Combo Prediction */}
              <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#FFE600] font-bold text-sm mb-1">
                  <Cpu size={16} className="text-[#FFE600]" />
                  <span>2. 75% TACTICAL AI COMBO PREDICTION</span>
                </div>
                <p className="text-amber-200/90 text-xs">
                  The Enemy AI Director tracks and memorizes your live input sequences. When you initiate a high-damage combo sequence, the enemy has a <strong className="text-white">75% tactical chance</strong> to predict your final finisher input:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px]">
                  <div className="border border-cyan-500/30 p-2 rounded bg-cyan-950/30">
                    <span className="text-[#00FFD1] font-bold block mb-0.5">💨 PREDICTIVE EVASION DASH</span>
                    <p className="text-cyan-200/80">
                      The enemy performs a rapid phase-dash away from your attack trajectory, completely evading all incoming finisher damage.
                    </p>
                  </div>
                  <div className="border border-amber-500/30 p-2 rounded bg-amber-950/30">
                    <span className="text-[#FFE600] font-bold block mb-0.5">🛡️ PREDICTIVE DEFENSIVE BLOCK</span>
                    <p className="text-amber-200/80">
                      The enemy raises a hardened organic kinetic barrier, deflecting <strong className="text-white">85% of incoming combo damage</strong> and emitting a defensive shockwave.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rule 3: Pit Hazard & Crater Edge Navigation */}
              <div className="bg-cyan-950/30 border border-cyan-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#00FFD1] font-bold text-sm mb-1">
                  <Shield size={16} />
                  <span>3. PIT HAZARD / CRATER EDGE NAVIGATION & RANGED FLUID ATTACK</span>
                </div>
                <p className="text-cyan-200/90 text-xs">
                  Mutated Bacteria organisms now utilize spatial raycasts to detect explosion craters and pit abyss hazards:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-cyan-200/80 text-[11px]">
                  <li>Enemies will <strong className="text-white">never blindly walk into pits</strong>; they smartly steer and patrol around crater edges.</li>
                  <li>If the direct path to the player is blocked by a pit hazard, the enemy halts movement and launches a <strong className="text-[#39FF14]">Ranged Bacterial Acid Splash fluid projectile</strong> directly across the chasm on a <strong className="text-white">2.0-second tactical cooldown</strong>.</li>
                </ul>
              </div>

              {/* Rule 4: Executioner Protocol */}
              <div className="bg-purple-950/30 border border-purple-500/40 p-3.5 rounded">
                <div className="flex items-center gap-2 text-[#FF00E5] font-bold text-sm mb-1">
                  <Flame size={16} />
                  <span>4. EXECUTIONER PROTOCOL & COGNITIVE PRESSURE</span>
                </div>
                <p className="text-purple-200/90 text-xs">
                  Remaining stationary or turtling passively for <strong className="text-white">&gt;1.5 seconds</strong> activates Executioner Protocol:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-purple-200/80 text-[11px]">
                  <li>Ranged Spitters unleash <strong className="text-white">predictive mortar artillery</strong> targeting your future trajectory.</li>
                  <li>A <strong className="text-rose-400">throbbing red stress vignette</strong> constricts your peripheral vision and FOV.</li>
                  <li>Enemies gain a +35% speed surge to swarm your defensive perimeter.</li>
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
                    VARIATE YOUR COMBAT INPUTS (BYPASS THE BUFFER)
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    Never perform the exact same action sequence twice. Seamlessly weave <strong className="text-white">CHOP ➔ BLAST ➔ DASH ➔ CHOP</strong>. By constantly rotating your moves, the AI's pattern recognition remains low (below 30%), preventing high-probability enemy parries.
                  </p>
                </div>
              </div>

              <div className="bg-black/70 border border-amber-500/40 p-3.5 rounded flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-amber-950/60 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 font-black text-sm">
                  02
                </div>
                <div>
                  <h4 className="text-amber-400 font-bold text-xs uppercase mb-1">
                    BAIT THE PARRY STANCE & WHIFF-PUNISH
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    When you notice an elite enemy glowing in the golden <strong className="text-amber-300">Parry Stance</strong>, do not swing! Instead, delay your strike for 0.2s or Phase-Dash to their flank. Once their parry window drops, punish them with a point-blank blaster burst or heavy katana combo while they are in recovery.
                  </p>
                </div>
              </div>

              <div className="bg-black/70 border border-cyan-500/40 p-3.5 rounded flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 font-black text-sm">
                  03
                </div>
                <div>
                  <h4 className="text-[#00FFD1] font-bold text-xs uppercase mb-1">
                    BREAK THE RED VIGNETTE WITH ACTIVE ENGAGEMENT
                  </h4>
                  <p className="text-cyan-200/80 text-xs">
                    If the crimson stress vignette appears on your screen or you hear the Executioner Alarm, break out of defensive mode immediately! Performing an active dash or landing a hit instantly resets the idle pressure gauge, clearing the red vignette and silencing the predictive mortar barrage.
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
            <span>NEURAL COMBAT MANUAL // READY</span>
          </div>

          <button
            id="guide-ack-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#00FFD1] to-[#00d0a7] text-black font-black text-xs uppercase tracking-wider rounded transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation"
          >
            ACKNOWLEDGE & DEPLOY
          </button>
        </div>
      </div>
    </div>
  );
};
