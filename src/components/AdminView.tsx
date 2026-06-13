import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  User, 
  ListPlus, 
  TrendingUp, 
  Check, 
  RotateCcw, 
  Calculator, 
  AlertCircle, 
  HelpCircle, 
  Calendar, 
  Award, 
  Ban, 
  ShieldCheck, 
  UserX, 
  FileText, 
  UserPlus,
  Trophy,
  Copy
} from 'lucide-react';
import { Player, Challenge, MatchActivity, Verification, AuditLog } from '../types';
import { calculateEloExchange, checkAntiFarming } from '../eloService';
import { UserRepository } from '../repositories/UserRepository';
import { ChallengeRepository } from '../repositories/ChallengeRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import TournamentBuilderView from './TournamentBuilderView';

interface AdminViewProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  challenges: Challenge[];
  setChallenges: React.Dispatch<React.SetStateAction<Challenge[]>>;
  matches: MatchActivity[];
  setMatches: React.Dispatch<React.SetStateAction<MatchActivity[]>>;
  verifications: Verification[];
  setVerifications: React.Dispatch<React.SetStateAction<Verification[]>>;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser: Player;
  onUpdatePlayerElo: (playerId: string, newElo: number) => void;
  onLogMatchPlay: (matchData: any) => void;
  onResetToDefaults: () => void;
  setActiveScreen?: (screen: any) => void;
}

