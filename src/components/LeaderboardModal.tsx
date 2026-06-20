import { X, Trophy, Trash2, Calendar, Award } from "lucide-react";
import { ScoreRecord } from "../types";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ScoreRecord[];
  onClear: () => void;
}

export default function LeaderboardModal({ isOpen, onClose, records, onClear }: LeaderboardModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      id="leaderboard-modal"
    >
      <div className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-full"
          aria-label="Close"
          id="close-leaderboard-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-amber-500 animate-pulse" />
          <h3 className="text-xl font-bold text-white font-sans tracking-tight">Prep Leaderboard & History</h3>
        </div>

        <div className="max-height-[320px] overflow-y-auto mb-6 pr-1 custom-scrollbar">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" id="leaderboard-empty">
              <Award className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">No recorded scores yet.</p>
              <p className="text-xs text-slate-500 mt-1">Complete a preparation quiz to write history!</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3 pl-4">Category</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3">Score</th>
                    <th className="p-3 text-right pr-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 pl-4 font-medium max-w-[180px] truncate">{rec.category}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          rec.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                          rec.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {rec.difficulty}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <strong className="text-amber-400">{rec.score}</strong> / <span className="text-slate-400">{rec.total}</span>
                      </td>
                      <td className="p-3 text-right pr-4 text-xs text-slate-400 font-mono">
                        <span className="flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3 inline text-slate-500" />
                          {rec.date}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center bg-white/5 -mx-6 -mb-6 p-4 px-6 rounded-b-2xl">
          <p className="text-xs text-slate-500">Track and reinforce your weakness patterns systematically.</p>
          {records.length > 0 && (
            <button
              onClick={onClear}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer border border-red-500/20"
              id="clear-leaderboard-btn"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
