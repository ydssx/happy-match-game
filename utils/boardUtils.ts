import { BOARD_SIZE, CANDY_COLORS } from '../constants';
import { CandyColor, TileData, SpecialType, LevelConfig } from '../types';

let nextId = 1;

export const generateRandomColor = (): CandyColor => {
  const index = Math.floor(Math.random() * CANDY_COLORS.length);
  return CANDY_COLORS[index];
};

// Create board based on Level Configuration
export const createInitialBoard = (level: LevelConfig): TileData[] => {
  const tiles: TileData[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let iceCount = 0;
      if (level.iceConfig && level.iceConfig[row] && level.iceConfig[row][col]) {
        iceCount = level.iceConfig[row][col];
      }

      tiles.push({
        id: nextId++,
        color: generateRandomColor(),
        row,
        col,
        isMatched: false,
        special: SpecialType.None,
        iceCount,
        isIngredient: false,
      });
    }
  }
  
  return tiles;
};

export const getTileAt = (tiles: TileData[], row: number, col: number): TileData | undefined => {
  return tiles.find((t) => t.row === row && t.col === col);
};

// Advanced Matching: Returns groupings to determine special candy creation
interface MatchResult {
  matchedIds: number[];
  specialCreated?: {
    type: SpecialType;
    index: number; // The tile ID that becomes the special candy (usually the moved one)
  };
}

export const findAdvancedMatches = (tiles: TileData[], lastMovedId: number | null): MatchResult => {
  const grid: (TileData | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  tiles.forEach(t => {
    if (t.row >= 0 && t.row < BOARD_SIZE && t.col >= 0 && t.col < BOARD_SIZE) {
      grid[t.row][t.col] = t;
    }
  });

  const matchedSet = new Set<number>();
  const horizontalMatches: TileData[][] = [];
  const verticalMatches: TileData[][] = [];

  // Helper to find runs
  const findRuns = (isRow: boolean) => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      let currentRun: TileData[] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        const tile = isRow ? grid[i][j] : grid[j][i];
        
        // Ingredients don't match normally
        if (tile && !tile.isIngredient && tile.color !== CandyColor.Rainbow && (!currentRun.length || currentRun[0].color === tile.color)) {
          currentRun.push(tile);
        } else {
          if (currentRun.length >= 3) {
             if(isRow) horizontalMatches.push([...currentRun]);
             else verticalMatches.push([...currentRun]);
             currentRun.forEach(t => matchedSet.add(t.id));
          }
          if (tile && !tile.isIngredient && tile.color !== CandyColor.Rainbow) {
            currentRun = [tile];
          } else {
            currentRun = [];
          }
        }
      }
      if (currentRun.length >= 3) {
        if(isRow) horizontalMatches.push([...currentRun]);
        else verticalMatches.push([...currentRun]);
        currentRun.forEach(t => matchedSet.add(t.id));
      }
    }
  };

  findRuns(true); // Horizontal
  findRuns(false); // Vertical

  const result: MatchResult = { matchedIds: Array.from(matchedSet) };

  // Prioritize creating specials based on the move
  
  // Check for Match-5 (Rainbow)
  const allMatches = [...horizontalMatches, ...verticalMatches];
  const match5 = allMatches.find(run => run.length >= 5);
  
  if (match5) {
    // Determine where to spawn. If lastMovedId is in the match, use it. Else middle.
    let spawnTile = match5.find(t => t.id === lastMovedId) || match5[2];
    result.specialCreated = { type: SpecialType.Rainbow, index: spawnTile.id };
    return result; // Return early, Rainbow takes precedence
  }

  // Check for L/T shapes (Bomb)
  let bombCandidate: TileData | null = null;
  
  for (const hMatch of horizontalMatches) {
    for (const vMatch of verticalMatches) {
       // Find intersection
       const intersection = hMatch.find(h => vMatch.some(v => v.id === h.id));
       if (intersection) {
         bombCandidate = intersection;
         break;
       }
    }
    if (bombCandidate) break;
  }

  if (bombCandidate) {
    result.specialCreated = { type: SpecialType.Bomb, index: bombCandidate.id };
    return result;
  }

  // Check for Match-4 (Line)
  const match4 = allMatches.find(run => run.length === 4);
  if (match4) {
    let spawnTile = match4.find(t => t.id === lastMovedId) || match4[1];
    // Determine orientation based on run direction
    const isHorizontal = horizontalMatches.includes(match4);
    result.specialCreated = { 
      type: isHorizontal ? SpecialType.Vertical : SpecialType.Horizontal, 
      index: spawnTile.id 
    };
    return result;
  }

  return result;
};

