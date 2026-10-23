/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CHARACTERS, BiblicalCharacter } from './data/characters';
import {
  calculateRoundScore,
  checkGuess,
  selectCharactersForRound,
  ScoreBreakdown,
} from './game/scoring';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { CharacterArtwork } from './components/CharacterArtwork';
import { ClueList } from './components/ClueList';
import { GuessInput } from './components/GuessInput';
import { RoundResultModal } from './components/RoundResultModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { MultiplayerSetupModal } from './components/MultiplayerSetupModal';
import { GlobalLeaderboardModal } from './components/GlobalLeaderboardModal';
import { sound } from './utils/audio';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';
type GameMode = 'solo' | 'duo' | 'equipos' | 'online';

interface PlayerInfo {
  name: string;
  score: number;
}

export default function App() {
  // Screen State
  const [gameState, setGameState] = useState<GameState>('title');
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil' | 'todas'>('medio');
  const [category, setCategory] = useState<string>('Todos');
  const [roundsCount, setRoundsCount] = useState<number>(5);
  const [timeLimit, setTimeLimit] = useState<number>(45);

  // Match State
  const [matchCharacters, setMatchCharacters] = useState<BiblicalCharacter[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [cluesUsed, setCluesUsed] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(45);
  const [streak, setStreak] = useState<number>(0);
  const [isRoundEnded, setIsRoundEnded] = useState<boolean>(false);
  const [lastRoundCorrect, setLastRoundCorrect] = useState<boolean>(false);
  const [lastScoreBreakdown, setLastScoreBreakdown] = useState<ScoreBreakdown | undefined>(undefined);
  const [showRoundModal, setShowRoundModal] = useState<boolean>(false);

  // Players / Teams State
  const [players, setPlayers] = useState<PlayerInfo[]>([{ name: 'Jugador 1', score: 0 }]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [history, setHistory] = useState<{ character: BiblicalCharacter; guessed: boolean; score: number }[]>([]);

  // Online Room State
  const [roomCode, setRoomCode] = useState<string | undefined>(undefined);
  const [initialRoomCode, setInitialRoomCode] = useState<string | undefined>(undefined);
  const [onlinePlayerId, setOnlinePlayerId] = useState<string | undefined>(undefined);

  // Modals
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Check URL params on mount (?autostart=1 or ?room=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    const roomParam = params.get('room');

    if (roomParam) {
      setInitialRoomCode(roomParam.toUpperCase());
      setShowMultiplayerModal(true);
    } else if (autostart === '1') {
      startMatch({
        mode: 'solo',
        diff: 'medio',
        cat: 'Todos',
        rounds: 5,
        time: 45,
      });
    }
  }, []);

  // Timer Tick Loop
  useEffect(() => {
    if (gameState !== 'playing' || isRoundEnded) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        if (prev <= 11) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isRoundEnded, currentRoundIndex]);

  // Keyboard controls listener (Space/Enter to start, P/Esc for pause, M for mute, 1-5 for clues)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        const nextMute = sound.toggleMute();
        setIsMuted(nextMute);
        return;
      }

      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startMatch({ mode: 'solo', diff: difficulty, cat: category, rounds: roundsCount, time: timeLimit });
        }
      } else if (gameState === 'playing') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setGameState('paused');
        } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
          const clueNum = parseInt(e.key, 10);
          if (clueNum === cluesUsed + 1 && cluesUsed < 5 && !isRoundEnded) {
            handleRevealClue();
          }
        }
      } else if (gameState === 'paused') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, cluesUsed, isRoundEnded, difficulty, category, roundsCount, timeLimit]);

  // Start a fresh match
  const startMatch = useCallback(
    (opts: {
      mode: GameMode;
      diff: 'facil' | 'medio' | 'dificil' | 'todas';
      cat: string;
      rounds: number;
      time: number;
      playerNames?: string[];
      roomCode?: string;
      seed?: string;
    }) => {
      const selected = selectCharactersForRound(CHARACTERS, {
        difficulty: opts.diff,
        category: opts.cat,
        count: opts.rounds,
        seed: opts.seed,
      });

      const setupPlayers: PlayerInfo[] = (opts.playerNames || ['Jugador 1']).map((name) => ({
        name,
        score: 0,
      }));

      setGameMode(opts.mode);
      setDifficulty(opts.diff);
      setCategory(opts.cat);
      setRoundsCount(opts.rounds);
      setTimeLimit(opts.time);
      setMatchCharacters(selected);
      setCurrentRoundIndex(0);
      setCluesUsed(0);
      setTimeRemaining(opts.time);
      setStreak(0);
      setIsRoundEnded(false);
      setLastRoundCorrect(false);
      setLastScoreBreakdown(undefined);
      setShowRoundModal(false);
      setPlayers(setupPlayers);
      setActivePlayerIndex(0);
      setHistory([]);
      setRoomCode(opts.roomCode);

      setGameState('playing');
    },
    []
  );

  // Reveal next clue with penalty
  const handleRevealClue = () => {
    if (cluesUsed >= 5 || isRoundEnded) return;
    setCluesUsed((prev) => prev + 1);
    sound.playClueReveal();
  };

  // Time expired handler
  const handleTimeExpired = () => {
    if (isRoundEnded) return;
    finishRound(false);
  };

  // Give up handler
  const handleGiveUp = () => {
    if (isRoundEnded) return;
    finishRound(false);
  };

  // Guess submission handler
  const handleGuess = (rawGuess: string) => {
    if (isRoundEnded || gameState !== 'playing') return;
    const current = matchCharacters[currentRoundIndex];
    if (!current) return;

    const isMatch = checkGuess(rawGuess, current);

    if (isMatch) {
      sound.playCorrect();
      finishRound(true);
    } else {
      sound.playWrong();
    }
  };

  // Complete round and calculate score
  const finishRound = (isCorrect: boolean) => {
    setIsRoundEnded(true);
    setLastRoundCorrect(isCorrect);
    const current = matchCharacters[currentRoundIndex];

    let breakdown: ScoreBreakdown | undefined = undefined;
    let earnedPoints = 0;

    if (isCorrect) {
      breakdown = calculateRoundScore({
        timeRemaining,
        totalTime: timeLimit,
        cluesUsed,
        difficulty: current.difficulty,
        streak,
      });
      earnedPoints = breakdown.totalScore;
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setLastScoreBreakdown(breakdown);

    // Update active player's score
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === activePlayerIndex ? { ...p, score: p.score + earnedPoints } : p))
    );

    // Record history
    setHistory((prev) => [...prev, { character: current, guessed: isCorrect, score: earnedPoints }]);

    // Show round end modal
    setShowRoundModal(true);
  };

  // Proceed to next round or match conclusion
  const handleNextRound = () => {
    setShowRoundModal(false);

    if (currentRoundIndex + 1 < matchCharacters.length) {
      setCurrentRoundIndex((prev) => prev + 1);
      setCluesUsed(0);
      setTimeRemaining(timeLimit);
      setIsRoundEnded(false);
      setLastRoundCorrect(false);
      setLastScoreBreakdown(undefined);

      // Rotate turn in 2-Player or Teams mode
      if (players.length > 1) {
        setActivePlayerIndex((prev) => (prev + 1) % players.length);
      }
    } else {
      // Game Over / Victory
      sound.playFanfare();
      setGameState('gameover');

      // Auto-submit async room run if in an online room
      if (roomCode) {
        const totalScore = players.reduce((sum, p) => sum + p.score, 0);
        const correctAnswers = history.filter((h) => h.guessed).length + (lastRoundCorrect ? 1 : 0);
        fetch(`/api/rooms/${roomCode}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: onlinePlayerId,
            playerName: players[0]?.name || 'Jugador',
            score: totalScore,
            correctAnswers,
            totalTimeUsed: timeLimit * matchCharacters.length - timeRemaining,
          }),
        }).catch(console.error);
      }
    }
  };

  // Submit to Global Leaderboard API (with localStorage fallback for static hosts like GitHub Pages / Vercel)
  const handleLeaderboardSubmit = async (name: string, groupName?: string) => {
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    const correctCount = history.filter((h) => h.guessed).length;
    const entry = {
      id: `local_${Date.now()}`,
      name,
      groupName,
      score: totalScore,
      difficulty,
      correctAnswers: correctCount,
      totalRounds: matchCharacters.length,
      mode: gameMode,
      createdAt: Date.now(),
    };

    try {
      const saved = JSON.parse(localStorage.getItem('biblical_leaderboard') || '[]');
      saved.push(entry);
      localStorage.setItem('biblical_leaderboard', JSON.stringify(saved));
    } catch {}

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {}
  };

  // Online Room Creation API (with deterministic seed code fallback for static hosting)
  const handleCreateOnlineRoom = async (config: {
    hostName: string;
    difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
    category: string;
    roundsCount: number;
    timeLimit: number;
  }): Promise<string | null> => {
    const diffPrefix =
      config.difficulty === 'facil'
        ? 'F'
        : config.difficulty === 'dificil'
        ? 'D'
        : config.difficulty === 'todas'
        ? 'T'
        : 'M';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let fallbackCode = diffPrefix;
    for (let i = 0; i < 5; i++) {
      fallbackCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, seed: fallbackCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOnlinePlayerId(data.playerId);
          startMatch({
            mode: 'online',
            diff: config.difficulty,
            cat: config.category,
            rounds: config.roundsCount,
            time: config.timeLimit,
            playerNames: [config.hostName],
            roomCode: data.room.code,
            seed: data.room.seed,
          });
          return data.room.code;
        }
      }
    } catch {}

    // Fallback for static hosting (GitHub Pages / Vercel): room code itself encodes difficulty + deterministic seed
    startMatch({
      mode: 'online',
      diff: config.difficulty,
      cat: config.category,
      rounds: config.roundsCount,
      time: config.timeLimit,
      playerNames: [config.hostName],
      roomCode: fallbackCode,
      seed: fallbackCode,
    });
    return fallbackCode;
  };

  // Online Room Join API (with deterministic seed code fallback for static hosting)
  const handleJoinOnlineRoom = async (code: string, playerName: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) return false;

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const room = data.room;
          setOnlinePlayerId(data.playerId);
          startMatch({
            mode: 'online',
            diff: room.difficulty,
            cat: room.category,
            rounds: room.roundsCount,
            time: room.timeLimit,
            playerNames: [playerName],
            roomCode: room.code,
            seed: room.seed,
          });
          return true;
        }
      }
    } catch {}

    // Static fallback: decode difficulty from first character and use code as deterministic seed
    const firstChar = cleanCode.charAt(0);
    const decodedDiff: 'facil' | 'medio' | 'dificil' | 'todas' =
      firstChar === 'F'
        ? 'facil'
        : firstChar === 'D'
        ? 'dificil'
        : firstChar === 'T'
        ? 'todas'
        : 'medio';

    startMatch({
      mode: 'online',
      diff: decodedDiff,
      cat: 'Todos',
      rounds: 5,
      time: 45,
      playerNames: [playerName],
      roomCode: cleanCode,
      seed: cleanCode,
    });
    return true;
  };

  const currentCharacter = matchCharacters[currentRoundIndex] || CHARACTERS[0];

  // Calculate live preview of potential points
  const currentPotentialPoints = Math.max(
    100,
    1000 - cluesUsed * 160 + Math.round(timeRemaining * (difficulty === 'dificil' ? 15 : 10))
  );

  const totalScoreAll = players.reduce((sum, p) => sum + p.score, 0);
  const correctCountAll = history.filter((h) => h.guessed).length;

  return (
    <div className="w-full min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between font-sans relative select-none">
      {/* 1. TITLE SCREEN */}
      {gameState === 'title' && (
        <TitleScreen
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          category={category}
          onSelectCategory={setCategory}
          onStartSolo={() =>
            startMatch({
              mode: 'solo',
              diff: difficulty,
              cat: category,
              rounds: roundsCount,
              time: timeLimit,
            })
          }
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
        />
      )}

      {/* 2. PLAYING / PAUSED HUD & PLAYFIELD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="w-full flex-1 flex flex-col justify-between">
          {/* Top HUD */}
          <GameHUD
            currentRound={currentRoundIndex + 1}
            totalRounds={matchCharacters.length}
            timeRemaining={timeRemaining}
            totalTime={timeLimit}
            potentialPoints={currentPotentialPoints}
            streak={streak}
            activePlayerName={players.length > 1 ? players[activePlayerIndex]?.name : undefined}
            gameMode={gameMode}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(sound.toggleMute())}
            onPause={() => setGameState('paused')}
            difficulty={difficulty}
          />

          {/* Main Playfield Grid */}
          <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Left Column: Artwork with dynamic clues unblur */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
              <CharacterArtwork
                character={currentCharacter}
                cluesUsed={cluesUsed}
                revealed={isRoundEnded}
                isCorrect={lastRoundCorrect}
              />
            </div>

            {/* Right Column: Progressive Clues & Guess Input */}
            <div className="w-full md:w-1/2 flex flex-col gap-3 justify-center">
              <ClueList
                clues={currentCharacter.clues}
                cluesUsed={cluesUsed}
                onRevealClue={handleRevealClue}
                disabled={isRoundEnded || gameState === 'paused'}
                revealed={isRoundEnded}
              />

              <GuessInput
                currentCharacter={currentCharacter}
                onGuess={handleGuess}
                onGiveUp={handleGiveUp}
                disabled={isRoundEnded || gameState === 'paused'}
                roundEnded={isRoundEnded}
                difficulty={difficulty}
              />
            </div>
          </main>
        </div>
      )}

      {/* 3. ROUND RESULT MODAL */}
      {showRoundModal && (
        <RoundResultModal
          character={currentCharacter}
          isCorrect={lastRoundCorrect}
          scoreBreakdown={lastScoreBreakdown}
          cluesUsed={cluesUsed}
          timeRemaining={timeRemaining}
          isLastRound={currentRoundIndex + 1 >= matchCharacters.length}
          onNextRound={handleNextRound}
          activePlayerName={players.length > 1 ? players[activePlayerIndex]?.name : undefined}
          playerScores={players.length > 1 ? players : undefined}
        />
      )}

      {/* 4. PAUSE MODAL */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={() =>
            startMatch({
              mode: gameMode,
              diff: difficulty,
              cat: category,
              rounds: roundsCount,
              time: timeLimit,
              playerNames: players.map((p) => p.name),
              roomCode,
            })
          }
          onHome={() => setGameState('title')}
        />
      )}

      {/* 5. GAME OVER / PODIUM MODAL */}
      {gameState === 'gameover' && (
        <GameOverModal
          totalScore={totalScoreAll}
          correctCount={correctCountAll}
          totalRounds={matchCharacters.length}
          difficulty={difficulty}
          gameMode={gameMode}
          charactersPlayed={history}
          onRestart={() =>
            startMatch({
              mode: gameMode,
              diff: difficulty,
              cat: category,
              rounds: roundsCount,
              time: timeLimit,
              playerNames: players.map((p) => p.name),
              roomCode,
            })
          }
          onHome={() => setGameState('title')}
          roomCode={roomCode}
          playerScores={players.length > 1 ? players : undefined}
          onSubmitLeaderboard={handleLeaderboardSubmit}
        />
      )}

      {/* 6. MULTIPLAYER SETUP MODAL */}
      <MultiplayerSetupModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        initialRoomCode={initialRoomCode}
        onStartPassAndPlay={(config) => {
          startMatch({
            mode: config.isTeams ? 'equipos' : 'duo',
            diff: config.difficulty,
            cat: config.category,
            rounds: config.roundsCount,
            time: config.timeLimit,
            playerNames: config.players,
          });
        }}
        onCreateOnlineRoom={handleCreateOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
      />

      {/* 7. GLOBAL LEADERBOARD MODAL */}
      <GlobalLeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />
    </div>
  );
}