export default function AdminView({
  players,
  setPlayers,
  challenges,
  setChallenges,
  matches,
  setMatches,
  verifications,
  setVerifications,
  notifications,
  setNotifications,
  currentUser,
  onUpdatePlayerElo,
  onLogMatchPlay,
  onResetToDefaults,
  setActiveScreen
}: AdminViewProps) {
  
  // Guard clause for RBAC (Role Based Access Control)
  const isAuthorized = currentUser.role === 'officer' || currentUser.role === 'superadmin';

  // State Tabs
  const [activeTab, setActiveTab ] = useState<'tournaments' | 'approvals' | 'disputes' | 'seasons' | 'users' | 'elo' | 'logs'>('tournaments');

  // Persistence of Audit logs inside localStorage
  const [auditLogs, setAuditLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem('pb_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      "[SYSTEM] Pickleball Club Elo secure container launched.",
      "[AUTHENTICATION] Admin console unlocked by Super-Admin perspective.",
      "[MIGRATION] Loaded factory seed matchups from 2024 database."
    ];
  });

  // Save audit logs when updated
  useEffect(() => {
    localStorage.setItem('pb_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (msg: string) => {
    const stamp = `[${new Date().toISOString()}]`;
    setAuditLogs(prev => [`${stamp} ${msg}`, ...prev]);
  };

  // Elo slider settings
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [customElo, setCustomElo] = useState<number>(() => {
    const p = players.find(x => x.id === (players[0]?.id || ''));
    return p ? p.elo : 1500;
  });

  // Sandbox log match state
  const [matchPlayer1, setMatchPlayer1] = useState<string>('alex_rivers');
  const [matchPlayer2, setMatchPlayer2] = useState<string>('elena_v');
  const [matchType, setMatchType] = useState<string>('Competitive Singles');
  const [set1Score, setSet1Score] = useState<string>('11-8');
  const [set2Score, setSet2Score] = useState<string>('11-5');
  const [sandboxWinnerId, setSandboxWinnerId] = useState<string>('alex_rivers');
  const [sandboxEloChange, setSandboxEloChange] = useState<number>(20);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handlers for approvals
  const handleApproveUser = async (player: Player) => {
    try {
      await UserRepository.update(player.id, { status: 'active' });
      const updated = players.map(p => p.id === player.id ? { ...p, status: 'active' as const } : p);
      setPlayers(updated);

      await AuditLogRepository.create({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'APPROVE_USER',
        details: `Approved joining request for user: ${player.name} (${player.id}).`
      });

      await NotificationRepository.create({
        id: `notif_${Date.now()}`,
        userId: player.id,
        title: 'Membership Approved',
        message: `Your membership registration has been approved by ${currentUser.name}. Welcome to Pickleball Club Elo!`,
        time: 'Just now',
        createdAt: new Date().toISOString(),
        unread: true
      });

      setSuccessMsg(`Successfully approved membership for ${player.name}!`);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (e) {
      console.error('Approve failed', e);
    }
  };

  const handleDeclineUser = async (player: Player) => {
    try {
      await UserRepository.delete(player.id);

      await AuditLogRepository.create({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'DECLINE_USER',
        details: `Declined registration request for user: ${player.name} (${player.id}).`
      });

      const updated = players.filter(p => p.id !== player.id);
      setPlayers(updated);
      setSuccessMsg(`Declined membership request for ${player.name}.`);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (e) {
      console.error('Decline failed', e);
    }
  };

  // Handlers for user modifications
  const handleSuspendUser = async (player: Player) => {
    try {
      await UserRepository.update(player.id, { status: 'suspended' });
      const updated = players.map(p => p.id === player.id ? { ...p, status: 'suspended' as const } : p);
      setPlayers(updated);
      await AuditLogRepository.create({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'SUSPEND_USER',
        details: `User account was suspended: ${player.name} (${player.id}).`
      });
      setSuccessMsg(`Suspended ${player.name}. Access deactivated.`);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (e) {
      console.error('Suspend failed', e);
    }
  };

  const handleActivateUser = async (player: Player) => {
    try {
      await UserRepository.update(player.id, { status: 'active' });
      const updated = players.map(p => p.id === player.id ? { ...p, status: 'active' as const } : p);
      setPlayers(updated);
      await AuditLogRepository.create({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'ACTIVATE_USER',
        details: `User account was reactivated: ${player.name} (${player.id}).`
      });
      setSuccessMsg(`Reactivated ${player.name}.`);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (e) {
      console.error('Activate failed', e);
    }
  };

  const handlePromoteToOfficer = async (player: Player) => {
    try {
      await UserRepository.update(player.id, { role: 'officer' });
      const updated = players.map(p => p.id === player.id ? { ...p, role: 'officer' as const } : p);
      setPlayers(updated);
      await AuditLogRepository.create({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'PROMOTE_OFFICER',
        details: `User promoted to officer: ${player.name} (${player.id}).`
      });
      setSuccessMsg(`Promoted ${player.name} to Officer.`);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (e) {
      console.error('Promote failed', e);
    }
  };

  const handleDemoteToMember = async (player: Player) => {
    try {
      await UserRepository.update(player.id, { role: 'member' });
      const updated = players.map(p => p.id === player.id ? { ...p, role: 'member' as const } : p);
      setPlayers(updated);
      await AuditLogRepository.create({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'DEMOTE_MEMBER',
        details: `User demoted to member: ${player.name} (${player.id}).`
      });
      setSuccessMsg(`Demoted ${player.name} back to Club Member.`);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (e) {
      console.error('Demote failed', e);
    }
  };

  // Resolve disputed match
  const handleResolveDisputeApprove = (challenge: Challenge) => {
    // Determine the players
    const p1 = players.find(p => p.id === challenge.challengerId);
    const p2 = players.find(p => p.id === challenge.opponentId);
    if (!p1 || !p2) return;

    const isChallengerWinner = challenge.winnerId === p1.id;
    const score = challenge.submittedScore || "11-8, 11-6";

    // Anti farming check
    const farming = checkAntiFarming(p1.id, p2.id, matches);

    let p1Shift = 0;
    let p2Shift = 0;
    let explanationMsg = "";

    if (farming.isFarmed) {
      explanationMsg = "Match is logged but remains UNRANKED due to the 24-hour anti-farming limit.";
      addAuditLog(`Dispute resolved: Certified match #${challenge.id} as UNRANKED due to anti-farming limits.`);
    } else {
      const eloCalc = calculateEloExchange({
        player1Elo: p1.elo,
        player2Elo: p2.elo,
        player1MatchesCount: p1.wins + p1.losses,
        player2MatchesCount: p2.wins + p2.losses,
        isPlayer1Winner: isChallengerWinner,
        scoreString: score
      });
      p1Shift = eloCalc.p1Exchange;
      p2Shift = eloCalc.p2Exchange;
      explanationMsg = `Calculated rating shift: ${p1Shift > 0 ? '+' : ''}${p1Shift} Elo to ${p1.name} and ${p2Shift > 0 ? '+' : ''}${p2Shift} Elo to ${p2.name}.`;
      addAuditLog(`Dispute resolved: Certified score of verified match #${challenge.id} between ${p1.name} and ${p2.name}. ${p1Shift}/${p2Shift} Elo exchange executed.`);
    }

    // Apply ranking adjustments
    const updatedPlayers = players.map(p => {
      if (p.id === p1.id) {
        const nextElo = Math.max(100, p.elo + p1Shift);
        return {
          ...p,
          elo: nextElo,
          peakElo: Math.max(p.peakElo, nextElo),
          wins: isChallengerWinner ? p.wins + 1 : p.wins,
          losses: isChallengerWinner ? p.losses : p.losses + 1,
          streak: isChallengerWinner ? p.streak + 1 : 0
        };
      }
      if (p.id === p2.id) {
        const nextElo = Math.max(100, p.elo + p2Shift);
        return {
          ...p,
          elo: nextElo,
          peakElo: Math.max(p.peakElo, nextElo),
          wins: !isChallengerWinner ? p.wins + 1 : p.wins,
          losses: !isChallengerWinner ? p.losses : p.losses + 1,
          streak: !isChallengerWinner ? p.streak + 1 : 0
        };
      }
      return p;
    });

    // Re-evaluate ranks
    const sorted = [...updatedPlayers].sort((a,b) => b.elo - a.elo);
    const fullyRanked = updatedPlayers.map(p => {
      const idx = sorted.findIndex(item => item.id === p.id);
      let tier: Player['tier'] = 'Expert';
      if (idx === 0) tier = 'Grandmaster';
      else if (idx <= 2) tier = 'Elite';
      else if (idx <= 5) tier = 'Expert';
      else if (idx <= 9) tier = 'Pro';
      else tier = 'Challenger';

      return { ...p, rank: idx + 1, tier };
    });

    setPlayers(fullyRanked);

    // Record activity match log
    const newActivity: MatchActivity = {
      id: `match_dispute_resolved_${Date.now()}`,
      opponentId: isChallengerWinner ? p2.id : p1.id,
      opponentName: isChallengerWinner ? p2.name : p1.name,
      opponentAvatar: isChallengerWinner ? p2.avatar : p1.avatar,
      type: challenge.matchType === 'doubles' ? 'Competitive Doubles' : 'Competitive Singles',
      timeString: 'Just now',
      result: isChallengerWinner ? 'W' : 'L', // Reference perspective
      scores: score,
      eloChange: isChallengerWinner ? p1Shift : p2Shift,
      timestamp: new Date().toISOString()
    };
    setMatches(prev => [newActivity, ...prev]);

    // Shift challenge status
    setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, statusString: 'completed' as const } : c));

    // Log verification
    const newVerif: Verification = {
      id: `v_disp_res_${Date.now()}`,
      title: `Dispute Resolution: match #${challenge.id}`,
      type: 'Verified by Admin Arbitration',
      status: 'verified',
      timeAgo: 'Just now'
    };
    setVerifications(prev => [newVerif, ...prev]);

    setSuccessMsg(`Arbitrated Dispute! Match #${challenge.id} verified. ${explanationMsg}`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleResolveDisputeCancel = (challenge: Challenge) => {
    // Just reset to completed or reset code
    setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, statusString: 'declined' as const } : c));
    addAuditLog(`Dispute resolved: Officer cancelled in dispute match #${challenge.id} between ${challenge.challengerName} and ${challenge.opponentName}. Match invalidated.`);
    setSuccessMsg(`Arbitrated Dispute! Match #${challenge.id} was CANCELLED and deleted with no rating change.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Clear season trigger
  const handleEndActiveSeason = () => {
    // 1. Get Top 3 active players on the leaderboard
    const activePlayers = players.filter(p => p.status === 'active').sort((a,b) => b.elo - a.elo);
    if (activePlayers.length === 0) {
      alert("No active players listed on leaderboard to reset!");
      return;
    }

    const goldWinner = activePlayers[0];
    const silverWinner = activePlayers[1] || null;
    const bronzeWinner = activePlayers[2] || null;

    // 2. Award medals, reset seasonal Elo to 1000, keep peak Elo
    const updated = players.map(p => {
      const isGold = goldWinner && p.id === goldWinner.id;
      const isSilver = silverWinner && p.id === silverWinner.id;
      const isBronze = bronzeWinner && p.id === bronzeWinner.id;

      const currAwards = p.awards || { gold: 0, silver: 0, bronze: 0 };
      const nextAwards = {
        gold: currAwards.gold + (isGold ? 1 : 0),
        silver: currAwards.silver + (isSilver ? 1 : 0),
        bronze: currAwards.bronze + (isBronze ? 1 : 0)
      };

      return {
        ...p,
        awards: nextAwards,
        elo: 1000 // Elo resets to 1000
      };
    });

    // Re-evaluate ranks with updated Elo of 1000
    const sorted = [...updated].sort((a,b) => b.elo - a.elo);
    const fullyRanked = updated.map(p => {
      const idx = sorted.findIndex(item => item.id === p.id);
      let tier: Player['tier'] = 'Expert';
      if (idx === 0) tier = 'Grandmaster';
      else if (idx <= 2) tier = 'Elite';
      else if (idx <= 5) tier = 'Expert';
      else if (idx <= 9) tier = 'Pro';
      else tier = 'Challenger';

      return { ...p, rank: idx + 1, tier };
    });

    setPlayers(fullyRanked);

    // Save logs
    const msg = `OFFICIAL SEASON END TRIGGERED of Season 1. Gold Medal: ${goldWinner.name} (${goldWinner.elo} ELO). Silver Medal: ${silverWinner ? silverWinner.name : 'N/A'}. Bronze Medal: ${bronzeWinner ? bronzeWinner.name : 'N/A'}. Elo scores reset to 1000. Peak Elo and historical logs conserved.`;
    addAuditLog(msg);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 10000);

    // Broadcast notification toast to all
    const notif = {
      id: `season_end_${Date.now()}`,
      title: 'Season Completed & Awards Distributed 🏆',
      message: `Congratulations to ${goldWinner.name} for claiming 1st place! Season has reset. All players set to 1000 Elo for Season 2!`,
      time: 'Just now',
      unread: true
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Submit manual sliders
  const handleSliderEloSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePlayerElo(selectedPlayerId, customElo);
    const pName = players.find(x => x.id === selectedPlayerId)?.name || 'Player';
    addAuditLog(`Officer adjusted ELO directly for player: ${pName} to ${customElo}.`);
    setSuccessMsg(`Successfully set rating for ${pName} to ${customElo} ELO!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Sandbox match logging
  const handleSandboxLogMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchPlayer1 === matchPlayer2) {
      alert("Please select distinct players to audit matches.");
      return;
    }

    onLogMatchPlay({
      player1Id: matchPlayer1,
      player2Id: matchPlayer2,
      type: matchType,
      scoreString: `${set1Score}, ${set2Score}`,
      winnerId: sandboxWinnerId,
      eloTransferred: sandboxEloChange
    });

    const p1Name = players.find(x => x.id === matchPlayer1)?.name || 'P1';
    const p2Name = players.find(x => x.id === matchPlayer2)?.name || 'P2';
    const winName = sandboxWinnerId === matchPlayer1 ? p1Name : p2Name;

    addAuditLog(`Logged Match Audit: ${p1Name} vs ${p2Name} (${set1Score}, ${set2Score}). Winner: ${winName}. Elo Exchange: ${sandboxEloChange}.`);
    setSuccessMsg(`Simulated Match Logged! ${winName} won against ${sandboxWinnerId === matchPlayer1 ? p2Name : p1Name}. ELO calculated and synchronized.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handlePlayerChange = (id: string) => {
    setSelectedPlayerId(id);
    const p = players.find(x => x.id === id);
    if (p) {
      setCustomElo(p.elo);
    }
  };

  // 1. RBAC Restriction Shield rendering
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center animate-fadeIn flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-red-500/20 bg-red-500/5 text-red-400 flex items-center justify-center text-2xl animate-pulse shadow-md">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-lg font-black text-white uppercase tracking-wider">
            Access Key Refused
          </h2>
          <p className="text-on-surface-variant text-xs leading-relaxed max-w-xs mx-auto">
            The Admin dashboard is strictly restricted to club Officers and Super Administrators. 
            Your current account clearance ({currentUser.role.toUpperCase()}) is insufficient.
          </p>
        </div>
        <div className="bg-brand-surface border border-brand-outline p-4 rounded-xl text-[10px] w-full font-mono text-left text-on-surface-variant flex flex-col gap-1 select-none">
          <span>ID: {currentUser.id}</span>
          <span>TIER: {currentUser.tier}</span>
          <span>ROLE: {currentUser.role.toUpperCase()}</span>
          <span>STATUS: {currentUser.status.toUpperCase()}</span>
        </div>
      </div>
    );
  }

  // Filter pending users
  const pendingUsers = players.filter(p => p.status === 'pending');
  // Filter disputed challenges
  const disputedChallenges = challenges.filter(c => c.statusString === 'disputed');

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12 text-left">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-outline pb-4">
        <div>
          <h2 className="font-display text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-primary" />
            <span>Pickleball Club Elo Admin Hub</span>
          </h2>
          <p className="text-on-surface-variant font-sans text-xs mt-1">
            Resolve member status, arbitrate active ranking disputes, reset season calendars and audit log system states.
          </p>
        </div>

        <button
          onClick={() => {
            onResetToDefaults();
            setAuditLogs([
              `[${new Date().toISOString()}] [FACTORY RESET] System returned to pristine default seed data.`,
              `[${new Date().toISOString()}] [SYSTEM] Container reset complete.`
            ]);
            setSuccessMsg("All player analytics, medal rosters, and matchup statistics have been reset!");
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
          className="bg-brand-surface-high hover:bg-brand-surface border border-brand-outline hover:border-brand-primary text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-lg flex items-center gap-2 text-white active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-primary" />
          <span>Reset Factory Data</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-brand-primary-container/10 border border-brand-primary/30 rounded-xl text-brand-primary text-xs flex items-start gap-2.5 animate-scaleIn select-none font-semibold">
          <Check className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Advanced Tabs Row */}
      <div className="flex border-b border-brand-outline overflow-x-auto no-scrollbar gap-5">
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'tournaments' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <Trophy className="w-3.5 h-3.5 text-brand-primary" />
          <span>Bracket Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'approvals' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Pending Approvals</span>
          {pendingUsers.length > 0 && (
            <span className="bg-brand-primary text-black font-extrabold px-1.5 py-0.5 text-[9px] rounded font-mono">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'disputes' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-brand-secondary" />
          <span>Match Disputes</span>
          {disputedChallenges.length > 0 && (
            <span className="bg-brand-secondary text-black font-extrabold px-1.5 py-0.5 text-[9px] rounded font-mono">
              {disputedChallenges.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('seasons')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'seasons' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <Calendar className="w-3.5 h-3.5 text-brand-primary" />
          <span>Season System</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'users' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <User className="w-3.5 h-3.5 text-brand-tertiary" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('elo')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'elo' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Elo Adjustments</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer bg-transparent border-0 flex items-center gap-1.5 transition-all ${activeTab === 'logs' ? 'text-brand-primary border-b-2 border-brand-primary font-black' : 'text-on-surface-variant hover:text-white'}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* Tabs Contents */}
      <div className="bg-brand-surface border border-brand-outline rounded-2xl p-6 min-h-[350px] shadow-2xl">
        
        {/* Bracket Builder Tab Content */}
        {activeTab === 'tournaments' && (
          <TournamentBuilderView 
            players={players} 
            setActiveScreen={setActiveScreen || (() => {})} 
          />
        )}
        
        {/* 1. MEMBERSHIP QUEUE APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider border-b border-brand-outline pb-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-primary" />
              <span>Pending Membership Approval Queue</span>
            </h3>

            {pendingUsers.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center gap-2">
                <Check className="w-6 h-6 text-[#ccff80]" />
                <p className="font-bold text-white">All registration requests resolved!</p>
                <p>The membership queue is currently 100% clean.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map(p => (
                  <div key={p.id} className="bg-brand-surface-low border border-brand-outline p-4 rounded-xl flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded shrink-0 bg-brand-surface-high border border-brand-outline flex items-center justify-center text-[#ccff80] font-black text-sm">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="text-sm font-black text-white truncate">{p.name}</h4>
                        <div className="group relative inline-flex items-center gap-1 mt-0.5 max-w-full">
                          <span className="text-[10px] text-on-surface-variant font-mono truncate block">ID: {p.id}</span>
                          <Copy
                            onClick={() => navigator.clipboard.writeText(p.id)}
                            className="w-3 h-3 text-brand-primary cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveUser(p)}
                        className="px-3 py-1.5 bg-brand-primary hover:opacity-95 text-black font-extrabold text-[10px] uppercase rounded transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeclineUser(p)}
                        className="px-3 py-1.5 border border-brand-outline text-red-400 hover:bg-red-500/10 font-bold text-[10px] uppercase rounded transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. MATCH DISPUTES RESOLUTIONS */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider border-b border-brand-outline pb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brand-secondary" />
              <span>Arbitrate Disputed Match Scores</span>
            </h3>

            {disputedChallenges.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center gap-2">
                <Check className="w-6 h-6 text-brand-primary" />
                <p className="font-bold text-white">Zero disputed scores reported!</p>
                <p>No active match disputes require officer arbitration currently.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {disputedChallenges.map(c => (
                  <div key={c.id} className="bg-brand-surface-low border border-brand-outline p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="text-left space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-tight text-white">{c.challengerName} vs. {c.opponentName}</span>
                        <span className="text-[9px] bg-red-400/10 text-red-400 border border-red-500/10 rounded px-1.5 py-0.5 font-bold uppercase">Disputed Match</span>
                      </div>
                      <p className="text-xs text-on-surface-variant py-0.5">
                        Reported Score: <strong className="text-[#ccff80] font-mono">{c.submittedScore}</strong>
                      </p>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        Court Location: {c.location} • Match ID Refer: #{c.id}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <button
                        onClick={() => handleResolveDisputeApprove(c)}
                        className="px-4 py-2 bg-[#ccff80] text-black font-extrabold text-[10px] uppercase rounded cursor-pointer"
                      >
                        Approve Score
                      </button>
                      <button
                        onClick={() => handleResolveDisputeCancel(c)}
                        className="px-4 py-2 border border-brand-outline text-red-400 hover:bg-red-500/10 font-bold text-[10px] uppercase rounded cursor-pointer"
                      >
                        Cancel Match
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SEASON SYSTEM MANAGEMENT */}
        {activeTab === 'seasons' && (
          <div className="space-y-6">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider border-b border-brand-outline pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>Seasonal Calendar Rankings Management</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Season status indicators */}
              <div className="md:col-span-5 bg-brand-surface-low border border-brand-outline p-5 rounded-xl flex flex-col gap-4 text-left">
                <span className="text-xs font-mono text-[#ccff80] font-black tracking-widest uppercase">● Active Campaign Status</span>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white uppercase italic">Season 1: Summer Launch</h4>
                  <p className="text-[11px] text-on-surface-variant font-semibold">Started on: June 01, 2026 • Closes on: Sept 30, 2026</p>
                </div>
                
                <div className="border-t border-brand-outline/40 pt-3">
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Current Leaderboard Standing Awards</span>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-white font-semibold">
                      <span>🥇 Gold (Rank 1):</span>
                      <span className="text-brand-primary">{players.sort((a,b)=>b.elo-a.elo)[0]?.name}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold">
                      <span>🥈 Silver (Rank 2):</span>
                      <span>{players.sort((a,b)=>b.elo-a.elo)[1]?.name}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold flex-wrap">
                      <span>🥉 Bronze (Rank 3):</span>
                      <span>{players.sort((a,b)=>b.elo-a.elo)[2]?.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* End season action triggers */}
              <div className="md:col-span-7 flex flex-col justify-between gap-4 p-2">
                <div className="space-y-3.5">
                  <div className="flex gap-2">
                    <Award className="w-5 h-5 text-[#ccff80] shrink-0" />
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      <strong>Closing the Active Season will:</strong> Award perpetual medals to the Top 3 players listed above. Reset Elo scores of all club players back to <strong>1000</strong>. Save initial peak Elos and lifetime stats unchanged.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <HelpCircle className="w-5 h-5 text-brand-secondary shrink-0" />
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      The tournament administrator will be logged in the audit ticker, and an automatic broadcast notification will distribute to all users instantly!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEndActiveSeason}
                  className="w-full bg-brand-primary text-black font-extrabold text-[10px] uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer shadow-lg active:scale-98 transition-all pt-3.5 pb-3.5"
                >
                  <Award className="w-4 h-4 fill-black" />
                  <span>End Season & Distribute Medals with rating reset</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 4. USER DIRECTORY MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4 text-left">
            <h3 className="font-display text-sm font-black text-white uppercase tracking-wider border-b border-brand-outline pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-tertiary" />
              <span>Roster Registry User Access Control & Permissions</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-on-surface-variant font-sans border-collapse">
                <thead>
                  <tr className="border-b border-brand-outline text-[10px] uppercase tracking-wider font-extrabold text-white text-left">
                    <th className="py-2 px-1">Player</th>
                    <th className="py-2 px-1">Status</th>
                    <th className="py-2 px-1">Role Type</th>
                    <th className="py-2 px-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-outline/40">
                  {players.map(p => (
                    <tr key={p.id} className="hover:bg-brand-surface-high/20">
                      <td className="py-2 p-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white block truncate max-w-[120px]">{p.name}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">({p.elo} ELO)</span>
                        </div>
                      </td>
                      <td className="py-2 p-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p.status === 'active' ? 'bg-[#ccff80]/10 text-[#ccff80]' : p.status === 'suspended' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-400/10 text-yellow-500'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 p-1">
                        <span className="text-white font-mono text-[10px] font-bold uppercase">{p.role}</span>
                      </td>
                      <td className="py-2 p-1 text-right space-x-1.5">
                        {p.id !== currentUser.id && (
                          <>
                            {/* Role switchers */}
                            {p.role === 'member' ? (
                              <button
                                onClick={() => handlePromoteToOfficer(p)}
                                className="px-2 py-1 bg-brand-surface border border-brand-outline text-[9px] font-bold text-[#ccff80] hover:border-[#ccff80] rounded"
                              >
                                Promote
                              </button>
                            ) : p.role === 'officer' ? (
                              <button
                                onClick={() => handleDemoteToMember(p)}
                                className="px-2 py-1 bg-brand-surface border border-brand-outline text-[9px] font-bold text-yellow-500 hover:border-yellow-500 rounded"
                              >
                                Demote
                              </button>
                            ) : null}

                            {/* Status switchers */}
                            {p.status === 'active' ? (
                              <button
                                onClick={() => handleSuspendUser(p)}
                                className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 hover:bg-red-500/20 rounded"
                              >
                                Suspend
                              </button>
                            ) : p.status === 'suspended' ? (
                              <button
                                onClick={() => handleActivateUser(p)}
                                className="px-2 py-1 bg-green-500/10 border border-[#ccff80]/20 text-[9px] font-bold text-[#ccff80] hover:bg-green-500/20 rounded"
                              >
                                Activate
                              </button>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. DIRECT ELO RATING SLIDERS */}
        {activeTab === 'elo' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick adjust rating */}
            <div className="space-y-4">
              <h3 className="font-display text-sm font-black text-white uppercase tracking-wider border-b border-brand-outline pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-primary" />
                <span>Adjust Player Elo Directly</span>
              </h3>
              
              <form onSubmit={handleSliderEloSubmit} className="space-y-4 text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Selected Player:</label>
                  <select
                    className="bg-brand-surface-lowest border border-brand-outline rounded-lg p-3 text-xs text-white focus:border-brand-primary outline-none cursor-pointer w-full"
                    value={selectedPlayerId}
                    onChange={(e) => handlePlayerChange(e.target.value)}
                  >
                    {players.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.tier} • {item.elo} ELO)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant font-mono">
                    <span>Manually edit rating score:</span>
                    <span className="text-brand-primary font-black text-xs">{customElo} ELO</span>
                  </div>
                  
                  <input
                    type="range"
                    min="1000"
                    max="3000"
                    step="5"
                    value={customElo}
                    onChange={(e) => setCustomElo(Number(e.target.value))}
                    className="w-full h-1.5 bg-brand-surface-lowest rounded-full appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-on-surface-variant">
                    <span>1,000 (Challenger)</span>
                    <span>2,000 (Pro)</span>
                    <span>3,000 (Grandmaster Rank 1)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ccff80] text-black font-extrabold text-[10px] py-3 uppercase tracking-wider rounded-lg hover:opacity-95 transition-all shadow cursor-pointer mt-2"
                >
                  Apply Arbitrary Rating adjustment
                </button>
              </form>
            </div>

            {/* Simulated match playing logging */}
            <div className="space-y-4">
              <h3 className="font-display text-sm font-black text-white uppercase tracking-wider border-b border-brand-outline pb-2 flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-brand-secondary" />
                <span>Log Court Match Scoreboards</span>
              </h3>

              <form onSubmit={handleSandboxLogMatch} className="space-y-3 font-sans text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] uppercase font-bold text-on-surface-variant">Home competitor:</label>
                    <select
                      value={matchPlayer1}
                      onChange={(e) => setMatchPlayer1(e.target.value)}
                      className="bg-brand-surface-lowest border border-brand-outline rounded p-2 text-xs text-white"
                    >
                      {players.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] uppercase font-bold text-on-surface-variant">Opponent player:</label>
                    <select
                      value={matchPlayer2}
                      onChange={(e) => setMatchPlayer2(e.target.value)}
                      className="bg-brand-surface-lowest border border-brand-outline rounded p-2 text-xs text-white"
                    >
                      {players.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] uppercase font-bold text-on-surface-variant">Set 1 score:</label>
                    <input
                      type="text"
                      className="bg-brand-surface-lowest border border-brand-outline rounded p-2 text-xs text-white text-center font-mono"
                      value={set1Score}
                      onChange={(e) => setSet1Score(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] uppercase font-bold text-on-surface-variant">Set 2 score:</label>
                    <input
                      type="text"
                      className="bg-brand-surface-lowest border border-brand-outline rounded p-2 text-xs text-white text-center font-mono"
                      value={set2Score}
                      onChange={(e) => setSet2Score(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] uppercase font-bold text-on-surface-variant">Winner player:</label>
                    <select
                      value={sandboxWinnerId}
                      onChange={(e) => setSandboxWinnerId(e.target.value)}
                      className="bg-brand-surface-lowest border border-brand-outline rounded p-2 text-xs text-white"
                    >
                      <option value={matchPlayer1}>Home player wins</option>
                      <option value={matchPlayer2}>Opponent wins</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] uppercase font-bold text-on-surface-variant">Elo exchange:</label>
                    <input
                      type="number"
                      className="bg-brand-surface-lowest border border-brand-outline rounded p-2 text-xs text-white text-center font-mono"
                      value={sandboxEloChange}
                      onChange={(e) => setSandboxEloChange(Number(e.target.value))}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-surface-high hover:bg-brand-surface border border-brand-outline hover:border-brand-primary text-white font-extrabold text-[10px] py-2.5 uppercase tracking-wider rounded transition-all cursor-pointer mt-1"
                >
                  Inscribe Score directly
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 6. AUDIT LOGS TICKER */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand-outline pb-2">
              <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                <span>Security Audit logs (Logs Persistent)</span>
              </h3>
              <button
                onClick={() => {
                  setAuditLogs([
                    `[${new Date().toISOString()}] [PURGE] Audit logs cleared by officer commands.`
                  ]);
                }}
                className="text-[9px] font-bold text-red-400 hover:underline bg-transparent border-0 cursor-pointer"
              >
                Clear Log History
              </button>
            </div>

            <div className="bg-[#040507] border border-brand-outline/80 p-4 rounded-xl font-mono text-[10px] text-on-surface-variant h-64 overflow-y-auto space-y-1.5 text-left select-all">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed odd:text-white/80">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
