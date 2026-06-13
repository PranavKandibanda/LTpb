import React, { useState } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  Calendar,
  Flame,
  History,
  Lock,
  Sparkles,
  ArrowRight,
  Plus,
  Edit3
} from 'lucide-react';
import { Player, MatchActivity } from '../types';

interface ProfileViewProps {
  player: Player;
  matchActivities: MatchActivity[];
  currentUser: Player;
  onOpenNewChallengeWithOpponent: (opponent: Player) => void;
  onChangeAvatar?: () => void;
}

export default function ProfileView({
  player,
  matchActivities,
  currentUser,
  onOpenNewChallengeWithOpponent,
  onChangeAvatar
}: ProfileViewProps) {
  const [graphDays, setGraphDays] = useState<'30D' | '90D'>('30D');

  // Filter matches specific to this player profile
  const playerRelatedMatches = matchActivities.filter(
    m => m.opponentId === player.id || player.id === currentUser.id
  );

  const totalMatches = player.wins + player.losses;
  const winRate = totalMatches > 0 ? ((player.wins / totalMatches) * 100).toFixed(1) : '0';

  // Customize quotes based on player
  const getDefaultQuote = () => {
    if (player.bio) return player.bio;
    if (player.id === 'elena_v') return "Defensive specialist since 2022.";
    if (player.id === 'alex_rivers') return "Power smasher and deep court strategist.";
    if (player.id === 'jordan_p') return "Aggressive kitchen volleyer with fast reflexes.";
    return "Competitive master ready for any challenger.";
  };

  // Generate synthetic points for the SVG graph that look professional
  const graphPoints = graphDays === '30D' 
    ? [2100, 2150, 2120, 2240, 2300, 2280, 2410, 2480, 2450, 2520, 2600, 2650, 2710, 2750, 2800, 2850, player.elo]
    : [1800, 1920, 1850, 1950, 2010, 1990, 2120, 2240, 2190, 2250, 2350, 2450, 2510, 2590, 2660, 2750, player.elo];

  const svgWidth = 800;
  const svgHeight = 200;
  const minRating = Math.min(...graphPoints) - 50;
  const maxRating = Math.max(...graphPoints) + 50;
  const ratingRange = maxRating - minRating;

  // Build the SVG spline coordinates
  const svgPoints = graphPoints.map((rating, idx) => {
    const x = (idx / (graphPoints.length - 1)) * svgWidth;
    const y = svgHeight - ((rating - minRating) / ratingRange) * svgHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${svgPoints.join(' L ')}`;
  const areaD = `M 0,${svgHeight} L ${svgPoints.join(' L ')} L ${svgWidth},${svgHeight} Z`;

  // Get index of last node for final point circle
  const lastIndex = graphPoints.length - 1;
  const lastX = (lastIndex / (graphPoints.length - 1)) * svgWidth;
  const lastY = svgHeight - ((graphPoints[lastIndex] - minRating) / ratingRange) * svgHeight;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* Hero Profile identity header block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Identity Card */}
        <div className="lg:col-span-8 bg-brand-surface rounded-2xl border border-brand-outline overflow-hidden relative min-h-[320px] flex items-end shadow-xl">
          <div className="absolute inset-0 z-0">
            <img
              alt="Action pickleball lunge background representation"
              className="w-full h-full object-cover opacity-35"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAIldkWlwSj7PTEXSz0JM9bhdKcsqqNdrrJx-H4gjzogNT-F_eV1izDz8KAyM8-ao3fZzXALR8EQVMt98PAhSySJfUn_hS5XajO49VSUIJx8MezmR-1KNaYX2NP70PIsx3dU9nD73JcGoGg3W8lDc1tk8WTlXreoW-_rTG99q-swP4b2Kh21UOxDziNClAD25bSwqsxsAPrHL9EEKjqFTcxCgmFn8yUKyfELtaZn7XIbhmYgywmKQYPAHDmR0wf9unPeocM3IJi9Bh"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 p-6 w-full flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 rounded-2xl border-2 border-brand-primary p-1 bg-brand-bg shrink-0 select-none group">
                {player.avatar ? (
                  <img
                    alt={player.name}
                    className="w-full h-full object-cover rounded-xl"
                    src={player.avatar}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-brand-surface-high border border-brand-outline flex items-center justify-center font-bold text-brand-primary text-xl">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {player.id === currentUser.id && onChangeAvatar && (
                  <button
                    onClick={onChangeAvatar}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-brand-primary text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                    title="Change avatar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="font-display text-2xl lg:text-3xl font-black text-white">{player.name}</h1>
                  <span className="bg-brand-primary-container text-black px-2.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase">
                    Rank {player.rank}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-brand-surface-high text-brand-primary border border-brand-outline px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    {player.tier}
                  </span>
                  
                  <p className="text-on-surface-variant text-xs italic opacity-90 font-medium">
                    "{getDefaultQuote()}"
                  </p>
                </div>
              </div>
            </div>

            {/* Pulsing ELO display */}
            <div className="bg-brand-surface-high/85 border border-brand-outline p-4 rounded-2xl text-center min-w-[150px] shadow-2xl shrink-0">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold leading-none">
                Current Elo
              </p>
              <p className="font-display text-4xl font-extrabold text-brand-primary mt-1 shadow-brand-primary/20 hover:scale-105 transition-transform duration-300">
                {player.elo.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Awards Section showing Seasonal Medals */}
        <div className="lg:col-span-4 bg-brand-surface rounded-2xl border border-brand-outline p-5 flex flex-col shadow-xl text-left">
          <h3 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Award className="w-4 h-4 text-[#ccff80]" />
            <span>Seasonal Placement Medals</span>
          </h3>
          
          <div className="space-y-3 flex-grow">
            {(!player.awards || (player.awards.gold === 0 && player.awards.silver === 0 && player.awards.bronze === 0)) ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-on-surface-variant text-xs gap-1">
                <Trophy className="w-8 h-8 text-on-surface-variant/30 shrink-0" />
                <p className="font-bold text-white mt-1">Zero Medals Issued</p>
                <p className="max-w-[200px] text-on-surface-variant mx-auto">Perform premium matches to claim season trophies!</p>
              </div>
            ) : (
              <>
                {(player.awards.gold > 0) && (
                  <div className="flex items-center gap-3 p-3 bg-brand-surface-lowest rounded-xl border border-brand-outline hover:border-[#ccff80]/30 transition-all">
                    <div className="bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20 text-yellow-400 animate-pulse">
                      <Trophy className="w-4 h-4 fill-yellow-400" />
                    </div>
                    <div>
                      <p className="font-black text-xs text-white">Gold Trophies: {player.awards.gold}</p>
                      <span className="text-[9px] text-[#ccff80] font-mono tracking-widest uppercase">1st Place Season Resets</span>
                    </div>
                  </div>
                )}

                {(player.awards.silver > 0) && (
                  <div className="flex items-center gap-3 p-3 bg-[#0c0f13] rounded-xl border border-brand-outline hover:border-slate-300/30 transition-all">
                    <div className="bg-slate-300/10 p-2 rounded-lg border border-slate-300/20 text-slate-300">
                      <Trophy className="w-4 h-4 fill-slate-300" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Silver Trophies: {player.awards.silver}</p>
                      <span className="text-[9px] text-slate-300 font-mono tracking-widest uppercase">2nd Place Finishes</span>
                    </div>
                  </div>
                )}

                {(player.awards.bronze > 0) && (
                  <div className="flex items-center gap-3 p-3 bg-[#0c0f13] rounded-xl border border-brand-outline hover:border-amber-600/30 transition-all">
                    <div className="bg-amber-600/10 p-2 rounded-lg border border-amber-600/20 text-amber-600">
                      <Trophy className="w-4 h-4 fill-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Bronze Trophies: {player.awards.bronze}</p>
                      <span className="text-[9px] text-amber-600 font-mono tracking-widest uppercase">3rd Place Finishes</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Wins</p>
          <div className="flex items-end justify-between">
            <p className="font-display text-2xl font-black text-white">{player.wins}</p>
            <span className="text-brand-primary text-xs font-bold mb-1">+5 this week</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Losses</p>
          <div className="flex items-end justify-between">
            <p className="font-display text-2xl font-black text-white">{player.losses}</p>
            <span className="text-on-surface-variant text-xs font-medium mb-1">Elite ratio</span>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Win %</p>
          <div className="flex items-end justify-between">
            <p className="font-display text-2xl font-black text-brand-secondary">{winRate}%</p>
            <div className="w-16 bg-brand-surface-high h-1.5 rounded-full mb-1.5 overflow-hidden">
              <div className="bg-brand-secondary h-full rounded-full" style={{ width: `${winRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Peak Elo</p>
          <div className="flex items-end justify-between">
            <p className="font-display text-2xl font-black text-brand-tertiary">
              {Math.max(player.elo, player.peakElo).toLocaleString()}
            </p>
            <TrendingUp className="w-4 h-4 text-brand-tertiary mb-1" />
          </div>
        </div>
      </div>

      {/* Performance Graph & Recent Activity matches split layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Elo History Chart */}
        <div className="lg:col-span-2 bg-brand-surface rounded-xl border border-brand-outline p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-sm text-white uppercase tracking-wider">
              Elo Progression History
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setGraphDays('30D')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  graphDays === '30D'
                    ? 'bg-brand-surface-high text-brand-primary border border-brand-primary'
                    : 'bg-brand-surface-lowest text-on-surface-variant border border-brand-outline'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setGraphDays('90D')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  graphDays === '90D'
                    ? 'bg-brand-surface-high text-brand-primary border border-brand-primary'
                    : 'bg-brand-surface-lowest text-on-surface-variant border border-brand-outline'
                }`}
              >
                90D
              </button>
            </div>
          </div>

          <div className="h-64 w-full relative">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="splineGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(163, 230, 53, 0.35)"></stop>
                  <stop offset="100%" stopColor="rgba(163, 230, 53, 0)"></stop>
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              <line stroke="#2D3139" strokeWidth="1" x1="0" x2={svgWidth} y1="0" y2="0"></line>
              <line stroke="#2D3139" strokeDasharray="4" strokeWidth="1" x1="0" x2={svgWidth} y1={svgHeight/4} y2={svgHeight/4}></line>
              <line stroke="#2D3139" strokeDasharray="4" strokeWidth="1" x1="0" x2={svgWidth} y1={svgHeight/2} y2={svgHeight/2}></line>
              <line stroke="#2D3139" strokeDasharray="4" strokeWidth="1" x1="0" x2={svgWidth} y1={svgHeight * 0.75} y2={svgHeight * 0.75}></line>
              <line stroke="#2D3139" strokeWidth="1" x1="0" x2={svgWidth} y1={svgHeight} y2={svgHeight}></line>
              
              {/* Highlight Gradient Area */}
              <path d={areaD} fill="url(#splineGradient)"></path>
              
              {/* Linear Spline Path */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="#a3e635" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="3.5"
                className="animate-pulse"
              ></path>
              
              {/* Active current node point */}
              <circle cx={lastX} cy={lastY} fill="#a3e635" r="6" className="animate-ping"></circle>
              <circle cx={lastX} cy={lastY} fill="#ccff80" r="5" stroke="#0F1115" strokeWidth="1.5"></circle>
            </svg>
            
            {/* Float dynamic ranking flag badge */}
            <div 
              className="absolute bg-brand-primary text-black text-[10px] font-black px-2.5 py-1 rounded-lg border border-brand-outline shadow-xl"
              style={{
                right: '4px',
                top: `${Math.max(10, Math.min(svgHeight - 40, lastY - 14))}px`
              }}
            >
              {player.elo.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Dynamic visual matches list relative only to that profile */}
        <div className="bg-brand-surface rounded-xl border border-brand-outline p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-brand-secondary" />
              <span>Recent Activity</span>
            </h3>
            
            {/* Quick new challenge option if showing another profile */}
            {player.id !== currentUser.id && (
              <button
                onClick={() => onOpenNewChallengeWithOpponent(player)}
                className="bg-brand-primary/15 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-black hover:border-brand-primary text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-all uppercase"
              >
                <Plus className="w-3 h-3" /> Challenge
              </button>
            )}
          </div>

          <div className="space-y-3">
            {playerRelatedMatches.length === 0 ? (
              <div className="text-center p-8 bg-brand-surface-low border border-brand-outline/40 rounded-xl text-on-surface-variant text-xs">
                No recent reported matches for this player.
              </div>
            ) : (
              playerRelatedMatches.slice(0, 3).map(match => (
                <div
                  key={match.id}
                  className="bg-brand-surface-lowest p-3.5 rounded-lg border border-brand-outline flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      match.result === 'W'
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {match.result}
                    </div>

                    <div>
                      <p className="font-semibold text-white text-xs leading-none">
                        vs. {match.opponentId === player.id ? currentUser.name : match.opponentName}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wide mt-1">
                        {match.type} • {match.scores}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-black text-xs ${
                      match.result === 'W' ? 'text-brand-primary' : 'text-red-400'
                    }`}>
                      {match.result === 'W' ? `+${match.eloChange}` : match.eloChange}
                    </p>
                    <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">{match.timeString}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
