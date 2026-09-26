import React, { useState } from 'react';
import {
  Globe,
  GitBranch,
  Rocket,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Language, getTranslation } from '../localization';

interface VercelDeploymentModalProps {
  isOpen?: boolean;
  onClose: () => void;
  language?: Language;
}

export const VercelDeploymentModal: React.FC<VercelDeploymentModalProps> = ({
  isOpen = true,
  onClose,
  language = 'MY',
}) => {
  const activeLang: Language = language === 'EN' ? 'EN' : 'MY';
  const t = getTranslation(activeLang);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isMy = activeLang === 'MY';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono-tech overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#060312] border-2 border-[#00FFD1] p-4 sm:p-6 shadow-[0_0_35px_rgba(0,255,209,0.35)] my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00FFD1]/30 pb-3 mb-4">
          <div className="flex items-center gap-2.5 text-[#00FFD1]">
            <Rocket className="text-[#00FFD1] animate-bounce" size={24} />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">
                {t.vercelGuideTitle}
              </h2>
              <p className="text-[10px] text-cyan-300/70">
                {isMy ? 'ဆာဗာမဲ့ WebRTC P2P + Zero-Config Vercel Deployment' : 'Serverless WebRTC P2P + Zero-Config Vercel Deployment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* System Architecture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          <div className="bg-black/60 border border-[#00FFD1]/30 p-2.5 flex flex-col items-center text-center">
            <Globe size={18} className="text-[#00FFD1] mb-1" />
            <span className="text-[10px] text-white font-bold uppercase">
              {isMy ? '၁၀၀% Static SPA' : '100% Static SPA'}
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">
              {isMy ? 'Vite Build ဖြင့် အလွန်မြန်ဆန်စွာ အလုပ်လုပ်သည်' : 'Optimized Vite Build with instant cold-start'}
            </span>
          </div>

          <div className="bg-black/60 border border-[#00FF66]/30 p-2.5 flex flex-col items-center text-center">
            <Users size={18} className="text-[#00FF66] mb-1" />
            <span className="text-[10px] text-[#00FF66] font-bold uppercase">
              {isMy ? 'Multi-User WebRTC P2P' : 'Multi-User WebRTC P2P'}
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">
              {isMy ? 'အပိုဆာဗာခ မလိုဘဲ ဖုန်း/ကွန်ပျူတာ အချင်းချင်းချိတ်ဆက်ကစားနိုင်' : 'Free peer-to-peer data channels between devices'}
            </span>
          </div>

          <div className="bg-black/60 border border-[#FF00E5]/30 p-2.5 flex flex-col items-center text-center">
            <ShieldCheck size={18} className="text-[#FF00E5] mb-1" />
            <span className="text-[10px] text-[#FF00E5] font-bold uppercase">
              {isMy ? 'vercel.json အသင့်ပါရှိ' : 'vercel.json Configured'}
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">
              {isMy ? 'လိုင်းလမ်းကြောင်းများ (Routing) အတွက် စီမံထားပြီး' : 'Automatic SPA fallback and security headers'}
            </span>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 text-xs">
          
          {/* Step 1 */}
          <div className="border border-white/15 bg-black/40 p-3.5 relative">
            <div className="flex items-center gap-2 mb-1.5 text-[#00FFD1] font-bold">
              <span className="px-1.5 py-0.5 bg-[#00FFD1] text-black text-[10px] font-black">STEP 1</span>
              <span>{isMy ? 'GitHub သို့ ကုဒ်များ တင်သွင်းခြင်း (GitHub Export / Push)' : 'Push or Export to GitHub'}</span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed mb-2">
              {isMy
                ? 'AI Studio ညာဘက်ထိပ်ရှိ Settings သို့မဟုတ် Export menu မှ "Export to GitHub" ကို နှိပ်၍ သင့် GitHub အကောင့်ထဲသို့ တိုက်ရိုက် Repository အဖြစ် ပို့နိုင်ပါသည် (သို့မဟုတ် အောက်ပါ Git Commands ကိုသုံးနိုင်သည်) -'
                : 'Use the AI Studio Settings menu to "Export to GitHub", or push your local workspace via standard git commands:'}
            </p>
            <div className="bg-[#020108] border border-white/10 p-2 text-[10px] text-cyan-200 flex items-center justify-between font-mono">
              <code className="truncate mr-2">git init && git add . && git commit -m "Deploy KKS Cyberpunk: Neon Anti-Virus"</code>
              <button
                onClick={() => handleCopy('git init && git add . && git commit -m "Deploy KKS Cyberpunk: Neon Anti-Virus"', 1)}
                className="px-2 py-1 bg-[#00FFD1]/20 hover:bg-[#00FFD1] hover:text-black text-[#00FFD1] font-bold transition-all flex items-center gap-1 shrink-0"
              >
                {copiedIndex === 1 ? <CheckCircle size={12} /> : <Copy size={12} />}
                <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-white/15 bg-black/40 p-3.5 relative">
            <div className="flex items-center gap-2 mb-1.5 text-[#00FF66] font-bold">
              <span className="px-1.5 py-0.5 bg-[#00FF66] text-black text-[10px] font-black">STEP 2</span>
              <span>{isMy ? 'Vercel တွင် New Project အဖြစ် ချိတ်ဆက်ခြင်း' : 'Import Project on Vercel Dashboard'}</span>
            </div>
            <ol className="list-decimal list-inside text-gray-300 text-[11px] space-y-1 leading-relaxed">
              <li>
                {isMy ? (
                  <span><a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-[#00FFD1] underline">vercel.com/new</a> သို့ သွား၍ သင့် GitHub အကောင့်ဖြင့် Login ဝင်ပါ။</span>
                ) : (
                  <span>Navigate to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-[#00FFD1] underline">vercel.com/new</a> and connect your GitHub.</span>
                )}
              </li>
              <li>
                {isMy ? 'ခုနက တင်ထားသော Repository (ဥပမာ Remix-Neon-Cyber-Runner-2) ကို "Import" ပြုလုပ်ပါ။' : 'Click "Import" on your newly pushed repository.'}
              </li>
              <li>
                {isMy
                  ? 'Framework Preset တွင် "Vite" ဟု အလိုအလျောက် ပေါ်နေမည်ဖြစ်ပြီး Build Command သည် "npm run build" ဖြစ်နေပါမည် (မည်သည့် Setting မှ ပြောင်းရန်မလိုပါ)။'
                  : 'Vercel will auto-detect "Vite" with "npm run build" and output "dist". Zero config changes needed!'}
              </li>
              <li>
                {isMy ? '"Deploy" ခလုတ်ကို နှိပ်လိုက်ပါ။ ၁ မိနစ်အတွင်း တိုက်ရိုက် လွှင့်တင်ပြီးဖြစ်ပါမည်။' : 'Click "Deploy". In ~45 seconds, your production URL will go live.'}
              </li>
            </ol>
          </div>

          {/* Step 3 (CLI Alternative) */}
          <div className="border border-white/15 bg-black/40 p-3.5 relative">
            <div className="flex items-center gap-2 mb-1.5 text-[#FF00E5] font-bold">
              <span className="px-1.5 py-0.5 bg-[#FF00E5] text-black text-[10px] font-black">STEP 3</span>
              <span>{isMy ? 'Vercel CLI ဖြင့် ချက်ချင်း Deploy လုပ်လိုပါက (Alternative)' : 'Instant CLI Deploy (Alternative)'}</span>
            </div>
            <p className="text-gray-300 text-[11px] mb-2">
              {isMy
                ? 'Terminal မှတစ်ဆင့် ချက်ချင်း တင်လိုပါက အောက်ပါ Command တစ်ကြောင်းတည်းဖြင့် တင်နိုင်ပါသည် -'
                : 'You can also deploy directly from terminal using the official Vercel CLI:'}
            </p>
            <div className="bg-[#020108] border border-white/10 p-2 text-[10px] text-cyan-200 flex items-center justify-between font-mono">
              <code>npx vercel --prod</code>
              <button
                onClick={() => handleCopy('npx vercel --prod', 2)}
                className="px-2 py-1 bg-[#FF00E5]/20 hover:bg-[#FF00E5] hover:text-white text-[#FF00E5] font-bold transition-all flex items-center gap-1 shrink-0"
              >
                {copiedIndex === 2 ? <CheckCircle size={12} /> : <Copy size={12} />}
                <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step 4: Multi-User WebRTC How-To */}
          <div className="border border-[#00FFD1]/40 bg-[#00FFD1]/10 p-3.5">
            <div className="flex items-center gap-2 mb-1.5 text-[#00FFD1] font-bold">
              <Zap size={15} />
              <span>{isMy ? 'Multi-User ကစားသမား အချင်းချင်း ချိတ်ဆက်ကစားနည်း' : 'How Teammates Connect Online'}</span>
            </div>
            <p className="text-white text-[11px] leading-relaxed">
              {isMy
                ? 'Vercel ပေါ် ရောက်သွားသော သင့် URL (ဥပမာ https://your-game.vercel.app) သို့ ဝင်၍ "CO-OP MULTIPLAYER" ➔ "HOST CO-OP ROOM" ကို နှိပ်ပြီး Room Code (ဥပမာ CYBER-7429) သို့မဟုတ် Invite Link ကို သူငယ်ချင်းထံ ပို့လိုက်ရုံဖြင့် အတူတကွ ချက်ချင်း ဝင်ရောက်ကစားနိုင်မည် ဖြစ်ပါသည်!'
                : 'Open your Vercel URL, click "CO-OP MULTIPLAYER" ➔ "HOST CO-OP ROOM", then copy the Room Code or Invite Link and send it to teammates on mobile or desktop to play together!'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {isMy ? '📁 vercel.json ဖိုင်ကို စနစ်တကျ ပြင်ဆင်ပြီးဖြစ်ပါသည်' : '📁 vercel.json is already pre-configured at project root'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00FFD1] hover:bg-[#00FFD1]/80 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_#00FFD1]"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
