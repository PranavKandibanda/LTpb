import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  RotateCcw, 
  Check, 
  Users, 
  User, 
  Save, 
  Sparkles, 
  PartyPopper,
  AlertCircle
} from 'lucide-react';
import { Player } from '../types';

interface DuoTeam {
  id: string;
  name: string;
  p1: Player;
  p2: Player;
  elo: number;
}

interface TournamentBuilderViewProps {
  players: Player[];
  setActiveScreen: (screen: any) => void;
}

export default function TournamentBuilderView({ players, setActiveScreen }: TournamentBuilderViewProps) {
  // Mode tabs
  const [mode, setMode] = useState<'solo' | 'duo'>('solo');
  const [draftMode, setDraftMode] = useState<'auto' | 'manual'>('auto');
  const [bracketSize, setBracketSize] = useState(8);
  const [tournamentName, setTournamentName] = useState('Neon Open Invitationals 2026');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Roster arrays
  const activeSoloPlayers = players.filter(p => p.status === 'active');
  
  // Custom Dynamic Doubles pairings selected on-the-fly
  const [customDuoSlots, setCustomDuoSlots] = useState<Record<number, { p1: Player | null; p2: Player | null }>>({});
  const [assigningSeed, setAssigningSeed] = useState<number | null>(null);
  const [tempP1, setTempP1] = useState<Player | null>(null);

  // Auto-draft pool for doubles mode (player IDs)
  const [autoDraftPool, setAutoDraftPool] = useState<string[]>([]);

  // Selected competitors array for Solo mode
  const [selectedSoloIds, setSelectedSoloIds] = useState<string[]>([]);

  // Bracket state representation: round winner maps
  // Key: `${roundIdx}-${matchIdx}`, Value: winner competitor object (Player or DuoTeam)
  const [winnersMap, setWinnersMap] = useState<Record<string, any>>({});

  // Reset winner Map on selection changes
  const resetWinners = () => {
    setWinnersMap({});
  };

  const handleResetAll = () => {
    setSelectedSoloIds([]);
    setCustomDuoSlots({});
    setAutoDraftPool([]);
    setWinnersMap({});
    setTempP1(null);
    setAssigningSeed(null);
  };

  // Switch modes
  const handleModeChange = (newMode: 'solo' | 'duo') => {
    setMode(newMode);
    setDraftMode('auto');
    handleResetAll();
    setSearchMemberQuery('');
  };

  // Switch size
  const handleSizeChange = (newSize: number) => {
    setBracketSize(Math.max(2, Math.min(32, newSize)));
    handleResetAll();
    setSearchMemberQuery('');
  };

  // Switch draft mode (auto vs manual for doubles)
  const handleDraftModeChange = (newDraft: 'auto' | 'manual') => {
    setDraftMode(newDraft);
    setCustomDuoSlots({});
    setAutoDraftPool([]);
    setWinnersMap({});
    setTempP1(null);
    setAssigningSeed(null);
    setSearchMemberQuery('');
  };

  // Toggle player in auto-draft pool
  const toggleAutoDraftPlayer = (id: string) => {
    resetWinners();
    setCustomDuoSlots({});
    if (autoDraftPool.includes(id)) {
      setAutoDraftPool(autoDraftPool.filter(x => x !== id));
    } else {
      if (autoDraftPool.length < bracketSize * 2) {
        const nextPool = [...autoDraftPool, id];
        setAutoDraftPool(nextPool);
        // Auto-generate pairs when pool is full
        if (nextPool.length === bracketSize * 2) {
          autoGeneratePairs(nextPool);
        }
      }
    }
  };

  // Auto-generate balanced pairs from a pool of player IDs
  const autoGeneratePairs = (poolIds: string[]) => {
    const poolPlayers = poolIds
      .map(id => activeSoloPlayers.find(p => p.id === id))
      .filter(Boolean) as Player[];
    // Sort by ELO descending
    const sorted = [...poolPlayers].sort((a, b) => b.elo - a.elo);
    const n = sorted.length / 2;
    // Pair highest with lowest, 2nd highest with 2nd lowest, etc.
    const pairs: Record<number, { p1: Player; p2: Player }> = {};
    for (let i = 0; i < n; i++) {
      pairs[i + 1] = { p1: sorted[i], p2: sorted[sorted.length - 1 - i] };
    }
    // Sort pairs by avg ELO descending for seeding
    const sortedPairs = Object.entries(pairs)
      .map(([seed, pair]) => ({
        seed: Number(seed),
        avgElo: (pair.p1.elo + pair.p2.elo) / 2,
        p1: pair.p1,
        p2: pair.p2
      }))
      .sort((a, b) => b.avgElo - a.avgElo);
    // Assign to seed slots
    const newSlots: Record<number, { p1: Player | null; p2: Player | null }> = {};
    sortedPairs.forEach((entry, idx) => {
      newSlots[idx + 1] = { p1: entry.p1, p2: entry.p2 };
    });
    setCustomDuoSlots(newSlots);
  };

  // Compute next power of 2 >= n
  const getNextPowerOf2 = (n: number): number => {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  };

  const actualBracketSize = getNextPowerOf2(bracketSize);
  const byeCount = actualBracketSize - bracketSize;

  // Toggle competitor added (Solo mode only)
  const toggleSoloCompetitor = (id: string) => {
    resetWinners();
    if (selectedSoloIds.includes(id)) {
      setSelectedSoloIds(selectedSoloIds.filter(x => x !== id));
    } else {
      if (selectedSoloIds.length < bracketSize) {
        setSelectedSoloIds([...selectedSoloIds, id]);
      }
    }
  };

  // Get selected competitors sorted by ELO (this forms the Seeds: seed 1 is largest ELO...)
  const getSeededCompetitors = () => {
    if (mode === 'solo') {
      const items = activeSoloPlayers.filter(p => selectedSoloIds.includes(p.id));
      return [...items].sort((a, b) => b.elo - a.elo);
    }
    return [];
  };

  const seededCompetitors = getSeededCompetitors();

  // Helper to retrieve competitor of seed 1-indexed (Seed 1 is the 1st element, Seed 2 is 2nd...)
  const getCompetitorBySeed = (seedNumber: number) => {
    if (mode === 'solo') {
      if (seedNumber > seededCompetitors.length) return null;
      return seededCompetitors[seedNumber - 1]; // 0-indexed array
    } else {
      // In Duo mode, we retrieve configured team on the fly
      const slot = customDuoSlots[seedNumber];
      if (!slot || !slot.p1 || !slot.p2) return null;
      
      const p1 = slot.p1;
      const p2 = slot.p2;
      const avgElo = Math.round((p1.elo + p2.elo) / 2);
      const name = `${p1.name.split(' ')[0]} & ${p2.name.split(' ')[0]}`;
      
      return {
        id: `custom_duo_seed_${seedNumber}`,
        name: name,
        p1: p1,
        p2: p2,
        elo: avgElo
      };
    }
  };

  // Standard tournament pairing order — works for any bracket size
  const getSeedPairings = (size: number): [number, number][] => {
    const actual = getNextPowerOf2(size);
    const pairings: [number, number][] = [];
    // Standard recursive bracket seeding for actual size
    const seeds = Array.from({ length: actual }, (_, i) => i + 1);
    // Build bracket order via bit-reversal
    const bracketOrder: number[] = [];
    const log2 = Math.log2(actual);
    for (let i = 0; i < actual; i++) {
      let rev = 0;
      let x = i;
      for (let j = 0; j < log2; j++) {
        rev = (rev << 1) | (x & 1);
        x >>= 1;
      }
      bracketOrder.push(seeds[rev]);
    }
    // Pair adjacent elements
    for (let i = 0; i < actual; i += 2) {
      pairings.push([bracketOrder[i], bracketOrder[i + 1]]);
    }
    return pairings;
  };

  const allSeedPairings = getSeedPairings(bracketSize);

  // Round 1 pairings include BYE matchups for proper bracket rendering
  const round1Pairings = allSeedPairings;

  // Seeds that get byes (advance automatically to round 2)
  const byeSeeds = allSeedPairings
    .filter(([a, b]) => a > bracketSize || b > bracketSize)
    .map(([a, b]) => (a <= bracketSize ? a : b));

  // Check if a round 1 matchup is a BYE
  const isByeMatchup = (pairing: [number, number]): boolean => {
    return pairing[0] > bracketSize || pairing[1] > bracketSize;
  };

  // Get the real seed from a BYE matchup
  const getRealSeedFromBye = (pairing: [number, number]): number => {
    return pairing[0] <= bracketSize ? pairing[0] : pairing[1];
  };

  // Advanced winners propagation logic
  const advanceCompetitor = (roundIdx: number, matchIdx: number, competitor: any) => {
    if (!competitor) return;

    const key = `${roundIdx}-${matchIdx}`;
    
    // Set the winner for this match
    const nextWinnersMap = { ...winnersMap, [key]: competitor };

    // Clear downstream dependent matches
    let currentRound = roundIdx + 1;
    let indexToCheck = Math.floor(matchIdx / 2);

    while (currentRound <= Math.log2(actualBracketSize)) {
      const downstreamKey = `${currentRound}-${indexToCheck}`;
      if (nextWinnersMap[downstreamKey]) {
        delete nextWinnersMap[downstreamKey];
      }
      currentRound++;
      indexToCheck = Math.floor(indexToCheck / 2);
    }

    setWinnersMap(nextWinnersMap);
  };

  // Recurse or pull participant for any match position
  const getParticipantForMatch = (roundIdx: number, matchIdx: number): { p1: any | null, p1Seed: number | string, p2: any | null, p2Seed: number | string } => {
    if (roundIdx === 1) {
      const seeds = round1Pairings[matchIdx];
      if (!seeds) return { p1: null, p1Seed: '?', p2: null, p2Seed: '?' };
      const competitor1 = getCompetitorBySeed(seeds[0]);
      const competitor2 = getCompetitorBySeed(seeds[1]);
      return {
        p1: competitor1,
        p1Seed: seeds[0],
        p2: competitor2,
        p2Seed: seeds[1]
      };
    }

    const precedingRound = roundIdx - 1;
    const prevMatch1Index = matchIdx * 2;
    const prevMatch2Index = matchIdx * 2 + 1;

    const comp1 = winnersMap[`${precedingRound}-${prevMatch1Index}`] || null;
    const comp2 = winnersMap[`${precedingRound}-${prevMatch2Index}`] || null;

    return {
      p1: comp1,
      p1Seed: `Winner M${prevMatch1Index + 1}`,
      p2: comp2,
      p2Seed: `Winner M${prevMatch2Index + 1}`
    };
  };

  // Determine rounds titles based on actual bracket size
  const getRoundName = (roundIdx: number): string => {
    const totalRounds = Math.log2(actualBracketSize);
    const roundsLeft = totalRounds - roundIdx + 1;

    if (roundsLeft === 1) return 'FINALS';
    if (roundsLeft === 2) return 'SEMI FINALS';
    if (roundsLeft === 3) return 'QUARTER FINALS';
    return `ROUND OF ${Math.pow(2, roundsLeft)}`;
  };

  // Search filtered member list for the left sidebar column (Solo Mode)
  const filteredSoloRoster = activeSoloPlayers.filter(item => {
    return item.name.toLowerCase().includes(searchMemberQuery.toLowerCase());
  });

  // Number of elements fully resolved
  const addedCount = mode === 'solo' 
    ? selectedSoloIds.length 
    : mode === 'duo' && draftMode === 'auto'
      ? Math.floor(autoDraftPool.length / 2)
      : Object.keys(customDuoSlots).filter(k => {
          const slot = customDuoSlots[Number(k)];
          return slot && slot.p1 && slot.p2;
        }).length;

  const isFilled = mode === 'solo'
    ? selectedSoloIds.length === bracketSize
    : mode === 'duo' && draftMode === 'auto'
      ? autoDraftPool.length === bracketSize * 2
      : addedCount === bracketSize;

  // Retrieve overall Champion candidate
  const totalRoundsCount = Math.log2(actualBracketSize);
  const champion = winnersMap[`${totalRoundsCount}-0`] || null;

  // Save / load config to local storage
  const handleSaveTournamentState = () => {
    const dataToSave = {
      tournamentName,
      mode,
      draftMode,
      bracketSize,
      selectedSoloIds,
      customDuoSlots,
      autoDraftPool,
      winnersMap
    };
    localStorage.setItem(`pb_tournament_save_${mode}_${draftMode}_${bracketSize}`, JSON.stringify(dataToSave));
    alert('Tournament configuration and dynamic partner pairings saved locally!');
  };

  useEffect(() => {
    const saved = localStorage.getItem(`pb_tournament_save_${mode}_${draftMode}_${bracketSize}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTournamentName(parsed.tournamentName || 'Neon Open Invitationals 2026');
        if (parsed.selectedSoloIds) {
          setSelectedSoloIds(parsed.selectedSoloIds);
        }
        if (parsed.customDuoSlots) {
          setCustomDuoSlots(parsed.customDuoSlots);
        }
        if (parsed.autoDraftPool) {
          setAutoDraftPool(parsed.autoDraftPool);
        }
        if (parsed.draftMode) {
          setDraftMode(parsed.draftMode);
        }
        if (parsed.winnersMap) {
          setWinnersMap(parsed.winnersMap);
        }
      } catch (err) {
        console.error('Failed to load saved tournament state', err);
      }
    }
  }, [mode, bracketSize, draftMode]);

  // Auto-advance BYE seeds when players/slots change
  useEffect(() => {
    if (byeCount === 0) return;

    const updatedMap = { ...winnersMap };
    let changed = false;

    allSeedPairings.forEach((pairing, idx) => {
      if (!isByeMatchup(pairing)) return;
      const realSeed = getRealSeedFromBye(pairing);
      const key = `1-${idx}`;
      const realCompetitor = getCompetitorBySeed(realSeed);
      if (realCompetitor && !updatedMap[key]) {
        updatedMap[key] = realCompetitor;
        changed = true;
      }
    });

    if (changed) setWinnersMap(updatedMap);
  }, [selectedSoloIds, customDuoSlots, bracketSize, autoDraftPool, draftMode]);

  // List of players already taken across all Duo slots to prevent "double booking"
  const getDuoAlreadyAssignedIds = () => {
    const entries = Object.entries(customDuoSlots) as [string, { p1: Player | null; p2: Player | null }][];
    return entries.flatMap(([sId, pair]) => {
      // Skip the slot we're currently configuring so we can edit it
      if (Number(sId) === assigningSeed) return [];
      const list = [];
      if (pair.p1) list.push(pair.p1.id);
      if (pair.p2) list.push(pair.p2.id);
      return list;
    });
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* 1. TOP HEADER SHELL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2D3139] pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-6 h-6 text-brand-primary" />
          <div>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              Bracket Builder
            </h2>
            <p className="text-on-surface-variant text-[11px] font-sans font-medium mt-0.5">
              Live tournament setups. Toggle modes and tap matchups to seed members directly.
            </p>
          </div>
        </div>

        {/* Mode switcher, alerts & rankings lookups */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          
          <div className="hidden md:flex bg-[#1A1D23] border border-[#2D3139] rounded-lg px-3 py-1.5 items-center gap-2 text-xs text-on-surface-variant max-w-sm">
            <AlertCircle className="w-4 h-4 text-brand-secondary shrink-0" />
            <span className="text-[10px] leading-snug">
              Matches inside the builder do not alter persistent ELO values.
            </span>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-[#0c0e12] p-1 rounded-lg border border-[#2D3139]">
            <button
              onClick={() => handleModeChange('solo')}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all tracking-wider ${
                mode === 'solo' 
                  ? 'bg-brand-primary text-black font-extrabold' 
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => handleModeChange('duo')}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all tracking-wider ${
                mode === 'duo' 
                  ? 'bg-brand-primary text-black font-extrabold' 
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Doubles
            </button>
          </div>

          {/* Draft mode toggle — only visible in doubles */}
          {mode === 'duo' && (
            <div className="flex bg-[#0c0e12] p-1 rounded-lg border border-[#2D3139]">
              <button
                onClick={() => handleDraftModeChange('auto')}
                className={`px-2.5 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold uppercase transition-all tracking-wider ${
                  draftMode === 'auto'
                    ? 'bg-brand-secondary text-black font-extrabold'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => handleDraftModeChange('manual')}
                className={`px-2.5 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold uppercase transition-all tracking-wider ${
                  draftMode === 'manual'
                    ? 'bg-brand-secondary text-black font-extrabold'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Manual
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveScreen('dashboard')}
            className="hidden md:inline text-xs text-brand-primary hover:underline hover:text-brand-primary-container font-semibold transition-colors px-1"
          >
            Dashboard
          </button>

          <div className="hidden md:block relative">
            <input
              type="text"
              placeholder="Search Global Rankings..."
              onClick={() => setActiveScreen('leaderboard')}
              className="bg-[#1A1D23] border border-[#2D3139] hover:border-brand-primary/40 rounded-lg p-2 pl-8 pr-3 text-[10px] text-white focus:outline-none focus:border-brand-primary cursor-pointer w-44 transition-all"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
          </div>

        </div>
      </div>

      {/* 2. BRACKET CONTROLS ROW */}
      <div className="bg-[#1A1D23] border border-[#2D3139] p-5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 shadow-lg">
        
        {/* Title Input field */}
        <div className="flex-grow max-w-md">
          <label className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">
            Tournament Title ({mode === 'solo' ? 'Singles Division' : 'Doubles Division'})
          </label>
          <input
            type="text"
            className="bg-[#0f1115] border border-[#2D3139] rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-brand-primary w-full transition-colors"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
          />
        </div>

        {/* Round Scale sizing controls */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider block">
            Number of {mode === 'solo' ? 'Players' : 'Pairs'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={2}
              max={32}
              value={bracketSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) handleSizeChange(v);
              }}
              className="bg-[#0f1115] border border-[#2D3139] rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-brand-primary w-20 text-center transition-colors"
            />
            {byeCount > 0 && (
              <span className="text-[10px] text-on-surface-variant font-mono">
                ({byeCount} bye{byeCount > 1 ? 's' : ''} → {actualBracketSize}-player bracket)
              </span>
            )}
            {byeCount === 0 && bracketSize > 2 && (
              <span className="text-[10px] text-on-surface-variant font-mono">
                (power of 2 — no byes)
              </span>
            )}
          </div>
        </div>

        {/* Options buttons */}
        <div className="flex items-end gap-2 shrink-0 md:pt-4">
          <button
            onClick={handleSaveTournamentState}
            className="bg-[#1A1D23] hover:bg-[#252930] border border-[#2D3139] text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-3 rounded-xl flex items-center gap-1.5 select-none hover:opacity-95 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-brand-primary" />
            <span>Save State</span>
          </button>
          
          <button
            onClick={handleResetAll}
            className="bg-[#1A1D23] hover:bg-[#252930] border border-[#2D3139] hover:border-red-400/40 text-on-surface-variant hover:text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-3 rounded-xl flex items-center gap-1.5 select-none transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bracket</span>
          </button>
        </div>

      </div>

      {/* 3. DOUBLE-COLUMN CORE VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: SEED ROSTER OR CONFIG PANEL */}
        <div className="lg:col-span-4 bg-[#1A1D23] border border-[#2D3139] p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
          
          {mode === 'solo' ? (
            /* SOLO MODE: SINGLES SEED LIST */
            <>
              <div className="border-b border-[#2D3139]/60 pb-2">
                <h4 className="font-display text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span>Configure Singles</span>
                </h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  Tap active club players to populate seeds. Sorted and paired automatically by player ELO.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search club members..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="bg-[#0f1115] border border-[#2D3139] rounded-lg p-2.5 pl-9 text-xs text-white focus:outline-none focus:border-brand-primary w-full"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              </div>

              <div className="max-h-96 overflow-y-auto pr-1 flex flex-col gap-2 no-scrollbar">
                {filteredSoloRoster.map((item) => {
                  const isAdded = selectedSoloIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSoloCompetitor(item.id)}
                      className={`border p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isAdded 
                          ? 'bg-brand-primary/10 border-brand-primary text-white font-bold' 
                          : 'bg-[#0f1115] border-[#2D3139] text-on-surface-variant hover:bg-[#252930] hover:border-[#2D3139]/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img referrerPolicy="no-referrer" src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full border border-[#2D3139] object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1A1D23] border border-[#2D3139] flex items-center justify-center font-bold text-xs text-brand-primary capitalize">
                            {item.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="text-left">
                          <p className={`text-xs ${isAdded ? 'text-white font-bold' : 'text-white/90'}`}>{item.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                            ELO: <strong className={isAdded ? 'text-brand-primary' : ''}>{item.elo}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1">
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors ${
                          isAdded ? 'border-brand-primary bg-brand-primary text-black' : 'border-[#2D3139] bg-transparent'
                        }`}>
                          {isAdded && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredSoloRoster.length === 0 && (
                  <p className="text-center py-6 text-on-surface-variant text-xs">No matching club players found.</p>
                )}
              </div>
            </>
          ) : mode === 'duo' && draftMode === 'auto' ? (
            /* DUO AUTO-DRAFT: POOL SELECTOR */
            <>
              <div className="border-b border-[#2D3139]/60 pb-2">
                <h4 className="font-display text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-secondary" />
                  <span>Auto-Draft Pool</span>
                </h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                  Pick {bracketSize * 2} players. System auto-creates balanced pairs seeded by ELO.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search club members..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="bg-[#0f1115] border border-[#2D3139] rounded-lg p-2.5 pl-9 text-xs text-white focus:outline-none focus:border-brand-primary w-full"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              </div>

              <div className="max-h-64 overflow-y-auto pr-1 flex flex-col gap-2 no-scrollbar">
                {filteredSoloRoster.map((item) => {
                  const isAdded = autoDraftPool.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleAutoDraftPlayer(item.id)}
                      className={`border p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isAdded 
                          ? 'bg-brand-secondary/10 border-brand-secondary text-white font-bold' 
                          : 'bg-[#0f1115] border-[#2D3139] text-on-surface-variant hover:bg-[#252930] hover:border-[#2D3139]/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img referrerPolicy="no-referrer" src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full border border-[#2D3139] object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1A1D23] border border-[#2D3139] flex items-center justify-center font-bold text-xs text-brand-secondary capitalize">
                            {item.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="text-left">
                          <p className={`text-xs ${isAdded ? 'text-white font-bold' : 'text-white/90'}`}>{item.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                            ELO: <strong className={isAdded ? 'text-brand-secondary' : ''}>{item.elo}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1">
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors ${
                          isAdded ? 'border-brand-secondary bg-brand-secondary text-black' : 'border-[#2D3139] bg-transparent'
                        }`}>
                          {isAdded && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredSoloRoster.length === 0 && (
                  <p className="text-center py-6 text-on-surface-variant text-xs">No matching club players found.</p>
                )}
              </div>

              {isFilled && Object.keys(customDuoSlots).length > 0 && (
                <div className="border-t border-[#2D3139]/60 pt-3 mt-1 space-y-2">
                  <p className="text-[9px] uppercase font-bold text-brand-secondary tracking-wider">Auto-Generated Pairs</p>
                  {Object.entries(customDuoSlots)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([seed, slot]: [string, { p1: Player | null; p2: Player | null }]) => {
                      if (!slot || !slot.p1 || !slot.p2) return null;
                      return (
                        <div key={seed} className="bg-[#0f1115] border border-[#2D3139] p-2.5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] bg-[#252930] font-mono text-on-surface-variant font-bold border border-[#2D3139] px-1.5 py-0.5 rounded">#{seed}</span>
                            <span className="text-[10px] font-bold text-white">{slot.p1.name.split(' ')[0]} & {slot.p2.name.split(' ')[0]}</span>
                          </div>
                          <span className="text-[9px] font-mono text-brand-secondary font-bold">AVG: {Math.round((slot.p1.elo + slot.p2.elo) / 2)}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ) : (
            /* DUO MANUAL: IN-CONTAINER DOUBLE SLOTS CREATOR */
            <>
              <div className="border-b border-[#2D3139]/60 pb-2">
                <h4 className="font-display text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span>Doubles Pairing</span>
                </h4>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                  Build double pairs dynamically. Click any Seed slot below to pair up players from scratch.
                </p>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                {Array.from({ length: bracketSize }).map((_, i) => {
                  const seedNum = i + 1;
                  const slot = customDuoSlots[seedNum];
                  const hasTeam = slot && slot.p1 && slot.p2;

                  return (
                    <div
                      key={seedNum}
                      onClick={() => {
                        setTempP1(null);
                        setAssigningSeed(seedNum);
                      }}
                      className={`border p-3.5 rounded-xl transition-all cursor-pointer ${
                        hasTeam 
                          ? 'bg-[#1A1D23] border-[#2D3139] hover:bg-[#252930] hover:border-brand-primary/40' 
                          : 'bg-[#0f1115] border-dashed border-[#2D3139] hover:border-brand-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-[#252930] font-mono text-on-surface-variant font-bold border border-[#2D3139] px-2 py-0.5 rounded">
                            SLOT #{seedNum}
                          </span>
                          {hasTeam ? (
                            <span className="text-xs font-black text-white tracking-wide">
                              {slot.p1!.name.split(' ')[0]} & {slot.p2!.name.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant italic">
                              + Create Team
                            </span>
                          )}
                        </div>

                        {hasTeam && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = { ...customDuoSlots };
                              delete updated[seedNum];
                              setCustomDuoSlots(updated);
                              resetWinners();
                            }}
                            className="text-[9px] text-red-400 hover:text-red-300 font-bold bg-transparent border-0 cursor-pointer px-1 py-0.5"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {hasTeam && (
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-on-surface-variant font-medium">
                          <span className="font-mono text-brand-primary font-bold">AVG ELO: {Math.round((slot.p1!.elo + slot.p2!.elo) / 2)}</span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[170px]">{slot.p1!.name.split(' ')[0]} ({slot.p1!.elo}) + {slot.p2!.name.split(' ')[0]} ({slot.p2!.elo})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom universal progress meter */}
          <div className="border-t border-[#2D3139] pt-3 mt-1">
            <div className="flex items-center justify-between text-xs mb-1 bg-transparent">
              <span className="text-on-surface-variant font-semibold">Seeded Entries</span>
              <strong className={isFilled ? 'text-brand-primary font-black' : 'text-white'}>
                {mode === 'duo' && draftMode === 'auto'
                  ? `${autoDraftPool.length} / ${bracketSize * 2} Players in Pool`
                  : `${addedCount} / ${bracketSize} ${mode === 'solo' ? 'Players' : 'Teams'}`}
              </strong>
            </div>
            
            {/* Real time visual meter */}
            <div className="w-full bg-[#0F1115] h-2 rounded-full overflow-hidden border border-[#2D3139]">
              <div 
                className="bg-brand-primary max-h-full h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (mode === 'duo' && draftMode === 'auto'
                  ? (autoDraftPool.length / (bracketSize * 2)) * 100
                  : (addedCount / bracketSize) * 100))}%` }}
              />
            </div>

            {/* dynamic system labels */}
            <p className="text-[9px] text-on-surface-variant italic leading-relaxed text-center mt-2.5">
              {isFilled 
                ? '⭐ Bracket scale filled! Click players directly inside the bracket on the right to simulate match victories.' 
                : mode === 'solo' 
                  ? `Choose ${bracketSize - addedCount} more players from the left list to populate bracket matchups.`
                  : mode === 'duo' && draftMode === 'auto'
                    ? `Pick ${bracketSize * 2 - autoDraftPool.length} more players to auto-draft pairs.`
                    : `Select empty slots on the right or configure in the list above to pair players directly.`
              }
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE DESIGN BRACKET WITH GHOST BORDERS */}
        <div className="lg:col-span-8 bg-[#1A1D23] border border-[#2D3139] p-6 rounded-2xl flex flex-col gap-6 shadow-xl overflow-x-auto min-h-[500px]">
          
          <div className="border-b border-[#2D3139]/65 pb-2.5 flex items-center justify-between">
            <div>
              <h4 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 matches-header-label">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                <span>Court Matrix Grid</span>
              </h4>
              <p className="text-[10px] text-on-surface-variant">
                {mode === 'solo' 
                  ? 'Click seeded players to advance them to the next match. Champions are tracked live.' 
                  : 'Click empty cells in Match #1 to pair players instantly, then advance winners.'
                }
              </p>
            </div>
          </div>

          {/* DYNAMIC DRAWING COMPARTMENT */}
          <div className="flex gap-8 py-4 px-1 min-w-[700px] select-none justify-between items-stretch">
            
            {/* Rounds Generation columns */}
            {Array.from({ length: Math.log2(actualBracketSize) }).map((_, roundIdx) => {
              const currentRoundNumber = roundIdx + 1;
              const matchesCount = actualBracketSize / Math.pow(2, currentRoundNumber);
              
              return (
                <div key={roundIdx} className="flex-1 flex flex-col justify-around gap-6 min-w-[190px]">
                  
                  {/* Round Header display */}
                  <div className="text-center font-display text-[9px] uppercase font-bold text-on-surface-variant tracking-wider bg-[#0c0e12] py-2 border border-[#2D3139] rounded-lg flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3 text-brand-primary" />
                    <span>{getRoundName(currentRoundNumber)}</span>
                  </div>

                  {/* Matches dynamic stack */}
                  <div className="flex-grow flex flex-col justify-around py-3 gap-4">
                    {Array.from({ length: matchesCount }).map((__, matchIdx) => {
                      const { p1, p1Seed, p2, p2Seed } = getParticipantForMatch(currentRoundNumber, matchIdx);
                      
                      const key = `${currentRoundNumber}-${matchIdx}`;
                      const matchWinner = winnersMap[key];

                      // Detect BYE matchups in round 1
                      const pairing = currentRoundNumber === 1 ? allSeedPairings[matchIdx] : null;
                      const p1IsBye = pairing && (pairing[0] > bracketSize);
                      const p2IsBye = pairing && (pairing[1] > bracketSize);

                      return (
                        <div 
                          key={matchIdx} 
                          className={`bg-[#1A1D23] border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary relative select-none ${
                            p1IsBye || p2IsBye ? 'border-brand-primary/30 opacity-70' : 'border-[#2D3139]'
                          }`}
                        >
                          {/* Match Index header banner */}
                          <div className="bg-[#0c0e12] border-b border-[#2D3139] text-[8px] uppercase font-semibold text-on-surface-variant/90 py-1.5 px-2.5 flex justify-between select-none">
                            <span>Match #{matchIdx + 1}</span>
                            {p1IsBye || p2IsBye ? (
                              <span className="text-brand-secondary font-black uppercase text-[7px] tracking-wider">
                                BYE → Seed {(p1IsBye ? pairing![0] : pairing![1])} advances
                              </span>
                            ) : matchWinner ? (
                              <span className="text-brand-primary font-black uppercase text-[7px] tracking-wider flex items-center gap-0.5 animate-pulse">
                                <Check className="w-2.5 h-2.5" /> Checked
                              </span>
                            ) : null}
                          </div>

                          {/* Top Competitor Seat */}
                          <div
                            onClick={() => {
                              if (p1 && !p1IsBye) {
                                advanceCompetitor(currentRoundNumber, matchIdx, p1);
                              } else if (mode === 'duo' && currentRoundNumber === 1 && !p1IsBye) {
                                setTempP1(null);
                                setAssigningSeed(p1Seed as number);
                              }
                            }}
                            className={`p-3 text-xs flex items-center justify-between transition-all ${
                              p1IsBye
                                ? 'text-on-surface-variant/40 bg-[#0c0e12] cursor-not-allowed'
                                : p1 
                                  ? 'hover:bg-[#252930] text-white cursor-pointer' 
                                  : mode === 'duo' && currentRoundNumber === 1
                                    ? 'hover:bg-[#252930] text-brand-primary/80 hover:text-brand-primary font-bold text-[10px] bg-[#0c0e12] cursor-pointer'
                                    : 'text-on-surface-variant/40 bg-transparent cursor-not-allowed'
                            } ${
                              matchWinner && p1 && matchWinner.id === p1.id
                                ? 'bg-brand-primary/10 font-bold border-l-4 border-brand-primary'
                                : 'border-l-4 border-transparent'
                            }`}
                          >
                            <span className="truncate max-w-[125px]">
                              {p1IsBye ? 'BYE' : p1 ? p1.name : mode === 'duo' && currentRoundNumber === 1 ? '+ Add Team (Seed ' + p1Seed + ')' : 'Waiting...'}
                            </span>
                            <span className="font-mono text-[9px] bg-[#0c0e12] px-1.5 py-0.5 border border-[#2D3139] rounded text-on-surface-variant">
                              {p1IsBye ? 'BYE' : p1 ? p1.elo : `SEED ${p1Seed}`}
                            </span>
                          </div>

                          <div className="border-t border-[#2D3139]/60" />

                          {/* Bottom Competitor Seat */}
                          <div
                            onClick={() => {
                              if (p2 && !p2IsBye) {
                                advanceCompetitor(currentRoundNumber, matchIdx, p2);
                              } else if (mode === 'duo' && currentRoundNumber === 1 && !p2IsBye) {
                                setTempP1(null);
                                setAssigningSeed(p2Seed as number);
                              }
                            }}
                            className={`p-3 text-xs flex items-center justify-between transition-all ${
                              p2IsBye
                                ? 'text-on-surface-variant/40 bg-[#0c0e12] cursor-not-allowed'
                                : p2 
                                  ? 'hover:bg-[#252930] text-white cursor-pointer' 
                                  : mode === 'duo' && currentRoundNumber === 1
                                    ? 'hover:bg-[#252930] text-brand-primary/80 hover:text-brand-primary font-bold text-[10px] bg-[#0c0e12] cursor-pointer'
                                    : 'text-on-surface-variant/40 bg-transparent cursor-not-allowed'
                            } ${
                              matchWinner && p2 && matchWinner.id === p2.id
                                ? 'bg-brand-primary/10 font-bold border-l-4 border-brand-primary'
                                : 'border-l-4 border-transparent'
                            }`}
                          >
                            <span className="truncate max-w-[125px]">
                              {p2IsBye ? 'BYE' : p2 ? p2.name : mode === 'duo' && currentRoundNumber === 1 ? '+ Add Team (Seed ' + p2Seed + ')' : 'Waiting...'}
                            </span>
                            <span className="font-mono text-[9px] bg-[#0c0e12] px-1.5 py-0.5 border border-[#2D3139] rounded text-on-surface-variant">
                              {p2IsBye ? 'BYE' : p2 ? p2.elo : `SEED ${p2Seed}`}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}

            {/* FINAL CHAMPION BOX ON FAR RIGHT */}
            <div className="flex flex-col justify-center gap-6 min-w-[200px]">
              
              <div className="text-center font-display text-[9px] uppercase font-bold text-brand-primary tracking-wider bg-brand-primary/10 py-2 border border-brand-primary/30 rounded-lg flex items-center justify-center gap-1">
                <PartyPopper className="w-3.5 h-3.5 text-brand-primary" />
                <span>CHAMPION</span>
              </div>

              <div className="flex-grow flex flex-col justify-center items-stretch py-3">
                <div className={`p-5 rounded-2xl border text-center transition-all ${
                  champion 
                    ? 'bg-brand-primary/15 border-brand-primary text-white custom-shadow scale-102 font-extrabold' 
                    : 'bg-[#0c0e12] border-[#2D3139] border-dashed text-on-surface-variant/55'
                }`}>
                  {champion ? (
                    <div className="space-y-3.5 animate-scaleIn">
                      <div className="w-12 h-12 rounded-full bg-brand-primary-container text-black border-2 border-brand-primary flex items-center justify-center font-black text-lg mx-auto shadow-lg select-none">
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
                      <div className="text-[8px] bg-brand-primary/25 border border-brand-primary/40 text-brand-primary rounded-full px-2.5 py-1 font-bold inline-block uppercase tracking-widest">
                        Winner 🥇
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2 select-none">
                      <div className="text-3xl text-on-surface-variant/35 font-mono select-none">🥇</div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">
                        Undecided
                      </p>
                      <p className="text-[9px] text-on-surface-variant/50 max-w-[140px] mx-auto leading-relaxed">
                        Complete preceding matchups to determine and crown the champion.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* 4. TEAM ASSEMBLY MODAL (DUO/DOUBLES MODE SPECIALTY) */}
      {assigningSeed !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1A1D23] border border-brand-primary/30 max-w-md w-full rounded-2xl shadow-xl p-5 relative flex flex-col gap-4 text-on-surface font-sans">
            
            {/* Modal Header banner */}
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="font-display text-xs font-black text-white uppercase tracking-wider">
                    Quick doubles pairing (Seed #{assigningSeed})
                  </h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Assembling doubles teammates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAssigningSeed(null);
                  setTempP1(null);
                }}
                className="text-on-surface-variant hover:text-white font-black text-sm bg-transparent border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex gap-3">
              <div className={`flex-1 text-center py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${
                tempP1 === null 
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                  : 'bg-[#0f1115] border-[#2D3139] text-on-surface-variant'
              }`}>
                1. Select Partner A
              </div>
              <div className={`flex-1 text-center py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${
                tempP1 !== null 
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary animate-pulse' 
                  : 'bg-[#0f1115] border-[#2D3139] text-on-surface-variant'
              }`}>
                2. Select Partner B
              </div>
            </div>

            {/* Current Drafted partner info */}
            {tempP1 && (
              <div className="bg-[#0f1115] border border-[#2D3139] p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-primary text-black font-extrabold flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">{tempP1.name}</p>
                    <p className="text-[9px] font-mono text-on-surface-variant mt-0.5">Rating: {tempP1.elo} ELO</p>
                  </div>
                </div>
                <button
                  onClick={() => setTempP1(null)}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer bg-transparent border-0"
                >
                  Change Player
                </button>
              </div>
            )}

            {/* Player Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder={tempP1 === null ? "Search Player 1 by name..." : `Search teammate for ${tempP1.name}...`}
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="bg-[#0f1115] border border-[#2D3139] rounded-lg p-2 pl-8 text-xs text-white focus:outline-none focus:border-brand-primary w-full"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
            </div>

            {/* Dynamic available active members selector */}
            <div className="max-h-56 overflow-y-auto pr-1 flex flex-col gap-1.5 no-scrollbar border-t border-b border-[#2D3139]/40 py-2">
              {activeSoloPlayers
                .filter(p => {
                  // Filter by query
                  if (searchMemberQuery && !p.name.toLowerCase().includes(searchMemberQuery.toLowerCase())) {
                    return false;
                  }
                  // Filter out player 1 if we're picking partner B
                  if (tempP1 && p.id === tempP1.id) {
                    return false;
                  }
                  // Filter out players already assigned to any other Duo seed slots
                  const alreadyAssignedIds = getDuoAlreadyAssignedIds();
                  return !alreadyAssignedIds.includes(p.id);
                })
                .map(player => (
                  <div
                    key={player.id}
                    onClick={() => {
                      if (tempP1 === null) {
                        setTempP1(player);
                      } else {
                        // Complete Duo pairing
                        setCustomDuoSlots({
                          ...customDuoSlots,
                          [assigningSeed]: {
                            p1: tempP1,
                            p2: player
                          }
                        });
                        setTempP1(null);
                        setAssigningSeed(null);
                        resetWinners();
                      }
                    }}
                    className="bg-[#0f1115] hover:bg-[#252930] border border-[#2D3139] hover:border-brand-primary/45 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      {player.avatar ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={player.avatar} 
                          alt={player.name} 
                          className="w-6.5 h-6.5 rounded-full border border-[#2D3139] object-cover" 
                        />
                      ) : (
                        <div className="w-6.5 h-6.5 rounded-full bg-[#1A1D23] border border-[#2D3139] flex items-center justify-center font-bold text-[9px] text-brand-primary uppercase">
                          {player.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{player.name}</p>
                        <p className="text-[9px] text-on-surface-variant font-mono mt-0.5">Rating: {player.elo} ELO</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-[#1A1D23] font-mono border border-[#2D3139] text-brand-primary px-2 py-0.5 rounded">
                      + Select
                    </span>
                  </div>
                ))}

              {activeSoloPlayers.filter(p => {
                if (searchMemberQuery && !p.name.toLowerCase().includes(searchMemberQuery.toLowerCase())) return false;
                if (tempP1 && p.id === tempP1.id) return false;
                const alreadyAssignedIds = getDuoAlreadyAssignedIds();
                return !alreadyAssignedIds.includes(p.id);
              }).length === 0 && (
                <p className="text-center py-4 text-on-surface-variant text-xs">No unassigned active players left matching search.</p>
              )}
            </div>

            {/* Modal footer controls */}
            <div className="flex justify-between items-center mt-1">
              <button
                onClick={() => {
                  setAssigningSeed(null);
                  setTempP1(null);
                }}
                className="text-xs text-on-surface-variant hover:text-white font-bold uppercase transition-colors px-3 py-1.5"
              >
                Quit Creator
              </button>
              <span className="text-[8px] uppercase tracking-wider text-on-surface-variant/70 font-mono font-bold">
                PRO-TRACKER ENGINE
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
