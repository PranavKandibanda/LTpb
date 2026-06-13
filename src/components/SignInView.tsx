import React, { useState, useMemo } from 'react';
import {
  User,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Lock,
  Terminal,
  LockKeyhole,
  Mail,
  Check
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { generateAvatars } from '../avatarGenerator';

interface SignInViewProps {
  onSelectAvatar?: (uri: string) => void;
}

export default function SignInView({ onSelectAvatar }: SignInViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [rememberNode, setRememberNode] = useState(true);
  const [statusMessage, setStatusMessage] = useState('SECURE CONNECTION ESTABLISHED - TERMINAL V1.0.2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const avatarList = useMemo(() => generateAvatars(), []);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setError(null);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setStatusMessage('RESET EMAIL SENT - CHECK INBOX');
    } catch (err: any) {
      const msg = err.code
        ? err.code.replace('auth/', '').replace(/-/g, ' ')
        : err.message || 'Failed to send reset email';
      setStatusMessage(`RESET FAILED - ${msg.toUpperCase()}`);
      setError(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        setStatusMessage('VALIDATING CREDENTIALS...');
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        setStatusMessage('CREATING PLAYER ACCOUNT...');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      }
    } catch (err: any) {
      const msg = err.code
        ? err.code.replace('auth/', '').replace(/-/g, ' ')
        : err.message || 'Authentication failed';
      setStatusMessage(`ACCESS DENIED - ${msg.toUpperCase()}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signin-container" className="min-h-screen bg-[#07090b] text-on-surface flex flex-col font-sans relative overflow-x-hidden">

      {/* Header Bar */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-brand-outline bg-[#07090b] z-40 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-sm md:text-base font-black text-brand-primary uppercase italic tracking-wider">
            PICKLEBALL CLUB ELO
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-brand-primary cursor-pointer">
            {mode === 'signin' ? 'Login' : 'Register'}
          </span>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant flex items-center gap-1 transition-colors cursor-pointer opacity-40">
            <Lock className="w-2.5 h-2.5" /> Rankings
          </span>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant flex items-center gap-1 transition-colors cursor-pointer opacity-40">
            <Lock className="w-2.5 h-2.5" /> Bracket Builder
          </span>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-on-surface-variant flex items-center gap-1 transition-colors cursor-pointer opacity-40">
            <Lock className="w-2.5 h-2.5" /> Clubs
          </span>
        </nav>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-brand-primary/20 flex items-center justify-center text-brand-primary bg-brand-primary/5">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Body Layout */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 relative z-10 w-full">

        {/* Left Panel */}
        <section className="lg:col-span-6 relative border-r border-brand-outline overflow-hidden flex flex-col justify-end p-8 sm:p-12 md:p-16 min-h-[350px] lg:min-h-0 bg-[#07090b]">
          <div className="absolute inset-0 z-0">
            <img
              alt="Professional stadium evening court lighting"
              className="w-full h-full object-cover grayscale brightness-[0.25] contrast-[1.3] mix-blend-luminosity select-none"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAIldkWlwSj7PTEXSz0JM9bhdKcsqqNdrrJx-H4gjzogNT-F_eV1izDz8KAyM8-ao3fZzXALR8EQVMt98PAhSySJfUn_hS5XajO49VSUIJx8MezmR-1KNaYX2NP70PIsx3dU9nD73JcGoGg3W8lDc1tk8WTlXreoW-_rTG99q-swP4b2Kh21UOxDziNClAD25bSwqsxsAPrHL9EEKjqFTcxCgmFn8yUKyfELtaZn7XIbhmYgywmKQYPAHDmR0wf9unPeocM3IJi9Bh"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-[#07090b]/60 to-transparent"></div>
          </div>
          <div className="relative z-10 space-y-4 max-w-lg mb-4">
            <div className="flex items-center gap-2 select-none">
              <span className="w-8 h-[2px] bg-brand-primary"></span>
              <p className="text-[10px] tracking-widest uppercase font-black text-brand-primary font-mono leading-none">
                Live Data Sync Active
              </p>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.95] mt-2">
              PRO-TRACKER<br />PLATFORM
            </h2>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant/80 max-w-sm leading-relaxed pt-1">
              The elite standard for pickleball performance analytics and global club elo rankings.
            </p>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className="lg:col-span-6 flex flex-col justify-center p-6 sm:p-12 md:p-16 lg:p-20 relative bg-[#07090b]">
          <div className="max-w-md w-full mx-auto space-y-6">

            <div className="w-full h-[3.5px] bg-[#ccff80]"></div>

            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">
                LAKE TRAVIS PICKLEBALL
              </h2>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-sans mt-3 opacity-90 select-none">
                <span className="w-4 h-[1px] bg-brand-primary"></span>
                <span>{mode === 'signin' ? 'Sign in to access the global rankings' : 'Create an account to join the club'}</span>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex border border-brand-outline text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-3 cursor-pointer transition-colors ${
                  mode === 'signin' ? 'bg-brand-primary text-black' : 'bg-transparent text-on-surface-variant hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-3 cursor-pointer transition-colors ${
                  mode === 'signup' ? 'bg-brand-primary text-black' : 'bg-transparent text-on-surface-variant hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-2">

              {/* Name field (sign-up only) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center select-none text-[10px] font-bold uppercase tracking-wider">
                    <label className="text-white font-sans">Full Name</label>
                  </div>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-brand-primary transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-[#0a0c0f] border border-brand-outline rounded-none py-3.5 pl-11 pr-4 text-xs font-mono tracking-wider text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-brand-primary transition-all duration-300"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center select-none text-[10px] font-bold uppercase tracking-wider">
                  <label className="text-white font-sans">Email Address</label>
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#0a0c0f] border border-brand-outline rounded-none py-3.5 pl-11 pr-4 text-xs font-mono tracking-wider text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-brand-primary transition-all duration-300"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center select-none text-[10px] font-bold uppercase tracking-wider">
                  <label className="text-white font-sans">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-brand-primary hover:underline bg-transparent border-0 cursor-pointer font-bold"
                      disabled={loading}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••••••"
                    className="w-full bg-[#0a0c0f] border border-brand-outline rounded-none py-3.5 pl-11 pr-4 text-xs font-mono text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-brand-primary transition-all duration-300"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Avatar picker (sign-up only) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center select-none text-[10px] font-bold uppercase tracking-wider">
                    <label className="text-white font-sans">Choose Avatar</label>
                    {selectedAvatar && (
                      <span className="text-brand-primary text-[9px]">Selected</span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto p-2 bg-[#0a0c0f] border border-brand-outline">
                    {avatarList.map(av => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(av.dataUri);
                          onSelectAvatar?.(av.dataUri);
                        }}
                        className={`w-full aspect-square rounded-lg border-2 cursor-pointer transition-all p-0.5 bg-[#0a0c0f] ${
                          selectedAvatar === av.dataUri
                            ? 'border-brand-primary scale-105'
                            : 'border-transparent hover:border-brand-outline'
                        }`}
                      >
                        <img
                          src={av.dataUri}
                          alt={av.name}
                          className="w-full h-full object-contain rounded-md"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Remember + options row */}
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider font-sans select-none pb-2 pt-1 uppercase">
                <label className="flex items-center gap-2.5 text-on-surface-variant hover:text-white cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberNode}
                    onChange={() => setRememberNode(!rememberNode)}
                    className="w-4 h-4 rounded-none bg-black border border-brand-outline text-brand-primary accent-brand-primary cursor-pointer shrink-0"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-none text-[11px] leading-snug">
                  {error}
                </div>
              )}

              {/* Password reset sent confirmation */}
              {resetSent && (
                <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-none text-[11px] leading-snug">
                  Password reset email sent. Check your inbox (and spam folder).
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ccff80] text-black font-extrabold text-xs sm:text-xs py-4 rounded-none flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all select-none cursor-pointer uppercase tracking-widest relative overflow-hidden"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Authenticate & Enter' : 'Create Account & Enter'}</span>
                    <span className="text-xs">⚡</span>
                  </>
                )}
              </button>

              {/* Status ticker */}
              <div className="flex items-center justify-center gap-2 pt-2 text-[9px] text-on-surface-variant/70 font-mono select-none tracking-widest uppercase">
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-[#ccff80] shadow-[0_0_8px_#ccff80]'}`}></span>
                <span>{statusMessage}</span>
              </div>
            </form>

            <div className="border-t border-brand-outline/40 my-6"></div>

            {/* Mode switch footer */}
            <div className="text-center text-xs text-on-surface-variant font-sans select-none">
              {mode === 'signin' ? (
                <p>
                  New to the competitive circuit?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="text-brand-primary hover:underline bg-transparent border-0 cursor-pointer font-bold"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className="text-brand-primary hover:underline bg-transparent border-0 cursor-pointer font-bold"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="h-14 border-t border-brand-outline px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-on-surface-variant/60 bg-[#07090b] sm:gap-4 py-4 sm:py-0 shrink-0 select-none tracking-wider">
        <div>
          © 2026 PICKLEBALL CLUB ELO. ALL RIGHTS RESERVED. SECURE TERMINAL V1.0.2
        </div>
        <div className="flex items-center gap-4 sm:gap-6 mt-1 sm:mt-0 uppercase tracking-widest">
          <span className="hover:text-white transition-colors cursor-pointer">System Status</span>
          <span className="hover:text-white transition-colors cursor-pointer">Membership Policy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
        </div>
      </footer>

    </div>
  );
}
