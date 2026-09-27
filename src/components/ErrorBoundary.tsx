import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[KKS Cyberpunk] Critical runtime anomaly caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    try {
      localStorage.removeItem('cyberrunner_temp_cache');
    } catch {}
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 w-screen h-screen bg-[#05030c] text-white flex flex-col items-center justify-center p-4 z-50 font-mono select-none">
          <div className="max-w-lg w-full bg-[#0b0618] border-2 border-[#FF0055] p-6 shadow-[0_0_50px_rgba(255,0,85,0.4)] flex flex-col items-center text-center relative overflow-hidden">
            {/* Glowing corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00FFD1]" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FFD1]" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00FFD1]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00FFD1]" />

            <div className="w-14 h-14 rounded-full bg-[#FF0055]/20 border border-[#FF0055] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,0,85,0.5)]">
              <AlertOctagon size={28} className="text-[#FF0055] animate-pulse" />
            </div>

            <div className="text-[10px] tracking-widest text-[#FF0055] uppercase font-bold mb-1">
              CRITICAL SUBSYSTEM RECOVERY // ကာကွယ်ရေးစနစ် ချို့ယွင်းမှု
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-2">
              NEON MATRIX DESYNC
            </h1>

            <p className="text-xs text-gray-300 mb-4 max-w-sm">
              ဂိမ်းဖွင့်လှစ်စဉ် အမှားအယွင်းတစ်ခု ဖြစ်ပေါ်ခဲ့ပါသည်။ အောက်ပါခလုတ်ကို နှိပ်၍ ဂိမ်းကို ပြန်လည်စတင် (Reboot) ပြုလုပ်နိုင်ပါသည်။
            </p>

            {this.state.error && (
              <div className="w-full bg-black/60 border border-red-500/30 p-2.5 rounded text-left mb-4 text-[11px] text-red-300 font-mono overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF0055] hover:bg-[#ff1a6b] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,85,0.4)] cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>RELOAD SYSTEM // ပြန်ဖွင့်မည်</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black/70 border border-[#00FFD1] text-[#00FFD1] hover:bg-[#00FFD1]/10 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>RETRY // ပြန်စမ်းမည်</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
