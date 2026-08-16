import React, { useState } from 'react';
import { 
  Swords, 
  Clock, 
  MapPin, 
  ShieldQuestion, 
  BookOpen, 
  Calculator, 
  Flame, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Send,
  HelpCircle,
  Trophy
} from 'lucide-react';
import { Challenge, Player } from '../types';

interface ChallengesViewProps {
  challenges: Challenge[];
  onAcceptChallenge: (id: string) => void;
  onDeclineChallenge: (id: string) => void;
  onCancelChallenge: (id: string) => void;
  currentUser: Player;
  onSubmitScore: (id: string, score: string, winnerId: string) => void;
  onVerifyScore: (id: string) => void;
  onDisputeScore: (id: string) => void;
  players: Player[];
}

export default function ChallengesView({
  challenges,
  onAcceptChallenge,
  onDeclineChallenge,
  onCancelChallenge,
  currentUser,
  onSubmitScore,
  onVerifyScore,
  onDisputeScore,
  players
}: ChallengesViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  
  // Score submission state
  const [submittingChallengeId, setSubmittingChallengeId] = useState<string | null>(null);
  const [score1, setScore1] = useState('11-8');
  const [score2, setScore2] = useState('11-6');
  const [score3, setScore3] = useState(''); // Game 3 is optional in best-of-3
  const [winnerSelectionId, setWinnerSelectionId] = useState('');

  // Filter lists based on the unified lifecycle tabs
  const pendingChallenges = challenges.filter(c => 
    c.statusString === 'pending' && (c.challengerId === currentUser.id || c.opponentId === currentUser.id)
  );

  const activeMatches = challenges.filter(c => 
    (c.statusString === 'accepted' || c.statusString === 'submitted' || c.statusString === 'disputed') &&
    (c.challengerId === currentUser.id || c.opponentId === currentUser.id)
  );

  const completedMatches = challenges.filter(c => 
    (c.statusString === 'completed' || c.statusString === 'declined') &&
    (c.challengerId === currentUser.id || c.opponentId === currentUser.id)
  );

  const getTabList = () => {
    if (activeTab === 'pending') return pendingChallenges;
    if (activeTab === 'active') return activeMatches;
    return completedMatches;
  };

  const activeList = getTabList();

  const handleOpenSubmitForm = (c: Challenge) => {
    setSubmittingChallengeId(c.id);
    // Set default winner selection to opponent (or challenger) depending on current user
    setWinnerSelectionId(c.opponentId);
  };

  const handleLocalSubmit = (e: React.FormEvent, cId: string) => {
    e.preventDefault();
    let finalScore = `${score1}, ${score2}`;
    if (score3.trim()) {
      finalScore += `, ${score3.trim()}`;
    }
    onSubmitScore(cId, finalScore, winnerSelectionId);
    setSubmittingChallengeId(null);
    setScore1('11-8');
    setScore2('11-6');
    setScore3('');
  };

  return (
    <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Dynamic Match Challenge Main Workspace Grid */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        {/* Advanced Tab Management row matching Pickleball theme */}
        <div className="flex border-b border-brand-outline gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer bg-transparent border-0 ${
              activeTab === 'pending'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span>Pending Invites</span>
            <span className="bg-brand-surface-high text-white px-1.5 py-0.5 rounded text-[10px] font-mono">
              {pendingChallenges.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer bg-transparent border-0 ${
              activeTab === 'active'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span>Active Matches</span>
            <span className="bg-brand-surface-high text-white px-1.5 py-0.5 rounded text-[10px] font-mono">
              {activeMatches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer bg-transparent border-0 ${
              activeTab === 'history'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span>Match History</span>
          </button>
        </div>

        {/* Dynamic Card Area rendering */}
        <div className="flex flex-col gap-4">
          {activeList.length === 0 ? (
            <div className="bg-brand-surface border border-brand-outline p-12 rounded-2xl text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
              <ShieldQuestion className="w-8 h-8 text-on-surface-variant/40" />
              <p className="font-semibold text-white">No active matches or invitations here.</p>
              <p className="text-xs max-w-sm">
                {activeTab === 'pending' 
                  ? "Awaiting matchup challenges! Click 'New Challenge' to initiate tournament ranking games."
                  : activeTab === 'active' 
                  ? "No matches are currently in progress. Complete a challenge to start tracking scoreboards!"
                  : "No historic completions found between records."}
              </p>
            </div>
          ) : (
            activeList.map(item => {
              const isUserChallenger = item.challengerId === currentUser.id;
              const opponentLabel = isUserChallenger ? item.opponentName : item.challengerName;
              const acceptedBy = item.acceptedBy || [];
              const hasUserAccepted = acceptedBy.includes(currentUser.id);
              const isIncomingInvite = item.statusString === 'pending' && !hasUserAccepted;

              const isDoubles = item.matchType === 'doubles';
              const opponentPartner = isDoubles ? players.find(p => p.id === item.opponentPartnerId) : null;
              const challengerPartner = isDoubles ? players.find(p => p.id === item.challengerPartnerId) : null;

              // Build list of all player IDs and their names for acceptance status
              const allPlayerIds = [item.challengerId, item.opponentId];
              if (isDoubles && item.challengerPartnerId) allPlayerIds.push(item.challengerPartnerId);
              if (isDoubles && item.opponentPartnerId) allPlayerIds.push(item.opponentPartnerId);
              const playerNames: Record<string, string> = {
                [item.challengerId]: item.challengerName,
                [item.opponentId]: item.opponentName,
              };
              if (item.challengerPartnerId && challengerPartner) playerNames[item.challengerPartnerId] = challengerPartner.name;
              if (item.opponentPartnerId && opponentPartner) playerNames[item.opponentPartnerId] = opponentPartner.name;

              return (
                <div
                  key={item.id}
                  className="bg-brand-surface border border-brand-outline p-5 rounded-xl flex flex-col gap-4 hover:border-brand-primary/40 transition-all duration-300 shadow-xl animate-scaleIn"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-[#0f1216] border border-brand-outline flex items-center justify-center font-black text-brand-primary text-sm shrink-0">
                        {opponentLabel.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">
                            {isUserChallenger
                              ? `vs. ${item.opponentName}${isDoubles && opponentPartner ? ` / ${opponentPartner.name}` : ''}`
                              : `${item.challengerName}${isDoubles && challengerPartner ? ` / ${challengerPartner.name}` : ''}'s Challenge`}
                          </h3>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-surface-high px-2 py-0.5 rounded text-on-surface-variant font-mono">
                            {item.matchType || 'singles'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-brand-primary" />
                            <span>{item.timeString}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-secondary" />
                            <span>{item.location}</span>
                          </span>
                        </div>
                        {item.statusString === 'pending' && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {allPlayerIds.map(pid => (
                              <span
                                key={pid}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  acceptedBy.includes(pid)
                                    ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                                    : 'bg-brand-surface-high text-on-surface-variant border-brand-outline'
                                }`}
                              >
                                {acceptedBy.includes(pid) ? '✓ ' : ''}{playerNames[pid] || 'Unknown'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Integrated Match Lifecycle Controllers */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                      {/* PENDING ACTIONS */}
                      {item.statusString === 'pending' && (
                        !hasUserAccepted ? (
                          <>
                            <button
                              onClick={() => onAcceptChallenge(item.id)}
                              className="px-4 py-2 bg-brand-primary text-black font-extrabold text-[10px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer rounded-lg"
                            >
                              Accept Match
                            </button>
                            <button
                              onClick={() => onDeclineChallenge(item.id)}
                              className="px-4 py-2 border border-brand-outline text-on-surface-variant font-bold text-[10px] uppercase tracking-wider hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-95 transition-all cursor-pointer rounded-lg"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-on-surface-variant lowercase tracking-wider bg-brand-surface-lowest border border-brand-outline px-3 py-1.5 rounded-lg">
                              You accepted — waiting for others...
                            </span>
                          </div>
                        )
                      )}

                      {/* ACCEPTED - MATCH PLAY IN PROGRESS */}
                      {item.statusString === 'accepted' && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          {submittingChallengeId !== item.id ? (
                            <button
                              onClick={() => handleOpenSubmitForm(item)}
                              className="w-full md:w-auto px-5 py-2.5 bg-[#ccff80] text-black font-extrabold text-[10px] uppercase tracking-wider hover:opacity-95 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            >
                              <Play className="w-3 h-3 fill-black" />
                              <span>Submit Match Score</span>
                            </button>
                          ) : (
                            <span className="text-xs text-brand-primary font-mono font-bold animate-pulse">Reporting scores...</span>
                          )}
                        </div>
                      )}

                      {/* SUBMITTED - WAITING FOR OPPONENT VERIFICATION */}
                      {item.statusString === 'submitted' && (
                        item.submittedById === currentUser.id ? (
                          <div className="bg-brand-surface-high px-4 py-2 rounded-xl border border-brand-outline text-[11px] text-on-surface-variant leading-tight text-right flex flex-col">
                            <span className="text-white font-bold uppercase tracking-wider text-[10px]">Awaiting Verification</span>
                            <span className="mt-0.5">Submitted score: <strong className="text-brand-primary font-mono">{item.submittedScore}</strong></span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 items-end w-full md:w-auto">
                            <div className="text-[11px] text-white font-semibold">
                              Opponent reported score: <strong className="text-brand-primary font-mono">{item.submittedScore}</strong>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onVerifyScore(item.id)}
                                className="px-4 py-1.5 bg-brand-primary text-black font-extrabold text-[10px] uppercase hover:opacity-90 rounded"
                              >
                                Approve & Log Elo
                              </button>
                              <button
                                onClick={() => onDisputeScore(item.id)}
                                className="px-4 py-1.5 border border-red-500/30 bg-red-500/10 text-red-400 font-extrabold text-[10px] uppercase hover:bg-red-500/20 rounded"
                              >
                                Dispute
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {/* DISPUTED - UNDER OFFICER REVIEW */}
                      {item.statusString === 'disputed' && (
                        <span className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Dispute review pending</span>
                        </span>
                      )}

                      {/* COMPLETED OR DECLINED HISTORIES */}
                      {item.statusString === 'completed' && (
                        <div className="flex flex-col items-end text-right">
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#ccff80] tracking-wider bg-brand-primary/5 px-2.5 py-1 rounded border border-[#ccff80]/20">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                          <span className="text-[10px] text-on-surface-variant mt-1.5 font-mono">Score: {item.submittedScore}</span>
                        </div>
                      )}

                      {item.statusString === 'declined' && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-400 bg-red-500/5 px-2.5 py-1 rounded border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Declined</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission mini-form inline wrapper */}
                  {submittingChallengeId === item.id && (
                    <div className="bg-brand-surface-lowest p-5 rounded-xl border border-brand-outline animate-slideDown mt-2">
                      <div className="flex items-center justify-between border-b border-brand-outline pb-2 mb-4">
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-primary flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          <span>best-of-3 set score reporting</span>
                        </span>
                        <button
                          onClick={() => setSubmittingChallengeId(null)}
                          className="bg-transparent border-0 text-on-surface-variant hover:text-white cursor-pointer text-xs"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={(e) => handleLocalSubmit(e, item.id)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-on-surface-variant">Game 1 Score:</label>
                            <input
                              type="text"
                              value={score1}
                              onChange={(e) => setScore1(e.target.value)}
                              placeholder="e.g. 11-8"
                              required
                              className="bg-brand-surface-high border border-brand-outline p-2 rounded text-xs text-white text-center font-mono focus:border-brand-primary outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-on-surface-variant">Game 2 Score:</label>
                            <input
                              type="text"
                              value={score2}
                              onChange={(e) => setScore2(e.target.value)}
                              placeholder="e.g. 11-6"
                              required
                              className="bg-brand-surface-high border border-brand-outline p-2 rounded text-xs text-white text-center font-mono focus:border-brand-primary outline-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] uppercase font-bold text-on-surface-variant">Game 3 (If played):</label>
                            <input
                              type="text"
                              value={score3}
                              onChange={(e) => setScore3(e.target.value)}
                              placeholder="e.g. 11-9 (optional)"
                              className="bg-brand-surface-high border border-brand-outline p-2 rounded text-xs text-white text-center font-mono focus:border-brand-primary outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-1">
                          <label className="text-[9px] uppercase font-bold text-on-surface-variant">Select Match Winner:</label>
                          <select
                            value={winnerSelectionId}
                            onChange={(e) => setWinnerSelectionId(e.target.value)}
                            required
                            className="bg-brand-surface-high border border-brand-outline p-2.5 rounded text-xs text-white select-none focus:border-brand-primary outline-none"
                          >
                            <option value="">-- Choose Winner --</option>
                            <optgroup label={`${item.challengerName}'s Team`}>
                              <option value={item.challengerId}>{item.challengerName} (Challenger)</option>
                              {isDoubles && challengerPartner && (
                                <option value={challengerPartner.id}>{challengerPartner.name} (Partner)</option>
                              )}
                            </optgroup>
                            <optgroup label={`${item.opponentName}'s Team`}>
                              <option value={item.opponentId}>{item.opponentName} (Opponent)</option>
                              {isDoubles && opponentPartner && (
                                <option value={opponentPartner.id}>{opponentPartner.name} (Partner)</option>
                              )}
                            </optgroup>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-brand-primary text-black font-extrabold text-[10px] py-3 uppercase tracking-wider hover:opacity-95 rounded-lg transition-opacity cursor-pointer shadow"
                        >
                          Send Score for Opponent Approval
                        </button>
                      </form>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Sidebar panel (Right side) */}
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Play rules widget */}
        <div className="bg-brand-surface border border-brand-outline rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-brand-surface-high/60 px-5 py-4 border-b border-brand-outline flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-primary" />
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Verification Flow
            </h3>
          </div>
          <div className="p-5 flex flex-col gap-4 text-xs text-on-surface-variant leading-relaxed text-left">
            <div className="flex gap-2">
              <span className="font-bold text-brand-primary font-mono">1.</span>
              <p>Either player submits the match scores after finishing active court plays.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-[#ccff80] font-mono">2.</span>
              <p>The opponent approves the scores to log rankings instantly, or disputes them.</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-amber-400 font-mono">3.</span>
              <p>Disputed scores block automated rating updates and require Officer review.</p>
            </div>
          </div>
        </div>

        {/* Anti-Farming info block */}
        <div className="bg-brand-surface border border-brand-outline rounded-2xl p-5 text-left flex flex-col gap-3 shadow-xl">
          <h4 className="font-display text-xs font-black uppercase tracking-wider text-brand-secondary flex items-center gap-1.5 border-b border-brand-outline pb-2">
            <AlertTriangle className="w-4 h-4 text-brand-secondary" />
            <span>Anti-Farming Limits</span>
          </h4>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Players are restricted to a maximum of <strong>3 ranked matches</strong> against the same opponent within a rolling 24-hour window. Additional matches are recorded as <strong>Unranked</strong> (no Elo calculated).
          </p>
          <div className="mt-1 bg-brand-surface-low border border-brand-outline p-2.5 rounded-lg text-center font-mono text-[10px] text-white">
            Matchup counts auto-clear 24h after play
          </div>
        </div>

      </aside>
    </div>
  );
}