// Explode logic for Special Candies
export const explodeTile = (
  startId: number, 
  tiles: TileData[], 
  affectedIds: Set<number>
) => {
  const queue = [startId];

  while(queue.length > 0) {
    const currentId = queue.shift()!;
    if (affectedIds.has(currentId)) continue;
    affectedIds.add(currentId);

    const tile = tiles.find(t => t.id === currentId);
    if (!tile) continue;

    // If it's special, add its range to queue
    if (tile.special === SpecialType.Horizontal) {
      tiles.filter(t => t.row === tile.row).forEach(t => queue.push(t.id));
    } else if (tile.special === SpecialType.Vertical) {
      tiles.filter(t => t.col === tile.col).forEach(t => queue.push(t.id));
    } else if (tile.special === SpecialType.Bomb) {
      tiles.filter(t => Math.abs(t.row - tile.row) <= 1 && Math.abs(t.col - tile.col) <= 1).forEach(t => queue.push(t.id));
    } else if (tile.special === SpecialType.Rainbow) {
       // Rainbow usually triggers on swap, but if exploded by another bomb, pick a random color
       const randomColor = generateRandomColor();
       tiles.filter(t => t.color === randomColor).forEach(t => queue.push(t.id));
    }
  }
};

export const applyGravity = (
  currentTiles: TileData[], 
  removedIds: number[], 
  level: LevelConfig,
  specialCreation?: { type: SpecialType, index: number }
): { updatedTiles: TileData[], scoreGained: number, iceCleared: number, ingredientsCollected: number } => {
  
  let scoreGained = 0;
  let iceCleared = 0;
  let ingredientsCollected = 0;

  // 1. Calculate Ice Cleared (match on top)
  currentTiles.forEach(t => {
    if (removedIds.includes(t.id) && t.iceCount > 0) {
      iceCleared++;
    }
  });

  // 2. Filter surviving tiles
  // IMPORTANT: Reset isNew and isMatched for surviving tiles so they don't re-animate
  let survivingTiles = currentTiles.filter(t => {
    if (specialCreation && t.id === specialCreation.index) return true; // Keep this one
    return !removedIds.includes(t.id);
  });

  // 3. Transform special creation
  if (specialCreation) {
    survivingTiles = survivingTiles.map(t => {
      if (t.id === specialCreation.index) {
        return { ...t, special: specialCreation.type, isMatched: false, isNew: false };
      }
      return t;
    });
  }

  // 4. Collect Ingredients at bottom
  const ingredientsAtBottom = survivingTiles.filter(t => t.isIngredient && t.row === BOARD_SIZE - 1);
  ingredientsAtBottom.forEach(t => {
    ingredientsCollected++;
    scoreGained += 1000; 
  });
  survivingTiles = survivingTiles.filter(t => !(t.isIngredient && t.row === BOARD_SIZE - 1));

  // 5. Gravity
  survivingTiles.sort((a, b) => b.row - a.row);
  const newTiles: TileData[] = [];
  
  for (let col = 0; col < BOARD_SIZE; col++) {
    const colTiles = survivingTiles.filter(t => t.col === col);
    colTiles.sort((a, b) => b.row - a.row);

    let placeRow = BOARD_SIZE - 1;
    for (const tile of colTiles) {
      // Surviving tiles move down. Reset flags.
      newTiles.push({ ...tile, row: placeRow, isNew: false, isMatched: false });
      placeRow--;
    }

    // Fill top
    while (placeRow >= 0) {
      let isIngredient = false;
      if (level.mode === 'COLLECT_ITEMS' && Math.random() < 0.05) {
         isIngredient = true;
      }

      newTiles.push({
        id: nextId++,
        color: isIngredient ? CandyColor.Ingredient : generateRandomColor(),
        row: placeRow,
        col: col,
        isMatched: false,
        isNew: true, // Only newly spawned tiles get this flag
        special: SpecialType.None,
        iceCount: 0, 
        isIngredient
      });
      placeRow--;
    }
  }
  
  scoreGained += removedIds.length * 10;
  
  return { updatedTiles: newTiles, scoreGained, iceCleared, ingredientsCollected };
};