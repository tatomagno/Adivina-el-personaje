/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award, RefreshCw, Users, Shield } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  difficulty: string;
  correctAnswers: number;
  totalRounds: number;
  groupName?: string;
  mode: string;
  createdAt: number;
}

interface GlobalLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    name: 'Grupo Josué & Caleb',
    score: 4890,
    difficulty: 'medio',
    correctAnswers: 5,
    totalRounds: 5,
    groupName: 'Jóvenes Vencedores',
    mode: 'equipos',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'seed-2',
    name: 'Hermana Raquel',
    score: 4720,
    difficulty: 'facil',
    correctAnswers: 5,
    totalRounds: 5,
    groupName: 'Escuela Bíblica Infantil',
    mode: 'solo',
    createdAt: Date.now() - 3600000 * 8,
  },
  {
    id: 'seed-3',
    name: 'Pastor Samuel',
    score: 4610,
    difficulty: 'dificil',
    correctAnswers: 5,
    totalRounds: 5,
    groupName: 'Seminario Berea',
    mode: 'solo',
    createdAt: Date.now() - 3600000 * 14,
  },
  {
    id: 'seed-4',
    name: 'Familia Morales',
    score: 4350,
    difficulty: 'medio',
    correctAnswers: 4,
    totalRounds: 5,
    groupName: 'Noche de Hogar',
    mode: 'duo',
    createdAt: Date.now() - 3600000 * 24,
  },
];

export const GlobalLeaderboardModal: React.FC<GlobalLeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'todas' | 'facil' | 'medio' | 'dificil'>('todas');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    let combined: LeaderboardEntry[] = [...FALLBACK_ENTRIES];

    try {
      const localSaved = JSON.parse(localStorage.getItem('biblical_leaderboard') || '[]');
      if (Array.isArray(localSaved)) {
        combined = [...combined, ...localSaved];
      }
    } catch {}

    try {
      const res = await fetch(`/api/leaderboard?difficulty=${selectedDifficulty}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          const seenIds = new Set(data.leaderboard.map((e: LeaderboardEntry) => e.id));
          combined = [...data.leaderboard, ...combined.filter((e) => !seenIds.has(e.id))];
        }
      }
    } catch {}

    if (selectedDifficulty !== 'todas') {
      combined = combined.filter((e) => e.difficulty === selectedDifficulty);
    }

    combined.sort((a, b) => b.score - a.score);
    setEntries(combined.slice(0, 50));
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, selectedDifficulty]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-100">
                Salón de la Fe · Clasificación Global
              </h2>
              <p className="text-xs text-stone-400">
                Los mejores puntajes de jugadores y grupos bíblicos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tabla de clasificación"
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-950/80 p-1.5 rounded-2xl border border-stone-800">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'facil', label: 'Niños' },
            { id: 'medio', label: 'Jóvenes' },
            { id: 'dificil', label: 'Adultos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDifficulty(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedDifficulty === tab.id
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchLeaderboard}
            aria-label="Actualizar tabla"
            className="p-2 text-stone-400 hover:text-amber-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-stone-400">
              Cargando clasificaciones...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-stone-400">
              <Award className="w-8 h-8 text-stone-600 mb-2" />
              <span>Aún no hay récords registrados para este nivel.</span>
              <span className="text-xs text-stone-500 mt-1">¡Sé el primero en jugar y registrar tu puntaje!</span>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const isTop3 = idx < 3;
              return (
                <div
                  key={entry.id || idx}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-r from-amber-950/60 to-stone-900 border-amber-500/50 shadow-md'
                      : idx === 1
                      ? 'bg-stone-900/90 border-slate-400/40'
                      : idx === 2
                      ? 'bg-stone-900/90 border-amber-700/40'
                      : 'bg-stone-950/50 border-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-stone-950'
                          : idx === 1
                          ? 'bg-slate-300 text-stone-950'
                          : idx === 2
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs sm:text-sm text-stone-100">
                          {entry.name}
                        </span>
                        {entry.mode === 'equipos' && (
                          <span className="text-[10px] px-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                            Equipo
                          </span>
                        )}
                      </div>
                      {entry.groupName && (
                        <p className="text-[11px] text-stone-400 italic">
                          {entry.groupName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-sm sm:text-base text-amber-400 tabular-nums">
                      {entry.score} pts
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {entry.correctAnswers}/{entry.totalRounds} aciertos
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
