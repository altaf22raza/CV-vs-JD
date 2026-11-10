import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  FileText, 
  PlusCircle, 
  Upload, 
  User as UserIcon,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { ResumeVersion } from '../types/resume';
import { Logo } from './Logo';

export type AppView = 'home' | 'my-cvs' | 'create-cv' | 'optimize-cv' | 'studio';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeVersion: ResumeVersion | null;
  versions: ResumeVersion[];
  onSelectVersion: (version: ResumeVersion) => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  activeVersion,
  versions,
  onSelectVersion,
  onOpenAuthModal,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Logo & Brand Name */}
        <div className="flex items-center gap-6 shrink-0">
          <button 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white border border-amber-200/80 shadow-2xs flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-[#C8973E] transition-all">
              <Logo className="w-full h-full" />
            </div>
            <div className="leading-tight flex items-center gap-1">
              <span className="text-xl font-extrabold tracking-tight text-[#1E2B3E]">
                CV
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#C8973E] px-1.5 py-0.5 rounded bg-amber-50 border border-[#C8973E]/40 font-mono">
                vs
              </span>
              <span className="text-xl font-extrabold tracking-tight text-[#1D5A3A]">
                JD
              </span>
            </div>
          </button>

          {/* Active CV Quick Switcher (when in studio) */}
          {currentView === 'studio' && activeVersion && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
              >
                <span className="font-semibold text-[#1E2B3E]">Active:</span>
                <span className="max-w-[130px] truncate">{activeVersion.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      My Saved CVs
                    </div>
                    {versions.map((ver) => (
                      <button
                        key={ver.id}
                        onClick={() => {
                          onSelectVersion(ver);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          ver.id === activeVersion.id ? 'bg-amber-50/70 text-[#1E2B3E] font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{ver.title}</span>
                        {ver.atsReport && (
                          <span className="text-[11px] font-mono tabular-nums text-emerald-600 ml-2 font-bold">
                            {ver.atsReport.overallScore}%
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setCurrentView('my-cvs');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-[#1E2B3E] hover:bg-slate-50 font-semibold flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#C8973E]" />
                        View All in My CVs
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links (Single Line) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentView('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#1E2B3E] ${
              currentView === 'home' ? 'text-[#1E2B3E] font-bold underline underline-offset-8 decoration-2 decoration-[#C8973E]' : ''
            }`}
          >
            Home
          </button>

          <button
            onClick={() => setCurrentView('my-cvs')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#1E2B3E] ${
              currentView === 'my-cvs' ? 'text-[#1E2B3E] font-bold underline underline-offset-8 decoration-2 decoration-[#C8973E]' : ''
            }`}
          >
            My CVs
          </button>

          <button
            onClick={() => setCurrentView('create-cv')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#1E2B3E] ${
              currentView === 'create-cv' ? 'text-[#1E2B3E] font-bold underline underline-offset-8 decoration-2 decoration-[#C8973E]' : ''
            }`}
          >
            Create CV
          </button>

          <button
            onClick={() => setCurrentView('optimize-cv')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#1E2B3E] ${
              currentView === 'optimize-cv' ? 'text-[#1E2B3E] font-bold underline underline-offset-8 decoration-2 decoration-[#C8973E]' : ''
            }`}
          >
            Optimize CV
          </button>
        </nav>

        {/* Zone 3: CTA & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentView('optimize-cv')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1D5A3A] hover:bg-[#164E32] rounded-lg transition-all shadow-xs hover:shadow-sm ring-1 ring-[#1D5A3A]/40 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C8973E]" />
            <span>Optimize for JD</span>
          </button>

          {/* User Account / Auth */}
          <div className="relative">
            {user ? (
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full hover:bg-slate-100 transition-all border border-slate-200 bg-white shadow-2xs hover:border-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C8973E]/40"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1E2B3E] text-white flex items-center justify-center text-xs font-bold shrink-0 border border-[#C8973E]/30">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-[#1E2B3E] max-w-[110px] truncate">
                  {user.displayName || user.email?.split('@')[0] || 'My Account'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {user && userMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/10" 
                  onClick={() => setUserMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {/* Clickable User Account Header - opens My CVs Library when clicked anywhere on it */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCurrentView('my-cvs');
                    }}
                    className="w-full text-left px-3.5 py-2.5 border-b border-slate-100 hover:bg-amber-50/50 transition-colors group cursor-pointer block"
                    title="Click to open My CVs Library"
                  >
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#1E2B3E] flex items-center justify-between">
                      <span className="truncate">{user.displayName || user.email?.split('@')[0] || 'Candidate'}</span>
                      <span className="text-[10px] font-semibold text-[#C8973E] bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded shrink-0">
                        Open Library →
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.email}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCurrentView('my-cvs');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>My CVs Library</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCurrentView('create-cv');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-400" />
                    <span>Create New CV</span>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
