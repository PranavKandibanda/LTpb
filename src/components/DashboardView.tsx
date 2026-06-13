import React from 'react';
import { 
  Trophy, 
  Calendar, 
  Flame, 
  TrendingUp, 
  Activity, 
  History, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Milestone
} from 'lucide-react';
import { Player, MatchActivity, Challenge, Verification } from '../types';

interface DashboardViewProps {
  currentUser: Player;
  recentMatches: MatchActivity[];
  upcomingChallenges: Challenge[];
  verifications: Verification[];
  onAcceptChallenge: (challengeId: string) => void;
  onDeclineChallenge: (challengeId: string) => void;
  onViewAllHistory: () => void;
  onSelectOpponentProfile: (opponentId: string) => void;
}

export default function DashboardView({
  currentUser,
  recentMatches,
  upcomingChallenges,
  verifications,
  onAcceptChallenge,
  onDeclineChallenge,
  onViewAllHistory,
  onSelectOpponentProfile
}: DashboardViewProps) {
  
  // Calculate win rate
  const totalMatches = currentUser.wins + currentUser.losses;
  const winRate = totalMatches > 0 ? Math.round((currentUser.wins / totalMatches) * 100) : 0;

  // Next Milestone calculations based on ELO
  const nextTierElo = currentUser.elo < 2500 ? 2500 : 3000;
  const tierName = currentUser.elo < 2500 ? 'Grandmaster' : 'Legendary Champion';
  const matchesToNext = Math.max(1, Math.ceil((nextTierElo - currentUser.elo) / 15));
  const progressPercent = Math.min(100, Math.round((currentUser.elo / nextTierElo) * 100));

  return (
    <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Left Column (Main Hub) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        {/* Player Overview Hero Section */}
        <section className="ghost-border bg-brand-surface rounded-2xl overflow-hidden relative min-h-[280px] flex items-center p-8 transition-all hover:scale-[1.005] duration-300">
          <div className="absolute inset-0 opacity-20 z-0">
            <img
              alt="High-performance indoor pickleball stadium background"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY2GingoI30v8PiZz1QW19VMnuO_4_MhYoSFxl386SP4KR7hDwt0CEAAjsITZY2t8zV3VM_BGhO72F05l_BEUSHsjqodNNekSdG1TqitNGMEUcOuojy8H17QL-TanaPFEQ0BHEUdpsKk4Bfs4L8K-B1M8nT-uR431udewtn-ewJo9esN_IKYeeqTdDL9Ijv7R0T2IIOE_nZekBPEVlZff6l29T9nojg5aZGzo-1gFEf2gcWAJwqacospTYowdcpR1dbuxarO7XPOaK"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/85 to-transparent"></div>
          </div>
          
          <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 bg-brand-primary-container/10 border border-brand-primary/30 px-3 py-1 rounded-lg text-brand-primary w-fit">
                <Trophy className="w-4 h-4 text-brand-primary animate-bounce" />
                <span className="font-display font-semibold tracking-wider text-[11px] uppercase">
                  {currentUser.tier} Tier
                </span>
              </div>
              
              <h2 className="font-display text-4xl lg:text-5xl font-black text-white mt-1 tracking-tight">
                {currentUser.name}
              </h2>
              
              <div className="flex gap-8 mt-2">
                <div>
                  <p className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                    Current Elo
                  </p>
                  <p className="font-display text-4xl font-extrabold text-brand-primary mt-0.5">
                    {currentUser.elo.toLocaleString()}
                  </p>
                </div>
                <div className="border-l border-brand-outline pl-8">
                  <p className="text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                    Season Record
                  </p>
                  <p className="text-xl font-bold mt-1 text-white">
                    {currentUser.wins}-{currentUser.losses}
                    <span className="text-brand-primary text-xs font-bold ml-2">({winRate}% WR)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Rank Card badge */}
            <div className="flex items-center gap-4 bg-brand-surface-high/95 backdrop-blur-sm border border-brand-outline p-5 rounded-2xl text-center min-w-[140px] shadow-2xl">
              <div className="w-full">
                <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1 leading-none">Rank</p>
                <p className="font-display text-3xl font-extrabold text-white text-center">#{currentUser.rank.toString().padStart(2, '0')}</p>
                <p className="text-[10px] text-brand-primary font-bold mt-1 uppercase tracking-wide">TOP 1% CLUB</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl hover:bg-brand-surface-high transition-all duration-200 shadow-sm cursor-pointer group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Total Wins</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black font-display text-white leading-none">{currentUser.wins}</span>
              <Trophy className="w-5 h-5 text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl hover:bg-brand-surface-high transition-all duration-200 shadow-sm cursor-pointer group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Matches Played</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black font-display text-white leading-none">
                {currentUser.wins + currentUser.losses}
              </span>
              <Activity className="w-5 h-5 text-on-surface-variant group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl hover:bg-brand-surface-high transition-all duration-200 shadow-sm cursor-pointer group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Peak Elo</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black font-display text-white leading-none">
                {currentUser.peakElo.toLocaleString()}
              </span>
              <TrendingUp className="w-5 h-5 text-brand-tertiary group-hover:scale-110 transition-transform animate-pulse" />
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-outline p-5 rounded-2xl hover:bg-brand-surface-high transition-all duration-200 shadow-sm cursor-pointer group">
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Win Streak</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black font-display text-brand-primary leading-none">
                {currentUser.streak}
              </span>
              <Flame className="w-5 h-5 text-brand-primary fill-brand-primary group-hover:animate-bounce" />
            </div>
          </div>
        </section>

        {/* Recent Match Activity */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-brand-primary" />
              <span>Recent Match Activity</span>
            </h3>
            <button
              onClick={onViewAllHistory}
              className="text-brand-primary font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
            >
              View All History <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recentMatches.length === 0 ? (
              <div className="bg-brand-surface border border-brand-outline p-8 rounded-2xl text-center text-on-surface-variant text-sm">
                No match records reported yet. Go to Admin to log a match!
              </div>
            ) : (
              recentMatches.map(match => (
                <div
                  key={match.id}
                  onClick={() => onSelectOpponentProfile(match.opponentId)}
                  className={`bg-brand-surface border p-4 rounded-xl flex items-center justify-between group hover:bg-brand-surface-high transition-all cursor-pointer ${
                    match.result === 'W' 
                      ? 'border-brand-outline hover:border-brand-primary/40' 
                      : 'border-brand-outline hover:border-red-500/40'
                  }`}
                  title="Click to view player stats"
                >
                  <div className="flex items-center gap-4 animate-scaleIn">
                    {/* Outcome Badge */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-sm ${
                      match.result === 'W'
                        ? 'bg-brand-primary-container/10 text-brand-primary border border-brand-primary/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {match.result}
                    </div>
                    
                    <div>
                      <p className="font-bold text-sm text-white group-hover:text-brand-primary transition-colors">
                        vs. {match.opponentName}
                      </p>
                      <p className="text-on-surface-variant text-xs mt-0.5">
                        {match.type} • {match.timeString}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Result</p>
                      <p className="font-bold text-sm text-white mt-0.5">{match.scores}</p>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg font-bold border min-w-[84px] text-center text-xs ${
                      match.result === 'W'
                        ? 'bg-brand-primary-container/10 text-brand-primary border-brand-primary/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {match.result === 'W' ? '+' : ''}{match.eloChange} Elo
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right Column Sidebar Info */}
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Upcoming Challenges */}
        <section className="bg-brand-surface border border-brand-outline rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-tertiary" />
              <span>Upcoming Challenges</span>
            </h3>
            {upcomingChallenges.length > 0 && (
              <span className="bg-brand-surface-high font-mono text-[10px] font-extrabold px-2 py-1 rounded-full text-brand-tertiary border border-brand-outline animate-pulse">
                {upcomingChallenges.length} PENDING
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {upcomingChallenges.length === 0 ? (
              <div className="text-center p-6 bg-brand-surface-low border border-brand-outline/40 rounded-xl text-on-surface-variant text-xs">
                No pending challenges for you.
              </div>
            ) : (
              upcomingChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="bg-brand-surface-low border border-brand-outline/80 p-4 rounded-xl flex flex-col gap-3 hover:border-brand-outline animate-slideUp"
                >
                  <div className="flex items-center gap-3">
                    {challenge.challengerAvatar ? (
                      <img
                        alt={challenge.challengerName}
                        className="w-10 h-10 rounded-full object-cover border border-brand-outline"
                        src={challenge.challengerAvatar}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-surface-high border border-brand-outline flex items-center justify-center font-bold text-brand-primary text-xs">
                        {challenge.challengerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-white">{challenge.challengerName}</p>
                        {challenge.challengerRank && (
                          <span className="text-[10px] text-brand-tertiary font-semibold">
                            {challenge.challengerRank}
                          </span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        {challenge.timeString} • {challenge.location}
                      </p>
                    </div>
                  </div>

                  {challenge.isIncoming ? (
                    <div className="flex gap-2" id={`act-${challenge.id}`}>
                      <button
                        onClick={() => onAcceptChallenge(challenge.id)}
                        className="flex-1 bg-brand-primary text-black font-bold text-xs py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                      >
                        ACCEPT
                      </button>
                      <button
                        onClick={() => onDeclineChallenge(challenge.id)}
                        className="flex-1 bg-brand-surface-high text-white font-bold text-xs py-2 rounded-lg border border-brand-outline hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        DECLINE
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-brand-surface-high/50 text-[10px] uppercase font-bold text-brand-primary/80 tracking-wider rounded border border-brand-outline/40">
                      Sent • Awaiting Response
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Verifications list matches exactly */}
        <section className="bg-brand-surface border border-brand-outline rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-secondary" />
            <span>Recent Verifications</span>
          </h3>

          <div className="flex flex-col gap-4">
            {verifications.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between ${
                  idx < verifications.length - 1 ? 'pb-3 border-b border-brand-outline' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.status === 'verified' 
                      ? 'bg-brand-primary-container/10 text-brand-primary border border-brand-primary/20'
                      : 'bg-brand-surface-high text-on-surface-variant border border-brand-outline'
                  }`}>
                    {item.status === 'verified' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4 animate-spin text-brand-tertiary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide mt-0.5">
                      {item.type}
                    </p>
                  </div>
                </div>
                <span className="text-on-surface-variant text-[11px] font-medium font-mono">
                  {item.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Performance Insights */}
        <section className="bg-gradient-to-br from-brand-primary-container/10 to-transparent border border-brand-outline rounded-2xl p-5 flex flex-col gap-3 shadow-md">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1">
              <Milestone className="w-3.5 h-3.5 animate-pulse" />
              <span>Season Insights</span>
            </p>
            <p className="font-semibold text-sm text-white">
              You are on track to reach <span className="text-brand-primary font-bold">'{tierName}'</span> tier in approximately {matchesToNext} matches.
            </p>
            
            <div className="w-full bg-brand-surface-high h-2 rounded-full mt-2 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(163,230,53,0.5)] transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant font-mono">
              <span>{currentUser.elo.toLocaleString()} ELO</span>
              <span className="text-brand-primary">{nextTierElo.toLocaleString()} NEXT</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
