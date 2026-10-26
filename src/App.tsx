/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CHARACTERS, BiblicalCharacter } from './data/characters';
import {
  calculateRoundScore,
  checkGuess,
  normalizeString,
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
import {
  OnlinePlayerState,
  OnlineRoomConfig,
  RecentRoomEntry,
  publishRoomEvent,
  fetchCloudRoomSnapshot,
  subscribeToCloudRoom,
  publishGlobalLeaderboardEntry,
  getRecentRooms,
  saveRecentRoom,
} from './utils/onlineSync';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';
type GameMode = 'solo' | 'duo' | 'equipos' | 'online';

interface PlayerInfo {
  name: string;
  score: number;
  streak: number;
  correctCount: number;
  turnsPlayed: number;
  completed?: boolean;
  updatedAt?: number;
}

const ACTIVE_SESSION_KEY = 'biblical_active_session_v2';

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
  const [players, setPlayers] = useState<PlayerInfo[]>([
    { name: 'Jugador 1', score: 0, streak: 0, correctCount: 0, turnsPlayed: 0 },
  ]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [history, setHistory] = useState<
    { character: BiblicalCharacter; guessed: boolean; score: number; playerName?: string }[]
  >([]);

  // Online Room State
  const [roomCode, setRoomCode] = useState<string | undefined>(undefined);
  const [initialRoomCode, setInitialRoomCode] = useState<string | undefined>(undefined);
  const [initialHostName, setInitialHostName] = useState<string | undefined>(undefined);
  const [onlinePlayerId, setOnlinePlayerId] = useState<string | undefined>(undefined);
  const [pendingOnlineConfig, setPendingOnlineConfig] = useState<OnlineRoomConfig | null>(null);
  const [onlineRoomPlayers, setOnlineRoomPlayers] = useState<OnlinePlayerState[]>([]);
  const [recentRooms, setRecentRooms] = useState<RecentRoomEntry[]>(() => getRecentRooms());
  const roomUnsubRef = useRef<(() => void) | null>(null);
  const roundDeadlineRef = useRef<number>(Date.now() + 45000);

  // Subscribe to cloud room updates whenever roomCode changes
  const connectToCloudRoom = useCallback((code: string) => {
    if (roomUnsubRef.current) {
      roomUnsubRef.current();
    }
    roomUnsubRef.current = subscribeToCloudRoom(code, (snapshot) => {
      const list = Object.values(snapshot.players).sort((a, b) => b.score - a.score);
      setOnlineRoomPlayers(list);
    });
  }, []);

  const refreshCloudRoomNow = useCallback(async () => {
    if (!roomCode) return;
    const snap = await fetchCloudRoomSnapshot(roomCode);
    const list = Object.values(snap.players).sort((a, b) => b.score - a.score);
    if (list.length > 0) {
      setOnlineRoomPlayers(list);
    }
  }, [roomCode]);

  useEffect(() => {
    return () => {
      if (roomUnsubRef.current) roomUnsubRef.current();
    };
  }, []);

  // Modals
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Persist active match / gameover state in localStorage so refreshing the page (F5) never loses the match or Podio
  useEffect(() => {
    if (gameState === 'title') return;
    try {
      const payload = {
        gameState,
        gameMode,
        difficulty,
        category,
        roundsCount,
        timeLimit,
        matchCharacters,
        currentRoundIndex,
        cluesUsed,
        timeRemaining,
        streak,
        isRoundEnded,
        lastRoundCorrect,
        showRoundModal,
        players,
        activePlayerIndex,
        history,
        roomCode,
        onlinePlayerId,
        savedAt: Date.now(),
      };
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(payload));
    } catch {}
  }, [
    gameState,
    gameMode,
    difficulty,
    category,
    roundsCount,
    timeLimit,
    matchCharacters,
    currentRoundIndex,
    cluesUsed,
    timeRemaining,
    streak,
    isRoundEnded,
    lastRoundCorrect,
    showRoundModal,
    players,
    activePlayerIndex,
    history,
    roomCode,
    onlinePlayerId,
  ]);

  const clearSavedSessionAndGoHome = () => {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {}
    setShowRoundModal(false);
    setGameState('title');
  };

  // Check URL params on mount (?autostart=1 or ?room=XYZ) OR restore active session on page refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    const roomParam = params.get('room')?.toUpperCase();
    const hostParam = params.get('h');

    // Check if there is a saved session from before page reload
    try {
      const rawSaved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (rawSaved) {
        const saved = JSON.parse(rawSaved);
        const ageMs = Date.now() - (saved.savedAt || 0);
        // Restore if session is recent (< 6 hours) and either there is no new ?room= param or it matches the same room
        if (
          ageMs < 6 * 3600 * 1000 &&
          saved.gameState &&
          saved.gameState !== 'title' &&
          (!roomParam || roomParam === saved.roomCode)
        ) {
          setGameMode(saved.gameMode || 'solo');
          setDifficulty(saved.difficulty || 'medio');
          setCategory(saved.category || 'Todos');
          setRoundsCount(saved.roundsCount || 5);
          setTimeLimit(saved.timeLimit || 45);
          if (Array.isArray(saved.matchCharacters) && saved.matchCharacters.length > 0) {
            setMatchCharacters(saved.matchCharacters);
          }
          setCurrentRoundIndex(saved.currentRoundIndex || 0);
          setCluesUsed(saved.cluesUsed || 0);
          const restoredRemaining = saved.timeRemaining ?? saved.timeLimit ?? 45;
          setTimeRemaining(restoredRemaining);
          roundDeadlineRef.current = Date.now() + restoredRemaining * 1000;
          setStreak(saved.streak || 0);
          setIsRoundEnded(Boolean(saved.isRoundEnded));
          setLastRoundCorrect(Boolean(saved.lastRoundCorrect));
          setShowRoundModal(Boolean(saved.showRoundModal));
          if (Array.isArray(saved.players) && saved.players.length > 0) {
            setPlayers(saved.players);
          }
          setActivePlayerIndex(saved.activePlayerIndex || 0);
          if (Array.isArray(saved.history)) {
            setHistory(saved.history);
          }
          if (saved.roomCode) {
            setRoomCode(saved.roomCode);
            connectToCloudRoom(saved.roomCode);
          }
          if (saved.onlinePlayerId) {
            setOnlinePlayerId(saved.onlinePlayerId);
          }
          setGameState(saved.gameState);
          return;
        }
      }
    } catch {}

    if (roomParam) {
      setInitialRoomCode(roomParam);
      if (hostParam) setInitialHostName(hostParam);
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
  }, [connectToCloudRoom]);

  // Wall-clock accurate Timer Tick Loop (works reliably even if mobile screen locks or switches apps)
  useEffect(() => {
    if (gameState !== 'playing' || isRoundEnded) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const checkRemainingTime = () => {
      const remaining = Math.max(0, Math.ceil((roundDeadlineRef.current - Date.now()) / 1000));
      setTimeRemaining((prev) => {
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        if (remaining !== prev && remaining <= 10) {
          sound.playTick();
        }
        return remaining;
      });
    };

    timerRef.current = setInterval(checkRemainingTime, 250);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkRemainingTime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
          roundDeadlineRef.current = Date.now() + timeRemaining * 1000;
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, cluesUsed, isRoundEnded, difficulty, category, roundsCount, timeLimit, timeRemaining]);

  // Start or resume a match
  const startMatch = useCallback(
    (opts: {
      mode: GameMode;
      diff: 'facil' | 'medio' | 'dificil' | 'todas';
      cat: string;
      rounds: number;
      time: number;
      playerNames?: string[];
      initialPlayers?: PlayerInfo[];
      startRoundIndex?: number;
      initialGameState?: GameState;
      roomCode?: string;
      seed?: string;
    }) => {
      const setupPlayers: PlayerInfo[] =
        opts.initialPlayers ||
        (opts.playerNames || ['Jugador 1']).map((name) => ({
          name,
          score: 0,
          streak: 0,
          correctCount: 0,
          turnsPlayed: 0,
        }));

      // Each player/team plays `opts.rounds` characters (e.g. 5 rounds x 2 players = 10 characters total)
      const totalTurns = opts.rounds * setupPlayers.length;

      const selected = selectCharactersForRound(CHARACTERS, {
        difficulty: opts.diff,
        category: opts.cat,
        count: totalTurns,
        seed: opts.seed,
      });

      setGameMode(opts.mode);
      setDifficulty(opts.diff);
      setCategory(opts.cat);
      setRoundsCount(opts.rounds);
      setTimeLimit(opts.time);
      setMatchCharacters(selected);
      setCurrentRoundIndex(opts.startRoundIndex ?? 0);
      setCluesUsed(0);
      setTimeRemaining(opts.time);
      roundDeadlineRef.current = Date.now() + opts.time * 1000;
      setStreak(0);
      setIsRoundEnded(false);
      setLastRoundCorrect(false);
      setLastScoreBreakdown(undefined);
      setShowRoundModal(false);
      setPlayers(setupPlayers);
      setActivePlayerIndex(0);
      setHistory([]);
      setRoomCode(opts.roomCode);

      setGameState(opts.initialGameState ?? 'playing');
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
    const activePlayer = players[activePlayerIndex];
    const currentPlayerStreak = activePlayer ? activePlayer.streak : streak;

    let breakdown: ScoreBreakdown | undefined = undefined;
    let earnedPoints = 0;

    if (isCorrect) {
      breakdown = calculateRoundScore({
        timeRemaining,
        totalTime: timeLimit,
        cluesUsed,
        difficulty: current.difficulty,
        streak: currentPlayerStreak,
      });
      earnedPoints = breakdown.totalScore;
      setStreak(currentPlayerStreak + 1);
    } else {
      setStreak(0);
    }

    setLastScoreBreakdown(breakdown);

    const updatedScore = (activePlayer?.score ?? 0) + earnedPoints;
    const updatedStreak = isCorrect ? (activePlayer?.streak ?? 0) + 1 : 0;
    const updatedCorrectCount = (activePlayer?.correctCount ?? 0) + (isCorrect ? 1 : 0);
    const updatedTurnsPlayed = (activePlayer?.turnsPlayed ?? 0) + 1;

    // Update active player's score, streak, correctCount, and turnsPlayed
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex
          ? {
              ...p,
              score: updatedScore,
              streak: updatedStreak,
              correctCount: updatedCorrectCount,
              turnsPlayed: updatedTurnsPlayed,
            }
          : p
      )
    );

    // If in an online room, publish live round progress so other devices see it in real time
    if (gameMode === 'online' && roomCode && onlinePlayerId) {
      const isFinalTurn = currentRoundIndex + 1 >= matchCharacters.length;
      const playerState: OnlinePlayerState = {
        id: onlinePlayerId,
        name: activePlayer?.name || 'Jugador',
        score: updatedScore,
        correctCount: updatedCorrectCount,
        turnsPlayed: updatedTurnsPlayed,
        totalRounds: matchCharacters.length,
        completed: isFinalTurn,
        updatedAt: Date.now(),
      };
      publishRoomEvent(roomCode, {
        type: 'player_update',
        player: playerState,
      });
    }

    // Record history with player name
    setHistory((prev) => [
      ...prev,
      {
        character: current,
        guessed: isCorrect,
        score: earnedPoints,
        playerName: activePlayer?.name,
      },
    ]);

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
      roundDeadlineRef.current = Date.now() + timeLimit * 1000;
      setIsRoundEnded(false);
      setLastRoundCorrect(false);
      setLastScoreBreakdown(undefined);

      // Rotate turn in 2-Player or Teams mode
      if (players.length > 1) {
        setActivePlayerIndex((prev) => (prev + 1) % players.length);
      }

      // Refresh timestamp in online room when starting the new round so the opponent's countdown resets
      if (gameMode === 'online' && roomCode && onlinePlayerId && players[0]) {
        publishRoomEvent(roomCode, {
          type: 'player_update',
          player: {
            id: onlinePlayerId,
            name: players[0].name,
            score: players[0].score,
            correctCount: players[0].correctCount,
            turnsPlayed: players[0].turnsPlayed,
            totalRounds: matchCharacters.length,
            completed: false,
            updatedAt: Date.now(),
          },
        });
      }
    } else {
      // Game Over / Victory
      sound.playFanfare();
      setGameState('gameover');

      // Auto-submit async room run if in an online room
      if (roomCode) {
        const totalScore = players.reduce((sum, p) => sum + p.score, 0);
        const correctAnswers = history.filter((h) => h.guessed).length;
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
        }).catch(() => {});
      }
    }
  };

  // Submit to Global Leaderboard API + Cloud Sync + localStorage
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

    publishGlobalLeaderboardEntry(entry).catch(() => {});

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {}
  };

  // Online Room Creation (Real-time cloud pub/sub + URL query encoding for static hosting like GitHub Pages)
  const handleCreateOnlineRoom = async (config: {
    hostName: string;
    difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
    category: string;
    roundsCount: number;
    timeLimit: number;
  }): Promise<OnlineRoomConfig | null> => {
    const diffPrefix =
      config.difficulty === 'facil'
        ? 'F'
        : config.difficulty === 'dificil'
        ? 'D'
        : config.difficulty === 'todas'
        ? 'T'
        : 'M';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let generatedCode = diffPrefix;
    for (let i = 0; i < 5; i++) {
      generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hostId = `host_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    let finalRoomConfig: OnlineRoomConfig = {
      code: generatedCode,
      seed: generatedCode,
      hostName: config.hostName,
      difficulty: config.difficulty,
      category: config.category,
      roundsCount: config.roundsCount,
      timeLimit: config.timeLimit,
    };

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, seed: generatedCode }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.room) {
          finalRoomConfig = {
            code: data.room.code,
            seed: data.room.seed,
            hostName: config.hostName,
            difficulty: config.difficulty,
            category: config.category,
            roundsCount: config.roundsCount,
            timeLimit: config.timeLimit,
          };
        }
      }
    } catch {}

    const initialHostPlayer: OnlinePlayerState = {
      id: hostId,
      name: config.hostName,
      score: 0,
      correctCount: 0,
      turnsPlayed: 0,
      totalRounds: config.roundsCount,
      completed: false,
      updatedAt: Date.now(),
    };

    setOnlinePlayerId(hostId);
    setRoomCode(finalRoomConfig.code);
    setPendingOnlineConfig(finalRoomConfig);
    setOnlineRoomPlayers([initialHostPlayer]);

    setRecentRooms(
      saveRecentRoom({
        code: finalRoomConfig.code,
        playerName: config.hostName,
        playerId: hostId,
        difficulty: finalRoomConfig.difficulty,
        category: finalRoomConfig.category,
        roundsCount: finalRoomConfig.roundsCount,
        timeLimit: finalRoomConfig.timeLimit,
        updatedAt: Date.now(),
      })
    );

    // Publish room creation to cloud channel so any device joining by code or link gets full config + sees host
    await publishRoomEvent(finalRoomConfig.code, {
      type: 'room_created',
      config: finalRoomConfig,
      hostPlayer: initialHostPlayer,
    });

    // Subscribe to live updates (so host sees when daughter/friend joins in the lobby and during the game)
    connectToCloudRoom(finalRoomConfig.code);

    return finalRoomConfig;
  };

  // Start the match once the host clicks "¡Empezar a Jugar Ahora!" in the waiting lobby
  const handleStartCreatedOnlineRoom = () => {
    if (!pendingOnlineConfig) return;
    if (onlinePlayerId) {
      publishRoomEvent(pendingOnlineConfig.code, {
        type: 'player_update',
        player: {
          id: onlinePlayerId,
          name: pendingOnlineConfig.hostName,
          score: 0,
          correctCount: 0,
          turnsPlayed: 0,
          totalRounds: pendingOnlineConfig.roundsCount,
          completed: false,
          updatedAt: Date.now(),
        },
      });
    }
    startMatch({
      mode: 'online',
      diff: pendingOnlineConfig.difficulty,
      cat: pendingOnlineConfig.category,
      rounds: pendingOnlineConfig.roundsCount,
      time: pendingOnlineConfig.timeLimit,
      playerNames: [pendingOnlineConfig.hostName],
      roomCode: pendingOnlineConfig.code,
      seed: pendingOnlineConfig.seed,
    });
  };

  // View the Podio of an online room directly without re-playing (e.g. after refreshing or checking results)
  const handleViewOnlineRoomPodio = async (code: string, playerName?: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) return false;

    const firstChar = cleanCode.charAt(0);
    const decodedDiff: 'facil' | 'medio' | 'dificil' | 'todas' =
      firstChar === 'F'
        ? 'facil'
        : firstChar === 'D'
        ? 'dificil'
        : firstChar === 'T'
        ? 'todas'
        : 'medio';

    let resolvedConfig: OnlineRoomConfig = {
      code: cleanCode,
      seed: cleanCode,
      hostName: 'Anfitrión',
      difficulty: decodedDiff,
      category: 'Todos',
      roundsCount: 3,
      timeLimit: 60,
    };

    let existingPlayers: OnlinePlayerState[] = [];
    try {
      const cloudSnapshot = await fetchCloudRoomSnapshot(cleanCode);
      if (cloudSnapshot.config) {
        resolvedConfig = cloudSnapshot.config;
      }
      existingPlayers = Object.values(cloudSnapshot.players).sort((a, b) => b.score - a.score);
      if (existingPlayers.length > 0) {
        setOnlineRoomPlayers(existingPlayers);
      }
    } catch {}

    const matchedPlayer = playerName
      ? existingPlayers.find((p) => normalizeString(p.name) === normalizeString(playerName))
      : existingPlayers[0];

    if (matchedPlayer) {
      setOnlinePlayerId(matchedPlayer.id);
    }

    connectToCloudRoom(cleanCode);

    startMatch({
      mode: 'online',
      diff: resolvedConfig.difficulty,
      cat: resolvedConfig.category,
      rounds: resolvedConfig.roundsCount,
      time: resolvedConfig.timeLimit,
      initialPlayers: matchedPlayer
        ? [
            {
              name: matchedPlayer.name,
              score: matchedPlayer.score,
              streak: 0,
              correctCount: matchedPlayer.correctCount,
              turnsPlayed: matchedPlayer.turnsPlayed,
              completed: matchedPlayer.completed,
              updatedAt: matchedPlayer.updatedAt,
            },
          ]
        : [{ name: playerName || 'Espectador', score: 0, streak: 0, correctCount: 0, turnsPlayed: 0 }],
      initialGameState: 'gameover',
      roomCode: resolvedConfig.code,
      seed: resolvedConfig.seed,
    });
    return true;
  };

  // Online Room Join (Smart resume / Podio view if player already exists in room, or fresh start if new)
  const handleJoinOnlineRoom = async (code: string, playerName: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) return false;

    // 1. Check URL query parameters first (if user opened a shared link)
    const params = new URLSearchParams(window.location.search);
    const urlDiff = params.get('d') as 'facil' | 'medio' | 'dificil' | 'todas' | null;
    const urlRounds = params.get('r') ? parseInt(params.get('r')!, 10) : null;
    const urlTime = params.get('t') ? parseInt(params.get('t')!, 10) : null;
    const urlCat = params.get('c');

    // 2. Decode difficulty prefix as baseline fallback
    const firstChar = cleanCode.charAt(0);
    const decodedDiff: 'facil' | 'medio' | 'dificil' | 'todas' =
      firstChar === 'F'
        ? 'facil'
        : firstChar === 'D'
        ? 'dificil'
        : firstChar === 'T'
        ? 'todas'
        : 'medio';

    let resolvedConfig: OnlineRoomConfig = {
      code: cleanCode,
      seed: cleanCode,
      hostName: initialHostName || 'Anfitrión',
      difficulty: urlDiff || decodedDiff,
      category: urlCat || 'Todos',
      roundsCount: urlRounds && !isNaN(urlRounds) ? urlRounds : 5,
      timeLimit: urlTime && !isNaN(urlTime) ? urlTime : 45,
    };

    // 3. Fetch cloud room snapshot (works even if guest only typed the 6-letter code manually!)
    let existingPlayers: OnlinePlayerState[] = [];
    try {
      const cloudSnapshot = await fetchCloudRoomSnapshot(cleanCode);
      if (cloudSnapshot.config) {
        resolvedConfig = cloudSnapshot.config;
      }
      existingPlayers = Object.values(cloudSnapshot.players).sort((a, b) => b.score - a.score);
      if (existingPlayers.length > 0) {
        setOnlineRoomPlayers(existingPlayers);
      }
    } catch {}

    // 4. Check if this player ALREADY exists in the room (e.g. rejoining after page refresh!)
    const existingSelf = existingPlayers.find(
      (p) => normalizeString(p.name) === normalizeString(playerName)
    );

    if (existingSelf) {
      setOnlinePlayerId(existingSelf.id);
      setRoomCode(cleanCode);
      connectToCloudRoom(cleanCode);

      setRecentRooms(
        saveRecentRoom({
          code: cleanCode,
          playerName: existingSelf.name,
          playerId: existingSelf.id,
          difficulty: resolvedConfig.difficulty,
          category: resolvedConfig.category,
          roundsCount: resolvedConfig.roundsCount,
          timeLimit: resolvedConfig.timeLimit,
          updatedAt: Date.now(),
        })
      );

      const alreadyFinished =
        existingSelf.completed || existingSelf.turnsPlayed >= resolvedConfig.roundsCount;

      if (alreadyFinished) {
        // Player already completed all rounds -> take them straight to the Podio!
        startMatch({
          mode: 'online',
          diff: resolvedConfig.difficulty,
          cat: resolvedConfig.category,
          rounds: resolvedConfig.roundsCount,
          time: resolvedConfig.timeLimit,
          initialPlayers: [
            {
              name: existingSelf.name,
              score: existingSelf.score,
              streak: 0,
              correctCount: existingSelf.correctCount,
              turnsPlayed: existingSelf.turnsPlayed,
              completed: true,
              updatedAt: existingSelf.updatedAt,
            },
          ],
          initialGameState: 'gameover',
          roomCode: resolvedConfig.code,
          seed: resolvedConfig.seed,
        });
        return true;
      } else if (existingSelf.turnsPlayed > 0) {
        // Player was mid-game -> resume on their next unplayed round!
        const refreshedState: OnlinePlayerState = {
          ...existingSelf,
          updatedAt: Date.now(),
        };
        await publishRoomEvent(cleanCode, {
          type: 'player_update',
          player: refreshedState,
        });

        startMatch({
          mode: 'online',
          diff: resolvedConfig.difficulty,
          cat: resolvedConfig.category,
          rounds: resolvedConfig.roundsCount,
          time: resolvedConfig.timeLimit,
          initialPlayers: [
            {
              name: existingSelf.name,
              score: existingSelf.score,
              streak: 0,
              correctCount: existingSelf.correctCount,
              turnsPlayed: existingSelf.turnsPlayed,
              completed: false,
              updatedAt: Date.now(),
            },
          ],
          startRoundIndex: existingSelf.turnsPlayed,
          roomCode: resolvedConfig.code,
          seed: resolvedConfig.seed,
        });
        return true;
      }
    }

    const guestId =
      existingSelf?.id ||
      `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const guestPlayerState: OnlinePlayerState = {
      id: guestId,
      name: playerName,
      score: 0,
      correctCount: 0,
      turnsPlayed: 0,
      totalRounds: resolvedConfig.roundsCount,
      completed: false,
      updatedAt: Date.now(),
    };

    setOnlinePlayerId(guestId);
    setRoomCode(cleanCode);

    setRecentRooms(
      saveRecentRoom({
        code: cleanCode,
        playerName,
        playerId: guestId,
        difficulty: resolvedConfig.difficulty,
        category: resolvedConfig.category,
        roundsCount: resolvedConfig.roundsCount,
        timeLimit: resolvedConfig.timeLimit,
        updatedAt: Date.now(),
      })
    );

    // Announce guest join to cloud room so host sees guest immediately
    await publishRoomEvent(cleanCode, {
      type: 'player_update',
      player: guestPlayerState,
    });

    connectToCloudRoom(cleanCode);

    // Clean URL params gently without reloading so refreshing doesn't re-pop the modal unnecessarily
    if (window.location.search.includes('room=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    startMatch({
      mode: 'online',
      diff: resolvedConfig.difficulty,
      cat: resolvedConfig.category,
      rounds: resolvedConfig.roundsCount,
      time: resolvedConfig.timeLimit,
      playerNames: [playerName],
      roomCode: resolvedConfig.code,
      seed: resolvedConfig.seed,
    });
    return true;
  };

  const currentCharacter = matchCharacters[currentRoundIndex] || CHARACTERS[0];

  // Calculate live preview of potential points
  const currentPotentialPoints = Math.max(
    100,
    1000 - cluesUsed * 160 + Math.round(timeRemaining * (difficulty === 'dificil' ? 15 : 10))
  );

  // Build unified scoreboard for online mode (merging local player state with live cloud players)
  const displayScoreboard: PlayerInfo[] | undefined =
    gameMode === 'online'
      ? (() => {
          const map = new Map<string, PlayerInfo>();
          for (const op of onlineRoomPlayers) {
            map.set(op.id, {
              name: op.name,
              score: op.score,
              streak: 0,
              correctCount: op.correctCount,
              turnsPlayed: op.turnsPlayed,
              completed: op.completed,
              updatedAt: op.updatedAt,
            });
          }
          if (onlinePlayerId && players[0]) {
            const existing = map.get(onlinePlayerId);
            map.set(onlinePlayerId, {
              name: players[0].name,
              score: Math.max(players[0].score, existing?.score ?? 0),
              streak: players[0].streak,
              correctCount: Math.max(players[0].correctCount, existing?.correctCount ?? 0),
              turnsPlayed: Math.max(players[0].turnsPlayed, existing?.turnsPlayed ?? 0),
              completed:
                gameState === 'gameover' ||
                existing?.completed ||
                players[0].turnsPlayed >= roundsCount,
              updatedAt: existing?.updatedAt || Date.now(),
            });
          }
          const list = Array.from(map.values()).sort((a, b) => b.score - a.score);
          return list.length > 0 ? list : players;
        })()
      : players.length > 1
      ? players
      : undefined;

  const totalScoreAll =
    players.reduce((sum, p) => sum + p.score, 0) ||
    (gameMode === 'online' && displayScoreboard?.[0]?.score) ||
    0;
  const correctCountAll =
    history.length > 0
      ? history.filter((h) => h.guessed).length
      : players.reduce((sum, p) => sum + p.correctCount, 0) ||
        (gameMode === 'online' && displayScoreboard?.[0]?.correctCount) ||
        0;

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
          recentRoom={
            recentRooms.length > 0
              ? { code: recentRooms[0].code, playerName: recentRooms[0].playerName }
              : null
          }
          onRejoinRecentRoom={() => {
            if (recentRooms.length > 0) {
              handleJoinOnlineRoom(recentRooms[0].code, recentRooms[0].playerName);
            }
          }}
        />
      )}

      {/* 2. PLAYING / PAUSED HUD & PLAYFIELD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="w-full flex-1 flex flex-col justify-between">
          {/* Top HUD */}
          <GameHUD
            currentRound={Math.floor(currentRoundIndex / Math.max(1, players.length)) + 1}
            totalRounds={roundsCount}
            timeRemaining={timeRemaining}
            totalTime={timeLimit}
            potentialPoints={currentPotentialPoints}
            streak={players[activePlayerIndex]?.streak ?? streak}
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
          nextPlayerName={
            players.length > 1 ? players[(activePlayerIndex + 1) % players.length]?.name : undefined
          }
          playerScores={displayScoreboard}
          gameMode={gameMode}
        />
      )}

      {/* 4. PAUSE MODAL */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => {
            roundDeadlineRef.current = Date.now() + timeRemaining * 1000;
            setGameState('playing');
          }}
          onRestart={() =>
            startMatch({
              mode: gameMode,
              diff: difficulty,
              cat: category,
              rounds: roundsCount,
              time: timeLimit,
              playerNames: players.map((p) => p.name),
              roomCode,
              seed: roomCode,
            })
          }
          onHome={clearSavedSessionAndGoHome}
        />
      )}

      {/* 5. GAME OVER / PODIUM MODAL */}
      {gameState === 'gameover' && (
        <GameOverModal
          totalScore={totalScoreAll}
          correctCount={correctCountAll}
          totalRounds={matchCharacters.length || roundsCount}
          roundsPerPlayer={roundsCount}
          timeLimit={timeLimit}
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
              seed: roomCode,
            })
          }
          onHome={clearSavedSessionAndGoHome}
          roomCode={roomCode}
          playerScores={displayScoreboard}
          onRefreshOnlineRoom={refreshCloudRoomNow}
          onSubmitLeaderboard={handleLeaderboardSubmit}
        />
      )}

      {/* 6. MULTIPLAYER SETUP MODAL */}
      <MultiplayerSetupModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        initialRoomCode={initialRoomCode}
        initialHostName={initialHostName}
        onlineRoomPlayers={onlineRoomPlayers}
        recentRooms={recentRooms}
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
        onStartCreatedOnlineRoom={handleStartCreatedOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
        onViewOnlineRoomPodio={handleViewOnlineRoomPodio}
      />

      {/* 7. GLOBAL LEADERBOARD MODAL */}
      <GlobalLeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />
    </div>
  );
}
