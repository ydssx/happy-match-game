import React from 'react';
import { VisualEffect, SpecialType, CandyColor } from '../types';
import { CANDY_STYLES } from '../constants';
import { clsx } from 'clsx';

interface EffectsLayerProps {
  effects: VisualEffect[];
}

export const EffectsLayer: React.FC<EffectsLayerProps> = ({ effects }) => {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-2xl">
      {effects.map((effect) => {
        const top = `${effect.row * 12.5}%`;
        const left = `${effect.col * 12.5}%`;
        const colorStyle = effect.color ? CANDY_STYLES[effect.color].bg : 'bg-white';

        switch (effect.type) {
          case SpecialType.Horizontal:
            return (
              <div
                key={effect.id}
                className={clsx("absolute h-[12.5%] w-full flex items-center justify-center animate-beam-x", colorStyle)}
                style={{ top, left: 0 }}
              >
                 <div className="w-full h-1/2 bg-white/80 blur-md" />
              </div>
            );
          
          case SpecialType.Vertical:
            return (
              <div
                key={effect.id}
                className={clsx("absolute w-[12.5%] h-full flex justify-center items-center animate-beam-y", colorStyle)}
                style={{ top: 0, left }}
              >
                <div className="h-full w-1/2 bg-white/80 blur-md" />
              </div>
            );

          case SpecialType.Bomb:
            return (
              <div
                key={effect.id}
                className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center"
                style={{ top, left }}
              >
                <div className="w-[300%] h-[300%] rounded-full bg-gradient-to-r from-orange-400 to-red-600 opacity-80 blur-lg animate-shockwave" />
              </div>
            );

          case SpecialType.Rainbow:
            return (
              <div
                key={effect.id}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full h-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 opacity-50 mix-blend-overlay animate-pulse" />
                <div className="absolute w-[50%] h-[50%] bg-white rounded-full blur-3xl animate-rainbow" />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};