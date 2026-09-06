import React from 'react';
import { AlertTriangle, Shield, Zap, Crosshair, X } from 'lucide-react';
import { multiplayer } from '../multiplayerManager';
import { sound } from '../audio';
import { Language } from '../localization';

interface TacticalPingWheelProps {
  isOpen?: boolean;
  playerX: number;
  playerY: number;
  onClose: () => void;
  language?: Language;
}

export const TacticalPingWheel: React.FC<TacticalPingWheelProps> = ({
  isOpen = true,
  playerX,
  playerY,
  onClose,
  language = 'MY',
}) => {
  if (!isOpen) return null;
  const isMy = language === 'MY';

  const sendPing = (category: 'RUSH' | 'COVER' | 'BACKUP' | 'CORE' | 'DANGER', text: string) => {
    sound.playCollect(2);
    multiplayer.sendTacticalPing(text, category, playerX, playerY);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none font-mono-tech">
      <div className="relative bg-[#070314] border-2 border-[#00FFD1] p-4 shadow-[0_0_30px_rgba(0,255,209,0.3)] w-full max-w-sm text-center">
        
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
          <span className="text-xs font-black text-[#00FFD1] uppercase tracking-wider">
            {isMy ? 'အဖွဲ့တွင်း အချက်ပြ ဆက်သွယ်မှု (TACTICAL PING)' : 'SQUAD TACTICAL COMMS'}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 my-2">
          {/* Danger */}
          <button
            onClick={() => sendPing('DANGER', isMy ? '⚠️ ရန်သူအုပ်စု သတိထား!' : '⚠️ DANGER AT LOCATION!')}
            className="p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 flex flex-col items-center gap-1.5 transition-all active:scale-95"
          >
            <AlertTriangle size={20} className="text-red-400" />
            <span className="text-[10px] font-bold uppercase">{isMy ? 'သတိထားပါ' : 'DANGER'}</span>
          </button>

          {/* Rush Core */}
          <button
            onClick={() => sendPing('RUSH', isMy ? '🎯 အတူထိုးဖောက်တိုက်ခိုက်မည်!' : '🎯 RUSH OBJECTIVE!')}
            className="p-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-[#00FFD1]/50 text-[#00FFD1] flex flex-col items-center gap-1.5 transition-all active:scale-95"
          >
            <Crosshair size={20} className="text-[#00FFD1]" />
            <span className="text-[10px] font-bold uppercase">{isMy ? 'ထိုးဖောက်မည်' : 'RUSH CORE'}</span>
          </button>

          {/* Cover */}
          <button
            onClick={() => sendPing('COVER', isMy ? '🛡️ အကာအကွယ်ယူပါ / ပုန်းကွယ်ပါ!' : '🛡️ TAKE COVER!')}
            className="p-3 bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/50 text-yellow-300 flex flex-col items-center gap-1.5 transition-all active:scale-95"
          >
            <Shield size={20} className="text-yellow-400" />
            <span className="text-[10px] font-bold uppercase">{isMy ? 'အကာအကွယ်ယူ' : 'TAKE COVER'}</span>
          </button>

          {/* Backup */}
          <button
            onClick={() => sendPing('BACKUP', isMy ? '⚡ အကူအညီ လိုအပ်သည်!' : '⚡ BACKUP NEEDED!')}
            className="p-3 bg-green-950/40 hover:bg-green-900/60 border border-[#00FF66]/50 text-[#00FF66] flex flex-col items-center gap-1.5 transition-all active:scale-95"
          >
            <Zap size={20} className="text-[#00FF66]" />
            <span className="text-[10px] font-bold uppercase">{isMy ? 'အကူအညီလိုသည်' : 'NEED BACKUP'}</span>
          </button>
        </div>

        <p className="text-[9px] text-gray-500 mt-2">
          {isMy ? 'ခလုတ်နှိပ်လိုက်ပါက အခြားကစားသမားများထံ အချက်ပြရောက်ရှိသွားပါမည်' : 'Broadcasting beacon to all squad members'}
        </p>

      </div>
    </div>
  );
};
