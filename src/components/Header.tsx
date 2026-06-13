import React from 'react';
import { Search, Settings, Swords, Bell } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNewChallenge?: () => void;
  onOpenSettings?: () => void;
}

export default function Header({
  currentView,
  searchQuery,
  setSearchQuery,
  onOpenNewChallenge,
  onOpenSettings
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center w-full px-6 h-16 md:ml-64 md:max-w-[calc(100%-16rem)] fixed top-0 bg-brand-bg/85 backdrop-blur-md z-40 border-b border-brand-outline">
      {/* Route Info */}
      <div className="flex items-center gap-2">
        <span className="text-on-surface-variant font-medium text-xs tracking-wider uppercase">Navigation /</span>
        <span className="text-brand-primary font-bold text-xs tracking-widest uppercase">{currentView}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Expanded Search Bar */}
        <div className="relative hidden lg:block">
          <input
            className="bg-brand-surface-lowest border border-brand-outline rounded-full py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all w-64"
            placeholder="Search players by name..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-3.5 h-3.5" />
        </div>

        {/* Dynamic CTAs */}
        {onOpenNewChallenge && (
          <button
            onClick={onOpenNewChallenge}
            className="bg-brand-primary text-black font-semibold text-xs px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer uppercase tracking-wider"
          >
            New Challenge
          </button>
        )}

        {/* Simple Settings Action */}
        <button 
          onClick={onOpenSettings}
          className="bg-brand-surface-high p-2 rounded-full border border-brand-outline hover:bg-brand-surface-variant transition-colors cursor-pointer text-on-surface hover:text-brand-primary"
          title="Club Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
