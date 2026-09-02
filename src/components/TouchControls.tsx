import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Terminal } from 'lucide-react';

interface TouchControlsProps {
  onMoveUp?: (active: boolean) => void;
  onMoveDown?: (active: boolean) => void;
  onMoveLeft: (active: boolean) => void;
  onMoveRight: (active: boolean) => void;
  onJump?: () => void;
  onSlide?: () => void;
  onDash: () => void;
  onHack?: () => void;
  comboCount: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onDash,
  onHack,
  comboCount,
}) => {
  const handleDir = (dirFn?: (active: boolean) => void) => ({
    onPointerDown: (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dirFn) dirFn(true);
    },
    onPointerUp: (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dirFn) dirFn(false);
    },
    onPointerLeave: (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dirFn) dirFn(false);
    },
    onPointerCancel: (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dirFn) dirFn(false);
    },
  });

  const handleAction = (actionFn?: () => void) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionFn) actionFn();
  };

  return (
    <footer
      id="bottom-controls-ui"
      className="absolute inset-x-0 bottom-0 px-2 sm:px-6 md:px-10 py-2 sm:py-3 bg-[#0A0A0A]/95 border-t border-[#00FFD1]/30 flex justify-between items-center z-30 select-none backdrop-blur-md"
    >
      {/* 1. Left Side: 8-Way D-Pad Vector Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="border-2 border-[#00FFD1]/50 bg-[#050505] p-1.5 sm:p-2 flex flex-col items-center shadow-[0_0_15px_rgba(0,255,209,0.2)]">
          <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest font-mono-tech text-[#00FFD1] mb-1">
            VECTOR D-PAD
          </span>

          {/* D-Pad Layout */}
          <div className="flex flex-col items-center gap-1 font-mono-tech">
            {/* UP [W] */}
            <button
              id="ctrl-move-up"
              type="button"
              {...handleDir(onMoveUp)}
              aria-label="Move Up [W]"
              className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-[#00FFD1] bg-[#0A0A0A] active:bg-[#00FFD1] active:text-black flex items-center justify-center text-xs font-black text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation active:scale-95"
            >
              <ArrowUp size={16} />
            </button>

            <div className="flex gap-1">
              {/* LEFT [A] */}
              <button
                id="ctrl-move-left"
                type="button"
                {...handleDir(onMoveLeft)}
                aria-label="Move Left [A]"
                className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-[#00FFD1] bg-[#0A0A0A] active:bg-[#00FFD1] active:text-black flex items-center justify-center text-xs font-black text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation active:scale-95"
              >
                <ArrowLeft size={16} />
              </button>

              {/* DOWN [S] */}
              <button
                id="ctrl-move-down"
                type="button"
                {...handleDir(onMoveDown)}
                aria-label="Move Down [S]"
                className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-[#00FFD1] bg-[#0A0A0A] active:bg-[#00FFD1] active:text-black flex items-center justify-center text-xs font-black text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation active:scale-95"
              >
                <ArrowDown size={16} />
              </button>

              {/* RIGHT [D] */}
              <button
                id="ctrl-move-right"
                type="button"
                {...handleDir(onMoveRight)}
                aria-label="Move Right [D]"
                className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-[#00FFD1] bg-[#0A0A0A] active:bg-[#00FFD1] active:text-black flex items-center justify-center text-xs font-black text-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.4)] cursor-pointer touch-manipulation active:scale-95"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle: Large Glowing [WARP DASH] Button */}
      <div className="flex items-center">
        <button
          id="ctrl-action-dash"
          type="button"
          onPointerDown={handleAction(onDash)}
          onClick={handleAction(onDash)}
          aria-label="Hypersonic Dash"
          className="border-2 border-[#FF00E5] bg-[#050505] hover:bg-[#FF00E5]/10 active:bg-[#FF00E5] active:text-black px-5 sm:px-8 py-2 sm:py-2.5 flex flex-col items-center justify-center text-[#FF00E5] font-mono-tech shadow-[0_0_20px_rgba(255,0,229,0.45)] transition-all active:scale-95 cursor-pointer touch-manipulation rounded-xl"
        >
          <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest opacity-80 mb-0.5">
            HYPERSONIC
          </span>
          <span className="text-xs sm:text-base font-black tracking-wider drop-shadow-[0_0_8px_#FF00E5]">
            DASH
          </span>
        </button>
      </div>

      {/* 3. Right Side: Interactive Action Terminals & Touch Overload */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Boost when combo >= 5 */}
        {comboCount >= 5 && (
          <button
            id="btn-combo-boost"
            type="button"
            onPointerDown={handleAction(onDash)}
            onClick={handleAction(onDash)}
            className="w-11 h-11 sm:w-13 sm:h-13 border-2 border-[#FFE600] bg-[#050505] text-[#FFE600] flex flex-col items-center justify-center text-[8px] font-bold uppercase shadow-[0_0_15px_#FFE600] active:scale-95 animate-pulse cursor-pointer touch-manipulation"
          >
            <Zap size={14} />
            <span>BOOST</span>
          </button>
        )}

        {/* HACK / OVERRIDE BUTTON */}
        <button
          id="btn-hack-action"
          type="button"
          onPointerDown={handleAction(onHack)}
          onClick={handleAction(onHack)}
          aria-label="Hack Terminal"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#00FF66] bg-[#050505] hover:bg-[#00FF66]/20 active:bg-[#00FF66] text-[#00FF66] active:text-black flex flex-col items-center justify-center p-1 transition-all active:scale-95 cursor-pointer touch-manipulation shadow-[0_0_18px_rgba(0,255,102,0.35)]"
        >
          <Terminal size={16} />
          <span className="text-[7px] sm:text-[8px] font-mono-tech font-black tracking-tighter uppercase text-center leading-tight">
            HACK<br />TERMINAL
          </span>
        </button>
      </div>
    </footer>
  );
};
