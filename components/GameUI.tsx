
import React from 'react';
import { LevelConfig, GameState, LevelMode, CandyColor } from '../types';
import { RefreshCw, Trophy, Target, Cherry, Snowflake, Play, Volume2, VolumeX, Flame } from 'lucide-react';
import { clsx } from 'clsx';
import { CANDY_STYLES, LEVELS } from '../constants';

// --- Level Selection Screen ---
interface LevelSelectProps {
  onSelectLevel: (level: LevelConfig) => void;
}

export const LevelSelector: React.FC<LevelSelectProps> = ({ onSelectLevel }) => {
  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
      <h2 className="text-2xl font-black text-white text-center mb-6">SELECT LEVEL</h2>
      <div className="space-y-4">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelectLevel(level)}
            className="w-full bg-slate-800/80 hover:bg-slate-700 p-4 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="text-left">
              <div className="text-pink-400 font-bold text-lg">{level.id}. {level.name}</div>
              <div className="text-slate-400 text-xs">{level.description}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play fill="white" size={16} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- In Game Stats ---
interface StatsProps {
  score: number;
  moves: number;
  levelConfig: LevelConfig;
  progress: {
    collected: number;
    iceCleared: number;
  };
  combo: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const GameStats: React.FC<StatsProps> = ({ score, moves, levelConfig, progress, combo, isMuted, onToggleMute, onRestart, onExit }) => {
  
  // Determine Goal Display
  let GoalIcon = Target;
  let goalText = "";
  let progressPercent = 0;

  if (levelConfig.mode === LevelMode.TargetScore) {
    if (levelConfig.targetColor) {
      const Style = CANDY_STYLES[levelConfig.targetColor];
      GoalIcon = Style.icon;
      goalText = `${progress.collected} / ${levelConfig.targetCount}`;
      progressPercent = (progress.collected / (levelConfig.targetCount || 1)) * 100;
    } else {
      goalText = `${score} / ${levelConfig.targetScore}`;
      progressPercent = (score / levelConfig.targetScore) * 100;
    }
  } else if (levelConfig.mode === LevelMode.ClearIce) {
    GoalIcon = Snowflake;
    // Calculate total ice from config
    const totalIce = levelConfig.iceConfig?.flat().reduce((a, b) => a + (b > 0 ? 1 : 0), 0) || 1;
    goalText = `${progress.iceCleared} / ${totalIce}`;
    progressPercent = (progress.iceCleared / totalIce) * 100;
  } else if (levelConfig.mode === LevelMode.CollectItems) {
    GoalIcon = Cherry;
    goalText = `${progress.collected} / ${levelConfig.targetCount}`;
    progressPercent = (progress.collected / (levelConfig.targetCount || 1)) * 100;
  }

  return (
    <div className="w-full max-w-[400px] mx-auto mb-4 flex flex-col gap-3 relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg relative z-20">
        <div className="flex flex-col items-center min-w-[60px]">
           <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">Moves</span>
           <span className={clsx("text-3xl font-black leading-none", moves <= 5 ? "text-red-400 animate-pulse" : "text-white")}>
             {moves}
           </span>
        </div>

        <div className="flex gap-2">
           <button onClick={onToggleMute} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95">
            {isMuted ? <VolumeX size={18} className="text-white/80" /> : <Volume2 size={18} className="text-white/80" />}
          </button>
          <button onClick={onRestart} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95">
            <RefreshCw size={18} className="text-white/80" />
          </button>
           <button onClick={onExit} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-xs font-bold text-white transition-colors">
            EXIT
          </button>
        </div>

        <div className="flex flex-col items-end min-w-[60px]">
           <span className="text-xs text-yellow-200 uppercase font-bold tracking-wider">Goal</span>
           <div className="flex items-center gap-2">
             <GoalIcon size={20} className="text-pink-400" />
             <span className="text-xl font-black leading-none text-white whitespace-nowrap">{goalText}</span>
           </div>
        </div>
      </div>

      {/* Progress Bar & Score */}
      <div className="flex items-center gap-2">
         <div className="relative flex-grow h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
         </div>
         <div className="text-xs font-mono text-white/50">{score}</div>
      </div>

      {/* Combo Floating Badge */}
      <div className={clsx(
        "absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full transition-all duration-300 pointer-events-none z-10",
        combo > 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
      )}>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-600 px-4 py-1 rounded-full shadow-lg border border-orange-300 animate-pulse-fast">
             <Flame size={16} className="text-yellow-200 fill-yellow-200" />
             <span className="text-lg font-black italic text-white tracking-widest drop-shadow-md">
               COMBO x{combo}
             </span>
          </div>
          <div className="text-orange-400 font-bold text-xs mt-1 drop-shadow-md">
             +{combo * 10}% Bonus!
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  gameState: GameState;
  score: number;
  aiMessage: string;
  onRestart: () => void;
  onNext: () => void;
}

export const GameOverModal: React.FC<ModalProps> = ({ isOpen, gameState, score, aiMessage, onRestart, onNext }) => {
  if (!isOpen) return null;

  const isWin = gameState === GameState.Won;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-4">
          {isWin ? (
            <div className="p-4 bg-yellow-100 rounded-full text-yellow-500 animate-bounce">
              <Trophy size={48} fill="currentColor" />
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded-full text-gray-500">
              <RefreshCw size={48} />
            </div>
          )}
        </div>
        
        <h2 className={clsx("text-3xl font-black mb-2", isWin ? "text-yellow-500" : "text-gray-700")}>
          {isWin ? "LEVEL CLEARED!" : "FAILED"}
        </h2>
        
        <p className="text-gray-500 font-medium mb-6">Final Score: {score}</p>

        {aiMessage && (
           <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="text-xs text-purple-600 font-bold uppercase mb-1 flex items-center justify-center gap-1">
               <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"/> AI Coach says
             </div>
             <p className="text-slate-700 italic text-sm leading-relaxed">"{aiMessage}"</p>
           </div>
        )}

        <div className="space-y-2">
           {isWin && (
             <button
              onClick={onNext}
              className="w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg bg-gradient-to-r from-green-400 to-emerald-600 hover:scale-105 transition-transform"
            >
              Next Level
            </button>
           )}
          <button
            onClick={onRestart}
            className={clsx(
              "w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95",
              isWin ? "bg-slate-400" : "bg-gradient-to-r from-slate-700 to-slate-800"
            )}
          >
            {isWin ? "Replay Level" : "Try Again"}
          </button>
        </div>
      </div>
    </div>
  );
};
