import { SeasonRepository } from '../repositories/SeasonRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { NotificationService } from './NotificationService';
import { Season, SeasonResult, User, AuditLog } from '../types';

export class SeasonService {
  /**
   * Initializes a brand new competitive season configuration
   */
  static async createSeason(params: {
    name: string;
    startDate: string;
    endDate: string;
    active: boolean;
  }): Promise<void> {
    const id = `season_${Date.now()}`;
    const newSeason: Season = {
      id,
      name: params.name,
      startDate: params.startDate,
      endDate: params.endDate,
      active: params.active
    };
    await SeasonRepository.create(newSeason);
  }

  /**
   * Closes the active season, records standings, grants awards, resets Elo, and updates rankings
   */
  static async endActiveSeason(officerId: string, officerName: string): Promise<void> {
    const activeSeason = await SeasonRepository.getActive();
    if (!activeSeason) {
      throw new Error('No active season currently running.');
    }

    const players = await UserRepository.getAll();
    const sorted = [...players].sort((a, b) => b.elo - a.elo);

    // End active flag
    await SeasonRepository.update(activeSeason.id, { active: false });

    // Process Standings & Awards
    for (let idx = 0; idx < sorted.length; idx++) {
      const player = sorted[idx];
      let award: 'gold' | 'silver' | 'bronze' | null = null;
      if (idx === 0) award = 'gold';
      else if (idx === 1) award = 'silver';
      else if (idx === 2) award = 'bronze';

      // Store historical placement
      const resultId = `result_${activeSeason.id}_${player.id}`;
      const standing: SeasonResult = {
        id: resultId,
        seasonId: activeSeason.id,
        seasonName: activeSeason.name,
        playerId: player.id,
        playerName: player.name,
        elo: player.elo,
        rank: idx + 1,
        wins: player.wins,
        losses: player.losses,
        award
      };
      await SeasonRepository.saveSeasonResult(standing);

      // Increment User Awards and reset stats
      const currentAwards = player.awards || { gold: 0, silver: 0, bronze: 0 };
      if (award === 'gold') currentAwards.gold += 1;
      if (award === 'silver') currentAwards.silver += 1;
      if (award === 'bronze') currentAwards.bronze += 1;

      // Preserve lifetime: sum up current wins/losses optionally
      const nextLifetimeWins = (player.wins || 0);
      const nextLifetimeLosses = (player.losses || 0);

      // Update in database: Reset Seasonal Elo to 1000 and wins/losses to 0, preserve Peak Elo and accumulate awards
      await UserRepository.update(player.id, {
        elo: 1000,
        wins: 0,
        losses: 0,
        streak: 0,
        awards: currentAwards,
        // Using optional variables to preserve overall histories
        trend: 0
      });

      // Dispatch notifications
      await NotificationService.notifyPlacementAward(player.id, activeSeason.name, idx + 1, award);
    }

    // Re-standardize player ranks post elo resets
    await this.refreshStandardRanks();

    // Log the officer operation
    const auditId = `audit_${Date.now()}`;
    const log: AuditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actorId: officerId,
      actorName: officerName,
      action: 'CLOSE_SEASON',
      details: `Season "${activeSeason.name}" ended. Standing outcomes recorded and user seasonal parameters reset to 1000.`
    };
    await AuditLogRepository.create(log);
  }

  /**
   * Internal rank reset helper
   */
  private static async refreshStandardRanks(): Promise<void> {
    const players = await UserRepository.getAll();
    const sorted = [...players].sort((a, b) => b.elo - a.elo);
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
  }
}
export default SeasonService;
