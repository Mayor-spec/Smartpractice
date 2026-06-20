import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { 
  GraduationCap, 
  Trophy, 
  Settings, 
  Globe, 
  Landmark, 
  Flame, 
  Clapperboard, 
  Play, 
  ArrowRight, 
  RotateCcw, 
  Copy, 
  FileDown, 
  Share2, 
  Timer, 
  Award, 
  Sparkles,
  ChevronRight,
  ClipboardCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

import { QuizQuestion, QuizCategory, QuizDifficulty, QuizSetup, ScoreRecord } from "./types";
import { playSound } from "./components/SoundUtility";
import { exportQuizAsPDF } from "./components/PdfExporter";
import SettingsModal from "./components/SettingsModal";
import LeaderboardModal from "./components/LeaderboardModal";

export default function App() {
  // App navigation state
  const [section, setSection] = useState<'config' | 'loading' | 'quiz' | 'result'>('config');

  // Config setup state
  const [setup, setSetup] = useState<QuizSetup>({
    category: 'General Affairs',
    difficulty: 'Easy',
    count: 5
  });

  // Game play state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  
  // Modals active state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);

  // Feedback states
  const [copiedState, setCopiedState] = useState<'none' | 'questions' | 'share'>('none');

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Leaderboard on init
  useEffect(() => {
    const raw = localStorage.getItem("wgtbam_leaderboard");
    if (raw) {
      try {
        setLeaderboard(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse leaderboard from LocalStorage:", e);
      }
    }
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (section !== 'quiz' || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Start timer interval
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired
          clearInterval(timerRef.current!);
          handleTimeExpired();
          return 0;
        }
        playSound('tick');
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [section, currentIdx, isAnswered]);

  const handleTimeExpired = () => {
    setIsAnswered(true);
    setSelectedOption(null);
    playSound('fail');
  };

  const selectCategory = (category: QuizCategory) => {
    playSound('click');
    setSetup(prev => ({ ...prev, category }));
  };

  const selectDifficulty = (difficulty: QuizDifficulty) => {
    playSound('click');
    setSetup(prev => ({ ...prev, difficulty }));
  };

  const selectCount = (count: number) => {
    playSound('click');
    setSetup(prev => ({ ...prev, count }));
  };

  // Launch Server generation request
  const startPrepQuiz = async () => {
    playSound('click');
    setSection('loading');
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: setup.category,
          difficulty: setup.difficulty,
          count: setup.count
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.questions?.length > 0) {
        setQuestions(resData.questions);
        setCurrentIdx(0);
        setScore(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setTimeLeft(30);
        setSection('quiz');
      } else {
        throw new Error(resData.error || "Empty question list received.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while connecting to the AI prep server. Please try again.");
      setSection('config');
    }
  };

  const handleOptionClick = (option: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(option);
    setIsAnswered(true);

    const correctAns = questions[currentIdx].correctAnswer.toUpperCase().trim();
    if (option === correctAns) {
      setScore(prev => prev + 1);
      playSound('success');
    } else {
      playSound('fail');
    }
  };

  const handleNextQ = () => {
    playSound('click');
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
      setTimeLeft(30);
    } else {
      // Completed, transition to result
      setSection('result');
      triggerCelebration();
    }
  };

  const triggerCelebration = () => {
    const percentage = ((score + (selectedOption === questions[currentIdx].correctAnswer ? 1 : 0)) / questions.length) * 100;
    
    // Save record to list
    const finalScore = score + (selectedOption === questions[currentIdx].correctAnswer ? 1 : 0);
    const newRecord: ScoreRecord = {
      id: Math.random().toString(36).substring(2, 9),
      category: setup.category,
      difficulty: setup.difficulty,
      score: finalScore,
      total: questions.length,
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updated = [newRecord, ...leaderboard].slice(0, 40);
    setLeaderboard(updated);
    localStorage.setItem("wgtbam_leaderboard", JSON.stringify(updated));

    if (percentage >= 80) {
      // High score confetti celebration
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#fbbf24", "#2563eb", "#10b981", "#ffffff"]
        });
      }, 300);
    }
  };

  const clearLeaderboard = () => {
    playSound('click');
    if (window.confirm("Are you sure you want to clear your preparation history? This action is irreversible.")) {
      setLeaderboard([]);
      localStorage.removeItem("wgtbam_leaderboard");
    }
  };

  // Helper formatting to copy
  const copyQuizToClipboard = () => {
    playSound('click');
    const intro = `--- WGTBAM 2.0 Prep Quiz Report [Category: ${setup.category} | Difficulty: ${setup.difficulty}] ---\n\n`;
    const body = questions.map((q, idx) => {
      return `Q${idx + 1}: ${q.question}\nA) ${q.optionA}\nB) ${q.optionB}\nC) ${q.optionC}\nD) ${q.optionD}\nCorrect: Option ${q.correctAnswer}\n`;
    }).join("\n");
    
    navigator.clipboard.writeText(intro + body)
      .then(() => {
        setCopiedState('questions');
        setTimeout(() => setCopiedState('none'), 3000);
      });
  };

  const shareQuizScore = () => {
    playSound('click');
    const pct = Math.round((score / questions.length) * 100);
    const message = `🏆 Prepared smart with WGTBAM 2.0 Prep AI!\nI scored ${score}/${questions.length} (${pct}%) on a ${setup.difficulty} level quiz about ${setup.category}!\nRefine your knowledge with secure Gemini 3.5 quiz models right now.`;
    
    navigator.clipboard.writeText(message)
      .then(() => {
        setCopiedState('share');
        setTimeout(() => setCopiedState('none'), 3000);
      });
  };

  const handleDownloadPdf = () => {
    playSound('click');
    exportQuizAsPDF(questions, setup.category, setup.difficulty, score);
  };

  const returnToConfig = () => {
    playSound('click');
    setSection('config');
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-start items-center bg-slate-950 overflow-x-hidden font-sans pt-1">
      {/* Background Starry Glimmer layout */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 z-0" />
      
      {/* Dynamic Glimmer Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none z-0 animate-pulse duration-5000" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none z-0 animate-pulse duration-7000" />

      {/* Main app box centering */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-6 flex flex-col min-h-screen">
        
        {/* Header App Actions bar */}
        <header className="flex justify-between items-center px-5 py-4 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 mb-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
              <GraduationCap className="w-6 h-6 text-amber-400 stroke-[1.8]" />
            </div>
            <div className="leading-tight">
              <span className="text-slate-400 text-[10px] tracking-widest font-bold uppercase font-sans">WGTBAM 2.0 PREPARATION</span>
              <h1 className="text-white text-lg font-extrabold tracking-tight">Prep <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">AI Assistant</span></h1>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={() => { playSound('click'); setIsLeaderboardOpen(true); }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-amber-400 hover:bg-white/10 transition duration-200 cursor-pointer flex items-center gap-2 text-sm font-medium"
              title="View History"
              id="leaderboard-btn"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Records</span>
            </button>
            <button 
              onClick={() => { playSound('click'); setIsSettingsOpen(true); }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition duration-200 cursor-pointer flex items-center gap-2 text-sm font-medium"
              title="AI Info"
              id="settings-btn"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">AI Info</span>
            </button>
          </div>
        </header>

        {/* Dynamic Display Area */}
        <main className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {section === 'config' && (
              <motion.section 
                key="config"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/50 backdrop-blur-lg border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
                id="config-panel"
              >
                {/* Visual Banner Accent */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500" />
                
                <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> High-Performance Quiz Generation
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                    Who Gets To Be A <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent italic">Millionaire?</span>
                  </h2>
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                    Prepare with tailored, educational quiz batches powered by Gemini 3.5 AI. Reinforce student politics, great history, sports, and entertainment facts.
                  </p>
                </div>

                <div className="space-y-6 md:space-y-8">
                  {/* Step 1: Category grids */}
                  <div>
                    <h3 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                      Choose Category Focus
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      <button 
                        onClick={() => selectCategory('General Affairs')}
                        className={`flex items-start text-left p-4 rounded-2xl border transition duration-200 cursor-pointer hover:bg-white/[0.04] ${
                          setup.category === 'General Affairs' 
                          ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                          : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <Globe className="w-5 h-5 text-blue-400 mt-1 shrink-0 mr-3" />
                        <div>
                          <h4 className="font-bold text-sm text-white">General Affairs</h4>
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">Nigerian, continental and global political & geographical trivia.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => selectCategory('Governance & OAU History')}
                        className={`flex items-start text-left p-4 rounded-2xl border transition duration-200 cursor-pointer hover:bg-white/[0.04] ${
                          setup.category === 'Governance & OAU History' 
                          ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                          : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <Landmark className="w-5 h-5 text-amber-400 mt-1 shrink-0 mr-3" />
                        <div>
                          <h4 className="font-bold text-sm text-white">Governance & OAU History</h4>
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">Great Ife student struggles, Union history, chancellors & landmarks.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => selectCategory('Sports')}
                        className={`flex items-start text-left p-4 rounded-2xl border transition duration-200 cursor-pointer hover:bg-white/[0.04] ${
                          setup.category === 'Sports' 
                          ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                          : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <Flame className="w-5 h-5 text-rose-400 mt-1 shrink-0 mr-3" />
                        <div>
                          <h4 className="font-bold text-sm text-white">Sports History</h4>
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">AFCON records, Olympic feats, Premier League & football trivia.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => selectCategory('Entertainment')}
                        className={`flex items-start text-left p-4 rounded-2xl border transition duration-200 cursor-pointer hover:bg-white/[0.04] ${
                          setup.category === 'Entertainment' 
                          ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                          : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <Clapperboard className="w-5 h-5 text-emerald-400 mt-1 shrink-0 mr-3" />
                        <div>
                          <h4 className="font-bold text-sm text-white">Entertainment & Culture</h4>
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">Nollywood awards, afrobeats events, viral media & cinema milestones.</p>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* Inline controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-bold text-white flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                        Difficulty Grade
                      </h3>
                      <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1">
                        {(['Easy', 'Medium', 'Hard'] as QuizDifficulty[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => selectDifficulty(level)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer ${
                              setup.difficulty === level 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-bold text-white flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                        Quantity
                      </h3>
                      <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1">
                        {([5, 10, 15] as number[]).map((qty) => (
                          <button
                            key={qty}
                            onClick={() => selectCount(qty)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                              setup.count === qty 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {qty} Questions
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-10" id="start-game-btn">
                  <button
                    onClick={startPrepQuiz}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-amber-500/10 cursor-pointer"
                  >
                    Generate Study Material
                    <Play className="w-4 h-4 fill-slate-950 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.section>
            )}

            {section === 'loading' && (
              <motion.section 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900/50 backdrop-blur-lg border border-white/5 rounded-3xl p-10 py-16 text-center shadow-2xl"
                id="loading-panel"
              >
                <div className="flex flex-col items-center justify-center gap-6">
                  {/* Elegant dual bounce loading spinner */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-amber-500 opacity-60 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-indigo-500 animate-pulse" />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">AI Preparing Questions...</h2>
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">{setup.category} • {setup.difficulty}</p>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed mt-1">
                      Connecting with Gemini server-side. Customizing a balanced set of multiple-choice questions for your choice.
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {section === 'quiz' && questions.length > 0 && (
              <motion.section 
                key="quiz"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900/50 backdrop-blur-lg border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative"
                id="quiz-panel"
              >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-amber-400" />
                
                {/* Meta header labels */}
                <div className="flex justify-between items-center gap-4 mb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[11px] font-bold text-slate-300">
                      {setup.category}
                    </span>
                    <span className={`px-3 py-1 border rounded-full text-[11px] font-bold ${
                      setup.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      setup.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {setup.difficulty}
                    </span>
                  </div>

                  {/* Red flashing Countdown box */}
                  <div className={`p-2 px-3.5 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold tracking-tight transition duration-200 ${
                    timeLeft <= 8 
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse' 
                      : 'bg-white/5 border-white/5 text-slate-300'
                  }`} id="timer-box">
                    <Timer className={`w-4 h-4 ${timeLeft <= 8 ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span>0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft} <span className="text-[10px] text-slate-500">s</span></span>
                  </div>
                </div>

                {/* Progress Tracker bar */}
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Question <strong className="text-white font-bold">{currentIdx + 1}</strong> of <strong className="text-white font-bold">{questions.length}</strong></span>
                    <span className="font-semibold text-amber-400">Current Points: {score}</span>
                  </div>
                  <div className="w-full bg-slate-950/50 rounded-full h-[6px] overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-amber-400 to-amber-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question box title */}
                <div className="min-h-[100px] flex items-center mb-8">
                  <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed tracking-tight" id="question-text">
                    {questions[currentIdx].question}
                  </h3>
                </div>

                {/* Question Option actions grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="options-grid">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const optText = 
                      opt === 'A' ? questions[currentIdx].optionA :
                      opt === 'B' ? questions[currentIdx].optionB :
                      opt === 'C' ? questions[currentIdx].optionC :
                      questions[currentIdx].optionD;

                    const isSelected = selectedOption === opt;
                    const correctAns = questions[currentIdx].correctAnswer.toUpperCase().trim();
                    const isCorrect = opt === correctAns;

                    // Compute dynamic button custom feedback colors
                    let btnClass = "bg-white/5 border-white/5 text-slate-200";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/5";
                      } else if (isSelected) {
                        btnClass = "bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/5";
                      } else {
                        btnClass = "bg-white/5 border-white/5 opacity-40";
                      }
                    } else {
                      btnClass = "hover:bg-white/[0.08] hover:border-white/15 cursor-pointer hover:translate-x-1";
                    }

                    return (
                      <button
                        key={opt}
                        disabled={isAnswered}
                        onClick={() => handleOptionClick(opt)}
                        className={`flex items-start text-left p-4 rounded-xl border transition duration-200 text-sm font-medium leading-relaxed font-sans ${btnClass}`}
                      >
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 mr-3.5 transition-colors ${
                          isAnswered && isCorrect ? 'bg-emerald-500 text-slate-950' :
                          isAnswered && isSelected && !isCorrect ? 'bg-rose-500 text-white' :
                          'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                        }`}>
                          {opt}
                        </span>
                        <span>{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Question footer button panel */}
                <div className="flex justify-end mt-10" id="next-q-btn">
                  <button
                    disabled={!isAnswered}
                    onClick={handleNextQ}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition duration-200 ${
                      isAnswered 
                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer shadow-lg shadow-blue-600/15' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {currentIdx + 1 === questions.length ? "Finish & Review" : "Next Question"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.section>
            )}

            {section === 'result' && (
              <motion.section 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/50 backdrop-blur-lg border border-white/5 rounded-3xl p-6 md:p-10 text-center shadow-2xl relative"
                id="result-panel"
              >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500" />
                
                <div className="py-6 max-w-xl mx-auto">
                  <div className="inline-flex justify-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl mb-4 relative">
                    <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tight leading-tight" id="result-status">
                    {((score / questions.length) * 100) >= 80 ? "Superb Execution!" :
                     ((score / questions.length) * 100) >= 50 ? "Satisfactory Progression!" :
                     "Keep Reinforcing!"}
                  </h2>

                  {/* Scored badge fraction */}
                  <div className="my-6">
                    <span className="inline-block text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">YOUR RESULT</span>
                    <div className="text-4xl md:text-5xl font-black text-white font-mono flex items-center justify-center gap-1.5 leading-none">
                      <span className="text-amber-400">{score}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-slate-400">{questions.length}</span>
                    </div>
                    <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mt-2.5">
                      {Math.round((score / questions.length) * 100)}% SUCCESS RATE
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed" id="result-feedback">
                    {((score / questions.length) * 100) >= 80 ? "Stellar work! Your knowledge base is tracking precisely toward the highest standard of WGTBAM 2.0 excellence." :
                     ((score / questions.length) * 100) >= 50 ? "Solid effort. Generating different question categories periodically will reinforce weak patterns effectively." :
                     "Contestant-tier prep requires deeper practice. Take a moment to read OAU student government milestones, geography modules, and sporting feats, then try again!"}
                  </p>
                </div>

                {/* Score Action lists */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2 border-t border-white/5 pt-8">
                  <button
                    onClick={copyQuizToClipboard}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition duration-250 cursor-pointer flex items-center gap-2 border border-white/5 active:scale-95"
                    title="Copy questions to Clipboard"
                    id="copy-questions-btn"
                  >
                    {copiedState === 'questions' ? (
                      <>
                        <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                        Copied Questions!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Material
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition duration-250 cursor-pointer flex items-center gap-2 border border-white/5 active:scale-95"
                    title="Export Material as PDF Report"
                    id="download-pdf-btn"
                  >
                    <FileDown className="w-4 h-4 text-amber-400" />
                    Download PDF
                  </button>

                  <button
                    onClick={shareQuizScore}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition duration-250 cursor-pointer flex items-center gap-2 border border-white/5 active:scale-95"
                    title="Copy Shareable Text to Clipboard"
                    id="share-btn"
                  >
                    {copiedState === 'share' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Copied Share Link!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-indigo-400" />
                        Share Score
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-center mt-8 border-t border-white/5 pt-6" id="restart-btn">
                  <button
                    onClick={returnToConfig}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start New Practice
                  </button>
                </div>
              </motion.section>
            )}

          </AnimatePresence>
        </main>

        {/* Footer text panel */}
        <footer className="mt-auto pt-10 text-center space-y-2">
          <p className="text-slate-500 text-[11px]">
            WGTBAM 2.0 Prep AI is an independent contestant preparation engine powered by Google Gemini.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <span>Prepare smart.</span>
            <span>•</span>
            <span>Realize your potential.</span>
          </div>
        </footer>

        {/* Overlays */}
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
        
        <LeaderboardModal 
          isOpen={isLeaderboardOpen} 
          onClose={() => setIsLeaderboardOpen(false)} 
          records={leaderboard}
          onClear={clearLeaderboard}
        />

      </div>
    </div>
  );
}
