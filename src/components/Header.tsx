import { Moon, Sun, LogOut, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type AppSection = 'discover' | 'compare' | 'services' | 'bookings' | 'owner';

interface HeaderProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  compareCount: number;
}

export function Header({ activeSection, onSelectSection, compareCount }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isAdmin, openAuthModal, signOutUser } = useAuth();

  const navItems: { id: AppSection; label: string }[] = [
    { id: 'discover', label: 'Discover PGs' },
    { id: 'compare', label: compareCount > 0 ? `Compare (${compareCount})` : 'Compare' },
    { id: 'services', label: 'Campus Services' },
    { id: 'bookings', label: 'My Bookings' },
    { id: 'owner', label: 'Owner Portal' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('discover')}
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 rounded"
        >
          HostelEase
        </button>

        {/* Zone 2: Clean Single-Line Text Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 ${
                  isActive
                    ? 'border-teal-700 dark:border-teal-400 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Accessible Dark Mode Toggle & Single Primary Account Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (profile ? onSelectSection(profile.role === 'owner' ? 'owner' : 'bookings') : openAuthModal('signup'))}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 max-w-[170px]"
              >
                {user.emailVerified && <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                <span className="truncate">
                  {profile?.displayName || user.displayName || 'Account'}
                  {isAdmin ? ' (Admin)' : ''}
                </span>
              </button>
              <button
                type="button"
                onClick={signOutUser}
                aria-label="Log out"
                title="Log out"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="h-10 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              Log In / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Compact Mobile Navigation Row */}
      <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center gap-4 overflow-x-auto text-xs font-medium">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 px-1 border-b-2 transition-colors ${
                isActive
                  ? 'border-teal-700 dark:border-teal-400 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
