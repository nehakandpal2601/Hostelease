import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  OperationType,
  clampNumber,
  clampString,
  db,
  handleFirestoreError,
} from '../lib/firebase';
import {
  BOUNDS,
  BookingEnquiry,
  BookingStatus,
  DEHRADUN_UNIVERSITIES,
  GenderPolicy,
  HostelListing,
  LOCALITIES,
  Locality,
  RoomType,
} from '../types/hostelease';

interface OwnerPortalViewProps {
  listings: HostelListing[];
}

const PRESET_IMAGES = [
  { label: 'Twin Sharing Room', url: '/src/assets/images/pg_clement_town_1795099249927.jpg' },
  { label: 'Single Studio Room', url: '/src/assets/images/pg_rajpur_road_1795099250106.jpg' },
  { label: 'Gated Hostel Exterior', url: '/src/assets/images/pg_bidholi_campus_1795099250170.jpg' },
  { label: 'Common Study Lounge', url: '/src/assets/images/hero_dehradun_hostel_1795099249908.jpg' },
];

const SAFETY_OPTIONS = [
  '24/7 CCTV',
  'Biometric Entry',
  'Full-Time Warden',
  'Female Warden',
  'Fire Extinguishers',
  'Gated Security Booth',
];

const FACILITY_OPTIONS = [
  '100 Mbps Wi-Fi',
  '3 Meals Included',
  'Laundry Service',
  'Power Backup',
  'RO Water',
  'Study Desk',
  'Attached Washroom',
  '2-Wheeler Parking',
];

