/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OnlinePlayerState {
  id: string;
  name: string;
  score: number;
  correctCount: number;
  turnsPlayed: number;
  totalRounds: number;
  completed: boolean;
  updatedAt: number;
}

export interface OnlineRoomConfig {
  code: string;
  hostName: string;
  difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
  category: string;
  roundsCount: number;
  timeLimit: number;
  seed: string;
}

export interface OnlineRoomSnapshot {
  config?: OnlineRoomConfig;
  players: Record<string, OnlinePlayerState>;
}

type RoomEventPayload =
  | {
      type: 'room_created';
      config: OnlineRoomConfig;
      hostPlayer: OnlinePlayerState;
    }
  | {
      type: 'player_update';
      player: OnlinePlayerState;
    };

const TOPIC_PREFIX = 'adivina_biblico_v2_room_';
const LEADERBOARD_TOPIC = 'adivina_biblico_v2_leaderboard_global';

function getTopicUrl(code: string) {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `https://ntfy.sh/${TOPIC_PREFIX}${clean}`;
}

/**
 * Publishes an event to the shared cloud room channel (works from static GitHub Pages).
 */
export async function publishRoomEvent(code: string, payload: RoomEventPayload): Promise<void> {
  try {
    await fetch(getTopicUrl(code), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Cloud room publish warning:', err);
  }
}

/**
 * Parses NDJSON lines from ntfy into an aggregated OnlineRoomSnapshot.
 */
export function reduceRoomEvents(rawLines: string[], existing?: OnlineRoomSnapshot): OnlineRoomSnapshot {
  const snapshot: OnlineRoomSnapshot = {
    config: existing?.config,
    players: { ...(existing?.players || {}) },
  };

  for (const line of rawLines) {
    if (!line.trim()) continue;
    try {
      const envelope = JSON.parse(line);
      if (envelope.event !== 'message' || !envelope.message) continue;
      const payload = JSON.parse(envelope.message) as RoomEventPayload;

      if (payload.type === 'room_created') {
        snapshot.config = payload.config;
        if (payload.hostPlayer) {
          const prev = snapshot.players[payload.hostPlayer.id];
          if (!prev || payload.hostPlayer.updatedAt >= prev.updatedAt) {
            snapshot.players[payload.hostPlayer.id] = payload.hostPlayer;
          }
        }
      } else if (payload.type === 'player_update' && payload.player) {
        const prev = snapshot.players[payload.player.id];
        if (!prev || payload.player.updatedAt >= prev.updatedAt) {
          snapshot.players[payload.player.id] = payload.player;
        }
      }
    } catch {
      // Ignore malformed line
    }
  }

  return snapshot;
}

/**
 * Fetches full history of a room from the cloud relay.
 */
export async function fetchCloudRoomSnapshot(code: string): Promise<OnlineRoomSnapshot> {
  try {
    const res = await fetch(`${getTopicUrl(code)}/json?poll=1&since=all`);
    if (!res.ok) return { players: {} };
    const text = await res.text();
    const lines = text.split('\n');
    return reduceRoomEvents(lines);
  } catch {
    return { players: {} };
  }
}

/**
 * Subscribes to live room updates via Server-Sent Events (SSE) + periodic poll backup.
 */
export function subscribeToCloudRoom(
  code: string,
  onUpdate: (snapshot: OnlineRoomSnapshot) => void
): () => void {
  let currentSnapshot: OnlineRoomSnapshot = { players: {} };
  let isClosed = false;
  let es: EventSource | null = null;

  const refreshFromPoll = async () => {
    if (isClosed) return;
    const snap = await fetchCloudRoomSnapshot(code);
    if (isClosed) return;
    currentSnapshot = reduceRoomEvents([], {
      config: snap.config || currentSnapshot.config,
      players: { ...currentSnapshot.players, ...snap.players },
    });
    onUpdate(currentSnapshot);
  };

  // Initial fetch
  refreshFromPoll();

  // Real-time SSE stream
  try {
    es = new EventSource(`${getTopicUrl(code)}/sse?since=all`);
    es.onmessage = (event) => {
      if (isClosed || !event.data) return;
      currentSnapshot = reduceRoomEvents([event.data], currentSnapshot);
      onUpdate(currentSnapshot);
    };
  } catch {
    // Fallback to polling only
  }

  // Backup poll every 4 seconds in case mobile browser suspends SSE
  const interval = setInterval(refreshFromPoll, 4000);

  return () => {
    isClosed = true;
    clearInterval(interval);
    if (es) {
      es.close();
    }
  };
}

/**
 * Encodes room configuration into compact query parameters so links work even offline/instantaneously.
 */
export function buildShareableRoomUrl(config: OnlineRoomConfig): string {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();
  params.set('room', config.code);
  params.set('d', config.difficulty);
  params.set('r', String(config.roundsCount));
  params.set('t', String(config.timeLimit));
  if (config.category && config.category !== 'Todos') {
    params.set('c', config.category);
  }
  if (config.hostName) {
    params.set('h', config.hostName);
  }
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Publishes a global leaderboard entry to the shared cloud channel.
 */
export async function publishGlobalLeaderboardEntry(entry: any): Promise<void> {
  try {
    await fetch(`https://ntfy.sh/${LEADERBOARD_TOPIC}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(entry),
    });
  } catch {}
}

/**
 * Fetches global leaderboard entries from the shared cloud channel.
 */
export async function fetchGlobalLeaderboardEntries(): Promise<any[]> {
  try {
    const res = await fetch(`https://ntfy.sh/${LEADERBOARD_TOPIC}/json?poll=1&since=all`);
    if (!res.ok) return [];
    const text = await res.text();
    const entries: any[] = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const env = JSON.parse(line);
        if (env.event === 'message' && env.message) {
          const item = JSON.parse(env.message);
          if (item && item.name && typeof item.score === 'number') {
            entries.push(item);
          }
        }
      } catch {}
    }
    return entries;
  } catch {
    return [];
  }
}
