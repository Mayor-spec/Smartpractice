import { X, ShieldCheck, Key, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      id="settings-modal"
    >
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full"
          aria-label="Close"
          id="close-settings-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white font-sans tracking-tight">Gemini Integration Settings</h3>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            This quiz prep application utilizes high-performance generative models from Google AI Studio to customize contestant-grade questions.
          </p>

          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-200">Secure AI Processing</h4>
              <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                Your connection is fully sandboxed. Gemini queries are processed server-side. No API keys are exposed or saved to the client browser.
              </p>
            </div>
          </div>

          <div className="bg-slate-850/50 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> Core Target Model:
              </span>
              <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">gemini-3.5-flash</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Connection Status:
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline" /> Operational
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            Questions are generated in real-time. Categories adaptively match history, administration, student governance, geography, sports, and Nigeria’s iconic entertainment culture.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-sm font-semibold rounded-xl transition duration-250 cursor-pointer shadow-lg shadow-amber-500/20"
            id="save-settings-btn"
          >
            Acknowledge & Save
          </button>
        </div>
      </div>
    </div>
  );
}
