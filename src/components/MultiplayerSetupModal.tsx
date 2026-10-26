/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Users, Globe, Copy, Check, Play, Shield, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES } from '../data/characters';
import { OnlinePlayerState, OnlineRoomConfig, buildShareableRoomUrl } from '../utils/onlineSync';

interface MultiplayerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomCode?: string;
  initialHostName?: string;
  onlineRoomPlayers?: OnlinePlayerState[];
  onStartPassAndPlay: (config: {
    players: string[];
    isTeams: boolean;
    difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
    category: string;
    roundsCount: number;
    timeLimit: number;
  }) => void;
  onCreateOnlineRoom: (config: {
    hostName: string;
    difficulty: 'facil' | 'medio' | 'dificil' | 'todas';
    category: string;
    roundsCount: number;
    timeLimit: number;
  }) => Promise<OnlineRoomConfig | null>;
  onStartCreatedOnlineRoom: () => void;
  onJoinOnlineRoom: (code: string, playerName: string) => Promise<boolean>;
}

export const MultiplayerSetupModal: React.FC<MultiplayerSetupModalProps> = ({
  isOpen,
  onClose,
  initialRoomCode,
  initialHostName,
  onlineRoomPlayers = [],
  onStartPassAndPlay,
  onCreateOnlineRoom,
  onStartCreatedOnlineRoom,
  onJoinOnlineRoom,
}) => {
  const [tab, setTab] = useState<'local' | 'online'>(initialRoomCode ? 'online' : 'local');

  // Local Pass & Play State
  const [isTeams, setIsTeams] = useState(false);
  const [player1Name, setPlayer1Name] = useState('Jugador 1');
  const [player2Name, setPlayer2Name] = useState('Jugador 2');
  const [roundsCount, setRoundsCount] = useState<number>(5);
  const [timeLimit, setTimeLimit] = useState<number>(45);
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil' | 'todas'>('medio');
  const [category, setCategory] = useState<string>('Todos');

  // Online Room State
  const [onlineAction, setOnlineAction] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [joinPlayerName, setJoinPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdConfig, setCreatedConfig] = useState<OnlineRoomConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync if initialRoomCode changes
  React.useEffect(() => {
    if (initialRoomCode) {
      setTab('online');
      setOnlineAction('join');
      setJoinCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  if (!isOpen) return null;

  const handleStartLocal = () => {
    onStartPassAndPlay({
      players: [player1Name.trim() || 'Jugador 1', player2Name.trim() || 'Jugador 2'],
      isTeams,
      difficulty,
      category,
      roundsCount,
      timeLimit,
    });
    onClose();
  };

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const cfg = await onCreateOnlineRoom({
        hostName: hostName.trim(),
        difficulty,
        category,
        roundsCount,
        timeLimit,
      });
      if (cfg) {
        setCreatedConfig(cfg);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !joinPlayerName.trim()) {
      setErrorMsg('Ingresa el código de la sala y tu nombre');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const ok = await onJoinOnlineRoom(joinCode.trim().toUpperCase(), joinPlayerName.trim());
      if (ok) {
        onClose();
      } else {
        setErrorMsg('Código inválido (debe tener al menos 4 letras/números)');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al unirse a la sala');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = createdConfig ? buildShareableRoomUrl(createdConfig) : '';

  const copyRoomLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-100">
                Modo Multijugador & Grupos
              </h2>
              <p className="text-xs text-stone-400">
                Juega frente a frente o desafía a amigos en línea
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de configuración multijugador"
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Local vs Online */}
        <div className="flex items-center gap-2 bg-stone-950/80 p-1.5 rounded-2xl border border-stone-800">
          <button
            type="button"
            onClick={() => setTab('local')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'local'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mismo Dispositivo (2 Jugadores / Equipos)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('online')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'online'
                ? 'bg-amber-600 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Desafío Online / Asincrónico</span>
          </button>
        </div>

        {/* TAB CONTENT: LOCAL PASS & PLAY */}
        {tab === 'local' && (
          <div className="space-y-4 pt-1">
            {/* 2 Players vs Teams toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsTeams(false);
                  setPlayer1Name('David');
                  setPlayer2Name('Salomón');
                }}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isTeams
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1 vs 1 (Parejas / Amigos)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTeams(true);
                  setPlayer1Name('Tribu de Judá');
                  setPlayer2Name('Tribu de Benjamín');
                }}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isTeams
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Por Equipos (Grupos / Iglesia)</span>
              </button>
            </div>

            {/* Names Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  {isTeams ? 'Nombre Equipo 1' : 'Jugador 1'}
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  {isTeams ? 'Nombre Equipo 2' : 'Jugador 2'}
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Common Game Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Dificultad por Edad
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="facil">Niños / Principiante</option>
                  <option value="medio">Jóvenes / Intermedio</option>
                  <option value="dificil">Adultos / Teólogos</option>
                  <option value="todas">Todas las edades</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Categoría Temática
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rounds & Timer limit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Rondas ({roundsCount} c/u)
                </label>
                <div className="flex gap-1.5">
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRoundsCount(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        roundsCount === num
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-950 border border-stone-800 text-stone-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Tiempo por Turno
                </label>
                <div className="flex gap-1.5">
                  {[30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimeLimit(sec)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        timeLimit === sec
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-950 border border-stone-800 text-stone-400'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartLocal}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all shadow-xl active:scale-[0.98] cursor-pointer mt-2"
            >
              <Play className="w-4 h-4 fill-stone-950" />
              <span>Comenzar Partida Multijugador</span>
            </button>
          </div>
        )}

        {/* TAB CONTENT: ONLINE / ASYNC CHALLENGE */}
        {tab === 'online' && (
          <div className="space-y-4 pt-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOnlineAction('create')}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  onlineAction === 'create'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Crear Nuevo Desafío</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineAction('join')}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  onlineAction === 'join'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Unirme con Código</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            {onlineAction === 'create' ? (
              !createdConfig ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-300 block mb-1">
                      Tu Nombre / Apodo como Creador
                    </label>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Ej. Papá, Mamá, Líder Andrés..."
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                      maxLength={25}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Dificultad
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="facil">Niños / Principiante</option>
                        <option value="medio">Jóvenes / Intermedio</option>
                        <option value="dificil">Adultos / Teólogos</option>
                        <option value="todas">Todas las edades</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Categoría
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rounds & Timer limit for Online Challenge */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Rondas ({roundsCount} c/u)
                      </label>
                      <div className="flex gap-1.5">
                        {[3, 5, 7, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setRoundsCount(num)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              roundsCount === num
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-950 border border-stone-800 text-stone-400'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-300 block mb-1">
                        Tiempo por Turno
                      </label>
                      <div className="flex gap-1.5">
                        {[30, 45, 60].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setTimeLimit(sec)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              timeLimit === sec
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-950 border border-stone-800 text-stone-400'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800 text-xs text-stone-400">
                    💡 <strong className="text-amber-300">Sala Conectada en Vivo:</strong> Comparte el enlace con tu hija o amigos. Verás en tiempo real cuando se unan y sus puntajes se actualizarán en vivo en ambos celulares.
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Generando Sala...' : 'Generar Código de Sala'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Created Room Code & Live Waiting Lobby */
                <div className="space-y-4 text-center py-2">
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40">
                    <span className="text-xs uppercase font-bold text-amber-400 block mb-1">
                      Código de Sala Generado
                    </span>
                    <div className="font-mono text-3xl sm:text-4xl font-black text-amber-200 tracking-widest my-2 select-all">
                      {createdConfig.code}
                    </div>
                    <p className="text-xs text-stone-300">
                      Envía este enlace por WhatsApp. El tiempo no empezará a correr hasta que pulses «Empezar a Jugar».
                    </p>
                  </div>

                  {/* Live Connected Players List */}
                  <div className="bg-stone-950/80 border border-amber-500/30 rounded-2xl p-3 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Jugadores en la Sala ({onlineRoomPlayers.length || 1})
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {createdConfig.roundsCount} rondas · {createdConfig.timeLimit}s
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(onlineRoomPlayers.length > 0
                        ? onlineRoomPlayers
                        : [{ id: 'host', name: createdConfig.hostName, score: 0 }]
                      ).map((p, i) => (
                        <span
                          key={p.id || i}
                          className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Share Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyRoomLink}
                        className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors border border-amber-500/30 cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `¡Te invito a jugar Adivina el Personaje Bíblico conmigo! Entra a nuestra sala (${createdConfig.code}) tocando este enlace: ${shareUrl}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer text-center"
                      >
                        <span>Enviar por WhatsApp</span>
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onStartCreatedOnlineRoom();
                        onClose();
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer mt-1"
                    >
                      <Play className="w-4 h-4 fill-stone-950" />
                      <span>¡Empezar a Jugar Ahora!</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Join Room Form */
              <div className="space-y-3">
                {initialRoomCode && (
                  <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      ¡{initialHostName ? <strong>{initialHostName}</strong> : 'Te'} ha invitado al desafío en la sala <strong>{initialRoomCode}</strong>! Ingresa tu nombre para entrar.
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Código de Sala
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Ej. F7K9X2"
                    maxLength={10}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-base font-mono tracking-widest text-center text-amber-300 uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Tu Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    value={joinPlayerName}
                    onChange={(e) => setJoinPlayerName(e.target.value)}
                    placeholder="Ej. Sofi, Mateo, Ruth..."
                    maxLength={20}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" />
                  <span>{loading ? 'Conectando a la Sala...' : 'Entrar al Desafío y Jugar'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
