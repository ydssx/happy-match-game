
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './components/Board';
import { GameStats, GameOverModal, LevelSelector } from './components/GameUI';
import { 
  createInitialBoard, 
  findAdvancedMatches, 
  applyGravity, 
  explodeTile
} from './utils/boardUtils';
import { TileData, GameState, LevelConfig, LevelMode, CandyColor, SpecialType, VisualEffect } from './types';
import { LEVELS, ANIMATION_DURATION, BOARD_SIZE } from './constants';
import { getGameEncouragement } from './services/geminiService';
import { soundManager } from './utils/soundManager';

const App: React.FC = () => {
  // Game State
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.Menu);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [invalidSwapIds, setInvalidSwapIds] = useState<number[]>([]);
  
  // Progress Tracking
  const [itemsCollected, setItemsCollected] = useState(0);
  const [iceCleared, setIceCleared] = useState(0);
  
  // Combo System
  const [combo, setCombo] = useState(1);

  // Effects
  const [activeEffects, setActiveEffects] = useState<VisualEffect[]>([]);

  // AI Message State
  const [aiMessage, setAiMessage] = useState<string>("");

  // Refs
  const stateRef = useRef({ tiles, gameState, score, moves, currentLevel, itemsCollected, iceCleared });
  useEffect(() => {
    stateRef.current = { tiles, gameState, score, moves, currentLevel, itemsCollected, iceCleared };
  }, [tiles, gameState, score, moves, currentLevel, itemsCollected, iceCleared]);

  const toggleMute = useCallback(() => {
    const newState = !isMuted;
    setIsMuted(newState);
    soundManager.setMuted(newState);
  }, [isMuted]);

  const startLevel = useCallback((level: LevelConfig) => {
    const newTiles = createInitialBoard(level);
    setTiles(newTiles);
    setScore(0);
    setMoves(level.moves);
    setItemsCollected(0);
    setIceCleared(0);
    setCurrentLevel(level);
    setGameState(GameState.Idle);
    setAiMessage("");
    setSelectedId(null);
    setActiveEffects([]);
    setInvalidSwapIds([]);
    setCombo(1);
    soundManager.playClick();
  }, []);

  // --- Logic ---

  const checkWinCondition = useCallback(() => {
    const { currentLevel, score, gameState, moves, itemsCollected, iceCleared } = stateRef.current;
    if (!currentLevel || gameState === GameState.Processing) return;

    let hasWon = false;

    if (currentLevel.mode === LevelMode.TargetScore) {
       if (currentLevel.targetColor) {
         if (itemsCollected >= (currentLevel.targetCount || 0)) hasWon = true;
       } else {
         if (score >= currentLevel.targetScore) hasWon = true;
       }
    } else if (currentLevel.mode === LevelMode.ClearIce) {
       // Check total ice initially needed
       const totalIce = currentLevel.iceConfig?.flat().reduce((a, b) => a + (b > 0 ? 1 : 0), 0) || 0;
       if (iceCleared >= totalIce) hasWon = true;
    } else if (currentLevel.mode === LevelMode.CollectItems) {
       if (itemsCollected >= (currentLevel.targetCount || 0)) hasWon = true;
    }

    if (hasWon && gameState !== GameState.Won) {
      setGameState(GameState.Won);
      soundManager.playWin();
      getGameEncouragement('WON', score, moves).then(setAiMessage);
    } else if (moves <= 0 && gameState !== GameState.Lost && gameState !== GameState.Won) {
      setGameState(GameState.Lost);
      soundManager.playLoss();
      getGameEncouragement('LOST', score, 0).then(setAiMessage);
    }
  }, []);

  // Recusive match processing with combo multiplier support
  const processMatches = useCallback(async (currentTiles: TileData[], lastMovedId: number | null, isSwap: boolean, currentCombo: number = 1) => {
    setGameState(GameState.Processing);
    const level = stateRef.current.currentLevel;
    if (!level) return true;

    // 1. Check for matches
    const { matchedIds, specialCreated } = findAdvancedMatches(currentTiles, lastMovedId);

    if (matchedIds.length === 0) {
      if (isSwap) return false; 
      
      // End of chain reaction
      setGameState(GameState.Idle);
      // We don't reset combo here if we want to show the final combo count for a moment
      // But typically for the next move, it resets on interaction.
      checkWinCondition();
      return true; 
    }

    // Update UI for combo
    setCombo(currentCombo);

    // Play Match Sound (pitch up slightly with combo)
    // Note: We'd ideally pass currentCombo to playMatch for pitch shift, relying on existing logic for now
    soundManager.playMatch(matchedIds.length);
    if (specialCreated) soundManager.playSpecialCreated();

    // 2. Identify Tiles to Remove (Trigger Explosions)
    const idsToRemove = new Set<number>();
    matchedIds.forEach(id => {
       if (specialCreated && id === specialCreated.index) return;
       idsToRemove.add(id);
    });

    // 3. Explode specials
    let previousSize = 0;
    const specialEffects: VisualEffect[] = [];
    
    // We iterate to find explosions. If the set grows, it means a chain reaction.
    while (idsToRemove.size > previousSize) {
      previousSize = idsToRemove.size;
      const snapshotIds = Array.from(idsToRemove);
      
      snapshotIds.forEach(id => {
         const tile = currentTiles.find(t => t.id === id);
         // If a tile in the kill list is special, it triggers an effect
         if (tile && tile.special !== SpecialType.None) {
            if (!specialEffects.some(e => e.id === `fx-${tile.id}`)) {
              specialEffects.push({
                id: `fx-${tile.id}`,
                type: tile.special,
                row: tile.row,
                col: tile.col,
                color: tile.color
              });
            }
         }
         explodeTile(id, currentTiles, idsToRemove);
      });
    }

    if (specialEffects.length > 0) {
      soundManager.playSpecialExplosion();
      setActiveEffects(prev => [...prev, ...specialEffects]);
      // Clear effects slightly faster to match new timings
      setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => !specialEffects.includes(e)));
      }, 500); 
    }

    // 4. ANIMATION PHASE: Mark matched tiles
    const animatedTiles = currentTiles.map(t => {
      if (matchedIds.includes(t.id) && specialCreated && specialCreated.type !== SpecialType.None) {
         return { ...t, isMatched: true, matchEffect: specialCreated.type };
      }
      if (idsToRemove.has(t.id)) {
        return { ...t, isMatched: true };
      }
      return t;
    });
    setTiles(animatedTiles);

    // Wait for "Shrink Out" animation (Reduced from 300 to 250ms)
    await new Promise(r => setTimeout(r, 250));

    // 5. Update Stats & Apply Gravity
    let newItemsCollected = 0;
    if (level.mode === LevelMode.TargetScore && level.targetColor) {
      currentTiles.forEach(t => {
        if (idsToRemove.has(t.id) && t.color === level.targetColor) {
          newItemsCollected++;
        }
      });
    }

    const { updatedTiles, scoreGained, iceCleared: newIce, ingredientsCollected } = applyGravity(
      currentTiles, 
      Array.from(idsToRemove), 
      level, 
      specialCreated
    );
    
    // Apply Combo Multiplier
    const multipliedScore = scoreGained * currentCombo;

    setScore(prev => prev + multipliedScore);
    setIceCleared(prev => prev + newIce);
    setItemsCollected(prev => prev + newItemsCollected + ingredientsCollected);
    setTiles(updatedTiles);

    // 6. Wait for fall animation (Reduced duration)
    await new Promise(r => setTimeout(r, ANIMATION_DURATION + 20));

    // 7. Recursive Check (Increment Combo)
    await processMatches(updatedTiles, null, false, currentCombo + 1);
    
    return true; 
  }, [checkWinCondition]);


  const handleTileClick = useCallback(async (id: number) => {
    const { gameState, tiles: currentTiles, moves: currentMoves } = stateRef.current;
    if (gameState !== GameState.Idle && gameState !== GameState.Selected) return;
    if (currentMoves <= 0) return;

    if (selectedId === null) {
      soundManager.playClick();
      setSelectedId(id);
      setGameState(GameState.Selected);
      return;
    }

    if (selectedId === id) {
      soundManager.playClick(); 
      setSelectedId(null);
      setGameState(GameState.Idle);
      return;
    }

    const tileA = currentTiles.find(t => t.id === selectedId);
    const tileB = currentTiles.find(t => t.id === id);

    if (!tileA || !tileB) return;

    const isAdjacent = 
      (Math.abs(tileA.row - tileB.row) === 1 && tileA.col === tileB.col) ||
      (Math.abs(tileA.col - tileB.col) === 1 && tileA.row === tileB.row);

    if (!isAdjacent) {
      soundManager.playClick();
      setSelectedId(id);
      return;
    }

    // SWAP ACTION - Reset Combo
    setCombo(1); 
    setSelectedId(null);
    setGameState(GameState.Swapping);
    soundManager.playSwap();

    const swappedTiles = currentTiles.map(t => {
      if (t.id === tileA.id) return { ...t, row: tileB.row, col: tileB.col };
      if (t.id === tileB.id) return { ...t, row: tileA.row, col: tileA.col };
      return t;
    });
    setTiles(swappedTiles);
    
    // Wait for swap animation
    await new Promise(r => setTimeout(r, ANIMATION_DURATION));

    // Special Case: Swapping a Rainbow Candy
    const rainbowTile = [tileA, tileB].find(t => t.special === SpecialType.Rainbow);
    const otherTile = [tileA, tileB].find(t => t.special !== SpecialType.Rainbow);

    let hasAction = false;

    if (rainbowTile && otherTile) {
      soundManager.playSpecialExplosion();
      setGameState(GameState.Processing);
      
      // Visual Effect for Rainbow
      setActiveEffects(prev => [...prev, {
        id: `rb-${Date.now()}`,
        type: SpecialType.Rainbow,
        row: rainbowTile.row,
        col: rainbowTile.col,
        color: otherTile.color
      }]);
      // Faster rainbow effect cleanup
      setTimeout(() => setActiveEffects([]), 600);

      const targetColor = otherTile.color;
      const idsToRemove = new Set<number>();
      idsToRemove.add(rainbowTile.id);
      
      swappedTiles.forEach(t => {
        if (t.color === targetColor) idsToRemove.add(t.id);
      });

      // Animate destruction
      const animatedTiles = swappedTiles.map(t => idsToRemove.has(t.id) ? { ...t, isMatched: true } : t);
      setTiles(animatedTiles);
      
      // Faster wait for destruction
      await new Promise(r => setTimeout(r, 300));

      const { updatedTiles, scoreGained, iceCleared: newIce, ingredientsCollected } = applyGravity(swappedTiles, Array.from(idsToRemove), stateRef.current.currentLevel!);
      
      setScore(prev => prev + scoreGained); // Rainbow action usually doesn't have combo multiplier unless it causes cascade
      setIceCleared(prev => prev + newIce);
      setItemsCollected(prev => prev + ingredientsCollected);
      setTiles(updatedTiles);
      setMoves(prev => prev - 1);
      
      await new Promise(r => setTimeout(r, ANIMATION_DURATION + 20));
      // Start processing cascading matches, starting with Combo = 1 (or 2 if we consider rainbow the first step)
      await processMatches(updatedTiles, null, false, 2); 
      hasAction = true;
    } else {
      // Standard Move
      hasAction = await processMatches(swappedTiles, tileB.id, true, 1);
      if (hasAction) {
        setMoves(prev => prev - 1);
      } else {
        // INVALID SWAP
        soundManager.playInvalid();
        setInvalidSwapIds([tileA.id, tileB.id]);
        
        setTiles(currentTiles); // Snap back
        
        // Faster reset after shake
        await new Promise(r => setTimeout(r, 350));
        setInvalidSwapIds([]);
        setGameState(GameState.Idle);
      }
    }

  }, [selectedId, processMatches]);

  useEffect(() => {
     checkWinCondition();
  }, [score, itemsCollected, iceCleared, checkWinCondition]);


  if (gameState === GameState.Menu || !currentLevel) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[100px]" />
         <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8 drop-shadow-sm tracking-tight text-center">
          HAPPY MATCH
          <span className="block text-sm text-white/50 font-normal mt-2 tracking-widest">SELECT LEVEL</span>
        </h1>
        <LevelSelector onSelectLevel={startLevel} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6 drop-shadow-sm tracking-tight text-center">
          HAPPY MATCH
          <span className="block text-sm text-white/50 font-normal mt-1 tracking-widest uppercase">{currentLevel.name}</span>
        </h1>

        <GameStats 
          score={score} 
          moves={moves} 
          levelConfig={currentLevel}
          progress={{ collected: itemsCollected, iceCleared }}
          combo={combo}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onRestart={() => startLevel(currentLevel)}
          onExit={() => { setGameState(GameState.Menu); setCurrentLevel(null); }}
        />

        <Board 
          tiles={tiles}
          selectedId={selectedId}
          onTileClick={handleTileClick}
          isProcessing={gameState === GameState.Processing}
          activeEffects={activeEffects}
          invalidSwapIds={invalidSwapIds}
        />

        <div className="mt-6 text-center text-white/40 text-sm font-medium animate-pulse">
           {currentLevel.description}
        </div>
      </div>

      <GameOverModal 
        isOpen={gameState === GameState.Won || gameState === GameState.Lost}
        gameState={gameState}
        score={score}
        aiMessage={aiMessage}
        onRestart={() => startLevel(currentLevel)}
        onNext={() => {
           const nextId = currentLevel.id + 1;
           const nextLevel = LEVELS.find(l => l.id === nextId);
           if (nextLevel) startLevel(nextLevel);
           else startLevel(LEVELS[0]); 
        }}
      />
    </div>
  );
};

export default App;