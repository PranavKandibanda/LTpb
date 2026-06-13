import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  X, 
  Check, 
  Bell, 
  Search,
  Users
} from 'lucide-react';
import { Player, MatchActivity, Challenge, Verification, ActiveScreen } from './types';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

// --- Clean Repository Layer Imports ---
import { UserRepository } from './repositories/UserRepository';
import { ChallengeRepository } from './repositories/ChallengeRepository';
import { MatchRepository } from './repositories/MatchRepository';
import { VerificationRepository } from './repositories/VerificationRepository';
import { NotificationRepository } from './repositories/NotificationRepository';

// --- Clean Service Layer Imports ---
import { UserService } from './services/UserService';
import { ChallengeService } from './services/ChallengeService';
import { NotificationService } from './services/NotificationService';

import { generateAvatars } from './avatarGenerator';
import AvatarPicker from './components/AvatarPicker';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import LeaderboardView from './components/LeaderboardView';
import ChallengesView from './components/ChallengesView';
import ProfileView from './components/ProfileView';
import NotificationsView from './components/NotificationsView';
import AdminView from './components/AdminView';
import SignInView from './components/SignInView';
import PendingApprovalView from './components/PendingApprovalView';
import SuspendedView from './components/SuspendedView';
import TournamentBuilderView from './components/TournamentBuilderView';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [authUser, setAuthUser] = useState<import('firebase/auth').User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Stateful databases synced via Firestore real-time listeners inside Repositories
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchActivity[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Current authenticated player profile (synced with Firestore)
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  // Selected player inspect state for Profile view
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);

  // Avatar picker state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarList = useMemo(() => generateAvatars(), []);
  const pendingAvatar = useRef('');

  // New challenge creation modal state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [modalOpponentId, setModalOpponentId] = useState('');
  const [modalLocation, setModalLocation] = useState('Central Park Court #4');
  const [modalTime, setModalTime] = useState('Friday, 5:30 PM');
  const [modalMatchType, setModalMatchType] = useState<'singles' | 'doubles'>('singles');

  // Sync profile selections when players list changes
  useEffect(() => {
    if (!currentUser) return;
    const freshUser = players.find(p => p.id === currentUser.id);
    if (freshUser) {
      setCurrentUser(freshUser);
    }
  }, [players, currentUser?.id]);

  useEffect(() => {
    if (!selectedPlayerForProfile) return;
    const freshProfile = players.find(p => p.id === selectedPlayerForProfile.id);
    if (freshProfile) {
      setSelectedPlayerForProfile(freshProfile);
    }
  }, [players, selectedPlayerForProfile?.id]);

  // ----------------------------------------------------
  // Firebase Auth
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync auth user to player profile (look up or auto-create on first login)
  useEffect(() => {
    if (!authUser) {
      if (currentUser !== null) setCurrentUser(null);
      return;
    }

    const initPlayer = async () => {
      let player = await UserRepository.getById(authUser.uid);
      if (!player) {
        const displayName = authUser.displayName || authUser.email?.split('@')[0] || 'Player';
        const newPlayer: Player = {
          id: authUser.uid,
          name: displayName,
          avatar: pendingAvatar.current,
          rank: 100,
          tier: 'Challenger',
          elo: 1000,
          wins: 0,
          losses: 0,
          streak: 0,
          peakElo: 1000,
          bio: '',
          joinedYear: new Date().getFullYear().toString(),
          trend: 0,
          matchesThisWeek: 0,
          role: 'member',
          status: 'pending',
          awards: { gold: 0, silver: 0, bronze: 0 }
        };
        await UserRepository.create(newPlayer);
        pendingAvatar.current = '';
        player = newPlayer;
      }
      setCurrentUser(player);
      setSelectedPlayerForProfile(player);
    };

    initPlayer();
  }, [authUser]);

  // ----------------------------------------------------
  // Repository Observers (Firestore listeners, only after auth)
  // ----------------------------------------------------
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = UserRepository.subscribeAll((list) => {
      setPlayers(list);
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = MatchRepository.subscribeAll((list) => {
      setMatches(list);
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = ChallengeRepository.subscribeAll((list) => {
      setChallenges(list);
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = VerificationRepository.subscribeAll((list) => {
      setVerifications(list);
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = NotificationRepository.subscribeByUser(currentUser.id, (list) => {
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

  // ----------------------------------------------------
  // Interactive Action Triggers fully backed by Service Layer
  // ----------------------------------------------------

  // Accept a pending incoming challenge
  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await ChallengeService.acceptChallenge(challengeId, currentUser?.id);
      
      const challengeObj = challenges.find(c => c.id === challengeId);
      if (challengeObj) {
        // Feed verification
        const verifId = `v_new_${Date.now()}`;
        await VerificationRepository.create({
          id: verifId,
          title: `Challenge Verified: vs. ${challengeObj.challengerName}`,
          type: 'Awaiting Match Play Result',
          status: 'verified',
          timeAgo: 'Just now'
        });
      }
    } catch (e) {
      console.error('Accept Challenge Failed', e);
    }
  };

  // Decline challenge
  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await ChallengeService.declineChallenge(challengeId);
    } catch (e) {
      console.error('Decline Challenge Failed', e);
    }
  };

  // Cancel outgoing challenge
  const handleCancelChallenge = async (challengeId: string) => {
    try {
      await ChallengeService.cancelChallenge(challengeId);
    } catch (e) {
      console.error('Cancel Challenge Failed', e);
    }
  };

  // Submit/log new challenge
  const handleCreateChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOpponentId) {
      alert("Please choose an opponent competitor to issue challenge!");
      return;
    }

    const opponentPlayer = players.find(p => p.id === modalOpponentId);
    if (!opponentPlayer) return;

    try {
      await ChallengeService.createChallenge({
        challengerId: currentUser!.id,
        challengerName: currentUser!.name,
        challengerAvatar: currentUser!.avatar,
        opponentId: opponentPlayer.id,
        opponentName: opponentPlayer.name,
        timeString: modalTime,
        location: modalLocation,
        matchType: modalMatchType
      });
      setShowChallengeModal(false);
      setActiveScreen('challenges');
    } catch (err) {
      console.error('Create Challenge Failed', err);
    }
  };

  // Profile selection redirect
  const handleSelectOpponentProfileId = (opponentId: string) => {
    const targetPlayer = players.find(p => p.id === opponentId);
    if (targetPlayer) {
      setSelectedPlayerForProfile(targetPlayer);
      setActiveScreen('profile');
    }
  };

  // Submit raw match score
  const handleSubmitScore = async (challengeId: string, score: string, winnerId: string) => {
    try {
      await ChallengeService.submitScore({
        challengeId,
        scores: score,
        winnerId,
        submittedById: currentUser!.id
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Submit score failed.');
    }
  };

  // Verify match score (opponent clicks verify!)
  const handleVerifyScore = async (challengeId: string) => {
    try {
      await ChallengeService.verifyScore(challengeId);
    } catch (e) {
      console.error('Verify score failed', e);
    }
  };

  // Dispute match score (raise dispute)
  const handleDisputeScore = async (challengeId: string) => {
    try {
      await ChallengeService.disputeScore(challengeId, currentUser!.name);
    } catch (e) {
      console.error('Dispute failed', e);
    }
  };

  // Manual ELO adjustments via Quick slider (Officer/Admin only)
  const handleUpdatePlayerElo = async (playerId: string, newElo: number) => {
    try {
      await UserService.adjustEloManually({
        userId: playerId,
        targetElo: newElo,
        officerId: currentUser!.id,
        officerName: currentUser!.name,
        reason: 'Officer manual Elo calibration slider adjustment.'
      });
    } catch (e) {
      console.error('Manual elo adjustment failed', e);
    }
  };

  // Sandbox match report processor (Simulates standard Elo Rating formulas)
  const handleLogMatchPlay = async (matchData: {
    player1Id: string;
    player2Id: string;
    type: string;
    scoreString: string;
    winnerId: string;
    eloTransferred: number;
  }) => {
    try {
      const p1 = players.find(p => p.id === matchData.player1Id);
      const p2 = players.find(p => p.id === matchData.player2Id);
      if (!p1 || !p2) return;

      const isP1Winner = matchData.winnerId === matchData.player1Id;

      // Log match report
      const matchId = `match_auto_${Date.now()}`;
      await MatchRepository.create({
        id: matchId,
        player1Id: p1.id,
        player2Id: p2.id,
        opponentId: p2.id,
        opponentName: p2.name,
        opponentAvatar: p2.avatar,
        type: matchData.type,
        timeString: 'Just now',
        result: isP1Winner ? 'W' : 'L',
        scores: matchData.scoreString,
        eloChange: matchData.eloTransferred,
        timestamp: new Date().toISOString()
      });

      // Update ratings
      const nextElo1 = isP1Winner ? p1.elo + matchData.eloTransferred : Math.max(1000, p1.elo - matchData.eloTransferred);
      const nextElo2 = !isP1Winner ? p2.elo + matchData.eloTransferred : Math.max(1000, p2.elo - matchData.eloTransferred);
      
      await UserRepository.update(p1.id, {
        elo: nextElo1,
        peakElo: Math.max(p1.peakElo, nextElo1),
        wins: isP1Winner ? p1.wins + 1 : p1.wins,
        losses: isP1Winner ? p1.losses : p1.losses + 1,
        streak: isP1Winner ? p1.streak + 1 : 0
      });

      await UserRepository.update(p2.id, {
        elo: nextElo2,
        peakElo: Math.max(p2.peakElo, nextElo2),
        wins: !isP1Winner ? p2.wins + 1 : p2.wins,
        losses: !isP1Winner ? p2.losses : p2.losses + 1,
        streak: !isP1Winner ? p2.streak + 1 : 0
      });

      await UserService.recalculateAllRanks();

      // Notification
      await NotificationService.sendNotification({
        userId: currentUser!.id,
        title: 'Match Results Certified',
        message: `${isP1Winner ? p1.name : p2.name} defeated ${isP1Winner ? p2.name : p1.name} (${matchData.scoreString}). Elo rating shift applied!`,
      });
    } catch (e) {
      console.error('Log match failed', e);
    }
  };

  // Clear all data and sign out
  const handleResetToDefaults = async () => {
    try {
      for (const p of players) {
        await UserRepository.delete(p.id);
      }
      for (const m of matches) {
        await MatchRepository.delete(m.id);
      }
      for (const c of challenges) {
        await ChallengeRepository.delete(c.id);
      }
      for (const v of verifications) {
        await VerificationRepository.delete(v.id);
      }
      await NotificationRepository.clearAll(currentUser?.id || '');
      setActiveScreen('dashboard');
      await signOut(auth);
    } catch (e) {
      console.error('Reset defaults failed', e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleChangeAvatar = async (uri: string) => {
    if (!currentUser) return;
    try {
      await UserRepository.update(currentUser.id, { avatar: uri });
      setShowAvatarPicker(false);
    } catch (e) {
      console.error('Failed to update avatar', e);
    }
  };

  // Notification tools in Firestore
  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationRepository.markAsRead(id);
    } catch (e) {
      console.error('Mark as read failed', e);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await NotificationRepository.clearAll(currentUser!.id);
    } catch (e) {
      console.error('Clear notifications failed', e);
    }
  };

  // Render correct Active screen view
  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <DashboardView
            currentUser={currentUser}
            recentMatches={matches}
            upcomingChallenges={challenges.filter(c => c.statusString === 'pending')}
            verifications={verifications}
            onAcceptChallenge={handleAcceptChallenge}
            onDeclineChallenge={handleDeclineChallenge}
            onViewAllHistory={() => setActiveScreen('leaderboard')}
            onSelectOpponentProfile={handleSelectOpponentProfileId}
          />
        );
      case 'leaderboard':
        return (
          <LeaderboardView
            allPlayers={players}
            searchQuery={searchQuery}
            onSelectPlayer={(player) => {
              setSelectedPlayerForProfile(player);
              setActiveScreen('profile');
            }}
            currentUser={currentUser}
          />
        );
      case 'challenges':
        return (
          <ChallengesView
            challenges={challenges}
            onAcceptChallenge={handleAcceptChallenge}
            onDeclineChallenge={handleDeclineChallenge}
            onCancelChallenge={handleCancelChallenge}
            currentUser={currentUser}
            onSubmitScore={handleSubmitScore}
            onVerifyScore={handleVerifyScore}
            onDisputeScore={handleDisputeScore}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearNotifications}
          />
        );
      case 'profile':
        if (!selectedPlayerForProfile) return null;
        return (
          <ProfileView
            player={selectedPlayerForProfile}
            matchActivities={matches}
            currentUser={currentUser}
            onOpenNewChallengeWithOpponent={(opponent) => {
              setModalOpponentId(opponent.id);
              setShowChallengeModal(true);
            }}
            onChangeAvatar={() => setShowAvatarPicker(true)}
          />
        );
      case 'admin':
        return (
          <AdminView
            players={players}
            setPlayers={setPlayers}
            challenges={challenges}
            setChallenges={setChallenges}
            matches={matches}
            setMatches={setMatches}
            verifications={verifications}
            setVerifications={setVerifications}
            notifications={notifications}
            setNotifications={setNotifications}
            currentUser={currentUser}
            onUpdatePlayerElo={handleUpdatePlayerElo}
            onLogMatchPlay={handleLogMatchPlay}
            onResetToDefaults={handleResetToDefaults}
            setActiveScreen={setActiveScreen}
          />
        );
      case 'tournament-builder':
        return (
          <TournamentBuilderView
            players={players}
            setActiveScreen={setActiveScreen}
          />
        );
      default:
        return <div className="text-center py-12 text-on-surface-variant">Selected division coming soon!</div>;
    }
  };

  // Format screen title for Header display
  const getScreenTitle = () => {
    if (activeScreen === 'dashboard') return 'Dashboard Hub';
    if (activeScreen === 'profile') return `${selectedPlayerForProfile?.name ?? 'Player'} Stats`;
    if (activeScreen === 'tournament-builder') return 'Bracket Builder';
    return activeScreen;
  };

  // Find remaining candidate opponents for modal challenge dropdown (excluding ourselves)
  const challengeCandidates = currentUser ? players.filter(p => p.id !== currentUser.id) : [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090b] flex flex-col items-center justify-center font-sans px-4">
        <div className="w-10 h-10 border-2 border-[#ccff80] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white text-xs uppercase tracking-widest font-mono text-center">
          Establishing SSL Club Database Handshake...
        </p>
      </div>
    );
  }

  if (!authUser) {
    return <SignInView onSelectAvatar={(uri) => { pendingAvatar.current = uri; }} />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#07090b] flex flex-col items-center justify-center font-sans px-4">
        <div className="w-10 h-10 border-2 border-[#ccff80] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white text-xs uppercase tracking-widest font-mono text-center">
          Syncing player profile...
        </p>
      </div>
    );
  }

  if (currentUser.status === 'pending') {
    return <PendingApprovalView />;
  }

  if (currentUser.status === 'suspended') {
    return <SuspendedView />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-on-surface flex">
      
      {/* SideNavBar fixed shell layout matches visual design */}
        <Sidebar
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          currentUser={currentUser}
          onOpenNewChallenge={() => {
          if (challengeCandidates[0]) {
            setModalOpponentId(challengeCandidates[0].id);
          }
          setShowChallengeModal(true);
        }}
        onLogout={handleLogout}
        onChangeAvatar={() => setShowAvatarPicker(true)}
        pendingChallengesCount={challenges.filter(c => c.statusString === 'pending' && c.isIncoming).length}
      />

      {/* Main Content Layout Page */}
      <div className="flex-grow flex flex-col min-h-screen">
        
        {/* TopAppBar header */}
        <Header
          currentView={getScreenTitle()}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewChallenge={() => {
            if (challengeCandidates[0]) {
              setModalOpponentId(challengeCandidates[0].id);
            }
            setShowChallengeModal(true);
          }}
          onOpenSettings={() => setActiveScreen('admin')}
        />

        {/* Content Canvas Frame */}
        <main className="md:ml-64 pt-24 pb-16 px-6 flex-grow">
          {renderScreen()}
        </main>
      </div>

      {/* Bottom responsive tab navigation for mobile layout widths */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-brand-surface border-t border-brand-outline flex justify-around items-center h-14 z-50 shadow-2xl">
        <button 
          onClick={() => setActiveScreen('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-xs bg-transparent border-0 cursor-pointer ${activeScreen === 'dashboard' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          <span className="text-[9px]">Home</span>
        </button>
        <button 
          onClick={() => setActiveScreen('leaderboard')}
          className={`flex flex-col items-center gap-0.5 text-xs bg-transparent border-0 cursor-pointer ${activeScreen === 'leaderboard' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-[9px]">Lists</span>
        </button>
        <button
          onClick={() => {
            if (challengeCandidates[0]) {
              setModalOpponentId(challengeCandidates[0].id);
            }
            setShowChallengeModal(true);
          }}
          className="flex flex-col items-center justify-center -translate-y-2 bg-brand-primary-container text-black w-10 h-10 rounded-full shadow-lg border-2 border-brand-bg shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveScreen('challenges')}
          className={`flex flex-col items-center gap-0.5 text-xs bg-transparent border-0 cursor-pointer ${activeScreen === 'challenges' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-[9px]">Match</span>
        </button>
        <button 
          onClick={() => setActiveScreen('notifications')}
          className={`flex flex-col items-center gap-0.5 text-xs bg-transparent border-0 cursor-pointer relative ${activeScreen === 'notifications' ? 'text-brand-primary font-bold' : 'text-on-surface-variant'}`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span className="text-[9px]">Alerts</span>
          <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
        </button>
      </nav>

      {/* Pristine Animated custom Modal for "New Challenge" matches exact aesthetic guidelines */}
      {showAvatarPicker && (
        <AvatarPicker
          avatars={avatarList}
          currentUri={currentUser?.avatar || ''}
          onSelect={handleChangeAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {showChallengeModal && (
        <div className="fixed inset-0 bg-brand-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-brand-surface border border-brand-outline rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-scaleIn">
            
            {/* Modal Exit Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-outline mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-primary animate-pulse" />
                <h3 className="font-display font-black text-white uppercase tracking-wider text-sm">
                  Pro-Match Challenge
                </h3>
              </div>
              <button
                onClick={() => setShowChallengeModal(false)}
                className="bg-brand-surface-high p-1.5 rounded-full text-on-surface-variant hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChallengeSubmit} className="space-y-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Select Opponent:
                </label>
                <select
                  className="bg-brand-surface-lowest border border-brand-outline rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-primary cursor-pointer w-full"
                  value={modalOpponentId}
                  onChange={(e) => setModalOpponentId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Competitor --</option>
                  {challengeCandidates.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tier} • {p.elo} ELO)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Match Type:
                </label>
                <select
                  className="bg-brand-surface-lowest border border-brand-outline rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-primary cursor-pointer w-full"
                  value={modalMatchType}
                  onChange={(e) => setModalMatchType(e.target.value as 'singles' | 'doubles')}
                  required
                >
                  <option value="singles">Competitive Singles</option>
                  <option value="doubles">Competitive Doubles</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Court Location:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modalLocation}
                    onChange={(e) => setModalLocation(e.target.value)}
                    placeholder="e.g. Central Park Court #4"
                    className="bg-brand-surface-lowest border border-brand-outline rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-brand-primary w-full"
                    required
                  />
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/80 w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Match Schedule:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    placeholder="e.g. Sunday, 4:00 PM"
                    className="bg-brand-surface-lowest border border-brand-outline rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-brand-primary w-full"
                    required
                  />
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/80 w-4 h-4" />
                </div>
              </div>

              <div className="bg-brand-surface-lowest p-3 rounded-xl border border-brand-outline text-[11px] text-on-surface-variant leading-relaxed">
                <p>
                  <strong>Match Penalty Warning:</strong> Issuing this challenge complies with the official 48-hour acceptance rule. Once accepted, matches must be completed within 7 days.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary text-black font-extrabold text-xs py-3 rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-lg cursor-pointer uppercase tracking-wider"
              >
                Inscribe Custom Challenge
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
