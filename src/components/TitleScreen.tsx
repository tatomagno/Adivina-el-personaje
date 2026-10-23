/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Users, Trophy, Sparkles, BookOpen, Volume2, VolumeX, Shield, Award } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES } from '../data/characters';

interface TitleScreenProps {
  difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
  onSelectDifficulty: (d: 'facil' | 'medio' | 'dificil' | 'todas') => void;
  category: string;
  onSelectCategory: (c: string) => void;
  onStartSolo: () => void;
  onOpenMultiplayer: () => void;
  onOpenLeaderboard: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  category,
  onSelectCategory,
  onStartSolo,
  onOpenMultiplayer,
  onOpenLeaderboard,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="relative w-full min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between items-center px-4 py-6 sm:py-8 overflow-hidden select-none">
      {/* Ambient Celestial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Floating starry particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Bar: Mute & Quick Stats */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-[11px] font-semibold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Edición Bíblica Interactiva
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Center Hero Lockup: Custom Inline SVG Emblem */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center my-auto z-10 py-6">
        {/* Custom Ornate Emblem */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 drop-shadow-[0_0_35px_rgba(245,158,11,0.45)]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Outer golden halo ring */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="50" cy="50" r="38" fill="#1C1917" stroke="#FBBF24" strokeWidth="2.5" />
            {/* Crown of Glory and Cross */}
            <path d="M36,42 L42,32 L50,38 L58,32 L64,42 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="50" cy="38" r="2.5" fill="#EF4444" />
            {/* Open Holy Scripture Book */}
            <path d="M30,55 Q42,50 50,55 Q58,50 70,55 L70,72 Q58,68 50,72 Q42,68 30,72 Z" fill="#FEF3C7" stroke="#78350F" strokeWidth="2" />
            <line x1="50" y1="55" x2="50" y2="72" stroke="#78350F" strokeWidth="2" />
            <line x1="35" y1="60" x2="46" y2="60" stroke="#B45309" strokeWidth="1.5" />
            <line x1="35" y1="65" x2="46" y2="65" stroke="#B45309" strokeWidth="1.5" />
            <line x1="54" y1="60" x2="65" y2="60" stroke="#B45309" strokeWidth="1.5" />
            <line x1="54" y1="65" x2="65" y2="65" stroke="#B45309" strokeWidth="1.5" />
            {/* Radiance sparkles */}
            <circle cx="50" cy="18" r="2" fill="#FDE68A" />
            <circle cx="20" cy="50" r="1.5" fill="#FDE68A" />
            <circle cx="80" cy="50" r="1.5" fill="#FDE68A" />
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-md">
          Adivina el Personaje Bíblico
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-300 max-w-lg leading-relaxed font-sans">
          Observa la ilustración, descubre las pistas progresivas y adivina antes de que termine el tiempo. ¡Gana más puntos resolviendo con menos pistas!
        </p>

        {/* Difficulty Selector Buttons */}
        <div className="w-full max-w-xl mt-6">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
            Nivel de Dificultad por Edad:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => onSelectDifficulty(diff.id as any)}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  difficulty === diff.id
                    ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/40 border-amber-400 text-amber-100 shadow-lg scale-[1.02]'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">{diff.label.split('/')[0]}</div>
                <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">{diff.minAge}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selector Scroll */}
        <div className="w-full max-w-xl mt-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
            Categoría Temática:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar justify-start sm:justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-amber-500 text-stone-950 font-bold shadow'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-md mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onStartSolo}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black rounded-2xl flex items-center justify-center gap-2.5 text-base sm:text-lg transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-stone-950" />
            <span>Jugar Ahora (Solitario)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenMultiplayer}
              className="py-3 px-3 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Multijugador / Salas</span>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="py-3 px-3 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Tabla Global</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <footer className="w-full max-w-4xl text-center py-2 z-10 border-t border-stone-900">
        <p className="text-[11px] text-stone-500 tracking-wider font-mono">
          Espacio / Enter Iniciar · P Pausa · M Sonido · 1 a 5 Revelar Pistas
        </p>
      </footer>
    </div>
  );
};
