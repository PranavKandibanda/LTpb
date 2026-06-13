import { UserRepository } from '../repositories/UserRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { NotificationService } from './NotificationService';
import { User, AuditLog } from '../types';

export class UserService {
  /**
   * Registers a new competitor with initial parameters in pending status
   */
  static async registerUser(params: {
    id: string;
    name: string;
    nickname?: string;
    bio?: string;
    avatar?: string;
  }): Promise<void> {
    const freshUser: User = {
      id: params.id,
      name: params.name,
      nickname: params.nickname || '',
      avatar: params.avatar || '',
      rank: 100, // placeholder until first rank evaluation
      tier: 'Challenger',
      elo: 1000,
      wins: 0,
      losses: 0,
      streak: 0,
      peakElo: 1000,
      bio: params.bio || '',
      joinedYear: new Date().getFullYear().toString(),
      trend: 0,
      matchesThisWeek: 0,
      role: 'member',
      status: 'pending',
      awards: { gold: 0, silver: 0, bronze: 0 }
    };
    await UserRepository.create(freshUser);
  }

  /**
   * Changes status and logs audit record
   */
  static async updateUserStatus(params: {
    userId: string;
    newStatus: 'active' | 'suspended';
    officerId: string;
    officerName: string;
  }): Promise<void> {
    const user = await UserRepository.getById(params.userId);
    if (!user) throw new Error('User not found.');

    await UserRepository.update(params.userId, { status: params.newStatus });

    // Write audit log
    const auditId = `audit_${Date.now()}`;
    const log: AuditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actorId: params.officerId,
      actorName: params.officerName,
      action: params.newStatus === 'active' ? 'APPROVE_USER' : 'SUSPEND_USER',
      details: `${params.newStatus === 'active' ? 'Approved' : 'Suspended'} user ${user.name} (${user.id}).`
    };
    await AuditLogRepository.create(log);

    // Notify user
    if (params.newStatus === 'active') {
      await NotificationService.notifyMembershipApproved(params.userId);
    } else {
      await NotificationService.sendNotification({
        userId: params.userId,
        title: 'Account Suspended',
        message: 'Your account has been suspended by building administration. Contact officers for review.',
      });
    }
  }

  /**
   * Adjusts rating manually (for administrative corrections) and logs an audit record
   */
  static async adjustEloManually(params: {
    userId: string;
    targetElo: number;
    officerId: string;
    officerName: string;
    reason: string;
  }): Promise<void> {
    const user = await UserRepository.getById(params.userId);
    if (!user) throw new Error('User not found.');

    const previousElo = user.elo;
    await UserRepository.update(params.userId, { 
      elo: params.targetElo,
      peakElo: Math.max(user.peakElo, params.targetElo)
    });

    // Write audit log
    const auditId = `audit_${Date.now()}`;
    const log: AuditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actorId: params.officerId,
      actorName: params.officerName,
      action: 'MANUAL_ELO_ADJUST',
      details: `Adjusted Elo of ${user.name} from ${previousElo} to ${params.targetElo}. Reason: ${params.reason}`
    };
    await AuditLogRepository.create(log);

    // Dynamic rank recalculator across players
    await this.recalculateAllRanks();

    // Alert user
    await NotificationService.sendNotification({
      userId: params.userId,
      title: 'Elo Rating Recalibrated',
      message: `An officer adjusted your rating manually to ${params.targetElo} Elo. (Reason: ${params.reason})`,
    });
  }

  /**
   * Promotes or demotes user roles
   */
  static async changeUserRole(params: {
    userId: string;
    newRole: 'member' | 'officer' | 'superadmin';
    actorId: string;
    actorName: string;
  }): Promise<void> {
    const user = await UserRepository.getById(params.userId);
    if (!user) throw new Error('User not found.');

    await UserRepository.update(params.userId, { role: params.newRole });

    // Write audit log
    const auditId = `audit_${Date.now()}`;
    const log: AuditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      actorId: params.actorId,
      actorName: params.actorName,
      action: 'CHANGE_ROLE',
      details: `Changed role of user ${user.name} to ${params.newRole}.`
    };
    await AuditLogRepository.create(log);
  }

  /**
   * Standardizes ranks and tiers based on Elo ratings descending
   */
  static async recalculateAllRanks(): Promise<void> {
    const users = await UserRepository.getAll();
    // Sorted descending by Elo is guaranteed by repo but reinforce
    const sorted = [...users].sort((a, b) => b.elo - a.elo);

    for (let idx = 0; idx < sorted.length; idx++) {
      const player = sorted[idx];
      let tier: User['tier'] = 'Expert';
      if (idx === 0) tier = 'Grandmaster';
      else if (idx <= 2) tier = 'Elite';
      else if (idx <= 5) tier = 'Expert';
      else if (idx <= 9) tier = 'Pro';
      else tier = 'Challenger';

      const rank = idx + 1;
      if (player.rank !== rank || player.tier !== tier) {
        await UserRepository.update(player.id, { rank, tier });
      }
    }
  }
}
