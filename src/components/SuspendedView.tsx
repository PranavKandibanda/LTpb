import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function SuspendedView() {
  return (
    <div className="min-h-screen bg-[#07090b] text-on-surface flex flex-col items-center justify-center font-sans px-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
          Account Suspended
        </h1>

        <p className="text-on-surface-variant text-sm leading-relaxed">
          Your account has been suspended. Please contact a club admin for more
          information.
        </p>

        <div className="bg-brand-surface border border-red-500/10 rounded-xl p-4 text-left text-xs text-on-surface-variant space-y-2">
          <p>
            If you believe this was done in error, reach out to the club
            administration to resolve the issue.
          </p>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 bg-transparent border border-red-500/20 px-4 py-2 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
