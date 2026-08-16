export interface User {
  id: string;
  name: string;
  nickname?: string;
  avatar: string;
  rank: number;
  tier: 'Grandmaster' | 'Elite' | 'Pro' | 'Expert' | 'Challenger';
  elo: number;
  wins: number;
  losses: number;
  streak: number;
  peakElo: number;
  bio?: string;
  joinedYear?: string;
  trend: number; // positive = elo growth, negative = loss
  matchesThisWeek?: number;
  role: 'member' | 'officer' | 'superadmin';
  status: 'pending' | 'active' | 'suspended';
  awards?: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

export type Player = User; // For compatibility with the existing UI components and app views

export interface Match {
  id: string;
  player1Id?: string; // challenger / reporter
  player2Id?: string; // opponent
  player1PartnerId?: string; // friendly doubles teammate
  player2PartnerId?: string; // hostile opponent doubles teammate
  opponentId: string; // main opponent ID for listings
  opponentName: string;
  opponentAvatar?: string;
  type: string; // "Competitive Singles" | "Competitive Doubles"
  timeString: string;
  result: 'W' | 'L'; // perspective of logged in client
  scores: string; // e.g. "11-8, 11-5"
  eloChange: number;
  partnerEloChange?: number;
  opponentEloChange?: number;
  timestamp: string | Date; // Date or ISO string for versatility
  isRanked?: boolean;
}

export type MatchActivity = Match; // Compat alias

export interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerAvatar: string;
  challengerRank?: string;
  challengerTier?: string;
  opponentId: string;
  opponentName: string;
  timeString: string;
  location: string;
  statusString: 'pending' | 'accepted' | 'declined' | 'submitted' | 'disputed' | 'completed';
  isIncoming?: boolean; // Client perspective helper for UI alerts
  timestamp: string | Date; // ISO UTC format or Date object
  matchType?: 'singles' | 'doubles';
  challengerPartnerId?: string;
  opponentPartnerId?: string;
  submittedScore?: string;
  submittedById?: string;
  winnerId?: string;
  acceptedBy?: string[];
}

export interface Season {
  id: string;
  name: string;
  startDate: string; // ISO 8601 string
  endDate: string; // ISO 8601 string
  active: boolean;
}

export interface Notification {
  id: string;
  userId: string; // owner uid
  title: string;
  message: string;
  time: string; // e.g. "Just now", "2h ago"
  createdAt: string; // ISO timestamp
  unread: boolean;
}

export interface SeasonResult {
  id: string;
  seasonId: string;
  seasonName: string;
  playerId: string;
  playerName: string;
  elo: number;
  rank: number;
  wins: number;
  losses: number;
  award?: 'gold' | 'silver' | 'bronze' | null;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO date
  actorId: string;
  actorName: string;
  action: string; // e.g. "APPROVE_USER", "SUSPEND_USER", "MANUAL_ELO_ADJUST", "MANAGE_SEASONS"
  details: string;
}

export interface Verification {
  id: string;
  title: string;
  type: string; // e.g. "Verified by Admin", "Verified by Opponent"
  status: 'verified' | 'pending';
  timeAgo: string;
}

export type ActiveScreen = 'dashboard' | 'leaderboard' | 'challenges' | 'notifications' | 'profile' | 'admin' | 'tournament-builder';
