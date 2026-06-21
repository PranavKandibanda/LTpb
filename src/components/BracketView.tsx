import React, { useEffect, useState } from 'react';
import {
  Trophy,
  AlertCircle,
  PartyPopper,
  Check,
  Sparkles,
  Users,
  Share2,
  ExternalLink
} from 'lucide-react';
import { BracketData } from '../types';
import { BracketRepository } from '../repositories/BracketRepository';

interface BracketViewProps {
  bracketId: string;
  onBack: () => void;
}

export default function BracketView({ bracketId, onBack }: BracketViewProps) {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await BracketRepository.getById(bracketId);
        if (!data) {
          setError('Bracket not found.');
          setLoading(false);
          return;
        }
        const now = new Date().toISOString();
        if (data.expiresAt < now) {
          setExpired(true);
          setBracket(data);
          setLoading(false);
          return;
        }
        setBracket(data);
      } catch {
        setError('Failed to load bracket.');
      }
      setLoading(false);
    };
    load();
  }, [bracketId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ccff80] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="bg-[#1A1D23] border border-[#2D3139] p-8 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-bold text-sm">{error || 'Bracket not available.'}</p>
        <button onClick={onBack} className="mt-4 text-xs text-brand-primary hover:underline">Back</button>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="bg-[#1A1D23] border border-[#2D3139] p-8 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
        <p className="text-white font-bold text-sm mb-1">This bracket has expired.</p>
        <p className="text-on-surface-variant text-[11px]">Brackets are auto-deleted 30 days after creation.</p>
        <button onClick={onBack} className="mt-4 text-xs text-brand-primary hover:underline">Back</button>
      </div>
    );
  }

  const bracketSize = bracket.bracketSize;
  const totalRounds = Math.log2(bracketSize);

  const getRoundName = (roundIdx: number): string => {
    const roundsLeft = totalRounds - roundIdx + 1;
    if (roundsLeft === 1) return 'FINALS';
    if (roundsLeft === 2) return 'SEMI FINALS';
    if (roundsLeft === 3) return 'QUARTER FINALS';
    return `ROUND OF ${Math.pow(2, roundsLeft)}`;
  };

  const getSeedPairings = (size: number): [number, number][] => {
    if (size === 8) return [[1, 8], [4, 5], [2, 7], [3, 6]];
    if (size === 16) return [[1, 16], [8, 9], [5, 12], [4, 13], [3, 14], [6, 11], [7, 10], [2, 15]];
    const pairings: [number, number][] = [];
    for (let i = 1; i <= 16; i++) pairings.push([i, 33 - i]);
    return pairings;
  };

  const round1Pairings = getSeedPairings(bracketSize);

  const getSlotBySeed = (seed: number) => bracket.slots.find(s => s.seedNumber === seed);

  const getCompetitor = (seed: number) => {
    const slot = getSlotBySeed(seed);
    if (!slot) return null;
    if (bracket.mode === 'solo') {
      return slot.p1 ? { id: slot.p1.id, name: slot.p1.name, elo: slot.p1.elo } : null;
    }
    if (slot.p1 && slot.p2) {
      return {
        id: `duo_seed_${seed}`,
        name: `${slot.p1.name.split(' ')[0]} & ${slot.p2.name.split(' ')[0]}`,
        elo: Math.round((slot.p1.elo + slot.p2.elo) / 2),
      };
    }
    return null;
  };

  const getParticipantForMatch = (roundIdx: number, matchIdx: number) => {
    if (roundIdx === 1) {
      const seeds = round1Pairings[matchIdx];
      return {
        p1: getCompetitor(seeds[0]),
        p1Seed: seeds[0],
        p2: getCompetitor(seeds[1]),
        p2Seed: seeds[1],
      };
    }
    const precedingRound = roundIdx - 1;
    const prevMatch1Index = matchIdx * 2;
    const prevMatch2Index = matchIdx * 2 + 1;
    return {
      p1: bracket.winnersMap[`${precedingRound}-${prevMatch1Index}`] || null,
      p1Seed: `Winner M${prevMatch1Index + 1}`,
      p2: bracket.winnersMap[`${precedingRound}-${prevMatch2Index}`] || null,
      p2Seed: `Winner M${prevMatch2Index + 1}`,
    };
  };

  const champion = bracket.winnersMap[`${totalRounds}-0`] || null;

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?bracketId=${bracketId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Shareable link copied to clipboard!');
    } catch {
      prompt('Copy this link to share:', url);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2D3139] pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-6 h-6 text-brand-primary" />
          <div>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              {bracket.tournamentName}
            </h2>
            <p className="text-on-surface-variant text-[11px] font-sans font-medium mt-0.5 flex items-center gap-2">
              <span>{bracket.mode === 'solo' ? 'Singles' : 'Doubles'} Bracket</span>
              <span>•</span>
              <span>{bracketSize} {bracket.mode === 'solo' ? 'Players' : 'Pairs'}</span>
              <span>•</span>
              <span>Created by {bracket.createdByName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="bg-[#1A1D23] hover:bg-[#252930] border border-[#2D3139] text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-primary" />
            <span>Share</span>
          </button>
          <button
            onClick={onBack}
            className="text-xs text-brand-primary hover:underline font-semibold transition-colors px-1"
          >
            Back
          </button>
        </div>
      </div>

      {/* Bracket Grid */}
      <div className="bg-[#1A1D23] border border-[#2D3139] p-6 rounded-2xl overflow-x-auto">
        <div className="border-b border-[#2D3139]/65 pb-2.5 mb-4 flex items-center justify-between">
          <h4 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span>Court Matrix Grid</span>
          </h4>
          <span className="text-[9px] text-on-surface-variant">
            Shared bracket — read-only view
          </span>
        </div>

        <div className="flex gap-8 py-4 px-1 min-w-[700px] select-none justify-between items-stretch">
          {Array.from({ length: totalRounds }).map((_, roundIdx) => {
            const currentRoundNumber = roundIdx + 1;
            const matchesCount = bracketSize / Math.pow(2, currentRoundNumber);

            return (
              <div key={roundIdx} className="flex-1 flex flex-col justify-around gap-6 min-w-[190px]">
                <div className="text-center font-display text-[9px] uppercase font-bold text-on-surface-variant tracking-wider bg-[#0c0e12] py-2 border border-[#2D3139] rounded-lg flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-brand-primary" />
                  <span>{getRoundName(currentRoundNumber)}</span>
                </div>

                <div className="flex-grow flex flex-col justify-around py-3 gap-4">
                  {Array.from({ length: matchesCount }).map((__, matchIdx) => {
                    const { p1, p1Seed, p2, p2Seed } = getParticipantForMatch(currentRoundNumber, matchIdx);
                    const key = `${currentRoundNumber}-${matchIdx}`;
                    const matchWinner = bracket.winnersMap[key];

                    return (
                      <div key={matchIdx}
                        className="bg-[#1A1D23] border border-[#2D3139] rounded-xl overflow-hidden"
                      >
                        <div className="bg-[#0c0e12] border-b border-[#2D3139] text-[8px] uppercase font-semibold text-on-surface-variant/90 py-1.5 px-2.5 flex justify-between">
                          <span>Match #{matchIdx + 1}</span>
                          {matchWinner && (
                            <span className="text-brand-primary font-black uppercase text-[7px] tracking-wider flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Checked
                            </span>
                          )}
                        </div>

                        <div className={`p-3 text-xs flex items-center justify-between ${
                          matchWinner && p1 && matchWinner.id === p1.id
                            ? 'bg-brand-primary/10 font-bold border-l-4 border-brand-primary'
                            : 'border-l-4 border-transparent'
                        }`}>
                          <span className="truncate max-w-[125px]">
                            {p1 ? p1.name : '—'}
                          </span>
                          <span className="font-mono text-[9px] bg-[#0c0e12] px-1.5 py-0.5 border border-[#2D3139] rounded text-on-surface-variant">
                            {p1 ? p1.elo : `SEED ${p1Seed}`}
                          </span>
                        </div>

                        <div className="border-t border-[#2D3139]/60" />

                        <div className={`p-3 text-xs flex items-center justify-between ${
                          matchWinner && p2 && matchWinner.id === p2.id
                            ? 'bg-brand-primary/10 font-bold border-l-4 border-brand-primary'
                            : 'border-l-4 border-transparent'
                        }`}>
                          <span className="truncate max-w-[125px]">
                            {p2 ? p2.name : '—'}
                          </span>
                          <span className="font-mono text-[9px] bg-[#0c0e12] px-1.5 py-0.5 border border-[#2D3139] rounded text-on-surface-variant">
                            {p2 ? p2.elo : `SEED ${p2Seed}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Champion Box */}
          <div className="flex flex-col justify-center gap-6 min-w-[200px]">
            <div className="text-center font-display text-[9px] uppercase font-bold text-brand-primary tracking-wider bg-brand-primary/10 py-2 border border-brand-primary/30 rounded-lg flex items-center justify-center gap-1">
              <PartyPopper className="w-3.5 h-3.5 text-brand-primary" />
              <span>CHAMPION</span>
            </div>
            <div className="flex-grow flex flex-col justify-center items-stretch py-3">
              <div className={`p-5 rounded-2xl border text-center transition-all ${
                champion
                  ? 'bg-brand-primary/15 border-brand-primary text-white font-extrabold'
                  : 'bg-[#0c0e12] border-[#2D3139] border-dashed text-on-surface-variant/55'
              }`}>
                {champion ? (
                  <div className="space-y-3.5">
                    <div className="w-12 h-12 rounded-full bg-brand-primary-container text-black border-2 border-brand-primary flex items-center justify-center font-black text-lg mx-auto shadow-lg">
                      🏆
                    </div>
                    <div className="space-y-0.5 text-center">
                      <h5 className="font-display text-sm font-black text-brand-primary uppercase tracking-tight">
                        {champion.name}
                      </h5>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        Bracket Victor • {champion.elo} ELO
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="text-3xl text-on-surface-variant/35 font-mono">🥇</div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                      Undecided
                    </p>
                    <p className="text-[9px] text-on-surface-variant/50 max-w-[140px] mx-auto leading-relaxed">
                      Complete preceding matchups to crown the champion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
