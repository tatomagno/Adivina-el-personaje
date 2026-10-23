/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BiblicalCharacter } from '../data/characters';

interface CharacterArtworkProps {
  character: BiblicalCharacter;
  cluesUsed: number;
  revealed: boolean;
  isCorrect: boolean;
}

export const CharacterArtwork: React.FC<CharacterArtworkProps> = ({
  character,
  cluesUsed,
  revealed,
  isCorrect,
}) => {
  // Reveal clarity percentage: 0 clues = 15%, 1 = 35%, 2 = 55%, 3 = 75%, 4 = 90%, 5 = 100%
  const clarity = revealed ? 100 : Math.min(100, 15 + cluesUsed * 18);
  const blurAmount = revealed ? 0 : Math.max(0, 8 - cluesUsed * 1.6);
  const showColors = revealed || cluesUsed >= 2;

  // Render thematic biblical SVG scene based on character's iconType
  const renderThematicIcon = () => {
    switch (character.iconType) {
      case 'sling_harp':
        return (
          <g>
            {/* Arpa y Honda de David */}
            <path d="M70,40 Q130,20 130,90 Q130,150 70,160 Z" fill="none" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
            <line x1="80" y1="50" x2="80" y2="150" stroke="#FDE68A" strokeWidth="2" opacity="0.8" />
            <line x1="95" y1="55" x2="95" y2="145" stroke="#FDE68A" strokeWidth="2" opacity="0.8" />
            <line x1="110" y1="65" x2="110" y2="135" stroke="#FDE68A" strokeWidth="2" opacity="0.8" />
            {/* Piedras lisas */}
            <circle cx="140" cy="140" r="8" fill="#9CA3AF" stroke="#4B5563" strokeWidth="2" />
            <circle cx="155" cy="145" r="7" fill="#D1D5DB" stroke="#4B5563" strokeWidth="2" />
            <circle cx="145" cy="155" r="6" fill="#9CA3AF" stroke="#4B5563" strokeWidth="2" />
            {/* Corona flotante de rey */}
            <path d="M85,30 L95,15 L105,28 L115,15 L125,30 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
          </g>
        );

      case 'tablets_staff':
        return (
          <g>
            {/* Tablas de la Ley */}
            <rect x="75" y="45" width="24" height="45" rx="12" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
            <rect x="101" y="45" width="24" height="45" rx="12" fill="#E2E8F0" stroke="#475569" strokeWidth="3" />
            <line x1="80" y1="60" x2="94" y2="60" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <line x1="80" y1="70" x2="94" y2="70" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <line x1="106" y1="60" x2="120" y2="60" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <line x1="106" y1="70" x2="120" y2="70" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            {/* Vara con cayado */}
            <path d="M55,30 Q45,30 45,45 L45,170" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />
            {/* Rayos de luz del monte Sinaí */}
            <path d="M100,20 L90,5 M100,20 L100,2 M100,20 L110,5" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case 'ark_dove':
        return (
          <g>
            {/* Arca en las aguas */}
            <path d="M50,110 L150,110 L135,145 L65,145 Z" fill="#78350F" stroke="#451A03" strokeWidth="3" />
            <rect x="75" y="90" width="50" height="20" fill="#92400E" stroke="#451A03" strokeWidth="2" />
            {/* Olas */}
            <path d="M40,150 Q60,140 80,150 T120,150 T160,150" fill="none" stroke="#38BDF8" strokeWidth="4" />
            {/* Paloma con rama de olivo */}
            <path d="M120,50 Q135,35 150,45 Q140,55 125,55 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
            <path d="M150,45 L158,47" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arcoiris */}
            <path d="M60,60 Q100,20 140,60" fill="none" stroke="#F43F5E" strokeWidth="2" opacity="0.7" />
            <path d="M62,64 Q100,26 138,64" fill="none" stroke="#FBBF24" strokeWidth="2" opacity="0.7" />
            <path d="M64,68 Q100,32 136,68" fill="none" stroke="#38BDF8" strokeWidth="2" opacity="0.7" />
          </g>
        );

      case 'whale_fish':
        return (
          <g>
            {/* Gran pez */}
            <path d="M40,120 Q90,50 160,100 Q140,150 70,145 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="4" />
            <path d="M160,100 L180,85 L175,100 L180,115 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="3" />
            <circle cx="70" cy="115" r="5" fill="#FFFFFF" />
            <circle cx="68" cy="115" r="2.5" fill="#0F172A" />
            {/* Chorro de agua */}
            <path d="M85,90 Q80,50 65,45 M85,90 Q90,50 100,45" fill="none" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
            {/* Pequeña silueta de barco sobre las olas */}
            <path d="M110,40 L135,40 L125,52 Z" fill="#B45309" />
            <line x1="122" y1="28" x2="122" y2="40" stroke="#78350F" strokeWidth="2" />
            <path d="M122,28 L134,35 L122,38 Z" fill="#F8FAFC" />
          </g>
        );

      case 'lion_den':
      case 'lion_jawbone':
        return (
          <g>
            {/* Rostro majestuoso de león o melena */}
            <circle cx="100" cy="95" r="45" fill="#D97706" opacity="0.4" />
            <path d="M70,80 Q100,50 130,80 Q145,115 100,140 Q55,115 70,80 Z" fill="#B45309" stroke="#78350F" strokeWidth="3" />
            <circle cx="85" cy="85" r="5" fill="#FDE68A" stroke="#78350F" strokeWidth="2" />
            <circle cx="115" cy="85" r="5" fill="#FDE68A" stroke="#78350F" strokeWidth="2" />
            <path d="M95,105 L105,105 L100,115 Z" fill="#451A03" />
            {/* Barrotes de foso o quijada */}
            <line x1="50" y1="25" x2="50" y2="175" stroke="#71717A" strokeWidth="4" opacity="0.7" />
            <line x1="150" y1="25" x2="150" y2="175" stroke="#71717A" strokeWidth="4" opacity="0.7" />
            {/* Halo celestial que calma a las bestias */}
            <circle cx="100" cy="35" r="16" fill="none" stroke="#FBBF24" strokeWidth="3" strokeDasharray="3 3" />
          </g>
        );

      case 'cross_halo':
        return (
          <g>
            {/* Halo de luz glorioso */}
            <circle cx="100" cy="65" r="45" fill="#FEF08A" opacity="0.35" />
            <circle cx="100" cy="65" r="35" fill="none" stroke="#FBBF24" strokeWidth="4" />
            {/* Cruz sagrada */}
            <path d="M90,35 H110 V165 H90 Z M65,65 H135 V85 H65 Z" fill="#B45309" stroke="#78350F" strokeWidth="3" />
            {/* Destellos de resurrección */}
            <path d="M100,20 L100,5 M140,40 L155,30 M150,75 L165,75 M60,40 L45,30 M50,75 L35,75" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
            {/* Pan y Cáliz */}
            <circle cx="65" cy="150" r="12" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
            <path d="M125,135 L145,135 L140,155 L130,155 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          </g>
        );

      case 'crown_scepter':
        return (
          <g>
            {/* Corona persa enjoyada */}
            <path d="M60,95 L70,55 L85,75 L100,50 L115,75 L130,55 L140,95 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="3" />
            <circle cx="100" cy="50" r="6" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            <circle cx="70" cy="55" r="5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
            <circle cx="130" cy="55" r="5" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
            {/* Cetro real de oro extendido */}
            <line x1="50" y1="160" x2="145" y2="120" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
            <circle cx="145" cy="120" r="10" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          </g>
        );

      case 'fire_chariot':
        return (
          <g>
            {/* Llamas sagradas */}
            <path d="M70,140 Q60,90 90,60 Q105,95 115,70 Q130,110 120,140 Z" fill="#EF4444" opacity="0.8" />
            <path d="M80,140 Q75,100 95,80 Q105,105 110,85 Q120,115 115,140 Z" fill="#F59E0B" opacity="0.9" />
            {/* Rueda de carro de fuego */}
            <circle cx="100" cy="125" r="28" fill="none" stroke="#FCD34D" strokeWidth="5" />
            <line x1="100" y1="97" x2="100" y2="153" stroke="#FCD34D" strokeWidth="3" />
            <line x1="72" y1="125" x2="128" y2="125" stroke="#FCD34D" strokeWidth="3" />
            <path d="M90,30 Q100,10 110,30" fill="none" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" />
          </g>
        );

      case 'wheat_sheaves':
        return (
          <g>
            {/* Gavillas de trigo de Rut */}
            <path d="M85,160 Q85,100 65,70 Q95,90 95,160 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <path d="M105,160 Q105,90 125,65 Q100,90 100,160 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
            <path d="M95,160 Q95,75 95,50 Q105,80 95,160 Z" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
            {/* Espigas detalladas */}
            <ellipse cx="65" cy="65" rx="8" ry="14" transform="rotate(-25 65 65)" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <ellipse cx="125" cy="60" rx="8" ry="14" transform="rotate(25 125 60)" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
            <ellipse cx="95" cy="45" rx="8" ry="14" fill="#FDE68A" stroke="#B45309" strokeWidth="1.5" />
            {/* Lazo rojo */}
            <rect x="85" y="125" width="25" height="10" rx="3" fill="#DC2626" />
          </g>
        );

      default:
        return (
          <g>
            {/* Pergamino antiguo y luz profética */}
            <path d="M60,50 Q100,35 140,50 L135,140 Q95,155 55,140 Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="3" />
            <path d="M55,50 C55,40 65,40 70,50 L65,140" fill="none" stroke="#78350F" strokeWidth="3" />
            <line x1="75" y1="70" x2="120" y2="70" stroke="#B45309" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="75" y1="90" x2="120" y2="90" stroke="#B45309" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="75" y1="110" x2="110" y2="110" stroke="#B45309" strokeWidth="2" strokeDasharray="4 2" />
            {/* Corona / Sello de bendición */}
            <circle cx="100" cy="30" r="14" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
            <path d="M95,30 L100,25 L105,30 L100,35 Z" fill="#FEF3C7" />
          </g>
        );
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-[180px] xs:max-w-[220px] sm:max-w-[280px] md:max-w-[320px] mx-auto rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-amber-950/70 select-none">
      {/* Background celestial starry glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-stone-950" />

      {/* Decorative Golden Ornate Corners */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 rounded-tl pointer-events-none" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 rounded-tr pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 rounded-bl pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 rounded-br pointer-events-none" />

      {/* The Central Illustration SVG */}
      <div
        className="w-full h-full flex items-center justify-center transition-all duration-700 ease-out p-4"
        style={{
          filter: `blur(${blurAmount}px) ${showColors ? 'saturate(1.2)' : 'grayscale(0.85) brightness(0.7)'}`,
          opacity: Math.max(0.3, clarity / 100),
          transform: revealed ? 'scale(1.03)' : 'scale(1)',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)]"
        >
          {/* Ambient radiance aura */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="6 4" opacity="0.3" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.2" />

          {/* Render character theme */}
          {renderThematicIcon()}

          {/* Character silhouette bust */}
          <g opacity={revealed ? '0.9' : '0.7'}>
            <circle cx="100" cy="75" r="24" fill={character.gender === 'female' ? '#F43F5E' : '#3B82F6'} opacity="0.2" />
            <path d="M70,165 Q100,125 130,165 Z" fill="#FBBF24" opacity="0.15" />
          </g>
        </svg>
      </div>

      {/* Mystery Overlay when not revealed */}
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Halo ring pulse */}
            <div className="w-16 h-16 rounded-full border border-amber-400/40 animate-ping absolute" />
            <div className="w-14 h-14 rounded-full bg-stone-900/85 border border-amber-500/60 shadow-lg flex items-center justify-center">
              <span className="text-2xl font-serif font-black text-amber-300">?</span>
            </div>
          </div>
          <div className="mt-3 px-3 py-1 rounded-full bg-stone-900/90 border border-amber-500/30 text-amber-200/90 text-xs font-medium tracking-wide">
            {cluesUsed === 0
              ? 'Silueta misteriosa'
              : `Pistas pedidas: ${cluesUsed}/5 · Imagen al ${clarity}%`}
          </div>
        </div>
      )}

      {/* Correct / Victory Banner */}
      {revealed && (
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-stone-950/90 to-transparent flex flex-col items-center text-center animate-in fade-in duration-300">
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
            {character.category} · {character.testament} T.
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-100 drop-shadow-md">
            {character.name}
          </h2>
          <p className="text-xs text-stone-300 italic line-clamp-1 mt-0.5">
            "{character.title}"
          </p>
        </div>
      )}

      {/* Badges preview in corner */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[170px] pointer-events-none">
        {character.visualBadges.slice(0, cluesUsed >= 3 ? 3 : cluesUsed >= 1 ? 1 : 0).map((badge, i) => (
          <span
            key={i}
            className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
};
