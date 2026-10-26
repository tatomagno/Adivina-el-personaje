/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Lock, KeyRound, AlertTriangle } from 'lucide-react';

interface ClueListProps {
  clues: [string, string, string, string, string];
  cluesUsed: number;
  onRevealClue: () => void;
  disabled: boolean;
  revealed: boolean;
}

const CLUE_LABELS = [
  'Pista 1: Enigma Inicial',
  'Pista 2: Objeto o Símbolo Clave',
  'Pista 3: Cita Bíblica Relevante',
  'Pista 4: Suceso o Hazaña Cumbre',
  'Pista 5: Revelación Definitiva',
];

export const ClueList: React.FC<ClueListProps> = ({
  clues,
  cluesUsed,
  onRevealClue,
  disabled,
  revealed,
}) => {
  const safeClues = Array.isArray(clues) ? clues : [];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{`Pistas Progresivas (${revealed ? 5 : cluesUsed}/5)`}</span>
        </div>
        {!revealed && cluesUsed < 5 && (
          <span className="text-[11px] text-amber-400/80 font-medium">
            Pedir pista reduce recompensa (-160 pts)
          </span>
        )}
      </div>

      <div className="space-y-2">
        {safeClues.map((clueText, index) => {
          const isUnlocked = revealed || index < cluesUsed;
          const isCurrentUnlockable = !revealed && index === cluesUsed;

          return (
            <div
              key={index}
              className={`relative rounded-xl border transition-all duration-300 ${
                isUnlocked
                  ? 'bg-amber-950/40 border-amber-500/40 shadow-sm text-stone-100 p-2.5 sm:p-3'
                  : isCurrentUnlockable
                  ? 'bg-stone-900/70 border-amber-500/30 text-stone-300 p-2 sm:p-2.5'
                  : 'bg-stone-950/40 border-stone-800/40 text-stone-600 py-1.5 px-2.5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80">
                  {CLUE_LABELS[index] || `Pista ${index + 1}`}
                </span>
                {isUnlocked ? (
                  <span
                    key="unlocked"
                    className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-medium"
                  >
                    <span>Revelada</span>
                  </span>
                ) : (
                  <span
                    key="locked"
                    className="flex items-center gap-1 text-[9px] text-stone-500"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Bloqueada</span>
                  </span>
                )}
              </div>

              {isUnlocked ? (
                <p
                  key="clue-content"
                  className="mt-1 text-xs sm:text-sm font-sans leading-relaxed text-stone-200 animate-in fade-in duration-300"
                >
                  {clueText}
                </p>
              ) : isCurrentUnlockable ? (
                <div
                  key="clue-action"
                  className="mt-1.5 flex items-center justify-between gap-2"
                >
                  <p className="text-[11px] text-stone-400 italic line-clamp-1">
                    Desbloquea pista (-160 pts)
                  </p>
                  <button
                    type="button"
                    onClick={onRevealClue}
                    disabled={disabled}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-[11px] transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>{`Revelar Pista ${index + 1}`}</span>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
