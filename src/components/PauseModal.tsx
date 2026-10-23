/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg font-mono">
          II
        </div>

        <div>
          <h2 className="text-xl font-bold font-serif text-amber-100">
            Juego en Pausa
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            El tiempo se ha detenido. Tómate un respiro.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            data-start="true"
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>Reanudar Partida</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors border border-stone-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Partida</span>
          </button>

          <button
            type="button"
            onClick={onHome}
            className="w-full py-2.5 text-xs text-stone-400 hover:text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Salir al Menú Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
