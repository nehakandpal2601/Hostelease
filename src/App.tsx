import { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppSection, Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { DiscoveryCatalog } from './components/DiscoveryCatalog';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { ListingDetailModal } from './components/ListingDetailModal';
import { CampusServicesHub } from './components/CampusServicesHub';
import { StudentBookingsView } from './components/StudentBookingsView';
import { OwnerPortalView } from './components/OwnerPortalView';
import { SEED_LISTINGS } from './data/seedCatalog';
import { OperationType, db, handleFirestoreError } from './lib/firebase';
import { HostelListing } from './types/hostelease';

function HostelEaseWorkspace() {
  const { user, authReady } = useAuth();
  const [activeSection, setActiveSection] = useState<AppSection>('discover');
  const [listings, setListings] = useState<HostelListing[]>(SEED_LISTINGS);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([
    'listing-doon-crest-clement',
    'listing-shivalik-scholars-dalanwala',
  ]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Public read on mount; real-time onSnapshot when authenticated
  useEffect(() => {
    if (!authReady) return;

    const listingsQuery = query(collection(db, 'listings'), orderBy('monthlyRent', 'asc'));

    if (user) {
      const unsub = onSnapshot(
        listingsQuery,
        (snap) => {
          if (snap.empty) {
            setListings(SEED_LISTINGS);
          } else {
            setListings(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<HostelListing, 'id'>),
              })),
            );
          }
          setListingsLoading(false);
        },
        (error) => {
          setListingsLoading(false);
          handleFirestoreError(error, OperationType.LIST, 'listings');
        },
      );
      return () => unsub();
    } else {
      getDocs(listingsQuery)
        .then((snap) => {
          if (snap.empty) {
            setListings(SEED_LISTINGS);
          } else {
            setListings(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<HostelListing, 'id'>),
              })),
            );
          }
        })
        .catch(() => {
          setListings(SEED_LISTINGS);
        })
        .finally(() => {
          setListingsLoading(false);
        });
    }
  }, [authReady, user]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const selectedListing =
    listings.find((item) => item.id === selectedListingId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        compareCount={compareIds.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {activeSection === 'discover' && (
          <DiscoveryCatalog
            listings={listings}
            loading={listingsLoading}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onSelectListing={(item) => setSelectedListingId(item.id)}
            onOpenCompareView={() => setActiveSection('compare')}
            onOpenServicesView={() => setActiveSection('services')}
          />
        )}

        {activeSection === 'compare' && (
          <ComparisonMatrix
            allListings={listings}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onSelectListing={(item) => setSelectedListingId(item.id)}
            onBackToDiscover={() => setActiveSection('discover')}
          />
        )}

        {activeSection === 'services' && (
          <CampusServicesHub
            onServiceOrdered={() => setActiveSection('bookings')}
          />
        )}

        {activeSection === 'bookings' && (
          <StudentBookingsView
            onBrowseListings={() => setActiveSection('discover')}
            onBrowseServices={() => setActiveSection('services')}
          />
        )}

        {activeSection === 'owner' && (
          <OwnerPortalView listings={listings} />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>
            HostelEase · Dehradun Student Accommodation & Daily Services Platform
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveSection('discover')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Verified Listings
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('compare')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Compare Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('owner')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Partner With Us
            </button>
          </div>
        </div>
      </footer>

      <AuthModal />

      <ListingDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListingId(null)}
        onBookingCreated={() => {
          setSelectedListingId(null);
          setActiveSection('bookings');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <HostelEaseWorkspace />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
