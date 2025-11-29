import React from 'react';
import { TileData, VisualEffect } from '../types';
import { Tile } from './Tile';
import { EffectsLayer } from './EffectsLayer';

interface BoardProps {
  tiles: TileData[];
  selectedId: number | null;
  onTileClick: (id: number) => void;
  isProcessing: boolean;
  activeEffects: VisualEffect[];
  invalidSwapIds?: number[];
}

export const Board: React.FC<BoardProps> = ({ tiles, selectedId, onTileClick, isProcessing, activeEffects, invalidSwapIds = [] }) => {
  return (
    <div className="relative w-full max-w-[400px] aspect-square bg-white/20 backdrop-blur-sm rounded-2xl p-2 shadow-2xl border border-white/10 mx-auto select-none">
      {/* Grid Background (Checkers pattern for visual guide) */}
      <div className="absolute inset-2 grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden pointer-events-none opacity-20">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className={`${
              Math.floor(i / 8) % 2 === i % 2 ? 'bg-black/20' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Tiles Layer */}
      <div className="relative w-full h-full">
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            isSelected={tile.id === selectedId}
            isInvalid={invalidSwapIds.includes(tile.id)}
            onMouseDown={onTileClick}
            onTouchStart={onTileClick}
          />
        ))}
      </div>

      {/* Effects Overlay */}
      <EffectsLayer effects={activeEffects} />
    </div>
  );
};