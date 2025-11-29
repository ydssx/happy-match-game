import { CandyColor, LevelConfig, LevelMode, SpecialType } from './types';
import { Heart, Zap, Apple, Star, Hexagon, Circle, Disc, Cherry, Bomb, MoveHorizontal, MoveVertical, Snowflake } from 'lucide-react';

export const BOARD_SIZE = 8;
export const ANIMATION_DURATION = 250; // ms (Reduced for fluidity)

// --- Level Definitions ---
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Sweet Start",
    mode: LevelMode.TargetScore,
    moves: 15,
    targetScore: 2000,
    description: "Collect 15 Red Candies",
    targetColor: CandyColor.Red,
    targetCount: 15
  },
  {
    id: 2,
    name: "Frosty Peaks",
    mode: LevelMode.ClearIce,
    moves: 20,
    targetScore: 3000,
    description: "Break all the Ice!",
    // Simple checkerboard ice pattern for demo
    iceConfig: [
      [0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0],
      [0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
    ]
  },
  {
    id: 3,
    name: "Cherry Drop",
    mode: LevelMode.CollectItems,
    moves: 25,
    targetScore: 4000,
    description: "Bring 2 Cherries to the bottom!",
    targetCount: 2
  }
];

export const CANDY_COLORS: CandyColor[] = [
  CandyColor.Red,
  CandyColor.Blue,
  CandyColor.Green,
  CandyColor.Yellow,
  CandyColor.Purple,
  CandyColor.Orange,
];

// Visual Styles
export const CANDY_STYLES: Record<string, { bg: string; icon: any; shadow: string, color: string }> = {
  [CandyColor.Red]: { bg: 'bg-red-500', icon: Heart, shadow: 'shadow-red-700', color: 'text-red-500' },
  [CandyColor.Blue]: { bg: 'bg-blue-500', icon: Zap, shadow: 'shadow-blue-700', color: 'text-blue-500' },
  [CandyColor.Green]: { bg: 'bg-green-500', icon: Apple, shadow: 'shadow-green-700', color: 'text-green-500' },
  [CandyColor.Yellow]: { bg: 'bg-yellow-400', icon: Star, shadow: 'shadow-yellow-600', color: 'text-yellow-500' },
  [CandyColor.Purple]: { bg: 'bg-purple-500', icon: Hexagon, shadow: 'shadow-purple-700', color: 'text-purple-500' },
  [CandyColor.Orange]: { bg: 'bg-orange-500', icon: Circle, shadow: 'shadow-orange-700', color: 'text-orange-500' },
  [CandyColor.Rainbow]: { bg: 'bg-gradient-to-br from-red-400 via-yellow-400 to-blue-500', icon: Disc, shadow: 'shadow-slate-700', color: 'text-white' },
  [CandyColor.Ingredient]: { bg: 'bg-rose-200', icon: Cherry, shadow: 'shadow-rose-400', color: 'text-rose-600' },
};

export const SPECIAL_ICONS: Record<SpecialType, any> = {
  [SpecialType.None]: null,
  [SpecialType.Horizontal]: MoveHorizontal,
  [SpecialType.Vertical]: MoveVertical,
  [SpecialType.Bomb]: Bomb,
  [SpecialType.Rainbow]: Disc,
};