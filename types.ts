export enum CandyColor {
  Red = 'RED',
  Blue = 'BLUE',
  Green = 'GREEN',
  Yellow = 'YELLOW',
  Purple = 'PURPLE',
  Orange = 'ORANGE',
  // Special non-color types
  Rainbow = 'RAINBOW', 
  Ingredient = 'INGREDIENT'
}

export enum SpecialType {
  None = 'NONE',
  Horizontal = 'HORIZONTAL', // Clears Row
  Vertical = 'VERTICAL',     // Clears Col
  Bomb = 'BOMB',             // Clears 3x3
  Rainbow = 'RAINBOW',       // Clears Color
}

export enum LevelMode {
  TargetScore = 'TARGET_SCORE',
  ClearIce = 'CLEAR_ICE',
  CollectItems = 'COLLECT_ITEMS',
}

export interface TileData {
  id: number;
  color: CandyColor;
  row: number;
  col: number;
  isMatched: boolean;
  isNew?: boolean;
  // New features
  special: SpecialType;
  iceCount: number; // 0 = no ice, 1 = ice, 2 = chains/lock
  isIngredient?: boolean; // For collection mode
  matchEffect?: SpecialType; // Visual cue during destruction indicating what is being created
}

export enum GameState {
  Menu = 'MENU',
  Idle = 'IDLE',
  Selected = 'SELECTED',
  Swapping = 'SWAPPING',
  Processing = 'PROCESSING',
  Won = 'WON',
  Lost = 'LOST',
}

export interface LevelConfig {
  id: number;
  name: string;
  mode: LevelMode;
  moves: number;
  targetScore: number;
  description: string;
  // Mode specific goals
  targetColor?: CandyColor; // For TargetScore mode (e.g., Collect Red)
  targetCount?: number;     // Amount of targetColor or Ingredients to collect
  iceConfig?: number[][];   // Map of initial ice
}

export interface VisualEffect {
  id: string;
  type: SpecialType;
  row: number;
  col: number;
  color?: CandyColor;
}