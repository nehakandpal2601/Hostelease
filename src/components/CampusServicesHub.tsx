import React, { useState } from 'react';
import { CheckCircle2, Clock, Sparkles, Utensils, Wrench, Shirt } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CAMPUS_SERVICE_PLANS, TIFFIN_IMAGE_URL } from '../data/seedCatalog';
import { useAuth } from '../context/AuthContext';
import { OperationType, clampString, db, handleFirestoreError } from '../lib/firebase';
import { BOUNDS, LOCALITIES, Locality, ServicePlan } from '../types/hostelease';
import { ResilientImage } from './ResilientImage';

interface CampusServicesHubProps {
  onServiceOrdered: () => void;
}

export function CampusServicesHub({ onServiceOrdered }: CampusServicesHubProps) {
  const { user, profile, openAuthModal } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan>(CAMPUS_SERVICE_PLANS[0]);
  const [campusArea, setCampusArea] = useState<Locality>('Clement Town');
  const [scheduleSlot, setScheduleSlot] = useState('Morning (8:00 AM – 10:00 AM)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getCategoryIcon = (category: ServicePlan['category']) => {
    switch (category) {
      case 'Tiffin & Meals':
        return <Utensils className="w-4 h-4 text-teal-700 dark:text-teal-400" />;
      case 'Campus Laundry':
        return <Shirt className="w-4 h-4 text-teal-700 dark:text-teal-400" />;
      case 'Room Cleaning':
        return <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400" />;
      case 'Basic Repairs':
        return <Wrench className="w-4 h-4 text-teal-700 dark:text-teal-400" />;
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user || !profile) {
      openAuthModal('login');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'serviceOrders'), {
        studentId: user.uid,
        studentName: clampString(profile.displayName, BOUNDS.DISPLAY_NAME_MAX),
        campusArea,
        serviceCategory: selectedPlan.category,
        planName: clampString(selectedPlan.planName, 100),
        monthlyPriceInr: selectedPlan.priceInr,
        scheduleSlot: clampString(scheduleSlot, 80),
        status: selectedPlan.category === 'Basic Repairs' ? 'Scheduled' : 'Active',
        notes: clampString(notes, BOUNDS.SERVICE_NOTES_MAX),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccessMsg(`${selectedPlan.planName} scheduled for ${campusArea}. View in My Bookings.`);
      setNotes('');
      onServiceOrdered();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'serviceOrders');
      } catch (wrapped) {
        setErrorMsg('Unable to submit service request right now. Please try again.');
        console.error(wrapped);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-10" aria-labelledby="services-heading">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <p className="text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-400 mb-2">
            Everyday Living · Dehradun Campus Network
          </p>
          <h1 id="services-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
            Verified tiffin, laundry, room cleaning, and repairs in one place.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed max-w-2xl">
            Stop hunting separately across WhatsApp groups and local directories. Bundle verified student services directly to your hostel or PG gate with transparent fixed pricing.
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="h-56 lg:h-full min-h-[220px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <ResilientImage
              src={TIFFIN_IMAGE_URL}
              alt="Homestyle vegetarian student tiffin meal in stainless steel carrier"
              className="w-full h-full object-cover"
              fallbackTitle="Dehradun Student Tiffin Service"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Service Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPUS_SERVICE_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan);
                  setSuccessMsg(null);
                  setErrorMsg(null);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPlan(plan);
                  }
                }}
                className={`p-5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-teal-700 dark:border-teal-400 bg-teal-50/40 dark:bg-teal-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {getCategoryIcon(plan.category)}
                      {plan.category}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      ₹{plan.priceInr.toLocaleString('en-IN')} {plan.billingCycle}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {plan.planName}
                  </h2>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {plan.description}
                  </p>

                  <ul className="space-y-1.5 pt-1">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {plan.turnaround}
                  </span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Checkout / Schedule Panel */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleOrderSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 sticky top-24"
          >
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {selectedPlan.category}
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedPlan.planName}
              </h3>
              <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                ₹{selectedPlan.priceInr.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">
                  {selectedPlan.billingCycle}
                </span>
              </p>
            </div>

            <div>
              <label htmlFor="service-area" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dehradun Hostel / Campus Area
              </label>
              <select
                id="service-area"
                value={campusArea}
                onChange={(e) => setCampusArea(e.target.value as Locality)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="service-slot" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Delivery / Visit Window
              </label>
              <select
                id="service-slot"
                value={scheduleSlot}
                onChange={(e) => setScheduleSlot(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Morning (8:00 AM – 10:00 AM)">Morning (8:00 AM – 10:00 AM)</option>
                <option value="Afternoon (12:30 PM – 2:30 PM)">Afternoon (12:30 PM – 2:30 PM)</option>
                <option value="Evening (5:30 PM – 8:00 PM)">Evening (5:30 PM – 8:00 PM)</option>
              </select>
            </div>

            <div>
              <label htmlFor="service-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PG Name, Room Number & Instructions
              </label>
              <textarea
                id="service-notes"
                rows={3}
                maxLength={BOUNDS.SERVICE_NOTES_MAX}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Doon Crest Residency, Room 204. No onion/garlic on Tuesdays."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-xs text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 p-2.5 rounded-lg border border-teal-200 dark:border-teal-800">
                {successMsg}
              </p>
            )}

            {user ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? 'Scheduling Service...' : 'Activate Service Plan'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
              >
                Log In / Sign Up to Order Service
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
