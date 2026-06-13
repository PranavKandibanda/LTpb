import React, { useState } from 'react';
import { 
  Trophy, 
  ArrowDown, 
  ArrowUp, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart2,
  Users,
  Timer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Player } from '../types';

interface LeaderboardViewProps {
  allPlayers: Player[];
  searchQuery: string;
  onSelectPlayer: (player: Player) => void;
  currentUser: Player;
}

export default function LeaderboardView({
  allPlayers,
  searchQuery,
  onSelectPlayer,
  currentUser
}: LeaderboardViewProps) {
  const [seasonTab, setSeasonTab] = useState<'current' | 'all-time'>('current');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'elo' | 'wins' | 'winrate'>('elo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination stats
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter players based on search and selected option tier
  const filteredPlayers = allPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (player.nickname && player.nickname.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = tierFilter === 'all' ? true : player.tier.toLowerCase() === tierFilter.toLowerCase();
    return matchesSearch && matchesTier;
  });

  // Calculate stats
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let fieldA = 0;
    let fieldB = 0;

    if (sortBy === 'elo') {
      fieldA = a.elo;
      fieldB = b.elo;
    } else if (sortBy === 'wins') {
      fieldA = a.wins;
      fieldB = b.wins;
    } else if (sortBy === 'winrate') {
      const totalA = a.wins + a.losses;
      const totalB = b.wins + b.losses;
      fieldA = totalA > 0 ? (a.wins / totalA) : 0;
      fieldB = totalB > 0 ? (b.wins / totalB) : 0;
    }

    if (sortDirection === 'desc') {
      return fieldB - fieldA;
    } else {
      return fieldA - fieldB;
    }
  });

  // Paginated players
  const totalItems = sortedPlayers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPlayers = sortedPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper inside row: win rate
  const getWinRate = (player: Player) => {
    const total = player.wins + player.losses;
    return total > 0 ? ((player.wins / total) * 100).toFixed(1) : '0';
  };

  const handleSortToggle = (field: 'elo' | 'wins' | 'winrate') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Page Header & Filter controls matches identical design */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Global Rankings
          </h2>
          <p className="text-on-surface-variant font-sans text-sm mt-1 max-w-2xl leading-relaxed">
            Elite performance monitoring for the club's top competitors. Rankings are updated in real-time based on the Elo Rating System. Let's see who is ruling the court!
          </p>
        </div>

        {/* Action button toggles matches the design layout */}
        <div className="flex items-center gap-3">
          <div className="bg-brand-surface border border-brand-outline rounded-xl p-1 flex">
            <button
              onClick={() => setSeasonTab('current')}
              className={`px-4 py-2 text-xs font-bold font-sans rounded-lg transition-all cursor-pointer ${
                seasonTab === 'current'
                  ? 'bg-brand-primary text-black shadow-lg'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Current Season
            </button>
            <button
              onClick={() => setSeasonTab('all-time')}
              className={`px-4 py-2 text-xs font-bold font-sans rounded-lg transition-all cursor-pointer ${
                seasonTab === 'all-time'
                  ? 'bg-brand-primary text-black shadow-lg'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`ghost-border bg-brand-surface hover:bg-brand-surface-high px-4 py-2.5 rounded-xl flex items-center gap-2 hover:text-brand-primary transition-colors cursor-pointer ${
              filtersOpen ? 'text-brand-primary border-brand-primary' : 'text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold">Filters</span>
          </button>
        </div>
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {filtersOpen && (
        <div className="bg-brand-surface border border-brand-outline rounded-2xl p-4 flex flex-wrap gap-4 items-center animate-slideDown">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Filter by Elo Tier:
            </label>
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setCurrentPage(1); }}
              className="bg-brand-surface-lowest border border-brand-outline rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="all">All Tiers (Grandmaster, Elite, Pro)</option>
              <option value="grandmaster">Grandmaster</option>
              <option value="elite">Elite</option>
              <option value="pro">Pro</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Primary Order:
            </label>
            <div className="flex gap-1 bg-brand-surface-lowest border border-brand-outline rounded-lg p-0.5">
              <button
                onClick={() => handleSortToggle('elo')}
                className={`px-3 py-1 rounded text-[10px] font-bold ${sortBy === 'elo' ? 'bg-brand-primary text-black' : 'text-on-surface-variant'}`}
              >
                ELO
              </button>
              <button
                onClick={() => handleSortToggle('wins')}
                className={`px-3 py-1 rounded text-[10px] font-bold ${sortBy === 'wins' ? 'bg-brand-primary text-black' : 'text-on-surface-variant'}`}
              >
                Wins
              </button>
              <button
                onClick={() => handleSortToggle('winrate')}
                className={`px-3 py-1 rounded text-[10px] font-bold ${sortBy === 'winrate' ? 'bg-brand-primary text-black' : 'text-on-surface-variant'}`}
              >
                Win %
              </button>
            </div>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => {
                setTierFilter('all');
                setSortBy('elo');
                setSortDirection('desc');
                setCurrentPage(1);
              }}
              className="text-xs text-brand-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Table Container */}
      <div className="ghost-border bg-brand-surface-lowest rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-outline">
                <th className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant w-24">
                  Rank
                </th>
                <th className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                  Player
                </th>
                <th 
                  onClick={() => handleSortToggle('elo')}
                  className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant cursor-pointer hover:text-white select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Elo</span>
                    {sortBy === 'elo' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-brand-primary" /> : <ArrowUp className="w-3.5 h-3.5 text-brand-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 opacity-20" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSortToggle('wins')}
                  className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant cursor-pointer hover:text-white select-none hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Wins</span>
                    {sortBy === 'wins' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-brand-primary" /> : <ArrowUp className="w-3.5 h-3.5 text-brand-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 opacity-20" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant hidden sm:table-cell">
                  Losses
                </th>
                <th 
                  onClick={() => handleSortToggle('winrate')}
                  className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Win %</span>
                    {sortBy === 'winrate' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-brand-primary" /> : <ArrowUp className="w-3.5 h-3.5 text-brand-primary" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 opacity-20" />
                    )}
                  </div>
                </th>
                <th className="py-4 px-6 text-[10px] uppercase font-bold tracking-wider text-on-surface-variant text-right">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-outline/30 bg-brand-bg/20">
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant font-medium text-sm">
                    No players matching the active searches/filters. Let's try typing another name!
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((player, index) => {
                  // Real absolute Rank in entire sorted rank indexing
                  const absoluteRank = sortedPlayers.findIndex(p => p.id === player.id) + 1;
                  const isGold = absoluteRank === 1;
                  const isSilver = absoluteRank === 2;
                  const isBronze = absoluteRank === 3;
                  const winPct = getWinRate(player);

                  return (
                    <tr
                      key={player.id}
                      onClick={() => onSelectPlayer(player)}
                      className="hover:bg-brand-surface-high/70 transition-colors group cursor-pointer"
                      title="Inspect full player history & stats"
                    >
                      {/* Rank Column */}
                      <td className="py-5 px-6 font-display">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 flex items-center justify-center font-black rounded-lg text-sm italic ${
                            isGold 
                              ? 'bg-brand-tertiary text-black shadow-md' 
                              : isSilver 
                                ? 'bg-zinc-300 text-black' 
                                : isBronze 
                                  ? 'bg-[#ffeec3] text-black' 
                                  : 'bg-brand-surface-high text-on-surface-variant font-semibold'
                          }`}>
                            {absoluteRank}
                          </span>
                          {isGold && (
                            <Trophy className="w-4 h-4 text-brand-tertiary animate-pulse shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Player identity column matches mockup */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          {player.avatar ? (
                            <img
                              alt={player.name}
                              className={`w-12 h-12 rounded-xl object-cover shrink-0 select-none ${
                                isGold 
                                  ? 'border-2 border-brand-tertiary' 
                                  : isSilver 
                                    ? 'border-2 border-zinc-300' 
                                    : isBronze 
                                      ? 'border-2 border-[#ffeec3]' 
                                      : 'border border-brand-outline'
                              }`}
                              src={player.avatar}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-brand-surface-high border border-brand-outline flex items-center justify-center font-bold text-brand-primary shrink-0 select-none">
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-brand-primary transition-colors">
                              {player.name}
                            </span>
                            <span className={`text-[10px] uppercase font-extrabold tracking-widest mt-0.5 ${
                              player.tier === 'Grandmaster' 
                                ? 'text-brand-tertiary font-bold' 
                                : 'text-brand-secondary'
                            }`}>
                              {player.tier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stats columns */}
                      <td className="py-5 px-6 font-display text-lg font-black text-white">
                        <span className={player.elo >= 2700 ? 'text-brand-tertiary font-extrabold' : 'text-white'}>
                          {player.elo.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-5 px-6 font-bold text-white hidden sm:table-cell">
                        {player.wins}
                      </td>

                      <td className="py-5 px-6 text-on-surface-variant hidden sm:table-cell">
                        {player.losses}
                      </td>

                      {/* Win Percent Progress column */}
                      <td className="py-5 px-6 font-sans">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-white">{winPct}%</span>
                          <div className="w-24 h-1.5 bg-brand-surface-high rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                Number(winPct) >= 80 
                                  ? 'bg-brand-primary-container' 
                                  : Number(winPct) >= 65 
                                    ? 'bg-brand-secondary' 
                                    : 'bg-brand-tertiary'
                              }`}
                              style={{ width: `${winPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Trend Badge column */}
                      <td className="py-5 px-6 text-right font-bold text-xs">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                          player.trend > 0 
                            ? 'bg-brand-primary-container/10 text-brand-primary' 
                            : player.trend < 0 
                              ? 'bg-red-500/10 text-red-400' 
                              : 'bg-brand-surface-high text-on-surface-variant'
                        }`}>
                          {player.trend > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : player.trend < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          <span className="font-mono">
                            {player.trend > 0 ? `+${player.trend}` : player.trend === 0 ? '0' : player.trend}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination footer matching layout styles */}
        <div className="p-4 bg-brand-surface border-t border-brand-outline flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} Players
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 border border-brand-outline rounded-lg flex items-center justify-center hover:bg-brand-surface-high transition-all text-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 border rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                  page === currentPage
                    ? 'bg-brand-primary border-brand-primary text-black'
                    : 'border-brand-outline text-white hover:bg-brand-surface-high'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 border border-brand-outline rounded-lg flex items-center justify-center hover:bg-brand-surface-high transition-all text-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Performance Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="ghost-border bg-brand-surface p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Global Avg. Elo
            </h3>
            <BarChart2 className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-black text-white">1,450</span>
            <span className="text-brand-primary text-xs font-bold font-mono">+2.4% vs last week</span>
          </div>
          <div className="mt-4 h-1 w-full bg-brand-surface-high rounded-full">
            <div className="h-full bg-brand-primary w-2/3 rounded-full"></div>
          </div>
        </div>

        <div className="ghost-border bg-brand-surface p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Active Challengers
            </h3>
            <Users className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-black text-white">42</span>
            <span className="text-on-surface-variant text-xs font-bold">Matches scheduled today</span>
          </div>
          <div className="mt-4 flex gap-1 items-end h-8">
            <div className="h-4 w-1 rounded bg-brand-primary"></div>
            <div className="h-6 w-1 rounded bg-brand-primary/80"></div>
            <div className="h-5 w-1 rounded bg-brand-primary/60"></div>
            <div className="h-8 w-1 rounded bg-brand-primary"></div>
            <div className="h-7 w-1 rounded bg-brand-primary/90"></div>
            <div className="h-4 w-1 rounded bg-brand-primary"></div>
            <div className="h-6 w-1 rounded bg-brand-primary/70"></div>
          </div>
        </div>

        {/* Season Countdown */}
        <div className="ghost-border bg-brand-surface p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Season Countdown
              </h3>
              <Timer className="w-4 h-4 text-brand-tertiary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-black text-white">12d 04h</span>
              <span className="text-on-surface-variant text-xs font-bold">Time remaining</span>
            </div>
          </div>
          <div className="absolute bottom-[-10px] right-[-10px] text-white opacity-5 select-none pointer-events-none">
            <Trophy className="w-24 h-24 stroke-[1]" />
          </div>
        </div>
      </section>
    </div>
  );
}
