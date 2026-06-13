import { ChallengeRepository } from '../repositories/ChallengeRepository';
import { UserRepository } from '../repositories/UserRepository';
import { MatchRepository } from '../repositories/MatchRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { EloService } from './EloService';
import { MatchValidationService } from './MatchValidationService';
import { NotificationService } from './NotificationService';
import { Challenge, Match, User, AuditLog } from '../types';

export class ChallengeService {
  /**
   * Registers a brand new match challenge
   */
  static async createChallenge(params: {
    challengerId: string;
    challengerName: string;
    challengerAvatar: string;
    opponentId: string;
    opponentName: string;
    timeString: string;
    location: string;
    matchType: 'singles' | 'doubles';
    challengerPartnerId?: string;
    opponentPartnerId?: string;
  }): Promise<void> {
    const challenger = await UserRepository.getById(params.challengerId);
    const opponent = await UserRepository.getById(params.opponentId);
    
    // Safety check
    if (!challenger) throw new Error('Challenger profile not found.');
    if (!opponent) throw new Error('Opponent profile not found.');

    if (challenger.status !== 'active') throw new Error('Your account is not active. Please wait for admin approval.');
    if (opponent.status !== 'active') throw new Error('Opponent account is not active.');

    const challengeId = `chall_${Date.now()}`;
    const newChallenge: Challenge = {
      id: challengeId,
      challengerId: params.challengerId,
      challengerName: params.challengerName,
      challengerAvatar: params.challengerAvatar,
      challengerRank: challenger.rank ? `Rank #${challenger.rank}` : undefined,
      challengerTier: challenger.tier,
      opponentId: params.opponentId,
      opponentName: params.opponentName,
      timeString: params.timeString,
      location: params.location,
      statusString: 'pending',
      timestamp: new Date().toISOString(),
      matchType: params.matchType,
      challengerPartnerId: params.challengerPartnerId || undefined,
      opponentPartnerId: params.opponentPartnerId || undefined
    };

    await ChallengeRepository.create(newChallenge);

    // Notify opponent
    await NotificationService.notifyChallengeReceived(params.opponentId, params.challengerName, params.timeString);
    if (params.opponentPartnerId) {
      await NotificationService.notifyChallengeReceived(params.opponentPartnerId, params.challengerName, params.timeString);
    }
  }

  static async acceptChallenge(challengeId: string, acceptingUserId?: string): Promise<void> {
    const challenge = await ChallengeRepository.getById(challengeId);
    if (!challenge) throw new Error('Challenge not found.');

    if (acceptingUserId) {
      const accepter = await UserRepository.getById(acceptingUserId);
      if (accepter && accepter.status !== 'active') throw new Error('Your account is not active.');
    }

    await ChallengeRepository.update(challengeId, { statusString: 'accepted' });

    await NotificationService.notifyChallengeAccepted(challenge.challengerId, challenge.opponentName, challenge.timeString);
  }

  static async declineChallenge(challengeId: string): Promise<void> {
    const challenge = await ChallengeRepository.getById(challengeId);
    if (!challenge) throw new Error('Challenge not found.');

    await ChallengeRepository.update(challengeId, { statusString: 'declined' });

    await NotificationService.notifyChallengeRejected(challenge.challengerId, challenge.opponentName);
  }

  static async cancelChallenge(challengeId: string): Promise<void> {
    await ChallengeRepository.delete(challengeId);
  }

  /**
   * Opponent or challenger reports raw score format (best-of-3)
   */
  static async submitScore(params: {
    challengeId: string;
    scores: string;
    winnerId: string;
    submittedById: string;
  }): Promise<void> {
    const challenge = await ChallengeRepository.getById(params.challengeId);
    if (!challenge) throw new Error('Challenge not found.');

    const submitter = await UserRepository.getById(params.submittedById);
    if (submitter && submitter.status !== 'active') throw new Error('Your account is not active.');

    // Validate scores formatting
    const validation = MatchValidationService.validateScoreFormat(params.scores);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid scores format.');
    }

    await ChallengeRepository.update(params.challengeId, {
      statusString: 'submitted',
      submittedScore: params.scores,
      submittedById: params.submittedById,
      winnerId: params.winnerId
    });

    // Notify other participant they need to verify
    const isReporterChallenger = params.submittedById === challenge.challengerId;
    const recipientId = isReporterChallenger ? challenge.opponentId : challenge.challengerId;
    const reporter = await UserRepository.getById(params.submittedById);
    const reporterName = reporter ? reporter.name : 'Teammate';

