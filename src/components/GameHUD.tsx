/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Pause, Flame, Clock, Award, Users, Shield } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameHUDProps {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  totalTime: number;
  potentialPoints: number;
  streak: number;
  activePlayerName?: string;
  gameMode: 'solo' | 'duo' | 'equipos' | 'online';
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  difficulty: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentRound,
  totalRounds,
  timeRemaining,
  totalTime,
  potentialPoints,
  streak,
  activePlayerName,
  gameMode,
  isMuted,
  onToggleMute,
  onPause,
  difficulty,
}) => {
  const timePercentage = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
  const isUrgent = timeRemaining <= 10;

  return (
    <header className="w-full bg-stone-950/80 backdrop-blur-md border-b border-amber-500/20 px-3 sm:px-6 py-2.5 flex flex-col gap-2 z-10">
      {/* Top row: Mode, Turn info, Utility buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Mode badge & Round count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            {gameMode === 'equipos' ? (
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            ) : gameMode === 'duo' ? (
              <Users className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Award className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="capitalize">{gameMode}</span>
          </div>

          <div className="text-xs text-stone-300 font-medium">
            Ronda <span className="font-bold text-amber-400">{currentRound}</span> / {totalRounds}
          </div>
        </div>

        {/* Center: Active Player/Team when applicable */}
        {activePlayerName && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-stone-900 border border-amber-500/40 text-amber-200 text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Turno: {activePlayerName}</span>
          </div>
        )}

        {/* Right: Potential Points & Utility (Mute, Pause) */}
        <div className="flex items-center gap-2">
          {/* Potential Score */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-amber-500/30 text-stone-200 text-xs">
            <span className="text-stone-400">Premio:</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">
              +{potentialPoints} pts
            </span>
          </div>

          {/* Streak Badge */}
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-950/80 border border-orange-500/40 text-orange-400 text-xs font-bold animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>x{(1 + streak * 0.1).toFixed(1)}</span>
            </div>
          )}

          {/* Mute button */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause button */}
          <button
            type="button"
            onClick={onPause}
            aria-label="Pausar juego"
            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Active Player banner */}
      {activePlayerName && (
        <div className="flex sm:hidden items-center justify-center gap-1.5 py-0.5 text-xs font-bold text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Turno: {activePlayerName}</span>
        </div>
      )}

      {/* Bottom row: Time Progress bar */}
      <div className="w-full flex items-center gap-2">
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
        <div className="flex-1 h-2 rounded-full bg-stone-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ease-linear rounded-full ${
              isUrgent ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
            }`}
            style={{ width: `${timePercentage}%` }}
          />
        </div>
        <span
          className={`text-xs font-mono font-bold tabular-nums min-w-[28px] text-right ${
            isUrgent ? 'text-rose-400 animate-pulse font-black text-sm' : 'text-stone-300'
          }`}
        >
          {timeRemaining}s
        </span>
      </div>
    </header>
  );
};
