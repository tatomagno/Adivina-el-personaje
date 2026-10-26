/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Sparkles, Award } from 'lucide-react';
import { BiblicalCharacter } from '../data/characters';
import { ScoreBreakdown } from '../game/scoring';

interface RoundResultModalProps {
  character: BiblicalCharacter;
  isCorrect: boolean;
  scoreBreakdown?: ScoreBreakdown;
  cluesUsed: number;
  timeRemaining: number;
  isLastRound: boolean;
  onNextRound: () => void;
  activePlayerName?: string;
  nextPlayerName?: string;
  playerScores?: { name: string; score: number; correctCount?: number; turnsPlayed?: number }[];
  gameMode?: string;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  character,
  isCorrect,
  scoreBreakdown,
  cluesUsed,
  timeRemaining,
  isLastRound,
  onNextRound,
  activePlayerName,
  nextPlayerName,
  playerScores,
  gameMode,
}) => {
  const [autoAdvanceSec, setAutoAdvanceSec] = useState<number | null>(
    gameMode === 'online' ? 12 : null
  );

  useEffect(() => {
    if (gameMode !== 'online') return;
    setAutoAdvanceSec(12);
    const interval = setInterval(() => {
      setAutoAdvanceSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          onNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, character.id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header: Result banner */}
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <XCircle className="w-7 h-7 text-rose-400" />
            </div>
          )}

          <div>
            <span
              className={`text-xs uppercase font-bold tracking-wider ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isCorrect ? '¡Respuesta Correcta!' : '¡Tiempo Agotado / Revelado!'}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-amber-100">
              {character.name}
            </h3>
            <p className="text-xs text-stone-400 italic">
              {character.title} ({character.category})
            </p>
          </div>
        </div>

        {/* Score Breakdown (if correct) */}
        {isCorrect && scoreBreakdown ? (
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Puntaje Obtenido
              </span>
              <span className="text-xl font-mono font-black text-amber-400 tabular-nums">
                +{scoreBreakdown.totalScore} pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>Base (1000 - pistas):</span>
                <span className="font-mono text-amber-200">{scoreBreakdown.baseScore} pts</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Pistas usadas ({cluesUsed}):</span>
                <span className="font-mono text-rose-300">-{scoreBreakdown.cluePenalty} pts</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Tiempo ({timeRemaining}s):</span>
                <span className="font-mono text-emerald-300">+{scoreBreakdown.timeBonus} pts</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Multiplicador racha:</span>
                <span className="font-mono text-orange-300">x{scoreBreakdown.multiplier}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3.5 text-center text-xs text-stone-400">
            No sumaste puntos en esta ronda, ¡pero cada intento te ayuda a aprender más!
          </div>
        )}

        {/* Biblical Trivia & Passage Citation */}
        <div className="bg-stone-950/80 border border-amber-500/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dato Curioso Bíblico</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
            {character.funFact}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium pt-1 border-t border-stone-800/60">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Referencia: {character.biblePassage}</span>
          </div>
        </div>

        {/* Multiplayer Standings Preview */}
        {playerScores && playerScores.length > 1 && (
          <div className="bg-stone-950/60 border border-amber-500/20 rounded-2xl p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-2">
              Marcador Actual:
            </span>
            <div className="flex items-center justify-around gap-2">
              {playerScores.map((p, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xs font-bold text-stone-300">{p.name}</div>
                  <div className="text-sm font-mono font-black text-amber-400">{p.score} pts</div>
                  {p.turnsPlayed !== undefined && (
                    <div className="text-[10px] text-stone-400">
                      {p.correctCount || 0}/{p.turnsPlayed} aciertos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          data-start="true"
          onClick={onNextRound}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-xl active:scale-[0.98] cursor-pointer"
        >
          <span>
            {isLastRound
              ? `Ver Resultados Finales${autoAdvanceSec !== null ? ` (${autoAdvanceSec}s)` : ''}`
              : nextPlayerName
              ? `Siguiente Turno: ${nextPlayerName}`
              : `Siguiente Personaje${autoAdvanceSec !== null ? ` (${autoAdvanceSec}s)` : ''}`}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