export function OwnerPortalView({ listings }: OwnerPortalViewProps) {
  const { user, profile, isAdmin, openAuthModal } = useAuth();
  const [ownerBookings, setOwnerBookings] = useState<BookingEnquiry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Listing Form
  const [name, setName] = useState('');
  const [locality, setLocality] = useState<Locality>('Clement Town');
  const [nearCampus, setNearCampus] = useState<string>(DEHRADUN_UNIVERSITIES[0]);
  const [distanceKm, setDistanceKm] = useState(0.8);
  const [gender, setGender] = useState<GenderPolicy>('Boys');
  const [roomType, setRoomType] = useState<RoomType>('Twin Sharing');
  const [monthlyRent, setMonthlyRent] = useState(8500);
  const [securityDeposit, setSecurityDeposit] = useState(8500);
  const [availableBeds, setAvailableBeds] = useState(6);
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [safetyFeatures, setSafetyFeatures] = useState<string[]>(['24/7 CCTV', 'Full-Time Warden']);
  const [facilities, setFacilities] = useState<string[]>(['100 Mbps Wi-Fi', 'RO Water', 'Power Backup']);
  const [houseRules, setHouseRules] = useState(
    'Gate entry by 10:30 PM. Quiet study hours after 11:00 PM. Prior ID check for day visitors.',
  );
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOwnerBookings([]);
      return;
    }

    const q = isAdmin
      ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'bookings'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc'),
        );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOwnerBookings(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BookingEnquiry, 'id'>),
          })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      },
    );
    return () => unsub();
  }, [user, isAdmin]);

  const myListings = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return listings;
    return listings.filter((l) => l.ownerId === user.uid);
  }, [listings, user, isAdmin]);

  const economics = useMemo(() => {
    const confirmed = ownerBookings.filter(
      (b) => b.status === 'Confirmed' || b.status === 'Completed',
    );
    const grossCommission = confirmed.reduce((acc, b) => acc + (b.commissionInr || 1000), 0);
    const variableCost = confirmed.reduce((acc, b) => acc + (b.variableCostInr || 250), 0);
    const netContribution = grossCommission - variableCost;
    const baseMonthlyTarget = 60;
    const fixedMonthlyCost = 20000;
    return {
      totalLeads: ownerBookings.length,
      confirmedCount: confirmed.length,
      grossCommission,
      variableCost,
      netContribution,
      baseMonthlyTarget,
      fixedMonthlyCost,
    };
  }, [ownerBookings]);

  const toggleItem = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      openAuthModal('signup');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const computedSafetyScore = clampNumber(
      Number((7 + safetyFeatures.length * 0.5).toFixed(1)),
      1,
      10,
    );

    try {
      await addDoc(collection(db, 'listings'), {
        ownerId: user.uid,
        ownerName: clampString(profile.displayName, BOUNDS.DISPLAY_NAME_MAX),
        name: clampString(name, BOUNDS.LISTING_NAME_MAX),
        locality,
        nearCampus: clampString(nearCampus, BOUNDS.NEAR_CAMPUS_MAX),
        distanceKm: clampNumber(distanceKm, 0.1, 25),
        gender,
        roomType,
        monthlyRent: clampNumber(monthlyRent, 2500, 45000),
        securityDeposit: clampNumber(securityDeposit, 0, 80000),
        availableBeds: clampNumber(availableBeds, 1, 200),
        safetyScore: computedSafetyScore,
        verificationStatus: isAdmin ? 'Verified' : 'Pending Verification',
        isFeatured: false,
        imageUrl,
        safetyFeatures: safetyFeatures.slice(0, BOUNDS.MAX_SAFETY_FEATURES),
        facilities: facilities.slice(0, BOUNDS.MAX_FACILITIES),
        houseRules: clampString(houseRules, BOUNDS.HOUSE_RULES_MAX),
        description: clampString(
          description || `${name} offers verified student accommodation near ${nearCampus}.`,
          BOUNDS.DESCRIPTION_MAX,
        ),
        avgRating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setFeedback(
        isAdmin
          ? 'Property published and automatically verified on HostelEase.'
          : 'Property submitted for HostelEase verification audit. Students can already preview your standardized specs.',
      );
      setName('');
      setDescription('');
      setShowAddForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'listings');
    } finally {
      setSubmitting(false);
    }
  };

  const updateBookingStatus = async (booking: BookingEnquiry, nextStatus: BookingStatus) => {
    const isConfirmedOrDone = nextStatus === 'Confirmed' || nextStatus === 'Completed';
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: nextStatus,
        commissionInr: isConfirmedOrDone ? 1000 : 0,
        netContributionInr: isConfirmedOrDone ? 750 : 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
    }
  };

  const approveListingVerification = async (listing: HostelListing) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        verificationStatus:
          listing.verificationStatus === 'Verified' ? 'Pending Verification' : 'Verified',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${listing.id}`);
    }
  };

  if (!user) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          PG & Hostel Owner Automation Portal
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          List your Dehradun PG or hostel with standardized safety & rent disclosures, receive pre-qualified student visit requests, and automate your ₹1,000 per confirmed booking settlement.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="h-11 px-6 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-sm font-semibold transition-colors"
          >
            Sign Up as PG Owner
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="h-11 px-5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Log In
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8" aria-labelledby="owner-portal-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="owner-portal-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Owner & Operations Automation Portal
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Automated lead matching, standardized verification workflows, and ₹1,000 booking commission ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Listing Form' : 'Add PG / Hostel Listing'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs font-medium text-teal-800 dark:text-teal-300">
          {feedback}
        </div>
      )}

      {/* Automated Unit Economics Rollup (from Mission 7) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Student Leads</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {economics.totalLeads}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Target: {economics.baseMonthlyTarget} bookings/mo (Base)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Confirmed Placements</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-teal-700 dark:text-teal-400 mt-1">
            {economics.confirmedCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Triggers ₹1,000 commission
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Commission</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            ₹{economics.grossCommission.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Variable Cost: ₹{economics.variableCost.toLocaleString('en-IN')} (₹250/sale)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Net Contribution
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            ₹{economics.netContribution.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            ₹750 contribution / booking
          </p>
        </div>
      </div>

      {/* New Property Onboarding Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateListing}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Onboard Standardized PG / Hostel Listing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prop-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Property Name
              </label>
              <input
                id="prop-name"
                type="text"
                required
                minLength={BOUNDS.LISTING_NAME_MIN}
                maxLength={BOUNDS.LISTING_NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Himalayan Scholars Residency"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="prop-locality" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dehradun Locality
              </label>
              <select
                id="prop-locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value as Locality)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                {LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prop-campus" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nearest University / College
              </label>
              <select
                id="prop-campus"
                value={nearCampus}
                onChange={(e) => setNearCampus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                {DEHRADUN_UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prop-gender" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Occupancy Policy
              </label>
              <select
                id="prop-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderPolicy)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Co-ed">Co-ed</option>
              </select>
            </div>

            <div>
              <label htmlFor="prop-room" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room Configuration
              </label>
              <select
                id="prop-room"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Single Studio">Single Studio</option>
                <option value="Twin Sharing">Twin Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
              </select>
            </div>

            <div>
              <label htmlFor="prop-image" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Verified Photo Template
              </label>
              <select
                id="prop-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                {PRESET_IMAGES.map((img) => (
                  <option key={img.url} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prop-rent" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Rent (INR)
              </label>
              <input
                id="prop-rent"
                type="number"
                min={2500}
                max={45000}
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="prop-deposit" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Security Deposit (INR)
              </label>
              <input
                id="prop-deposit"
                type="number"
                min={0}
                max={80000}
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="prop-dist" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dist (km)
                </label>
                <input
                  id="prop-dist"
                  type="number"
                  step={0.1}
                  min={0.1}
                  max={25}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prop-beds" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Open Beds
                </label>
                <input
                  id="prop-beds"
                  type="number"
                  min={1}
                  max={200}
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Safety Checklist
              </p>
              <div className="flex flex-wrap gap-2">
                {SAFETY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleItem(safetyFeatures, opt, setSafetyFeatures)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      safetyFeatures.includes(opt)
                        ? 'border-teal-700 dark:border-teal-400 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Included Facilities
              </p>
              <div className="flex flex-wrap gap-2">
                {FACILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleItem(facilities, opt, setFacilities)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      facilities.includes(opt)
                        ? 'border-teal-700 dark:border-teal-400 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-rules" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                House Rules & Curfew
              </label>
              <textarea
                id="prop-rules"
                rows={2}
                maxLength={BOUNDS.HOUSE_RULES_MAX}
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="prop-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Property Highlights
              </label>
              <textarea
                id="prop-desc"
                rows={2}
                maxLength={BOUNDS.DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe study atmosphere, food quality, and nearby transport..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? 'Publishing...' : 'Submit Property Listing'}
            </button>
          </div>
        </form>
      )}

      {/* Automated Booking & Commission Pipeline Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Automated Lead & Booking Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirming a student placement automatically logs the ₹1,000 HostelEase commission and unlocks Verified Resident reviews.
            </p>
          </div>
        </div>

        {ownerBookings.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No student visit or bed reservation leads yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Property & Room</th>
                  <th className="py-3 px-4">Move-In / Visit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {ownerBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{b.studentName}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {b.studentUniversity} · <span className="font-mono">{b.studentPhone}</span>
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-white">{b.listingName}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {b.roomType} · ₹{b.monthlyRent.toLocaleString('en-IN')}/mo
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {b.moveInDate}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <span
                        className={
                          b.status === 'Confirmed' || b.status === 'Completed'
                            ? 'text-teal-700 dark:text-teal-400'
                            : b.status === 'Cancelled'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      ₹{b.commissionInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {b.status === 'Pending Visit' && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b, 'Visit Scheduled')}
                            className="px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Schedule Visit
                          </button>
                        )}
                        {(b.status === 'Pending Visit' || b.status === 'Visit Scheduled') && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b, 'Confirmed')}
                            className="px-2.5 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                          >
                            Confirm Booking
                          </button>
                        )}
                        {b.status === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b, 'Completed')}
                            className="px-2.5 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                          >
                            Mark Moved In
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Managed Properties & Verification Audit */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Managed Properties & Verification Status ({myListings.length})
          </h2>
        </div>

        {myListings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No properties listed under your account yet. Click &ldquo;Add PG / Hostel Listing&rdquo; above to onboard.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myListings.map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.locality} · {item.roomType} ·{' '}
                    <span className="font-mono tabular-nums">
                      ₹{item.monthlyRent.toLocaleString('en-IN')}/mo
                    </span>{' '}
                    · {item.availableBeds} beds open
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      item.verificationStatus === 'Verified'
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.verificationStatus === 'Verified' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {item.verificationStatus}
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => approveListingVerification(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {item.verificationStatus === 'Verified' ? 'Set Pending' : 'Approve & Verify'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
