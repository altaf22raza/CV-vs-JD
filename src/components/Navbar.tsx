import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  PlusCircle,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Briefcase,
  ClipboardList,
  Globe,
  Menu,
  X,
  Home,
  Shield,
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import { ResumeVersion, SupportedLanguage } from '../types/resume';
import { Logo } from './Logo';

export type AppView =
  | 'home'
  | 'my-cvs'
  | 'create-cv'
  | 'optimize-cv'
  | 'career-tools'
  | 'applications'
  | 'studio';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeVersion: ResumeVersion | null;
  versions: ResumeVersion[];
  onSelectVersion: (version: ResumeVersion) => void;
  onOpenAuthModal: () => void;
  onOpenPrivacyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  activeVersion,
  versions,
  onSelectVersion,
  onOpenAuthModal,
  onOpenPrivacyModal,
}) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const versionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (versionMenuRef.current && !versionMenuRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setDropdownOpen(false);
  };

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'my-cvs', label: t.navMyCvs, icon: Layers },
    { id: 'career-tools', label: t.navCareerPrep, icon: Briefcase },
    { id: 'applications', label: t.navApplications, icon: ClipboardList },
    { id: 'optimize-cv', label: t.navOptimizeCv, icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5EAF0]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Logo & Brand Name */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] overflow-hidden bg-[#F7F9FC] border border-[#E5EAF0] flex items-center justify-center p-1 group-hover:border-[#3978B8] transition-colors">
              <Logo className="w-full h-full" />
            </div>
            <div className="leading-tight flex items-center gap-1">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#173B65]">
                CV
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3978B8] px-1.5 py-0.5 rounded-[6px] bg-[#F7F9FC] border border-[#E5EAF0] font-mono">
                vs
              </span>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#3978B8]">
                JD
              </span>
            </div>
          </button>

          {/* Active CV Quick Switcher (when in studio on desktop) */}
          {currentView === 'studio' && activeVersion && (
            <div className="relative hidden lg:block" ref={versionMenuRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn-interactive flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#182230] bg-[#F7F9FC] hover:bg-slate-100 rounded-[10px] border border-[#E5EAF0] cursor-pointer"
              >
                <span className="font-semibold text-[#173B65]">Active:</span>
                <span className="max-w-[130px] truncate">{activeVersion.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-[#E5EAF0] rounded-[12px] shadow-lg py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    My Saved CVs
                  </div>
                  {versions.map((ver) => (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => {
                        onSelectVersion(ver);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#F7F9FC] transition-colors cursor-pointer ${
                        ver.id === activeVersion.id
                          ? 'bg-[#F7F9FC] text-[#173B65] font-bold'
                          : 'text-[#182230]'
                      }`}
                    >
                      <span className="truncate">{ver.title}</span>
                      {ver.atsReport && (
                        <span className="text-[11px] font-mono tabular-nums text-[#3978B8] ml-2 font-semibold shrink-0">
                          Est. {ver.atsReport.overallScore}%
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-[#E5EAF0] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => navigateTo('my-cvs')}
                      className="w-full px-3 py-1.5 text-left text-xs text-[#173B65] hover:bg-[#F7F9FC] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#3978B8]" />
                      <span>View All in My CVs</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 2: Desktop Navigation Links (lg+ to avoid tablet crowding) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  isActive
                    ? 'text-[#173B65] font-semibold border-b-2 border-[#3978B8]'
                    : 'text-slate-600 hover:text-[#173B65]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: CTA, User Profile & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('optimize-cv')}
            className="btn-interactive hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9EC1E6]" />
            <span>{t.ctaOptimize}</span>
          </button>

          {/* User Account / Auth */}
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="btn-interactive flex items-center gap-2 py-1 pl-1 pr-2 sm:pr-2.5 rounded-[10px] hover:bg-[#F7F9FC] border border-[#E5EAF0] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3978B8]/30"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-[8px] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-[8px] bg-[#173B65] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-semibold text-[#182230] max-w-[110px] truncate">
                  {user.displayName || user.email?.split('@')[0] || 'My Account'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="btn-interactive flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#173B65] hover:bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#3978B8]" />
                <span>{t.signIn}</span>
              </button>
            )}

            {user && userMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] bg-white border border-[#E5EAF0] rounded-[12px] shadow-xl py-1.5 z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => navigateTo('my-cvs')}
                  className="w-full text-left px-3.5 py-2.5 border-b border-[#E5EAF0] hover:bg-[#F7F9FC] transition-colors group cursor-pointer block"
                  title="Open My CVs Library"
                >
                  <div className="text-xs font-bold text-[#182230] group-hover:text-[#173B65] flex items-center justify-between gap-2">
                    <span className="truncate">
                      {user.displayName || user.email?.split('@')[0] || 'Candidate'}
                    </span>
                    <span className="text-[10px] font-semibold text-[#3978B8] bg-[#F7F9FC] border border-[#E5EAF0] px-1.5 py-0.5 rounded-[6px] shrink-0">
                      Library →
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</div>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('my-cvs')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#182230] hover:bg-[#F7F9FC] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#3978B8]" />
                  <span>My CVs Library</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('create-cv')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#182230] hover:bg-[#F7F9FC] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#3978B8]" />
                  <span>{t.navCreateCv}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('career-tools')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#182230] hover:bg-[#F7F9FC] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-[#3978B8]" />
                  <span>{t.navCareerPrep}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('applications')}
                  className="w-full px-3.5 py-2 text-left text-xs text-[#182230] hover:bg-[#F7F9FC] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4 text-[#3978B8]" />
                  <span>{t.navApplications}</span>
                </button>

                <div className="border-t border-[#E5EAF0] mt-1 pt-2 px-3.5 pb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#3978B8]" />
                    <span>{t.languageLabel}</span>
                  </span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="text-[11px] font-semibold text-[#182230] bg-[#F7F9FC] border border-[#E5EAF0] rounded-[8px] px-1.5 py-1 focus:outline-none focus:border-[#3978B8]"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-[#E5EAF0] mt-1 pt-1">
                  {onOpenPrivacyModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenPrivacyModal();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#182230] hover:bg-[#F7F9FC] flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-[#3978B8]" />
                      <span>Privacy &amp; Data Controls</span>
                    </button>
                  )}
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
            )}
          </div>

          {/* Mobile & Tablet Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden min-h-[40px] min-w-[40px] p-2 rounded-[10px] border border-[#E5EAF0] bg-white text-[#173B65] hover:bg-[#F7F9FC] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5EAF0] bg-white px-4 py-3 space-y-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pb-safe">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full min-h-[44px] px-3 py-2.5 rounded-[10px] text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#173B65] text-white'
                      : 'text-[#182230] hover:bg-[#F7F9FC]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#3978B8]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => navigateTo('create-cv')}
              className={`w-full min-h-[44px] px-3 py-2.5 rounded-[10px] text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                currentView === 'create-cv'
                  ? 'bg-[#173B65] text-white'
                  : 'text-[#182230] hover:bg-[#F7F9FC]'
              }`}
            >
              <PlusCircle
                className={`w-4 h-4 shrink-0 ${currentView === 'create-cv' ? 'text-white' : 'text-[#3978B8]'}`}
              />
              <span>{t.navCreateCv}</span>
            </button>
          </div>

          <div className="pt-2.5 border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigateTo('optimize-cv')}
              className="flex-1 min-h-[44px] py-2.5 px-3 text-xs font-semibold text-white bg-[#173B65] hover:bg-[#122F52] rounded-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9EC1E6]" />
              <span>{t.ctaOptimize}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#3978B8]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                aria-label={t.languageLabel}
                className="min-h-[40px] text-xs font-semibold text-[#182230] bg-[#F7F9FC] border border-[#E5EAF0] rounded-[10px] px-2 py-2 focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
