import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BOUNDS, DEHRADUN_UNIVERSITIES, UserRole } from '../types/hostelease';

export function AuthModal() {
  const {
    user,
    needsOnboarding,
    authModalOpen,
    authModalMode,
    closeAuthModal,
    signInWithGoogle,
    completeOnboarding,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [role, setRole] = useState<UserRole>('student');
  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState<string>(DEHRADUN_UNIVERSITIES[0]);
  const [courseYear, setCourseYear] = useState('1st Year');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(authModalMode);
    setErrorMsg(null);
  }, [authModalMode, authModalOpen]);

  useEffect(() => {
    if (user && needsOnboarding) {
      setDisplayName(user.displayName || '');
      setMode('signup');
    }
  }, [user, needsOnboarding]);

  const isVisible = authModalOpen || (Boolean(user) && needsOnboarding);
  if (!isVisible) return null;

  const isCompletingSignedInProfile = Boolean(user && needsOnboarding);

  const handleLoginSubmit = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in with Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = displayName.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < BOUNDS.DISPLAY_NAME_MIN) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    if (trimmedPhone.length < BOUNDS.PHONE_MIN) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp or contact number.');
      return;
    }

    setSubmitting(true);
    try {
      const draft = {
        displayName: trimmedName,
        role,
        university: role === 'owner' ? 'Dehradun Property Partner' : university,
        courseYear: role === 'owner' ? 'Hostel / PG Owner' : courseYear,
        phone: trimmedPhone,
      };
      if (isCompletingSignedInProfile) {
        await completeOnboarding(draft);
      } else {
        await signInWithGoogle(draft);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 id="auth-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {isCompletingSignedInProfile
                ? 'Complete Your HostelEase Profile'
                : mode === 'login'
                  ? 'Log In to HostelEase'
                  : 'Create Verified Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified accounts unlock bookings, owner listings, and student reviews.
            </p>
          </div>
          {!isCompletingSignedInProfile && (
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close authentication modal"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        {!isCompletingSignedInProfile && (
          <div className="px-6 pt-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {mode === 'login' && !isCompletingSignedInProfile ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Verified Google & University Sign-In</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Use your Google or college email (e.g. <span className="font-mono">@dgu.ac.in</span>) to securely access saved bookings, daily services, and verified property reviews.
                </p>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleLoginSubmit}
                className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? 'Connecting...' : 'Continue with Google'}
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                New to HostelEase?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-teal-700 dark:text-teal-400 font-semibold hover:underline"
                >
                  Create a student or PG owner account
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  I am joining HostelEase as a
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      role === 'student'
                        ? 'border-teal-700 dark:border-teal-400 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      role === 'owner'
                        ? 'border-teal-700 dark:border-teal-400 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>PG / Hostel Owner</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  maxLength={BOUNDS.DISPLAY_NAME_MAX}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ananya Rawat"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {role === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-uni" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Dehradun University
                    </label>
                    <select
                      id="signup-uni"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {DEHRADUN_UNIVERSITIES.map((uni) => (
                        <option key={uni} value={uni}>
                          {uni}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="signup-year" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course / Year
                    </label>
                    <input
                      id="signup-year"
                      type="text"
                      maxLength={BOUNDS.COURSE_YEAR_MAX}
                      value={courseYear}
                      onChange={(e) => setCourseYear(e.target.value)}
                      placeholder="e.g. MBA 1st Year"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="signup-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp / Phone Number (Private)
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  required
                  maxLength={BOUNDS.PHONE_MAX}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Stored securely in your private account profile; only shared when you request a PG visit.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {submitting
                  ? 'Saving Verified Profile...'
                  : isCompletingSignedInProfile
                    ? 'Complete Sign Up'
                    : 'Verify & Sign Up with Google'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
