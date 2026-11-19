import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  clampString,
  db,
  googleProvider,
  handleFirestoreError,
  isAdminEmail,
  testConnection,
} from '../lib/firebase';
import { SEED_LISTINGS, SEED_REVIEWS } from '../data/seedCatalog';
import { BOUNDS, UserPrivateContact, UserProfile, UserRole } from '../types/hostelease';

export interface SignUpDraft {
  displayName: string;
  role: UserRole;
  university: string;
  courseYear: string;
  phone: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  privateContact: UserPrivateContact | null;
  authReady: boolean;
  isAdmin: boolean;
  needsOnboarding: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  signInWithGoogle: (draft?: SignUpDraft) => Promise<void>;
  completeOnboarding: (draft: SignUpDraft) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateContact, setPrivateContact] = useState<UserPrivateContact | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const isAdmin = isAdminEmail(user?.email, user?.emailVerified);

  const seedInitialCatalogIfAdmin = useCallback(async (firebaseUser: User) => {
    if (!isAdminEmail(firebaseUser.email, firebaseUser.emailVerified)) return;
    try {
      const existingSnap = await getDocs(query(collection(db, 'listings'), limit(1)));
      if (!existingSnap.empty) return;

      const batch = writeBatch(db);
      for (const item of SEED_LISTINGS) {
        const listingRef = doc(db, 'listings', item.id);
        batch.set(listingRef, {
          ownerId: firebaseUser.uid,
          ownerName: item.ownerName,
          name: item.name,
          locality: item.locality,
          nearCampus: item.nearCampus,
          distanceKm: item.distanceKm,
          gender: item.gender,
          roomType: item.roomType,
          monthlyRent: item.monthlyRent,
          securityDeposit: item.securityDeposit,
          availableBeds: item.availableBeds,
          safetyScore: item.safetyScore,
          verificationStatus: item.verificationStatus,
          isFeatured: item.isFeatured,
          imageUrl: item.imageUrl,
          safetyFeatures: item.safetyFeatures,
          facilities: item.facilities,
          houseRules: item.houseRules,
          description: item.description,
          avgRating: 0,
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();

      // Seed initial verified student reviews and update listing ratings atomically
      for (const item of SEED_LISTINGS) {
        const reviews = SEED_REVIEWS[item.id] || [];
        if (reviews.length === 0) continue;
        const reviewBatch = writeBatch(db);
        let sum = 0;
        reviews.forEach((rev, index) => {
          const revRef = doc(db, 'listings', item.id, 'reviews', `seed-rev-${item.id}-${index + 1}`);
          sum += rev.overallRating;
          reviewBatch.set(revRef, {
            ...rev,
            createdAt: serverTimestamp(),
          });
        });
        const avg = Number((sum / reviews.length).toFixed(1));
        reviewBatch.update(doc(db, 'listings', item.id), {
          avgRating: avg,
          reviewCount: reviews.length,
          updatedAt: serverTimestamp(),
        });
        await reviewBatch.commit();
      }
    } catch (error) {
      console.warn('Auto-seed skipped or deferred:', error);
    }
  }, []);

  const loadUserProfile = useCallback(async (firebaseUser: User) => {
    const profilePath = `users/${firebaseUser.uid}`;
    const contactPath = `users/${firebaseUser.uid}/private/contact`;
    try {
      const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (profileSnap.exists()) {
        setProfile(profileSnap.data() as UserProfile);
        setNeedsOnboarding(false);
        const contactSnap = await getDoc(doc(db, 'users', firebaseUser.uid, 'private', 'contact'));
        if (contactSnap.exists()) {
          setPrivateContact(contactSnap.data() as UserPrivateContact);
        } else {
          setPrivateContact(null);
        }
      } else {
        setProfile(null);
        setPrivateContact(null);
        setNeedsOnboarding(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${profilePath} | ${contactPath}`);
    }
  }, []);

  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
        await seedInitialCatalogIfAdmin(firebaseUser);
      } else {
        setProfile(null);
        setPrivateContact(null);
        setNeedsOnboarding(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [loadUserProfile, seedInitialCatalogIfAdmin]);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const persistOnboarding = async (firebaseUser: User, draft: SignUpDraft) => {
    const safeName = clampString(draft.displayName || firebaseUser.displayName || 'Dehradun Student', BOUNDS.DISPLAY_NAME_MAX);
    const safeUni = clampString(draft.university || 'DBS Global University (DGU)', BOUNDS.UNIVERSITY_MAX);
    const safeCourse = clampString(draft.courseYear || '1st Year', BOUNDS.COURSE_YEAR_MAX);
    const safePhone = clampString(draft.phone || '+91 9876543210', BOUNDS.PHONE_MAX);

    const userRef = doc(db, 'users', firebaseUser.uid);
    const contactRef = doc(db, 'users', firebaseUser.uid, 'private', 'contact');

    try {
      const existing = await getDoc(userRef);
      if (!existing.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          displayName: safeName.length >= 2 ? safeName : 'HostelEase Member',
          role: draft.role === 'owner' ? 'owner' : 'student',
          university: safeUni,
          courseYear: safeCourse,
          photoURL: clampString(firebaseUser.photoURL || '', 500),
          emailVerified: Boolean(firebaseUser.emailVerified),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await setDoc(contactRef, {
        email: clampString(firebaseUser.email || '', 120),
        phone: safePhone,
        updatedAt: serverTimestamp(),
      });
      await loadUserProfile(firebaseUser);
      setNeedsOnboarding(false);
      setAuthModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const signInWithGoogle = async (draft?: SignUpDraft) => {
    const credential = await signInWithPopup(auth, googleProvider);
    if (draft) {
      await persistOnboarding(credential.user, draft);
    } else {
      await loadUserProfile(credential.user);
      const snap = await getDoc(doc(db, 'users', credential.user.uid));
      if (snap.exists()) {
        setAuthModalOpen(false);
      } else {
        setAuthModalMode('signup');
        setNeedsOnboarding(true);
      }
    }
  };

  const completeOnboarding = async (draft: SignUpDraft) => {
    if (!auth.currentUser) throw new Error('Please sign in first.');
    await persistOnboarding(auth.currentUser, draft);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setProfile(null);
    setPrivateContact(null);
    setNeedsOnboarding(false);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        privateContact,
        authReady,
        isAdmin,
        needsOnboarding,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        completeOnboarding,
        signOutUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