    await NotificationService.notifyVerificationRequired(recipientId, reporterName, params.scores);
  }

  static async disputeScore(challengeId: string, disputerName: string): Promise<void> {
    const challenge = await ChallengeRepository.getById(challengeId);
    if (!challenge) throw new Error('Challenge not found.');

    await ChallengeRepository.update(challengeId, { statusString: 'disputed' });

    // Notify other player
    const opponentId = challenge.submittedById === challenge.challengerId ? challenge.challengerId : challenge.opponentId;
    await NotificationService.notifyMatchDisputed(opponentId, disputerName);
  }

  /**
   * Approves scored match: Commits rating shift and records match activities
   */
  static async verifyScore(challengeId: string): Promise<void> {
    const challenge = await ChallengeRepository.getById(challengeId);
    if (!challenge) throw new Error('Challenge not found.');
    if (challenge.statusString !== 'submitted') {
      throw new Error('Can only verify submitted scores.');
    }

    const scores = challenge.submittedScore!;
    const winnerId = challenge.winnerId!;

    // Perform actual calculation Pipeline
    await this.processMatchResults({
      challenge,
      scores,
      winnerId
    });

    // Mark completed
    await ChallengeRepository.update(challengeId, { statusString: 'completed' });
  }

  /**
   * Officer arbitration resolver for disputed match results
   */
  static async resolveDisputedMatch(params: {
    challengeId: string;
    overrideWinnerId: string;
    overrideScores: string;
    officerId: string;
    officerName: string;
  }): Promise<void> {
    const challenge = await ChallengeRepository.getById(params.challengeId);
    if (!challenge) throw new Error('Challenge not found.');

    // Validate scores or override scores
    const officer = await UserRepository.getById(params.officerId);
    if (officer && officer.status !== 'active') throw new Error('Officer account is not active.');

    const validation = MatchValidationService.validateScoreFormat(params.overrideScores);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid scores format.');
    }

    // Process Ratings transfers
    await this.processMatchResults({
      challenge,
      scores: params.overrideScores,
      winnerId: params.overrideWinnerId
    });

    // Complete challenge status
    await ChallengeRepository.update(params.challengeId, {
      statusString: 'completed',
      submittedScore: params.overrideScores,
      winnerId: params.overrideWinnerId
    });

    // Write audit activity logs
    const auditId = `audit_${Date.now()}`;
    const log: AuditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actorId: params.officerId,
      actorName: params.officerName,
      action: 'RESOLVE_DISPUTE',
      details: `Dispute resolved for match ID ${params.challengeId}. Winner awarded: ${params.overrideWinnerId}, scores: ${params.overrideScores}`
    };
    await AuditLogRepository.create(log);
  }

  /**
   * Inner helper to isolate rating computation, anti-farming safety check, and database updates
   */
  private static async processMatchResults(params: {
    challenge: Challenge;
    scores: string;
    winnerId: string;
  }): Promise<void> {
    const { challenge, scores, winnerId } = params;

    const isDoubles = challenge.matchType === 'doubles';

    // Fetch competitors
    const p1 = await UserRepository.getById(challenge.challengerId);
    const p2 = await UserRepository.getById(challenge.opponentId);
    
    if (!p1 || !p2) throw new Error('Primary match players not found.');

    const p1Partner = challenge.challengerPartnerId ? await UserRepository.getById(challenge.challengerPartnerId) : null;
    const p2Partner = challenge.opponentPartnerId ? await UserRepository.getById(challenge.opponentPartnerId) : null;

    // Fetch historical matches to check anti-farming limits
    const historicalMatches = await MatchRepository.getAll();

    // Check limit
    const antiFarmResult = MatchValidationService.checkAntiFarming({
      p1Id: p1.id,
      p2Id: p2.id,
      p1PartnerId: p1Partner?.id,
      p2PartnerId: p2Partner?.id,
      historicalMatches
    });

    const isRanked = !antiFarmResult.isFarmed;

    let p1Shift = 0;
    let p2Shift = 0;
    
    if (isRanked) {
      if (isDoubles && p1Partner && p2Partner) {
        // Doubles math: team ratings average
        const combExchange = EloService.calculateDoublesExchange({
          team1LeaderElo: p1.elo,
          team1PartnerElo: p1Partner.elo,
          team2LeaderElo: p2.elo,
          team2PartnerElo: p2Partner.elo,
          team1MatchesCount: Math.max(p1.wins + p1.losses, p1Partner.wins + p1Partner.losses),
          team2MatchesCount: Math.max(p2.wins + p2.losses, p2Partner.wins + p2Partner.losses),
          isTeam1Winner: winnerId === p1.id || winnerId === p1Partner.id,
          scoreString: scores
        });

        p1Shift = combExchange.team1EloChange;
        p2Shift = combExchange.team2EloChange;
      } else {
        // Singles Standard exchange
        const exchange = EloService.calculateEloExchange({
          p1Elo: p1.elo,
          p2Elo: p2.elo,
          p1MatchesCount: p1.wins + p1.losses,
          p2MatchesCount: p2.wins + p2.losses,
          isP1Winner: winnerId === p1.id,
          scoreString: scores
        });

        p1Shift = exchange.p1Change;
        p2Shift = exchange.p2Change;
      }
    }

    // Update Player Stats in database
    const updateStats = async (player: User, didWin: boolean, eloDiff: number) => {
      const nextElo = isRanked ? Math.max(100, player.elo + eloDiff) : player.elo;
      const nextStreak = didWin ? player.streak + 1 : 0;
      await UserRepository.update(player.id, {
        elo: nextElo,
        peakElo: Math.max(player.peakElo, nextElo),
        wins: didWin ? player.wins + 1 : player.wins,
        losses: didWin ? player.losses : player.losses + 1,
        streak: nextStreak,
        trend: eloDiff
      });
    };

    const isChallengerTeamWinner = winnerId === p1.id || (isDoubles && p1Partner && winnerId === p1Partner.id);

    // Write Updates
    await updateStats(p1, isChallengerTeamWinner, p1Shift);
    await updateStats(p2, !isChallengerTeamWinner, p2Shift);

    if (isDoubles && p1Partner && p2Partner) {
      await updateStats(p1Partner, isChallengerTeamWinner, p1Shift);
      await updateStats(p2Partner, !isChallengerTeamWinner, p2Shift);
    }

    // Standardize Rankings across club
    const users = await UserRepository.getAll();
    const sorted = [...users].sort((a, b) => b.elo - a.elo);
    for (let idx = 0; idx < sorted.length; idx++) {
      const p = sorted[idx];
      let tier: User['tier'] = 'Expert';
      if (idx === 0) tier = 'Grandmaster';
      else if (idx <= 2) tier = 'Elite';
      else if (idx <= 5) tier = 'Expert';
      else if (idx <= 9) tier = 'Pro';
      else tier = 'Challenger';

      await UserRepository.update(p.id, { rank: idx + 1, tier });
    }

    // Save final match plays
    const p1MatchId = `match_${p1.id}_${Date.now()}`;
    const matchForP1: Match = {
      id: p1MatchId,
      player1Id: p1.id,
      player2Id: p2.id,
      player1PartnerId: p1Partner?.id,
      player2PartnerId: p2Partner?.id,
      opponentId: p2.id,
      opponentName: isDoubles && p2Partner ? `${p2.name} / ${p2Partner.name}` : p2.name,
      opponentAvatar: p2.avatar,
      type: isDoubles ? 'Competitive Doubles' : 'Competitive Singles',
      timeString: 'Just now',
      result: isChallengerTeamWinner ? 'W' : 'L',
      scores: scores,
      eloChange: p1Shift,
      timestamp: new Date().toISOString(),
      isRanked
    };
    await MatchRepository.create(matchForP1);

    const p2MatchId = `match_${p2.id}_${Date.now()}`;
    const matchForP2: Match = {
      id: p2MatchId,
      player1Id: p2.id,
      player2Id: p1.id,
      player1PartnerId: p2Partner?.id,
      player2PartnerId: p1Partner?.id,
      opponentId: p1.id,
      opponentName: isDoubles && p1Partner ? `${p1.name} / ${p1Partner.name}` : p1.name,
      opponentAvatar: p1.avatar,
      type: isDoubles ? 'Competitive Doubles' : 'Competitive Singles',
      timeString: 'Just now',
      result: !isChallengerTeamWinner ? 'W' : 'L',
      scores: scores,
      eloChange: p2Shift,
      timestamp: new Date().toISOString(),
      isRanked
    };
    await MatchRepository.create(matchForP2);

    // Notify players about ELO shifts!
    await NotificationService.notifyMatchApproved(p1.id, p2.name, scores, p1Shift);
    await NotificationService.notifyMatchApproved(p2.id, p1.name, scores, p2Shift);
    
    if (isDoubles && p1Partner && p2Partner) {
      await NotificationService.notifyMatchApproved(p1Partner.id, p2.name, scores, p1Shift);
      await NotificationService.notifyMatchApproved(p2Partner.id, p1.name, scores, p2Shift);
    }
  }
}
export default ChallengeService;
