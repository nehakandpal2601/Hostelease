import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
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
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import { BookingEnquiry, ServiceOrder } from '../types/hostelease';

interface StudentBookingsViewProps {
  onBrowseListings: () => void;
  onBrowseServices: () => void;
}

export function StudentBookingsView({
  onBrowseListings,
  onBrowseServices,
}: StudentBookingsViewProps) {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState<BookingEnquiry[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setServices([]);
      return;
    }

    setLoading(true);
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('studentId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    const servicesQuery = query(
      collection(db, 'serviceOrders'),
      where('studentId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snap) => {
        setBookings(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BookingEnquiry, 'id'>),
          })),
        );
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      },
    );

    const unsubServices = onSnapshot(
      servicesQuery,
      (snap) => {
        setServices(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ServiceOrder, 'id'>),
          })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'serviceOrders');
      },
    );

    return () => {
      unsubBookings();
      unsubServices();
    };
  }, [user]);

  const cancelBooking = async (booking: BookingEnquiry) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'Cancelled',
        commissionInr: 0,
        netContributionInr: 0,
        notes: booking.notes || 'Cancelled by student',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
    }
  };

  const cancelServiceOrder = async (order: ServiceOrder) => {
    try {
      await updateDoc(doc(db, 'serviceOrders', order.id), {
        status: 'Cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `serviceOrders/${order.id}`);
    }
  };

  if (!user) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign in to track your PG visits & services
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">
          View scheduled hostel inspections, confirmed bed reservations, and active tiffin or laundry subscriptions.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="h-10 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white text-sm font-semibold transition-colors"
        >
          Log In / Sign Up
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-10" aria-labelledby="my-bookings-heading">
      <div>
        <h1 id="my-bookings-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          My Bookings & Campus Services
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Real-time tracking for hostel visits, bed reservations, and daily living subscriptions.
        </p>
      </div>

      {/* PG / Hostel Bookings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            PG & Hostel Requests ({bookings.length})
          </h2>
          <button
            type="button"
            onClick={onBrowseListings}
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
          >
            + Find Another PG
          </button>
        </div>

        {loading ? (
          <div className="h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              You have not scheduled any PG visits or bed reservations yet.
            </p>
            <button
              type="button"
              onClick={onBrowseListings}
              className="h-10 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
            >
              Browse Verified PGs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => {
              const canCancel = b.status === 'Pending Visit' || b.status === 'Visit Scheduled';
              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {b.bookingType} · {b.roomType}
                      </p>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {b.listingName}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        b.status === 'Confirmed' || b.status === 'Completed'
                          ? 'text-teal-700 dark:text-teal-400'
                          : b.status === 'Cancelled'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {b.status === 'Confirmed' || b.status === 'Completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : b.status === 'Cancelled' ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {b.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {b.moveInDate}
                    </span>
                    <span>₹{b.monthlyRent.toLocaleString('en-IN')}/mo</span>
                  </div>

                  {b.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">{b.notes}</p>
                  )}

                  {b.status === 'Confirmed' && (
                    <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                      Booking confirmed — you can now submit a Verified Resident review on this property.
                    </p>
                  )}

                  {canCancel && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => cancelBooking(b)}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campus Service Subscriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Active Daily Services ({services.length})
          </h2>
          <button
            type="button"
            onClick={onBrowseServices}
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
          >
            + Add Tiffin / Laundry
          </button>
        </div>

        {services.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              No active tiffin, laundry, or housekeeping plans yet.
            </p>
            <button
              type="button"
              onClick={onBrowseServices}
              className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Explore Campus Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {s.serviceCategory} · {s.campusArea}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {s.planName}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      s.status === 'Cancelled'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-teal-700 dark:text-teal-400'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  ₹{s.monthlyPriceInr.toLocaleString('en-IN')} · {s.scheduleSlot}
                </p>
                {s.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.notes}</p>
                )}
                {(s.status === 'Active' || s.status === 'Scheduled') && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => cancelServiceOrder(s)}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Cancel Plan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
