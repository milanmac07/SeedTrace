'use client';

import { useState, useRef, useEffect } from 'react';
import WeatherWidget from "./components/WeatherWidget";
import DecisionSupport from "./components/DecisionSupport";
import LogDataForm from "./components/LogDataForm";
import SeedVarietyManager from "./components/SeedVarietyManager";
import LoginForm, { SeedTraceUser } from "./components/LoginForm";
import AboutUs from "./components/AboutUs";
import UserAuditLogs from "./components/UserAuditLogs";
import AddSeedBatchModal from "./components/AddSeedBatchModal";
import SeedLotManager from "./components/SeedLotManager";

export type UserRole = 'da_head' | 'da_staff' | 'farmer';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('farmer');
  const [activeTab, setActiveTab] = useState('home');
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isServiceActive = ['dashboard', 'varieties', 'decision', 'logging', 'audit'].includes(activeTab);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectService = (tab: string) => {
    setActiveTab(tab);
    setServicesOpen(false);
  };

  const handleLoginSuccess = (user: SeedTraceUser) => {
    setUserRole(user.role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('seedtrace_user');
    setIsAuthenticated(false);
    setUserRole('farmer');
    setActiveTab('home');
  };

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img 
              src="/SeedTrace-Logo.png" 
              alt="SeedTrace Logo" 
              className="w-12 h-12 object-cover rounded-full bg-white p-0.5 border-2 border-emerald-400 shadow-sm"
            />
            <div>
              <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                SEEDTRACE
                <span className="text-[10px] bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                  System
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-light">Agricultural Lineage & Telemetry System</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'home' 
                  ? 'bg-emerald-700 text-white shadow-inner' 
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
              }`}
            >
              Home
            </button>

            <button 
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'about' 
                  ? 'bg-emerald-700 text-white shadow-inner' 
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
              }`}
            >
              About Us
            </button>

            {/* SEED LOTS TAB REPLACING TRACE LINEAGE */}
            <button 
              onClick={() => setActiveTab('lots')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'lots' 
                  ? 'bg-emerald-700 text-white shadow-inner' 
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
              }`}
            >
              Seed Lots
            </button>

            {/* Services Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setServicesOpen(!servicesOpen)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isServiceActive 
                    ? 'bg-emerald-700 text-white shadow-inner' 
                    : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                }`}
              >
                Services
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {servicesOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => handleSelectService('dashboard')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>🌤️</span> Weather Monitoring
                  </button>

                  <button
                    onClick={() => handleSelectService('varieties')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'varieties' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>🌱</span> Seed Varieties
                  </button>

                  {(userRole === 'da_head' || userRole === 'da_staff') && (
                    <button
                      onClick={() => handleSelectService('decision')}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeTab === 'decision' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>📋</span> Decision Engine
                    </button>
                  )}

                  {(userRole === 'da_head' || userRole === 'da_staff') && (
                    <button
                      onClick={() => handleSelectService('logging')}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeTab === 'logging' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>📥</span> Log Data
                    </button>
                  )}

                  {/* DA HEAD ONLY: USER AUDIT LOGS */}
                  {userRole === 'da_head' && (
                    <button
                      onClick={() => handleSelectService('audit')}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeTab === 'audit' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>🛡️</span> User Audit Logs
                    </button>
                  )}
                </div>
              )}
            </div>

            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-1 rounded-md font-mono uppercase">
              {userRole.replace('_', ' ')}
            </span>

            <button 
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-semibold text-rose-200 hover:bg-rose-900 hover:text-white transition-all ml-2"
            >
              Logout
            </button>
          </nav>

        </div>

        {/* Mobile Navigation Dropdown Bar */}
        <div className="md:hidden bg-emerald-950 px-4 py-2 flex justify-between overflow-x-auto text-xs font-medium border-t border-emerald-800">
          <button onClick={() => setActiveTab('home')} className={`px-2 py-1 ${activeTab === 'home' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Home</button>
          <button onClick={() => setActiveTab('about')} className={`px-2 py-1 ${activeTab === 'about' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>About</button>
          <button onClick={() => setActiveTab('lots')} className={`px-2 py-1 ${activeTab === 'lots' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Seed Lots</button>
          <button onClick={() => setActiveTab('dashboard')} className={`px-2 py-1 ${activeTab === 'dashboard' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Weather</button>
          <button onClick={() => setActiveTab('varieties')} className={`px-2 py-1 ${activeTab === 'varieties' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Varieties</button>
          
          {(userRole === 'da_head' || userRole === 'da_staff') && (
            <>
              <button onClick={() => setActiveTab('decision')} className={`px-2 py-1 ${activeTab === 'decision' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Decision</button>
              <button onClick={() => setActiveTab('logging')} className={`px-2 py-1 ${activeTab === 'logging' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Log Data</button>
            </>
          )}

          {userRole === 'da_head' && (
            <button onClick={() => setActiveTab('audit')} className={`px-2 py-1 ${activeTab === 'audit' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>Audit</button>
          )}
          
          <button onClick={handleLogout} className="px-2 py-1 text-rose-300 font-bold">Logout</button>
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HOME VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <section className="relative rounded-2xl bg-cover bg-center bg-[url('/rice-bg.jpeg')] text-white p-8 md:p-12 shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-emerald-950/70 bg-gradient-to-r from-slate-950/85 via-emerald-950/70 to-transparent z-0" />
              <div className="relative z-10 max-w-2xl space-y-4">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                  Project SeedTrace
                </h1>
                <p className="text-emerald-100 text-sm md:text-base leading-relaxed drop-shadow">
                  SeedTrace integrates field data with environmental monitoring to streamline crop traceability, soil analytics, and operational decision-making.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-lg text-sm transition-all shadow-md"
                  >
                    About Us
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-800">Core Services & Tools</h2>
                <span className="text-xs text-slate-500">Select a module to open</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div onClick={() => setActiveTab('dashboard')} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">🌤️</div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700">Weather Analytics</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Monitor real-time telemetry, historical rainfall patterns, and weather forecasts for Tigaon.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">Open Weather Matrix →</div>
                </div>

                <div onClick={() => setActiveTab('varieties')} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">🌱</div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700">Seed Varieties</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Register, save, and search registered rice seed varieties stored in the master database.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">Manage Seed Masterlist →</div>
                </div>

                <div onClick={() => setActiveTab('lots')} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">📦</div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700">Seed Lots & Traceability</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">View, filter, and track all registered active seed lot batches and lineage details across farms.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">Manage Seed Lots →</div>
                </div>

                {(userRole === 'da_head' || userRole === 'da_staff') && (
                  <div onClick={() => setActiveTab('decision')} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">📋</div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700">Decision Engine</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Evaluate soil pH and environmental conditions to select optimal crop varieties.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">Run Recommendations →</div>
                  </div>
                )}

                {(userRole === 'da_head' || userRole === 'da_staff') && (
                  <div onClick={() => setActiveTab('logging')} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">📥</div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700">Field Logging</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Record harvest yields, soil inputs, and field observations directly to storage.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">Submit Field Entry →</div>
                  </div>
                )}

                {/* AUDIT LOGS CARD (DA HEAD ONLY) */}
                {userRole === 'da_head' && (
                  <div onClick={() => setActiveTab('audit')} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">🛡️</div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700">User Audit Logs</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Track user session logins, authorization events, and operational histories.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">View Activity Logs →</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ABOUT US VIEW */}
        {activeTab === 'about' && <AboutUs />}

        {/* WEATHER MONITORING VIEW */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <WeatherWidget region="Tigaon" />
          </div>
        )}

        {/* SEED VARIETIES VIEW */}
        {activeTab === 'varieties' && (
          <div className="max-w-6xl mx-auto">
            <SeedVarietyManager userRole={userRole} />
          </div>
        )}

        {/* SEED LOTS VIEW (REPLACES TRACEABILITY VIEW) */}
        {activeTab === 'lots' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {(userRole === 'da_head' || userRole === 'da_staff') && (
              <div className="flex justify-end">
                <AddSeedBatchModal />
              </div>
            )}
            <SeedLotManager />
          </div>
        )}

        {/* DECISION SUPPORT VIEW */}
        {activeTab === 'decision' && (userRole === 'da_head' || userRole === 'da_staff') && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <DecisionSupport />
          </div>
        )}

        {/* LOG DATA VIEW */}
        {activeTab === 'logging' && (userRole === 'da_head' || userRole === 'da_staff') && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <LogDataForm />
          </div>
        )}

        {/* AUDIT LOGS VIEW (DA HEAD ONLY) */}
        {activeTab === 'audit' && userRole === 'da_head' && (
          <div className="max-w-6xl mx-auto">
            <UserAuditLogs />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/SeedTrace-Logo.png" 
              alt="SeedTrace Logo" 
              className="w-8 h-8 rounded-full object-cover bg-white p-0.5"
            />
            <div>
              <p className="font-bold text-slate-200">SeedTrace Management System</p>
              <p className="text-[11px] text-slate-500">Seed Lineage, Analytics & Decision Management Platform</p>
            </div>
          </div>
          
          <div className="text-center md:text-right text-slate-500">
            <p>© {new Date().getFullYear()} SeedTrace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}