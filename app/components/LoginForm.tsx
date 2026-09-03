'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export type UserRole = 'da_head' | 'da_staff' | 'farmer';

export interface SeedTraceUser {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
}

interface LoginFormProps {
  onLoginSuccess?: (user: SeedTraceUser) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<UserRole>('da_staff');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suppress SSR/Hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // ----------------- SIGN IN LOGIC -----------------
    const { data, error: fetchError } = await supabase
      .from('seedtrace_users')
      .select('id, full_name, role, email, password')
      .eq('email', cleanEmail)
      .eq('password', password)
      .maybeSingle();

    if (fetchError || !data) {
      setErrorMsg('Invalid email or password.');
      setLoading(false);
      return;
    }

    const userData = data as unknown as SeedTraceUser;

    if (userData.role !== role) {
      setErrorMsg(
        `Unauthorized: Account is registered as "${userData.role.replace('_', ' ').toUpperCase()}", not "${role.replace('_', ' ').toUpperCase()}".`
      );
      setLoading(false);
      return;
    }

    // ----------------- SAFELY RECORD AUDIT LOG -----------------
    const { error: auditError } = await supabase
      .from('user_audit_logs')
      .insert({
        user_email: userData.email,
        role: userData.role,
        action: 'USER_LOGIN',
        details: `Logged in as ${userData.role.toUpperCase().replace('_', ' ')}`,
      });

    if (auditError) {
      console.error('Supabase Audit Log Error:', auditError.message, auditError.details);
    }

    // Save session locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('seedtrace_user', JSON.stringify(userData));
    }

    if (onLoginSuccess) {
      onLoginSuccess(userData);
    } else {
      if (role === 'da_head') window.location.href = '/admin/dashboard';
      else if (role === 'da_staff') window.location.href = '/staff/dashboard';
      else window.location.href = '/farmer/portal';
    }

    setLoading(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-emerald-950">
        <div className="bg-emerald-950/90 rounded-2xl p-8 max-w-md w-full border border-emerald-800/80 animate-pulse h-[520px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-[url('/rice-bg.jpeg')]">
      
      {/* Background Dark Green Overlay */}
      <div className="absolute inset-0 bg-emerald-950/80 bg-gradient-to-t from-emerald-950 via-slate-950/70 to-emerald-900/60 z-0" />

      {/* Main Card Container */}
      <div className="relative z-10 bg-emerald-950/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-emerald-800/80 max-w-md w-full space-y-6 text-white">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-block p-1.5 bg-white/10 backdrop-blur-md rounded-full shadow-lg border border-emerald-600/50">
            <img 
              src="/SeedTrace-Logo.png" 
              alt="SeedTrace Logo" 
              className="w-28 h-28 object-cover rounded-full mx-auto shadow-inner"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              SeedTrace Portal
            </h1>
            <p className="text-xs text-emerald-200 font-medium mt-1">
              Select authorization level to sign in
            </p>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-emerald-900/70 p-1.5 rounded-xl border border-emerald-800">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setRole('da_head')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
              role === 'da_head' ? 'bg-emerald-700 text-white shadow-md border border-emerald-600' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            🏛️ DA Head
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setRole('da_staff')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
              role === 'da_staff' ? 'bg-emerald-700 text-white shadow-md border border-emerald-600' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            📋 DA Staff
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setRole('farmer')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
              role === 'farmer' ? 'bg-emerald-700 text-white shadow-md border border-emerald-600' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            🌾 Farmer
          </button>
        </div>

        {/* System Error Message */}
        {errorMsg && (
          <div className="bg-rose-950/80 text-rose-200 border border-rose-800 p-3 rounded-xl text-xs font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleAuth} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">Email Address</label>
            <input
              type="email"
              required
              suppressHydrationWarning
              placeholder="input your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-emerald-900/40 border border-emerald-700 text-white placeholder-emerald-400/60 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                suppressHydrationWarning
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-emerald-900/40 border border-emerald-700 text-white placeholder-emerald-400/60 rounded-xl pl-3.5 pr-12 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all"
              />
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-300 hover:text-white select-none"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-emerald-950/50 disabled:opacity-50 mt-2 border border-emerald-500"
          >
            {loading
              ? 'Processing...'
              : `Sign in as ${role === 'da_head' ? 'DA Head' : role === 'da_staff' ? 'DA Staff' : 'Farmer'}`}
          </button>
        </form>

      </div>
    </div>
  );
}