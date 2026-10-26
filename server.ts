/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory persistent stores with file backup
interface PlayerScore {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalTimeUsed: number;
  completedAt?: number;
}

interface GameRoom {
  code: string;
  hostName: string;
  category: string;
  difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
  roundsCount: number;
  timeLimit: number;
  seed: string;
  characterIds: string[];
  players: Record<string, PlayerScore>;
  status: 'waiting' | 'active' | 'finished';
  createdAt: number;
}

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

// In-memory state
const rooms: Map<string, GameRoom> = new Map();
const leaderboard: LeaderboardEntry[] = [
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
  {
    id: 'seed-5',
    name: 'Tribu de Judá',
    score: 4120,
    difficulty: 'dificil',
    correctAnswers: 4,
    totalRounds: 5,
    groupName: 'Campamento Central',
    mode: 'equipos',
    createdAt: Date.now() - 3600000 * 40,
  },
];

// Helper to generate a clean 6-character room code
function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

// REST API ROUTES
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Create Room
app.post('/api/rooms/create', (req, res) => {
  try {
    const { hostName, category, difficulty, roundsCount, timeLimit, characterIds, seed } = req.body;
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const hostId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRoom: GameRoom = {
      code,
      hostName: hostName || 'Anfitrión',
      category: category || 'Todos',
      difficulty: difficulty || 'medio',
      roundsCount: roundsCount || 5,
      timeLimit: timeLimit || 45,
      seed: seed || `${code}-${Date.now()}`,
      characterIds: characterIds || [],
      players: {
        [hostId]: {
          id: hostId,
          name: hostName || 'Anfitrión',
          score: 0,
          correctAnswers: 0,
          totalTimeUsed: 0,
        },
      },
      status: 'waiting',
      createdAt: Date.now(),
    };

    rooms.set(code, newRoom);
    res.json({ success: true, room: newRoom, playerId: hostId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Room
app.get('/api/rooms/:code', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Sala no encontrada' });
  }
  res.json({ success: true, room });
});

// Join Room
app.post('/api/rooms/:code/join', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { playerName } = req.body;
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ success: false, error: 'Sala no encontrada' });
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  room.players[playerId] = {
    id: playerId,
    name: playerName || `Participante ${Object.keys(room.players).length + 1}`,
    score: 0,
    correctAnswers: 0,
    totalTimeUsed: 0,
  };

  res.json({ success: true, room, playerId });
});

// Submit Round / Full Run for an Async Challenge
app.post('/api/rooms/:code/submit', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { playerId, playerName, score, correctAnswers, totalTimeUsed } = req.body;
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ success: false, error: 'Sala no encontrada' });
  }

  const pid = playerId || `guest_${Date.now()}`;
  room.players[pid] = {
    id: pid,
    name: playerName || 'Jugador',
    score: Number(score) || 0,
    correctAnswers: Number(correctAnswers) || 0,
    totalTimeUsed: Number(totalTimeUsed) || 0,
    completedAt: Date.now(),
  };

  res.json({ success: true, room });
});

// Global Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const { difficulty } = req.query;
  let results = [...leaderboard];

  if (difficulty && difficulty !== 'todas') {
    results = results.filter((entry) => entry.difficulty === difficulty);
  }

  results.sort((a, b) => b.score - a.score);
  res.json({ success: true, leaderboard: results.slice(0, 50) });
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { name, score, difficulty, correctAnswers, totalRounds, groupName, mode } = req.body;
    if (!name || score === undefined) {
      return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    const newEntry: LeaderboardEntry = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim().substring(0, 30),
      score: Math.max(0, Math.round(Number(score))),
      difficulty: difficulty || 'medio',
      correctAnswers: Number(correctAnswers) || 0,
      totalRounds: Number(totalRounds) || 5,
      groupName: groupName ? String(groupName).trim().substring(0, 40) : undefined,
      mode: mode || 'solo',
      createdAt: Date.now(),
    };

    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep top 100
    if (leaderboard.length > 100) {
      leaderboard.splice(100);
    }

    res.json({ success: true, entry: newEntry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Integration with Vite dev or production static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
