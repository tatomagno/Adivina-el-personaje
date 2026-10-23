/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, HelpCircle, ListFilter, Sparkles, X } from 'lucide-react';
import { BiblicalCharacter, CHARACTERS } from '../data/characters';
import { normalizeString } from '../game/scoring';

interface GuessInputProps {
  currentCharacter: BiblicalCharacter;
  onGuess: (guessText: string) => void;
  onGiveUp: () => void;
  disabled: boolean;
  roundEnded: boolean;
  difficulty: string;
}

export const GuessInput: React.FC<GuessInputProps> = ({
  currentCharacter,
  onGuess,
  onGiveUp,
  disabled,
  roundEnded,
  difficulty,
}) => {
  const [inputText, setInputText] = useState('');
  const [useMultipleChoice, setUseMultipleChoice] = useState(difficulty === 'facil');
  const [options, setOptions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate 4 multiple-choice options whenever currentCharacter changes
  useEffect(() => {
    const distractors = CHARACTERS.filter((c) => c.id !== currentCharacter.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.name);

    const fullOptions = [currentCharacter.name, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(fullOptions);
    setInputText('');
    setSuggestions([]);
  }, [currentCharacter.id]);

  // Update autocomplete suggestions based on inputText
  useEffect(() => {
    if (!inputText.trim() || inputText.length < 1) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const normalized = normalizeString(inputText);
    const matches = CHARACTERS.filter((c) => {
      const matchName = normalizeString(c.name).includes(normalized);
      const matchAlias = c.aliases.some((a) => normalizeString(a).includes(normalized));
      return matchName || matchAlias;
    })
      .map((c) => c.name)
      .slice(0, 5);

    setSuggestions(matches);
    setIsDropdownOpen(matches.length > 0);
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || disabled || roundEnded) return;
    onGuess(inputText.trim());
    setInputText('');
    setIsDropdownOpen(false);
  };

  const handleSelectSuggestion = (name: string) => {
    setInputText(name);
    setIsDropdownOpen(false);
    onGuess(name);
  };

  return (
    <div className="w-full bg-stone-900/90 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-xl">
      {/* Mode toggle bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          ¿Quién es este personaje?
        </span>

        <button
          type="button"
          onClick={() => setUseMultipleChoice(!useMultipleChoice)}
          className="text-xs px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ListFilter className="w-3 h-3" />
          <span>{useMultipleChoice ? 'Modo Texto' : 'Modo 4 Opciones'}</span>
        </button>
      </div>

      {/* Multiple-choice button grid */}
      {useMultipleChoice ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {options.map((optName, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled || roundEnded}
              onClick={() => onGuess(optName)}
              className="py-3 px-4 rounded-xl font-medium text-sm sm:text-base text-stone-100 bg-gradient-to-r from-stone-800 to-stone-900 border border-amber-500/30 hover:border-amber-400 hover:from-amber-950/40 hover:to-stone-800 active:scale-[0.98] transition-all flex items-center justify-between shadow cursor-pointer disabled:opacity-50"
            >
              <span>{optName}</span>
              <span className="text-[11px] text-amber-400/80 font-mono">
                Opción {String.fromCharCode(65 + idx)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* Text input with autocomplete */
        <div className="relative">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe el nombre del personaje bíblico..."
                disabled={disabled || roundEnded}
                className="w-full bg-stone-950/80 border border-amber-500/40 rounded-xl pl-10 pr-9 py-2.5 text-sm sm:text-base text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                autoComplete="off"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || disabled || roundEnded}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer text-sm shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Adivinar</span>
            </button>
          </form>

          {/* Autocomplete dropdown */}
          {isDropdownOpen && suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1.5 bg-stone-900 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 bg-stone-950/80 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider">
                Sugerencias
              </div>
              {suggestions.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSuggestion(name)}
                  className="w-full text-left px-3.5 py-2 text-sm text-stone-200 hover:bg-amber-950/60 hover:text-amber-200 border-b border-stone-800/50 last:border-0 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{name}</span>
                  <span className="text-xs text-amber-400/60 font-mono">Elegir ↵</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Give up button */}
      {!roundEnded && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onGiveUp}
            disabled={disabled}
            className="text-xs text-stone-400 hover:text-rose-300 underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>No lo sé, rendirme y ver respuesta</span>
          </button>
        </div>
      )}
    </div>
  );
};
