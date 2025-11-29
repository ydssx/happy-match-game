import React from 'react';
import { TileData, SpecialType } from '../types';
import { CANDY_STYLES, SPECIAL_ICONS, ANIMATION_DURATION } from '../constants';
import { clsx } from 'clsx';
import { Lock, Snowflake } from 'lucide-react';

interface TileProps {
  tile: TileData;
  isSelected: boolean;
  isInvalid?: boolean;
  onMouseDown: (id: number) => void;
  onTouchStart: (id: number) => void;
}

export const Tile: React.FC<TileProps> = ({ tile, isSelected, isInvalid, onMouseDown, onTouchStart }) => {
  const style = CANDY_STYLES[tile.color];
  const Icon = style.icon;
  const SpecialIcon = SPECIAL_ICONS[tile.special];
  
  // Use matchEffect to show what this tile is turning into
  const PredictedIcon = tile.matchEffect ? SPECIAL_ICONS[tile.matchEffect] : null;

  // Calculate position percentage
  const top = `${tile.row * 12.5}%`;
  const left = `${tile.col * 12.5}%`;

  return (
    <div
      className={clsx(
        "absolute w-[12.5%] h-[12.5%] p-1 box-border transition-all ease-in-out cursor-pointer",
        isSelected ? "z-30 scale-110" : "z-20",
        tile.isNew && "animate-pop-in",
        tile.isMatched && "animate-shrink-out"
      )}
      style={{
        top,
        left,
        transitionDuration: `${ANIMATION_DURATION}ms`,
      }}
      onMouseDown={() => onMouseDown(tile.id)}
      onTouchStart={() => onTouchStart(tile.id)}
    >
      <div
        className={clsx(
          "w-full h-full rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden transition-all",
          style.bg,
          style.shadow,
          isSelected && "ring-4 ring-white animate-bounce-small shadow-2xl",
          !isSelected && "shadow-md",
          isInvalid && "ring-4 ring-red-500 animate-shake bg-red-500/50"
        )}
      >
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        
        {/* Main Icon */}
        <Icon className={clsx("drop-shadow-md relative z-10", style.color)} size={20} strokeWidth={2.5} />
        
        {/* Special Power-up Overlay (Existing) */}
        {tile.special !== SpecialType.None && (
           <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 animate-pulse">
             <SpecialIcon className="text-white drop-shadow-lg" size={24} strokeWidth={3} />
           </div>
        )}

        {/* Prediction Overlay (New) - Shows when a match will create a special */}
        {tile.matchEffect && PredictedIcon && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/50 animate-pulse border-2 border-white rounded-xl">
             <PredictedIcon className="text-black drop-shadow-lg scale-125" size={28} strokeWidth={3} />
          </div>
        )}

      </div>

      {/* Ice / Lock Overlay (Rendered outside the candy div so it covers it) */}
      {tile.iceCount > 0 && (
        <div className="absolute inset-1 bg-white/40 backdrop-blur-[2px] rounded-xl border-2 border-white/60 z-40 flex items-center justify-center pointer-events-none">
           {tile.iceCount === 1 ? (
             <Snowflake className="text-blue-200 opacity-80" size={20} />
           ) : (
             <div className="bg-slate-800/80 p-1 rounded-full">
                <Lock className="text-yellow-400" size={16} />
             </div>
           )}
        </div>
      )}
    </div>
  );
};