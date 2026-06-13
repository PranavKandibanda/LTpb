import React from 'react';
import { ShieldCheck, Clock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function PendingApprovalView() {
  return (
    <div className="min-h-screen bg-[#07090b] text-on-surface flex flex-col items-center justify-center font-sans px-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-surface-high border border-brand-outline flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-brand-primary" />
        </div>

        <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
          Membership Pending Review
        </h1>

        <p className="text-on-surface-variant text-sm leading-relaxed">
          Your account is awaiting approval from a club admin. You'll receive a
          notification once your membership is activated.
        </p>

        <div className="bg-brand-surface border border-brand-outline rounded-xl p-4 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>New accounts are reviewed to maintain club integrity</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>Approval typically takes less than 24 hours</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>You'll be notified in-app once approved</span>
          </div>
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
