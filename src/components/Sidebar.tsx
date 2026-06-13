import React from 'react';
import { 
  Trophy, 
  LayoutDashboard, 
  Gauge, 
  Swords, 
  Bell, 
  User, 
  ShieldAlert, 
  Plus, 
  LogOut,
  Edit3
} from 'lucide-react';
import { ActiveScreen, Player } from '../types';

interface SidebarProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  currentUser: Player;
  onOpenNewChallenge: () => void;
  pendingChallengesCount: number;
  onChangeAvatar?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({
  activeScreen,
  setActiveScreen,
  currentUser,
  onOpenNewChallenge,
  pendingChallengesCount,
  onChangeAvatar,
  onLogout
}: SidebarProps) {

  return (
    <aside id="sidebar" className="h-full w-64 fixed left-0 top-0 border-r border-brand-outline bg-brand-surface flex flex-col py-6 px-4 z-50">
      {/* Brand logo & platform headers */}
      <div className="mb-10 px-2">
        <h1 className="font-display text-lg font-extrabold text-brand-primary uppercase tracking-tighter flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-primary" />
          <span>Pickleball Club</span>
        </h1>
        <p className="text-on-surface-variant font-sans uppercase tracking-widest text-[10px] font-semibold mt-1">
          Pro-Tracker Platform
        </p>
      </div>

      {/* Navigation items */}
      <nav className="flex-grow space-y-1">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className={`w-full flex items-center justify-between py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'dashboard' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm font-semibold">Dashboard</span>
          </div>
        </button>

        <button
          onClick={() => setActiveScreen('leaderboard')}
          className={`w-full flex items-center py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'leaderboard' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Gauge className="w-4 h-4" />
            <span className="text-sm font-semibold">Leaderboard</span>
          </div>
        </button>

        <button
          onClick={() => setActiveScreen('challenges')}
          className={`w-full flex items-center justify-between py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'challenges' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Swords className="w-4 h-4" />
            <span className="text-sm font-semibold">Challenges</span>
          </div>
          {pendingChallengesCount > 0 && (
            <span className="bg-brand-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingChallengesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveScreen('notifications')}
          className={`w-full flex items-center justify-between py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'notifications' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4" />
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <span className="w-2 h-2 bg-brand-primary-container rounded-full animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveScreen('profile')}
          className={`w-full flex items-center py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'profile' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4" />
            <span className="text-sm font-semibold">Profile</span>
          </div>
        </button>

        <button
          onClick={() => setActiveScreen('tournament-builder')}
          className={`w-full flex items-center py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'tournament-builder' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-semibold">Bracket Builder</span>
          </div>
        </button>

        <button
          onClick={() => setActiveScreen('admin')}
          className={`w-full flex items-center py-3 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer ${
            activeScreen === 'admin' 
              ? 'text-brand-primary bg-brand-surface-high font-bold border-r-2 border-brand-primary' 
              : 'text-on-surface-variant hover:bg-brand-surface-high hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-semibold">Admin Panel</span>
          </div>
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center py-3 px-4 rounded-lg font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold">Secure Logout</span>
            </div>
          </button>
        )}
      </nav>

      {/* Button and User Switcher at Bottom */}
      <div className="mt-auto space-y-4">
        <button
          type="button"
          onClick={onOpenNewChallenge}
          className="w-full bg-brand-primary-container text-black py-3 px-4 font-bold font-display text-xs uppercase tracking-wider rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Challenge</span>
        </button>

        {/* Current User Display */}
        <div className="pt-4 border-t border-brand-outline">
          <div className="flex items-center gap-3 p-2">
            <div className="relative shrink-0 group">
              {currentUser.avatar ? (
                <img
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border border-brand-primary object-cover"
                  src={currentUser.avatar}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-surface-high border border-brand-primary flex items-center justify-center font-bold text-brand-primary">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {onChangeAvatar && (
                <button
                  onClick={onChangeAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-brand-primary text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                  title="Change avatar"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-white leading-tight">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-bold text-brand-primary tracking-wider">
                  {currentUser.tier}
                </span>
                <span className="text-[9px] text-on-surface-variant font-mono">
                  ({currentUser.elo} ELO)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
