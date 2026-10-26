/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, RotateCcw, Home, Share2, Check, Send, Award, Users, BookOpen } from 'lucide-react';
import { BiblicalCharacter } from '../data/characters';

interface GameOverModalProps {
  totalScore: number;
  correctCount: number;
  totalRounds: number;
  roundsPerPlayer?: number;
  difficulty: string;
  gameMode: string;
  charactersPlayed: { character: BiblicalCharacter; guessed: boolean; score: number; playerName?: string }[];
  onRestart: () => void;
  onHome: () => void;
  roomCode?: string;
  playerScores?: { name: string; score: number; correctCount?: number; turnsPlayed?: number }[];
  onSubmitLeaderboard: (name: string, groupName?: string) => Promise<void>;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  totalScore,
  correctCount,
  totalRounds,
  roundsPerPlayer,
  difficulty,
  gameMode,
  charactersPlayed,
  onRestart,
  onHome,
  roomCode,
  playerScores,
  onSubmitLeaderboard,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareUrl = roomCode
      ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      : `${window.location.origin}${window.location.pathname}`;
    const text = `¡Acabo de obtener ${totalScore} puntos acertando ${correctCount}/${totalRounds} personajes bíblicos en Adivina el Personaje Bíblico! ¿Puedes superarme? ${
      roomCode ? `Entra a mi sala (${roomCode}): ${shareUrl}` : shareUrl
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitLeaderboard(playerName.trim(), groupName.trim() || undefined);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const percentage = Math.round((correctCount / totalRounds) * 100);

  // Winner evaluation for Duo / Equipos mode
  const sortedPlayers = playerScores ? [...playerScores].sort((a, b) => b.score - a.score) : [];
  const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
  const isTie =
    sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 my-auto">
        {/* Victory Header with Trophy */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-xl flex items-center justify-center mb-3 animate-bounce">
            <div className="w-full h-full bg-stone-950 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
            {winner ? '¡Partida Finalizada!' : '¡Misión Cumplida!'}
          </span>

          {winner && sortedPlayers.length > 1 ? (
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-100 mt-1">
              {isTie ? '¡Empate Épico!' : `¡Ganador: ${winner.name}!`}
            </h2>
          ) : (
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-100 mt-1">
              {percentage >= 80 ? '¡Sabio de la Fe!' : percentage >= 50 ? '¡Buen Conocimiento Bíblico!' : '¡Sigue Aprendiendo!'}
            </h2>
          )}
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-stone-950/80 border border-amber-500/30 rounded-2xl p-4 text-center">
          <div>
            <span className="text-[11px] uppercase font-bold text-stone-400 block">
              {sortedPlayers.length > 1 ? 'Total Partida' : 'Puntaje'}
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-amber-400">
              {totalScore}
            </span>
          </div>
          <div className="border-x border-stone-800">
            <span className="text-[11px] uppercase font-bold text-stone-400 block">Aciertos</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
              {correctCount}/{totalRounds}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-stone-400 block">Efectividad</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-sky-400">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Multiplayer Standings if 2+ players or Online Room */}
        {(sortedPlayers.length > 1 || gameMode === 'online') && (
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>{gameMode === 'online' ? `Podio Sala Online (${roomCode})` : 'Podio de Jugadores'}</span>
              </div>
              {gameMode === 'online' ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Sincronizado en vivo
                </span>
              ) : (
                roundsPerPlayer && (
                  <span className="text-[11px] text-amber-400/80 font-mono">
                    {roundsPerPlayer} personajes c/u
                  </span>
                )
              )}
            </div>
            <div className="space-y-1.5">
              {sortedPlayers.map((p, index) => {
                const isStillPlaying =
                  gameMode === 'online' &&
                  roundsPerPlayer &&
                  p.turnsPlayed !== undefined &&
                  p.turnsPlayed < roundsPerPlayer;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs sm:text-sm font-semibold ${
                      index === 0
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        : 'bg-stone-950/60 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs w-4">#{index + 1}</span>
                      <span>{p.name}</span>
                      {p.correctCount !== undefined && roundsPerPlayer && (
                        <span className="text-[11px] text-stone-400 font-normal">
                          ({p.correctCount}/{roundsPerPlayer} aciertos)
                        </span>
                      )}
                      {isStillPlaying && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal animate-pulse">
                          Jugando ({p.turnsPlayed}/{roundsPerPlayer})...
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-amber-400">{p.score} pts</span>
                  </div>
                );
              })}
            </div>
            {gameMode === 'online' && sortedPlayers.length === 1 && (
              <p className="text-[11px] text-stone-400 text-center pt-1">
                Esperando a que el otro dispositivo juegue o avance de ronda... El marcador se actualizará solo.
              </p>
            )}
          </div>
        )}

        {/* Characters Review List */}
        <div className="bg-stone-950/60 border border-amber-500/20 rounded-2xl p-3 max-h-36 overflow-y-auto space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Personajes de la Partida:
          </span>
          {charactersPlayed.map(({ character, guessed, score, playerName: pName }, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 px-2 rounded-lg bg-stone-900/60 text-xs"
            >
              <div className="flex items-center gap-2">
                {guessed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-3.5 h-3.5 text-rose-400 text-center font-bold">✕</span>
                )}
                <span className="font-medium text-stone-200">{character.name}</span>
                {pName && sortedPlayers.length > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-300/80">
                    {pName}
                  </span>
                )}
              </div>
              <span className="font-mono text-stone-400">+{score} pts</span>
            </div>
          ))}
        </div>

        {/* Submit to Global Leaderboard Form */}
        {!submitted ? (
          <form
            onSubmit={handleSubmitScore}
            className="bg-stone-950/80 border border-amber-500/40 rounded-2xl p-3.5 space-y-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Registrar en Tabla de Clasificación Global</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Tu Nombre o Apodo..."
                maxLength={25}
                required
                className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Grupo / Iglesia (Opcional)..."
                maxLength={30}
                className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={!playerName.trim() || isSubmitting}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Publicar Récord'}</span>
            </button>
          </form>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-2xl p-3 text-center text-xs font-semibold">
            ✓ ¡Puntaje publicado con éxito en la Tabla Global!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors border border-amber-500/30 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? '¡Copiado al portapapeles!' : 'Compartir Resultado'}</span>
          </button>

          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar Otra Vez</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onHome}
          className="w-full text-xs text-stone-400 hover:text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer py-1"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Volver al Menú Principal</span>
        </button>
      </div>
    </div>
  );
};
