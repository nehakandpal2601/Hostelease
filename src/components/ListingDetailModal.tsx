import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Star,
  X,
  Calendar,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  addDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  OperationType,
  clampString,
  db,
  handleFirestoreError,
} from '../lib/firebase';
import { SEED_REVIEWS } from '../data/seedCatalog';
import {
  BOUNDS,
  BookingEnquiry,
  BookingType,
  HostelListing,
  PropertyReview,
} from '../types/hostelease';
import { ResilientImage } from './ResilientImage';

interface ListingDetailModalProps {
  listing: HostelListing | null;
  onClose: () => void;
  onBookingCreated: () => void;
}

export function ListingDetailModal({
  listing,
  onClose,
  onBookingCreated,
}: ListingDetailModalProps) {
  const { user, profile, privateContact, openAuthModal } = useAuth();

  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>('');

  // Booking form state
  const [bookingType, setBookingType] = useState<BookingType>('Schedule Visit');
  const [moveInDate, setMoveInDate] = useState('2026-12-01');
  const [phone, setPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Review form state
  const [safetyRating, setSafetyRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [foodWifiRating, setFoodWifiRating] = useState(4);
  const [valueRating, setValueRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (privateContact?.phone) {
      setPhone(privateContact.phone);
    }
  }, [privateContact]);

  useEffect(() => {
    setBookingSuccess(null);
    setBookingError(null);
    setReviewSuccess(null);
    setReviewError(null);
    setReviewComment('');
  }, [listing?.id]);

  // Load reviews for the selected listing
  useEffect(() => {
    if (!listing) return;
    const reviewsPath = `listings/${listing.id}/reviews`;
    setReviewsLoading(true);

    if (user) {
      const q = query(collection(db, reviewsPath), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (snap.empty && SEED_REVIEWS[listing.id]) {
            setReviews(
              SEED_REVIEWS[listing.id].map((r, i) => ({
                ...r,
                id: `preview-${listing.id}-${i}`,
              })),
            );
          } else {
            setReviews(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<PropertyReview, 'id'>),
              })),
            );
          }
          setReviewsLoading(false);
        },
        (error) => {
          setReviewsLoading(false);
          handleFirestoreError(error, OperationType.LIST, reviewsPath);
        },
      );
      return () => unsub();
    } else {
      getDocs(query(collection(db, reviewsPath), orderBy('createdAt', 'desc')))
        .then((snap) => {
          if (snap.empty && SEED_REVIEWS[listing.id]) {
            setReviews(
              SEED_REVIEWS[listing.id].map((r, i) => ({
                ...r,
                id: `preview-${listing.id}-${i}`,
              })),
            );
          } else {
            setReviews(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<PropertyReview, 'id'>),
              })),
            );
          }
        })
        .catch(() => {
          if (SEED_REVIEWS[listing.id]) {
            setReviews(
              SEED_REVIEWS[listing.id].map((r, i) => ({
                ...r,
                id: `preview-${listing.id}-${i}`,
              })),
            );
          }
        })
        .finally(() => setReviewsLoading(false));
    }
  }, [listing, user]);

  // Check if current user has a confirmed/completed booking for verified-resident review badge
  useEffect(() => {
    if (!listing || !user) {
      setConfirmedBookingId('');
      return;
    }
    const q = query(
      collection(db, 'bookings'),
      where('studentId', '==', user.uid),
      where('listingId', '==', listing.id),
    );
    getDocs(q)
      .then((snap) => {
        const verified = snap.docs.find((d) => {
          const data = d.data() as BookingEnquiry;
          return data.status === 'Confirmed' || data.status === 'Completed';
        });
        setConfirmedBookingId(verified ? verified.id : '');
      })
      .catch(() => setConfirmedBookingId(''));
  }, [listing, user]);

  const ratingSummary = useMemo(() => {
    if (reviews.length === 0) {
      return { avg: 0, safety: 0, cleanliness: 0, foodWifi: 0, value: 0 };
    }
    const total = reviews.reduce(
      (acc, r) => ({
        overall: acc.overall + r.overallRating,
        safety: acc.safety + r.safetyRating,
        cleanliness: acc.cleanliness + r.cleanlinessRating,
        foodWifi: acc.foodWifi + r.foodWifiRating,
        value: acc.value + r.valueRating,
      }),
      { overall: 0, safety: 0, cleanliness: 0, foodWifi: 0, value: 0 },
    );
    const n = reviews.length;
    return {
      avg: Number((total.overall / n).toFixed(1)),
      safety: Number((total.safety / n).toFixed(1)),
      cleanliness: Number((total.cleanliness / n).toFixed(1)),
      foodWifi: Number((total.foodWifi / n).toFixed(1)),
      value: Number((total.value / n).toFixed(1)),
    };
  }, [reviews]);

  if (!listing) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!user || !profile) {
      openAuthModal('login');
      return;
    }

    const cleanPhone = clampString(phone, BOUNDS.PHONE_MAX);
    if (cleanPhone.length < BOUNDS.PHONE_MIN) {
      setBookingError('Please enter a valid phone number so the PG owner can confirm your visit slot.');
      return;
    }

    setBookingSubmitting(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        studentId: user.uid,
        studentName: clampString(profile.displayName, BOUNDS.DISPLAY_NAME_MAX),
        studentUniversity: clampString(profile.university, BOUNDS.UNIVERSITY_MAX),
        studentPhone: cleanPhone,
        listingId: listing.id,
        listingName: clampString(listing.name, BOUNDS.LISTING_NAME_MAX),
        ownerId: listing.ownerId,
        moveInDate: clampString(moveInDate, 30),
        roomType: listing.roomType,
        monthlyRent: listing.monthlyRent,
        bookingType,
        status: 'Pending Visit',
        commissionInr: 0,
        variableCostInr: 250,
        netContributionInr: 0,
        notes: clampString(bookingNotes, BOUNDS.BOOKING_NOTES_MAX),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setBookingSuccess(
        `${bookingType} request sent to ${listing.ownerName}. Track live status in My Bookings.`,
      );
      setBookingNotes('');
      onBookingCreated();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'bookings');
      } catch (wrapped) {
        setBookingError(
          'Could not submit booking to database yet. Make sure this listing is published in Firestore by an admin/owner.',
        );
        console.error(wrapped);
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!user || !profile) {
      openAuthModal('login');
      return;
    }
    if (!user.emailVerified) {
      setReviewError('Only verified email accounts can submit reviews.');
      return;
    }

    const cleanComment = clampString(reviewComment, BOUNDS.REVIEW_COMMENT_MAX);
    if (cleanComment.length < BOUNDS.REVIEW_COMMENT_MIN) {
      setReviewError('Please write at least 10 characters describing your experience.');
      return;
    }

    const overall = Number(
      ((safetyRating + cleanlinessRating + foodWifiRating + valueRating) / 4).toFixed(1),
    );
    const reviewId = `rev-${user.uid.slice(0, 8)}-${Date.now()}`;
    const reviewRef = doc(db, 'listings', listing.id, 'reviews', reviewId);
    const listingRef = doc(db, 'listings', listing.id);

    const newCount = listing.reviewCount + 1;
    const newAvg = Number(
      (((listing.avgRating * listing.reviewCount) + overall) / newCount).toFixed(1),
    );

    setReviewSubmitting(true);
    try {
      const batch = writeBatch(db);
      batch.set(reviewRef, {
        listingId: listing.id,
        authorId: user.uid,
        authorName: clampString(profile.displayName, BOUNDS.DISPLAY_NAME_MAX),
        authorUniversity: clampString(profile.university, BOUNDS.UNIVERSITY_MAX),
        overallRating: overall,
        safetyRating,
        cleanlinessRating,
        foodWifiRating,
        valueRating,
        comment: cleanComment,
        verifiedResident: Boolean(confirmedBookingId),
        bookingId: confirmedBookingId,
        createdAt: serverTimestamp(),
      });
      batch.update(listingRef, {
        avgRating: newAvg,
        reviewCount: newCount,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setReviewComment('');
      setReviewSuccess('Thank you! Your verified review has been published.');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `listings/${listing.id}/reviews`);
      } catch (wrapped) {
        setReviewError(
          'Unable to publish review right now. Ensure the property exists in Firestore.',
        );
        console.error(wrapped);
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
              {listing.locality} · {listing.gender} · {listing.roomType}
            </p>
            <h2 id="detail-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {listing.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close property details"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Photo + Standardized Disclosures */}
            <div className="lg:col-span-7 space-y-6">
              <div className="aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                <ResilientImage
                  src={listing.imageUrl}
                  alt={listing.name}
                  className="w-full h-full object-cover"
                  fallbackTitle={listing.name}
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    {listing.distanceKm} km from {listing.nearCampus}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">
                    <ShieldCheck className="w-4 h-4" />
                    {listing.verificationStatus} (Safety {listing.safetyScore}/10)
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {listing.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Verified Safety Checklist
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                    {listing.safetyFeatures.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Included Facilities
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                    {listing.facilities.map((fac) => (
                      <li key={fac} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Standardized House Rules
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {listing.houseRules}
                </p>
              </div>
            </div>

            {/* Right Column: Contiguous Booking & Visit Request Module */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5 sticky top-0">
                <div className="flex items-baseline justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      ₹{listing.monthlyRent.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400"> / month</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      Refundable Deposit: ₹{listing.securityDeposit.toLocaleString('en-IN')} · {listing.availableBeds} beds open
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
                    {(['Schedule Visit', 'Reserve Bed'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBookingType(type)}
                        className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                          bookingType === type
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label htmlFor="move-in-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferred Visit / Move-In Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="move-in-date"
                        type="date"
                        required
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="booking-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Contact Number (WhatsApp)
                    </label>
                    <input
                      id="booking-phone"
                      type="tel"
                      required
                      maxLength={BOUNDS.PHONE_MAX}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="booking-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preferences or Questions (Optional)
                    </label>
                    <textarea
                      id="booking-notes"
                      rows={2}
                      maxLength={BOUNDS.BOOKING_NOTES_MAX}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. Visiting with parents around 3 PM, need balcony room..."
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {bookingError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                      {bookingError}
                    </p>
                  )}

                  {bookingSuccess && (
                    <p className="text-xs text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 p-2.5 rounded-lg border border-teal-200 dark:border-teal-800">
                      {bookingSuccess}
                    </p>
                  )}

                  {user ? (
                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {bookingSubmitting ? 'Submitting Request...' : `Confirm ${bookingType}`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
                    >
                      Log In / Sign Up to {bookingType}
                    </button>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    ₹0 student fee · Property owner confirms slot directly
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Verified User Reviews & Rating Section */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Verified Student Reviews & Ratings
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Only email-verified users can submit ratings. Confirmed residents receive a Verified Resident badge.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>{reviews.length > 0 ? ratingSummary.avg.toFixed(1) : 'New'}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  ({reviews.length} verified reviews)
                </span>
              </div>
            </div>

            {/* 4-Dimension Rating Bars */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                {[
                  { label: 'Safety & Security', score: ratingSummary.safety },
                  { label: 'Cleanliness', score: ratingSummary.cleanliness },
                  { label: 'Food & Wi-Fi', score: ratingSummary.foodWifi },
                  { label: 'Value for Money', score: ratingSummary.value },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{metric.label}</span>
                      <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {metric.score.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 dark:bg-teal-400 rounded-full"
                        style={{ width: `${(metric.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Review Feed */}
              <div className="lg:col-span-7 space-y-4">
                {reviewsLoading ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading verified reviews...</p>
                ) : reviews.length === 0 ? (
                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No student reviews yet. Be the first verified student to share your feedback.
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {rev.authorName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {rev.authorUniversity} ·{' '}
                            <span className="text-teal-700 dark:text-teal-400 font-medium">
                              {rev.verifiedResident ? 'Verified Resident' : 'Verified Student Account'}
                            </span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {rev.overallRating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Safety {rev.safetyRating}/5 · Cleanliness {rev.cleanlinessRating}/5 · Food/Wi-Fi {rev.foodWifiRating}/5 · Value {rev.valueRating}/5
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Verified Review Form */}
              <div className="lg:col-span-5">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rate & Review This Property
                  </h4>

                  {!user ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Sign in with your verified account to leave an authentic review for fellow Dehradun students.
                      </p>
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="w-full h-10 px-4 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Log In / Sign Up to Review
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'rev-safety', label: 'Safety', val: safetyRating, set: setSafetyRating },
                          { id: 'rev-clean', label: 'Cleanliness', val: cleanlinessRating, set: setCleanlinessRating },
                          { id: 'rev-food', label: 'Food & Wi-Fi', val: foodWifiRating, set: setFoodWifiRating },
                          { id: 'rev-value', label: 'Value', val: valueRating, set: setValueRating },
                        ].map((item) => (
                          <div key={item.id}>
                            <label htmlFor={item.id} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              {item.label} (1–5)
                            </label>
                            <select
                              id={item.id}
                              value={item.val}
                              onChange={(e) => item.set(Number(e.target.value))}
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                  {n} Stars
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label htmlFor="review-comment" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Your Verified Experience
                        </label>
                        <textarea
                          id="review-comment"
                          rows={3}
                          required
                          minLength={BOUNDS.REVIEW_COMMENT_MIN}
                          maxLength={BOUNDS.REVIEW_COMMENT_MAX}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share honest details about room condition vs photos, warden support, Wi-Fi stability, and food..."
                          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      {reviewError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400">{reviewError}</p>
                      )}
                      {reviewSuccess && (
                        <p className="text-xs text-teal-700 dark:text-teal-400">{reviewSuccess}</p>
                      )}

                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="w-full h-10 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                      >
                        {reviewSubmitting ? 'Publishing Review...' : 'Submit Verified Review'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
